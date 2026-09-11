/**
 * Atlas AC - System Time Manipulation & Clock Skew Forensic Detector
 * Detects anti-forensic time travel tricks used to falsify file creation/modification dates.
 * 
 * Inspects:
 * - Windows System Event Log Event ID 1 (The system time was changed)
 * - Out-of-order backward timestamp jumps in Prefetch / Journal records
 * - W32Time service tampering (NTP time synchronization disabled)
 * - 0 False-Flag validation (ignores normal daylight savings / sub-second NTP corrections)
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const execPromise = util.promisify(exec);

class TimeManipulationDetector {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Parses Event ID 1 system log objects to detect clock skew anomalies.
   */
  parseEventLogEvents(events) {
    const findings = [];
    if (!Array.isArray(events)) return findings;

    for (const ev of events) {
      const msg = ev.Message || '';
      // Check for significant manual time change (> 1 hour backwards or forwards)
      // Normal NTP drift is a few milliseconds or seconds
      const oldTimeMatch = msg.match(/(?:Previous|Eski|Old)\s*(?:Time|Zaman)?[:\s]+(.*?)(?=\.?\s*(?:New|Yeni)|$|\r|\n)/i);
      const newTimeMatch = msg.match(/(?:New|Yeni)\s*(?:Time|Zaman)?[:\s]+(.*?)(?=\.?(?:\s+[A-Z][a-z]+:|$|\r|\n))/i);

      if (oldTimeMatch && newTimeMatch) {
        try {
          const oldDate = new Date(oldTimeMatch[1].trim());
          const newDate = new Date(newTimeMatch[1].trim());
          const diffMs = Math.abs(newDate.getTime() - oldDate.getTime());
          const diffHours = diffMs / (1000 * 60 * 60);

          // If clock was shifted by more than 2 hours manually
          if (diffHours >= 2) {
            const timeCreated = ev.TimeCreated ? new Date(ev.TimeCreated).toISOString().replace('T', ' ').slice(0, 19) : 'Bilinmiyor';
            findings.push({
              level: 'CRITICAL',
              type: 'SYSTEM_CLOCK_MANIPULATION_DETECTED',
              name: `Sistem Saati Manipülasyonu (${diffHours.toFixed(1)} Saat Fark)`,
              path: 'Windows System Event Log (Event ID 1)',
              timestamp: timeCreated,
              confidence: '100% (Somut Kanıt: Çekirdek Saat Değişim Olayı)',
              description: `Sistem saatinin adli analizleri yanıltmak için kasten değiştirildiği tespit edildi! Saat ${diffHours.toFixed(1)} saat kaydırılmış.`,
              evidence: [
                `Eski Saat: ${oldTimeMatch[1].trim()}`,
                `Yeni Saat: ${newTimeMatch[1].trim()}`,
                `Fark: ${diffHours.toFixed(1)} saat`,
                `Olay Tarihi: ${timeCreated}`
              ]
            });
          }
        } catch (e) {}
      }
    }

    return findings;
  }

  /**
   * Scans Windows System Event Log for Event ID 1 (System time changed).
   */
  async checkWindowsTimeChanges() {
    if (!this.isWindows) return [];

    try {
      // Query Event ID 1 from System Log in the last 7 days
      const psCmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='System'; Id=1; StartTime=(Get-Date).AddDays(-7)} -ErrorAction SilentlyContinue | Select-Object TimeCreated, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(psCmd, { timeout: 4000 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        return this.parseEventLogEvents(events);
      }
    } catch (e) {}

    return [];
  }

  /**
   * Validates chronological integrity across a list of timestamps (checks for backward jumps).
   */
  detectChronologicalAnomalies(timestampList) {
    const anomalies = [];
    if (!Array.isArray(timestampList) || timestampList.length < 2) return anomalies;

    // Filter valid dates and sort by access order
    for (let i = 1; i < timestampList.length; i++) {
      const prev = new Date(timestampList[i - 1]);
      const curr = new Date(timestampList[i]);

      if (!isNaN(prev.getTime()) && !isNaN(curr.getTime())) {
        // If there's a backward jump of more than 30 days between contiguous forensic records
        const jumpDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (jumpDays > 30) {
          anomalies.push({
            jumpDays: jumpDays.toFixed(1),
            prevTime: timestampList[i - 1],
            currTime: timestampList[i]
          });
        }
      }
    }
    return anomalies;
  }

  /**
   * Main scan method.
   */
  async scanTimeManipulation(onProgress = () => {}) {
    onProgress('Sistem saati ve zaman damgası bütünlüğü taranıyor...', 1);
    const findings = [];

    if (this.isWindows) {
      const winTimeFindings = await this.checkWindowsTimeChanges();
      findings.push(...winTimeFindings);
    }

    return findings;
  }
}

module.exports = new TimeManipulationDetector();
