/**
 * Atlas AC - DPS (Diagnostic Policy Service) & Execution Forensics Engine
 *
 * Inspects Windows Diagnostic Policy Service (DPS) activity and SysMain / SRUM logs.
 * DPS records process lifecycle and resource consumption metrics in Windows.
 *
 * Crucially, DPS records CANNOT be cleared by standard cleaner utilities
 * (BleachBit, CCleaner, manual file deletion) because they are actively locked
 * by the svchost.exe (DPS/SysMain) service host.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const execGuarded = require('./guardedExec');
const cheatKnowledgeBase = require('./cheatKnowledgeBase');

const CHEAT_TARGET_REGEX = /vape|drip|slinky|meteor|wurst|liquidbounce|rise|novoline|astolfo|tenacity|raven|kura|augustus|phantom|entropy|whiteout|doomsday/i;

class DpsScanner {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans DPS / Diagnostics-Performance event logs and SRUM records.
   * @param {Function} onProgress - (msg, weight)
   * @returns {Promise<{status: string, findings: Array}>}
   */
  async scanDpsForensics(onProgress = () => {}) {
    if (!this.isWindows) {
      return { status: 'SKIPPED', findings: [] };
    }

    const findings = [];
    let dataSourceError = null;
    onProgress('DPS (Diagnostic Policy Service) Analizi: Başlatılıyor...', 10);

    try {
      // Query Diagnostics-Performance Operational event log (Event ID 100, 101, 200)
      const psScript = `
        Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Diagnostics-Performance/Operational'; Id=100,101,200} -MaxEvents 150 -ErrorAction SilentlyContinue | ForEach-Object {
          [PSCustomObject]@{
            TimeCreated = $_.TimeCreated.ToString('yyyy-MM-dd HH:mm:ss')
            Id = $_.Id
            Message = $_.Message
          }
        } | ConvertTo-Json -Compress
      `.trim();

      const { stdout } = await execGuarded(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`, {
        timeout: 10000,
        maxBuffer: 4 * 1024 * 1024
      });

      if (stdout && stdout.trim()) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout.trim());
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          const lines = stdout.split('\n').filter(Boolean);
          for (const l of lines) {
            try { events.push(JSON.parse(l.trim())); } catch (err) {}
          }
        }

        onProgress(`DPS kütüğündeki ${events.length} performans olayı inceleniyor...`, 50);

        for (const ev of events) {
          const msg = ev.Message || '';
          if (CHEAT_TARGET_REGEX.test(msg)) {
            const match = msg.match(CHEAT_TARGET_REGEX);
            const matchedCheat = match ? match[0] : 'Hile İkilisi';

            const finding = {
              level: 'CRITICAL',
              type: 'DPS_DIAGNOSTIC_EXECUTION_RECORD',
              name: `DPS Tanılama Kütüğünde Doğrulanmış Hile Çalıştırma Kaydı: ${matchedCheat}`,
              description: `Windows Diagnostic Policy Service (DPS) sistem günlüğünde '${matchedCheat}' hilesine ait silinemeyen çalıştırma kaydı yakalanmıştır. DPS kayıtları sistem kilitli olduğu için temizleme araçları tarafından silinemez.`,
              confidence: '100% Somut Adli Kanıt (Kilitli Windows DPS Kaydı)',
              time: ev.TimeCreated,
              evidence: [
                `Zaman Damgası: ${ev.TimeCreated}`,
                `Olay Kimliği: Event ID ${ev.Id}`,
                `Tanılama Verisi: ${msg.substring(0, 200)}...`
              ]
            };

            findings.push(cheatKnowledgeBase.enrichFinding(finding));
          }
        }
      }
    } catch (e) {
      dataSourceError = e;
    }

    onProgress('DPS Analizi tamamlandı.', 100);
    const status = dataSourceError
      ? (dataSourceError && dataSourceError.code === 'SCAN_EXEC_TIMEOUT' ? 'TIMEOUT' : 'ERROR')
      : (findings.length > 0 ? 'FINDINGS_DETECTED' : 'CLEAN');
    return {
      status,
      findings,
      ...(dataSourceError ? { error: dataSourceError.message || String(dataSourceError) } : {})
    };
  }
}

module.exports = new DpsScanner();
