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
    this.activeSessionId = null;
    this.activeSessionCode = null;
    this.clientToken = null;
    this.lastProgressSent = 0;
    this.lastPercentSent = -1;
    this.progressQueue = Promise.resolve();
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
    const data = await this.request({ action: 'claim', pin: sessionCode, clientId: this.clientId });
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

  async sendProgress(percent, stage, log, finding = null, target = '', objectsCount = 0) {
    const auth = this.authPayload('progress');
    if (!auth) return;
    const now = Date.now();
    const percentDiff = Math.abs(percent - this.lastPercentSent);
    if (!finding && percentDiff < 3 && now - this.lastProgressSent < 1000 && percent < 100) return;
    this.lastProgressSent = now;
    this.lastPercentSent = percent;
    const payload = {
        ...auth, percent, stage, log, target, objectsCount,
        finding: finding ? {
          title: finding.title || finding.name || 'Adli Bulgu',
          category: finding.category || stage || 'Forensics',
          severity: finding.severity || finding.risk || 'HIGH',
          path: finding.path || finding.file || '',
          details: finding.details || finding.desc || log || '',
          timestamp: finding.timestamp || new Date().toISOString()
        } : null
      };
    // Scanner callbacks are intentionally not awaited by the engine. Serialize
    // network writes here so an older request can never overwrite newer live
    // progress in the staff panel.
    this.progressQueue = this.progressQueue
      .then(() => this.request(payload, 10000))
      .catch(error => { console.warn('[CloudSync] İlerleme gönderilemedi:', error.message); });
    return this.progressQueue;
  }

  async completeSession(scanResults) {
    const auth = this.authPayload('complete');
    if (!auth) throw new Error('Aktif tarama oturumu yok.');
    await this.progressQueue;
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
        scannedJars: scanResults?.scannedJars || 0
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
      await this.progressQueue;
      await this.request({ ...auth, message: String(message || 'Tarama başarısız') }, 10000);
    } catch (_) {}
    this.reset();
  }
}

module.exports = new CloudSync();
module.exports.CloudSync = CloudSync;
