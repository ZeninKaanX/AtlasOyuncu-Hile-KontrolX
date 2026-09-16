/**
 * Atlas AC - Cloud Synchronization Engine
 * Bridges local client inspection scans to the central Supabase Staff Dashboard in real time.
 */

const os = require('os');

const SUPABASE_SYNC_URL = 'https://grxcdtcalukzhlqisbgr.supabase.co/functions/v1/scan-sync';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyeGNkdGNhbHVremhscWlzYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzEzMDksImV4cCI6MjEwNTE0NzMwOX0.mTOMFgvvODpHV1OOHl0QuWhryqtLPqeje5A3G-4cQSY';

class CloudSync {
  constructor() {
    this.activeSessionCode = null;
    this.lastProgressSent = 0;
    this.lastPercentSent = -1;
    this.cachedSystemInfo = null;
  }

  getSystemInfo() {
    if (this.cachedSystemInfo) return this.cachedSystemInfo;
    try {
      const cpus = os.cpus() || [];
      const totalMemGb = Math.round((os.totalmem() || 0) / (1024 * 1024 * 1024));
      const platformName = process.platform === 'win32' ? 'Windows' : (process.platform === 'linux' ? 'Linux' : process.platform);
      
      this.cachedSystemInfo = {
        platform: process.platform,
        osName: `${platformName} ${os.release() || ''} (${process.arch})`,
        hostname: os.hostname() || 'Unknown',
        cpu: cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU',
        cpuCores: cpus.length,
        ram: `${totalMemGb} GB`,
        uptimeMinutes: Math.round(os.uptime() / 60)
      };
    } catch (_) {
      this.cachedSystemInfo = { platform: process.platform, osName: 'Unknown', ram: '8 GB' };
    }
    return this.cachedSystemInfo;
  }

  async initSession(preferredCode = null, playerName = 'Şüpheli Oyuncu') {
    const sys = this.getSystemInfo();
    const payload = {
      action: 'init',
      sessionCode: preferredCode ? String(preferredCode).trim().toUpperCase() : undefined,
      playerName: playerName || 'Şüpheli Oyuncu',
      platform: process.platform,
      systemInfo: sys
    };

    try {
      const res = await fetch(SUPABASE_SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.warn('[CloudSync] Init failed with HTTP', res.status);
        return null;
      }

      const data = await res.json();
      this.activeSessionCode = data.sessionCode;
      console.log(`[CloudSync] Canlı adli oturum bağlandı. Kod: ${this.activeSessionCode}`);
      return data;
    } catch (err) {
      console.warn('[CloudSync] Bağlantı kurulamadı (çevrimdışı mod):', err.message);
      return null;
    }
  }

  async sendProgress(percent, stage, log, finding = null, target = '', objectsCount = 0) {
    if (!this.activeSessionCode) return;

    const now = Date.now();
    // Throttle: send on finding, or if percent changed by >= 3%, or at least 800ms elapsed
    const percentDiff = Math.abs(percent - this.lastPercentSent);
    if (!finding && percentDiff < 3 && (now - this.lastProgressSent) < 800 && percent < 100) {
      return;
    }

    this.lastProgressSent = now;
    this.lastPercentSent = percent;

    const payload = {
      action: 'progress',
      sessionCode: this.activeSessionCode,
      percent,
      stage,
      log,
      target,
      objectsCount,
      finding: finding ? {
        title: finding.title || finding.name || 'Adli İhlal',
        category: finding.category || stage || 'Forensics',
        severity: finding.severity || finding.risk || 'HIGH',
        path: finding.path || finding.file || '',
        details: finding.details || finding.desc || log || '',
        timestamp: finding.timestamp || new Date().toISOString()
      } : null
    };

    try {
      await fetch(SUPABASE_SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      // Non-blocking background sync
    }
  }

  async completeSession(scanResults) {
    if (!this.activeSessionCode) return null;

    const allFindings = (scanResults && scanResults.allFindings) || [];
    let criticalCount = 0;
    let highCount = 0;

    for (const f of allFindings) {
      const sev = String(f.severity || f.risk || '').toUpperCase();
      if (sev === 'CRITICAL') criticalCount++;
      else if (sev === 'HIGH') highCount++;
    }

    let verdict = 'clean';
    let riskScore = 0;

    if (criticalCount > 0) {
      verdict = 'banned';
      riskScore = Math.min(100, 85 + criticalCount * 5);
    } else if (highCount > 0) {
      verdict = 'banned';
      riskScore = Math.min(90, 70 + highCount * 5);
    } else if (allFindings.length > 0) {
      verdict = 'suspicious';
      riskScore = Math.min(65, 40 + allFindings.length * 5);
    }

    const payload = {
      action: 'complete',
      sessionCode: this.activeSessionCode,
      verdict,
      riskScore,
      findings: allFindings.map(f => ({
        title: f.title || f.name || 'Şüpheli Nesne',
        category: f.category || 'Genel',
        severity: (f.severity || f.risk || 'MEDIUM').toUpperCase(),
        path: f.path || f.file || '',
        details: f.details || f.evidence || f.desc || '',
        timestamp: f.timestamp || new Date().toISOString()
      })),
      reportData: {
        timestamp: scanResults.timestamp || new Date().toISOString(),
        durationSeconds: scanResults.durationSeconds || '0',
        scannedObjects: scanResults.scannedObjects || 0,
        scannedJars: scanResults.scannedJars || 0,
        verdict,
        criticalCount,
        highCount,
        totalFindings: allFindings.length
      },
      systemInfo: this.getSystemInfo()
    };

    try {
      const res = await fetch(SUPABASE_SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json().catch(() => ({}));
      console.log(`[CloudSync] Tarama raporu merkeze yüklendi! Sonuç: ${verdict.toUpperCase()}`);
      return result;
    } catch (err) {
      console.warn('[CloudSync] Rapor yükleme hatası:', err.message);
      return null;
    }
  }
}

module.exports = new CloudSync();
