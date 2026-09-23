/**
 * Atlas AC secure scan-session bridge.
 *
 * The eight-character PIN is used exactly once to claim a staff-created scan.
 * All later writes use a random 256-bit token which never reaches the UI.
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SUPABASE_SYNC_URL = 'https://grxcdtcalukzhlqisbgr.supabase.co/functions/v1/scan-sync';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyeGNkdGNhbHVremhscWlzYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzEzMDksImV4cCI6MjEwNTE0NzMwOX0.mTOMFgvvODpHV1OOHl0QuWhryqtLPqeje5A3G-4cQSY';
const PIN_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/;

class CloudSync {
  constructor() {
    this.reset();
    this.cachedSystemInfo = null;
    this.clientId = this.loadClientId();
  }

  reset() {
    if (this.progressRetryTimer) clearTimeout(this.progressRetryTimer);
    this.activeSessionId = null;
    this.activeSessionCode = null;
    this.clientToken = null;
    this.lastProgressSent = 0;
    this.lastPercentSent = -1;
    this.latestProgress = null;
    this.pendingFindings = [];
    this.progressPump = null;
    this.progressRetryTimer = null;
    this.lastSyncError = null;
    this.completing = false;
  }

  loadClientId() {
    const fallback = crypto.randomBytes(32).toString('hex');
    try {
      const base = process.platform === 'win32'
        ? (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'))
        : (process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'));
      const directory = path.join(base, 'AtlasAC');
      const filename = path.join(directory, 'client-id');
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      if (fs.existsSync(filename)) {
        const existing = fs.readFileSync(filename, 'utf8').trim().toLowerCase();
        if (/^[a-f0-9]{64}$/.test(existing)) return existing;
      }
      fs.writeFileSync(filename, fallback, { encoding: 'utf8', mode: 0o600, flag: 'w' });
      return fallback;
    } catch (_) {
      return fallback;
    }
  }

  getSystemInfo() {
    if (this.cachedSystemInfo) return this.cachedSystemInfo;
    try {
      const cpus = os.cpus() || [];
      const platformName = process.platform === 'win32' ? 'Windows' : process.platform === 'linux' ? 'Linux' : process.platform;
      this.cachedSystemInfo = {
        platform: process.platform,
        osName: `${platformName} ${os.release() || ''} (${process.arch})`,
        cpu: cpus[0]?.model?.trim() || 'Unknown CPU',
        cpuCores: cpus.length,
        ram: `${Math.round((os.totalmem() || 0) / (1024 ** 3))} GB`,
        uptimeMinutes: Math.round(os.uptime() / 60)
      };
    } catch (_) {
      this.cachedSystemInfo = { platform: process.platform, osName: 'Unknown' };
    }
    return this.cachedSystemInfo;
  }

  async request(payload, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(SUPABASE_SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Sunucu hatası (${response.status})`);
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  async initSession(pin) {
    const sessionCode = String(pin || '').trim().toUpperCase();
    if (!PIN_RE.test(sessionCode)) throw new Error('PIN sekiz karakter olmalıdır.');
    this.reset();
    const data = await this.request({
      action: 'claim', pin: sessionCode, clientId: this.clientId,
      clientPlatform: process.platform,
      systemInfo: this.getSystemInfo()
    });
    if (!data.sessionId || !data.clientToken) throw new Error('Sunucu geçerli bir tarama oturumu döndürmedi.');
    this.activeSessionId = data.sessionId;
    this.activeSessionCode = data.sessionCode;
    this.clientToken = data.clientToken;
    return data;
  }

  authPayload(action) {
    if (!this.activeSessionId || !this.clientToken) return null;
    return { action, sessionId: this.activeSessionId, clientToken: this.clientToken };
  }

  sendProgress(percent, stage, log, finding = null, target = '', objectsCount = 0) {
    const auth = this.authPayload('progress');
    if (!auth || this.completing) return Promise.resolve();
    const now = Date.now();
    const percentDiff = Math.abs(percent - this.lastPercentSent);
    if (!finding && percentDiff < 3 && now - this.lastProgressSent < 1000 && percent < 100) {
      return this.progressPump || Promise.resolve();
    }
    this.lastProgressSent = now;
    this.lastPercentSent = percent;
    this.latestProgress = { ...auth, percent, stage, log, target, objectsCount };
    if (finding) {
      this.pendingFindings.push({
        title: finding.title || finding.name || 'Adli Bulgu',
        category: finding.category || stage || 'Forensics',
        severity: finding.severity || finding.risk || 'HIGH',
        path: finding.path || finding.file || '',
        details: finding.details || finding.desc || log || '',
        timestamp: finding.timestamp || new Date().toISOString()
      });
      // The completed report carries every finding. Capping the live queue keeps
      // a noisy scanner from delaying the current percentage by several minutes.
      if (this.pendingFindings.length > 100) this.pendingFindings.splice(0, this.pendingFindings.length - 100);
    }
    return this.startProgressPump();
  }

  startProgressPump() {
    if (this.progressPump) return this.progressPump;
    if (!this.latestProgress && !this.pendingFindings.length) return Promise.resolve();
    if (this.progressRetryTimer) {
      clearTimeout(this.progressRetryTimer);
      this.progressRetryTimer = null;
    }

    this.progressPump = (async () => {
      let consecutiveFailures = 0;
      while (this.authPayload('progress') && (this.latestProgress || this.pendingFindings.length)) {
        const snapshot = this.latestProgress || {
          ...this.authPayload('progress'),
          percent: this.lastPercentSent,
          stage: 'Tarama sürüyor', log: 'Canlı telemetri güncelleniyor', target: '', objectsCount: 0
        };
        this.latestProgress = null;
        const liveFinding = this.pendingFindings[0] || null;
        try {
          await this.request({ ...snapshot, finding: liveFinding }, 10000);
          if (liveFinding) this.pendingFindings.shift();
          consecutiveFailures = 0;
          this.lastSyncError = null;
        } catch (error) {
          // Preserve the newest snapshot instead of dropping it. Authentication
          // errors are not hidden; completion will fail rather than claim a
          // successfully synchronized scan.
          this.latestProgress = this.latestProgress || snapshot;
          this.lastSyncError = error;
          consecutiveFailures++;
          console.warn(`[CloudSync] Canlı ilerleme denemesi ${consecutiveFailures}/3 başarısız:`, error.message);
          if (consecutiveFailures >= 3) break;
          await new Promise(resolve => setTimeout(resolve, 500 * consecutiveFailures));
        }
      }
    })().finally(() => {
      this.progressPump = null;
      if (!this.completing && this.activeSessionId && (this.latestProgress || this.pendingFindings.length)) {
        this.progressRetryTimer = setTimeout(() => {
          this.progressRetryTimer = null;
          void this.startProgressPump();
        }, 2000);
      }
    });
    return this.progressPump;
  }

  async completeSession(scanResults) {
    const auth = this.authPayload('complete');
    if (!auth) throw new Error('Aktif tarama oturumu yok.');
    this.completing = true;
    if (this.progressRetryTimer) {
      clearTimeout(this.progressRetryTimer);
      this.progressRetryTimer = null;
    }
    // The final report contains the canonical finding list. Only the newest
    // progress snapshot must be flushed before it; stale live finding events
    // must never block completion.
    this.pendingFindings = [];
    if (this.progressPump) await this.progressPump;
    if (this.latestProgress) await this.startProgressPump();
    const allFindings = Array.isArray(scanResults?.allFindings) ? scanResults.allFindings : [];
    const result = await this.request({
      ...auth,
      findings: allFindings.map(finding => ({
        title: finding.title || finding.name || 'Şüpheli Nesne',
        category: finding.category || 'Genel',
        severity: String(finding.severity || finding.risk || 'MEDIUM').toUpperCase(),
        path: finding.path || finding.file || '',
        details: finding.details || finding.evidence || finding.desc || '',
        timestamp: finding.timestamp || new Date().toISOString()
      })),
      reportData: {
        timestamp: scanResults?.timestamp || new Date().toISOString(),
        durationSeconds: scanResults?.durationSeconds || 0,
        scannedObjects: scanResults?.scannedObjects || 0,
        scannedJars: scanResults?.scannedJars || 0,
        scanStatus: scanResults?.scanStatus === 'INCOMPLETE' ? 'INCOMPLETE' : 'COMPLETE',
        incompleteEngines: Array.isArray(scanResults?.incompleteEngines)
          ? scanResults.incompleteEngines.map(engine => String(engine.label || '').slice(0, 80)).slice(0, 33)
          : []
      },
      systemInfo: this.getSystemInfo()
    }, 30000);
    this.reset();
    return result;
  }

  async failSession(message) {
    const auth = this.authPayload('fail');
    if (!auth) return;
    try {
      this.completing = true;
      this.pendingFindings = [];
      if (this.progressPump) await this.progressPump;
      await this.request({ ...auth, message: String(message || 'Tarama başarısız') }, 10000);
    } catch (_) {}
    this.reset();
  }
}

module.exports = new CloudSync();
module.exports.CloudSync = CloudSync;
