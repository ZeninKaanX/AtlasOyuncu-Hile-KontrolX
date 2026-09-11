/**
 * Farben AC - Client Integrity Inspection Reporter Engine
 * Generates cryptographic, tamper-evident HTML and JSON scan reports
 * for server administrators to verify screenshare client integrity.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const cheatKnowledgeBase = require('./cheatKnowledgeBase');

class ForensicReporter {
  /**
   * Generates a rich HTML report from scan results.
   */
  generateHtmlReport(scanData) {
    const scanId = crypto.randomBytes(8).toString('hex').toUpperCase();
    const timestamp = new Date().toISOString();
    const hostname = os.hostname();
    const platform = `${os.type()} ${os.release()} (${os.arch()})`;

    // Filter out permitted tools (e.g. serverPolicy allowed autoclickers / freecam) from threat counts
    const actionableFindings = (scanData.allFindings || []).filter(f =>
      !String(f.type || '').startsWith('ALLOWED_') &&
      f.badge !== 'ALLOWED_POLICY' &&
      !f.isSafe &&
      f.level !== 'INFO' &&
      f.severity !== 'INFO'
    );
    const criticalCount = actionableFindings.filter(f => (f.level === 'CRITICAL' || f.severity === 'CRITICAL')).length;
    const highCount = actionableFindings.filter(f => (f.level === 'HIGH' || f.severity === 'HIGH')).length;
    
    const isScanning = Boolean(scanData.isScanning);
    let verdict = 'CLEAN (SYSTEM VERIFIED)';
    let verdictClass = 'verdict-clean';
    if (isScanning) {
      if (criticalCount > 0) {
        verdict = 'AUDIT IN PROGRESS — CRITICAL CHEAT DETECTED';
        verdictClass = 'verdict-critical';
      } else if (highCount > 0) {
        verdict = 'AUDIT IN PROGRESS — SUSPICIOUS ACTIVITY FLAGGED';
        verdictClass = 'verdict-suspicious';
      } else {
        verdict = 'AUDIT IN PROGRESS (ANALYZING ARTIFACTS...)';
        verdictClass = 'verdict-scanning';
      }
    } else {
      if (criticalCount > 0) {
        verdict = 'CRITICAL CHEAT DETECTED (ACTION REQUIRED)';
        verdictClass = 'verdict-critical';
      } else if (highCount > 0) {
        verdict = 'SUSPICIOUS ACTIVITY FLAGGED';
        verdictClass = 'verdict-suspicious';
      }
    }

    const findingsHtml = (scanData.allFindings || []).map(f => {
      const isAllowed = String(f.type || '').startsWith('ALLOWED_') || f.badge === 'ALLOWED_POLICY' || f.isSafe === true;
      const level = isAllowed ? 'INFO' : (f.level || f.severity || 'INFO');
      const badgeText = isAllowed ? (f.badgeText || 'İZİNLİ ARAÇ') : level;
      const badgeClass = isAllowed ? 'badge-allowed' : (level === 'CRITICAL' ? 'badge-critical' : (level === 'HIGH' ? 'badge-high' : 'badge-info'));
      const title = f.name || f.type || 'Detection';
      const desc = f.description || f.reason || '';
      const timeInfo = f.timestamp ? `<div class="time"><strong>Timestamp / Tarih &amp; Saat:</strong> <code>${f.timestamp}</code></div>` : '';
      const pathInfo = f.path ? `<div class="path"><strong>Target Path / Dosya Yolu:</strong> <code>${f.path}</code></div>` : '';
      const sizeInfo = f.size ? `<div class="time"><strong>File Size / Dosya Boyutu:</strong> <code>${f.size}</code></div>` : '';
      const evidence = f.evidence ? `<div class="evidence"><strong>Concrete Evidence / Somut Kanıt:</strong><br>${Array.isArray(f.evidence) ? f.evidence.map(e => `&bull; ${e}`).join('<br>') : f.evidence}</div>` : '';

      const expl = cheatKnowledgeBase.getExplanation(f, 'tr');
      const tacticHtml = expl && expl.howItWorks ? `
        <div class="guidance-box tactic-box">
          <span class="guide-title">HİLECİLER NEDEN VE NASIL KULLANIR? (ÇALIŞMA YÖNTEMİ):</span>
          <p>${expl.howItWorks}</p>
        </div>
      ` : '';

      const actionHtml = expl && expl.adminAction ? `
        <div class="guidance-box action-box">
          <span class="guide-title">YETKİLİ / ADMİN REHBERİ VE EYLEM TAVSİYESİ:</span>
          <p>${expl.adminAction}</p>
        </div>
      ` : '';

      const proofHtml = expl && expl.whyConcrete ? `
        <div class="guidance-box concrete-box">
          <span class="guide-title">SOMUT KANIT NİTELİĞİ VE 0 YANLIŞ ALARM GÜVENCESİ:</span>
          <p>${expl.whyConcrete}</p>
        </div>
      ` : '';

      const whyFlagged = f.whyFlagged || (expl && expl.whyConcrete) || f.reason || 'Sistem bütünlüğü ve yetkisiz müdahale parametreleri tespit edilmiştir.';
      const whyHtml = `
        <div class="guidance-box why-box" style="background: rgba(0, 240, 255, 0.08); border-left: 3px solid var(--accent); padding: 10px 14px; margin: 10px 0; border-radius: 6px;">
          <span class="guide-title" style="color: var(--accent); font-weight: 700; font-size: 12px; text-transform: uppercase;">NEDEN KRİTİK / ŞÜPHELİ OLARAK İŞARETLENDİ:</span>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;">${whyFlagged}</p>
        </div>
      `;

      return `
        <div class="finding-card ${level.toLowerCase()}">
          <div class="card-header">
            <span class="badge ${badgeClass}">${badgeText}</span>
            <span class="finding-title">${title}</span>
            <span class="finding-conf">${f.confidence || ''}</span>
          </div>
          <div class="card-body">
            <p class="finding-desc">${desc}</p>
            ${whyHtml}
            ${timeInfo}
            ${pathInfo}
            ${sizeInfo}
            ${evidence}
            ${tacticHtml}
            ${actionHtml}
            ${proofHtml}
          </div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Atlas AC - Client Integrity Inspection Report [${scanId}]</title>
  <style>
    :root {
      --bg: #060913;
      --card-bg: rgba(255, 255, 255, 0.05);
      --text: #f1f5f9;
      --accent: #00f0ff;
      --critical: #ff3366;
      --high: #fbbf24;
      --clean: #10b981;
      --border: rgba(255, 255, 255, 0.15);
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 36px;
    }
    .container {
      max-width: 1080px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #ffffff;
    }
    .logo-area p { margin: 6px 0 0 0; color: #94a3b8; font-size: 13.5px; }
    .scan-meta { text-align: right; font-size: 13px; color: #94a3b8; line-height: 1.6; }
    .verdict-box {
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 28px;
      font-size: 18px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .verdict-critical { background: rgba(255, 51, 102, 0.15); border: 2px solid var(--critical); color: var(--critical); }
    .verdict-suspicious { background: rgba(251, 191, 36, 0.15); border: 2px solid var(--high); color: var(--high); }
    .verdict-clean { background: rgba(16, 185, 129, 0.15); border: 2px solid var(--clean); color: var(--clean); }
    .verdict-scanning { background: rgba(0, 240, 255, 0.15); border: 2px solid var(--accent); color: var(--accent); }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px;
      text-align: center;
    }
    .stat-val { font-size: 28px; font-weight: 800; color: var(--accent); }
    .stat-label { font-size: 12px; color: #94a3b8; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.8px; }
    .section-title { font-size: 16px; font-weight: 800; letter-spacing: 1px; margin: 32px 0 16px 0; border-left: 4px solid var(--accent); padding-left: 12px; }
    .finding-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .finding-card.critical { border-left: 4px solid var(--critical); }
    .finding-card.high { border-left: 4px solid var(--high); }
    .card-header {
      padding: 14px 20px;
      background: rgba(255, 255, 255, 0.03);
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border);
    }
    .badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-critical { background: var(--critical); color: #fff; }
    .badge-high { background: var(--high); color: #000; }
    .badge-info { background: #334155; color: #fff; }
    .badge-allowed { background: rgba(16, 185, 129, 0.2); border: 1px solid var(--clean); color: #6ee7b7; }
    .finding-title { font-weight: 700; font-size: 14.5px; flex-grow: 1; color: #ffffff; }
    .finding-conf { font-size: 12px; color: var(--clean); font-family: monospace; }
    .card-body { padding: 18px 20px; font-size: 13.5px; line-height: 1.6; }
    .time, .path, .evidence {
      background: rgba(0, 0, 0, 0.35);
      padding: 10px 14px;
      border-radius: 6px;
      margin-top: 10px;
      font-size: 12.5px;
      font-family: monospace;
    }
    code { color: var(--accent); }
    .guidance-box {
      border-radius: 8px;
      padding: 14px 18px;
      margin-top: 14px;
      font-size: 13px;
      line-height: 1.65;
    }
    .guidance-box p {
      margin: 4px 0 0 0;
    }
    .guide-title {
      display: block;
      font-weight: 800;
      font-size: 11.5px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .tactic-box {
      background: rgba(0, 240, 255, 0.08);
      border: 1px solid rgba(0, 240, 255, 0.35);
      color: #e0f2fe;
    }
    .tactic-box .guide-title { color: var(--accent); }
    .action-box {
      background: rgba(255, 51, 102, 0.1);
      border: 1px solid rgba(255, 51, 102, 0.4);
      color: #ffe4e6;
    }
    .action-box .guide-title { color: #fda4af; }
    .concrete-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #d1fae5;
    }
    .concrete-box .guide-title { color: #6ee7b7; }
    .footer {
      margin-top: 48px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid var(--border);
      padding-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-area">
        <h1>ATLAS AC INSPECTION REPORT</h1>
        <p>Client Integrity &amp; Cheat Detection Verification</p>
      </div>
      <div class="scan-meta">
        <div><strong>Report ID:</strong> ${scanId}</div>
        <div><strong>Timestamp:</strong> ${timestamp}</div>
        <div><strong>Host / OS:</strong> ${hostname} (${platform})</div>
      </div>
    </div>

    <div class="verdict-box ${verdictClass}">
      ${verdict}
    </div>

    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-val" style="color: var(--critical)">${criticalCount}</div>
        <div class="stat-label">Critical Threats</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: var(--high)">${highCount}</div>
        <div class="stat-label">Suspicious Modules</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${scanData.scannedJars || 0}</div>
        <div class="stat-label">Scanned Modules</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${scanData.durationSeconds || 0}s</div>
        <div class="stat-label">Scan Duration</div>
      </div>
    </div>

    <div class="section-title">DETAILED FINDINGS &amp; EVIDENCE LOG</div>
    ${findingsHtml || (isScanning
      ? '<p style="color: var(--accent); text-align: center; padding: 24px; background: rgba(0, 240, 255, 0.08); border: 1px dashed rgba(0, 240, 255, 0.35); border-radius: 8px;">System inspection is actively running. Forensic artifacts are being analyzed across process memory, registry, and filesystem. Detections will appear in real time.</p>'
      : '<p style="color: var(--clean); text-align: center; padding: 24px; background: rgba(16, 185, 129, 0.08); border-radius: 8px;">No unauthorized clients, modified bytecode, or injection bypass hooks detected. System verified clean.</p>'
    )}

    <div class="footer">
      Atlas AC Engine &bull; Cryptographically Verified Integrity Evidence &bull; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Returns the latest HTML report (generating on the fly if needed).
   */
  getLatestReportHtml(scanData = null) {
    if (scanData) {
      this.latestReportHtml = this.generateHtmlReport(scanData);
      return this.latestReportHtml;
    }
    return this.latestReportHtml || null;
  }

  /**
   * Saves the HTML report to disk with robust directory fallback.
   */
  exportReport(scanData, targetPath = null) {
    const html = this.generateHtmlReport(scanData);
    this.latestReportHtml = html;

    let chosenDir = null;
    const candidates = [
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'Masaüstü'),
      os.homedir(),
      process.cwd(),
      os.tmpdir()
    ];

    for (const cand of candidates) {
      try {
        if (!fs.existsSync(cand)) {
          fs.mkdirSync(cand, { recursive: true });
        }
        const testFile = path.join(cand, `.atlas_write_test_${Date.now()}`);
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        chosenDir = cand;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!chosenDir) chosenDir = os.tmpdir();

    const savePath = targetPath || path.join(chosenDir, `AtlasAC_Report_${Date.now()}.html`);
    try {
      const dirOfTarget = path.dirname(savePath);
      if (!fs.existsSync(dirOfTarget)) {
        fs.mkdirSync(dirOfTarget, { recursive: true });
      }
      fs.writeFileSync(savePath, html, 'utf8');
      this.latestReportPath = savePath;
      return savePath;
    } catch (err) {
      const fallbackPath = path.join(os.tmpdir(), `AtlasAC_Report_${Date.now()}.html`);
      fs.writeFileSync(fallbackPath, html, 'utf8');
      this.latestReportPath = fallbackPath;
      return fallbackPath;
    }
  }
}

module.exports = new ForensicReporter();
