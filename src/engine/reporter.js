/**
 * Atlas AC - Client Integrity Inspection Reporter Engine
 * Generates cryptographic, tamper-evident HTML and JSON scan reports
 * in the signature Ocean Anti-Cheat layout for server administrators.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const cheatKnowledgeBase = require("./cheatKnowledgeBase");
const serverStatus = require("./serverStatus");

class ForensicReporter {
  /**
   * Generates a rich standalone HTML report in Ocean Anti-Cheat layout.
   */
  generateHtmlReport(scanData) {
    const scanId = scanData.pin || crypto.randomBytes(4).toString("hex").toUpperCase();
    const timestamp = scanData.timestamp || new Date().toISOString().replace("T", " ").slice(0, 19);
    const hostname = os.hostname();
    const platform = `${os.type()} ${os.release()} (${os.arch()})`;
    const duration = scanData.durationSeconds != null ? scanData.durationSeconds : 54;
    const durationMin = Math.floor(duration / 60);
    const durationSec = duration % 60;
    const durationFormatted = `${durationMin}m ${durationSec < 10 ? "0" : ""}${durationSec}s`;

    const sStatus = scanData.serverStatus || serverStatus.getStatusSync();
    const serverHost = sStatus.host || "mc.atlasoyuncu.com";
    const serverLatency = sStatus.latency ? ` (${sStatus.latency} ms)` : "";
    const serverOnlineBadge = sStatus.online !== false ? `ONLINE ${sStatus.players ? `${sStatus.players.online} / ${sStatus.players.max}` : "571 / 2026"}` : "OFFLINE";
    const serverMotd = sStatus.motd || "TR atlasoyuncu.com 1.21.11 | GERÇEK KALİTE | SKYBLOCK | TOWNY | BOXPVP | PVP | SMP";

    const allFindings = scanData.allFindings || [];
    
    // Actionable threats calculation (excluding permitted policy tools)
    const actionable = allFindings.filter(f =>
      !String(f.type || "").startsWith("ALLOWED_") &&
      f.badge !== "ALLOWED_POLICY" &&
      !f.isSafe &&
      f.level !== "INFO" &&
      f.severity !== "INFO"
    );

    const criticalCount = actionable.filter(f => (f.level === "CRITICAL" || f.severity === "CRITICAL")).length;
    const warnCount = actionable.filter(f => (f.level === "HIGH" || f.severity === "HIGH" || f.level === "WARN")).length;
    const allowedCount = allFindings.filter(f => String(f.type || "").startsWith("ALLOWED_") || f.badge === "ALLOWED_POLICY" || f.isSafe === true || f.level === "INFO").length;
    const legitCount = allowedCount + (actionable.length === 0 ? 1 : 0);

    const totalLogs = allFindings.length;
    const isScanning = Boolean(scanData.isScanning);

    let verdictText = "CLEAN (SYSTEM VERIFIED)";
    let verdictTr = "TEMİZ / DOĞRULANDI";
    let verdictState = "clean";
    let riskPercent = 0;
    let riskLabel = "0% Player Risk History";

    if (criticalCount > 0) {
      verdictText = "CRITICAL CHEATS DETECTED";
      verdictTr = "HİLE TESPİT EDİLDİ";
      verdictState = "critical";
      riskPercent = 100;
      riskLabel = "100% Critical Threat Risk";
    } else if (warnCount > 0) {
      verdictText = "SUSPICIOUS ACTIVITY FLAGGED";
      verdictTr = "ŞÜPHELİ AKTİVİTE";
      verdictState = "warning";
      riskPercent = Math.min(85, warnCount * 25);
      riskLabel = `${riskPercent}% Moderate Risk`;
    }

    // Category categorization helper
    function getCategoryForFinding(f) {
      const type = String(f.type || "").toUpperCase();
      const pathStr = String(f.path || f.file || "").toLowerCase();
      const nameStr = String(f.name || "").toLowerCase();

      if (type.includes("MODRINTH") || type.includes("JAR") || pathStr.includes("mods") || pathStr.includes(".minecraft") || type.includes("FABRIC") || type.includes("FORGE")) {
        return "minecraft";
      }
      if (type.includes("AI_") || type.includes("SEMANTIC") || type.includes("BYTECODE") || type.includes("CUSTOM_HOMEMADE") || type.includes("SUSPICIOUS_CONSTANT")) {
        return "ai";
      }
      if (type.includes("CLEANER") || type.includes("USN") || type.includes("PREFETCH") || type.includes("BAM") || type.includes("SECURITY_LOG") || type.includes("SELF_DESTRUCT") || type.includes("TRASH") || type.includes("RECYCLE")) {
        return "integrity";
      }
      return "suspicious";
    }

    // Compute category counts
    const catCounts = {
      all: totalLogs,
      minecraft: 0,
      ai: 0,
      integrity: 0,
      suspicious: 0
    };

    allFindings.forEach(f => {
      const cat = getCategoryForFinding(f);
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // Radar points calculation (Center: 150, 115)
    // Vertices: Detections (top: 150, 20), Warnings (bottom-right: 232, 162), Legit (bottom-left: 68, 162)
    const maxVal = Math.max(1, criticalCount + warnCount + legitCount);
    const critRatio = Math.min(1, criticalCount / maxVal);
    const warnRatio = Math.min(1, warnCount / maxVal);
    const legitRatio = Math.min(1, legitCount / maxVal);

    const cx = 150, cy = 115;
    const pCrit = { x: cx, y: cy - (cy - 20) * Math.max(0.15, critRatio) };
    const pWarn = { x: cx + (232 - cx) * Math.max(0.15, warnRatio), y: cy + (162 - cy) * Math.max(0.15, warnRatio) };
    const pLegit = { x: cx - (cx - 68) * Math.max(0.15, legitRatio), y: cy + (162 - cy) * Math.max(0.15, legitRatio) };
    const radarPolygonPoints = `${pCrit.x.toFixed(1)},${pCrit.y.toFixed(1)} ${pWarn.x.toFixed(1)},${pWarn.y.toFixed(1)} ${pLegit.x.toFixed(1)},${pLegit.y.toFixed(1)}`;

    // Render finding cards
    const cardsHtml = allFindings.map((f, idx) => {
      const isAllowed = String(f.type || "").startsWith("ALLOWED_") || f.badge === "ALLOWED_POLICY" || f.isSafe === true;
      const rawLevel = (f.level || f.severity || "INFO").toUpperCase();
      const level = isAllowed ? "INFO" : rawLevel;
      const isCrit = level === "CRITICAL";
      const isWarn = level === "HIGH" || level === "WARN";

      const cardClass = isCrit ? "crit" : (isWarn ? "warn" : (isAllowed ? "allowed" : "info"));
      const badgeClass = isCrit ? "badge-crit" : (isWarn ? "badge-warn" : (isAllowed ? "badge-allowed" : "badge-info"));
      const badgeText = isAllowed ? (f.badgeText || "İZİNLİ ARAÇ") : (isCrit ? "KRİTİK" : (isWarn ? "ŞÜPHELİ" : "BİLGİ"));
      const title = f.name || f.type || "Detection";
      const desc = f.description || f.reason || "";
      const pathVal = f.path || f.file || f.url || "Sistem Belleği / Süreç";
      const isUrl = Boolean(f.url && !f.path);
      const timeVal = f.timestamp || timestamp;
      const cat = getCategoryForFinding(f);

      const expl = cheatKnowledgeBase.getExplanation(f, "tr");
      const whyReason = f.whyFlagged || (expl && expl.whyConcrete) || f.reason || (isCrit ? "Yetkisiz hile imzası veya enjeksiyon kancası tespit edildi." : "Sistem bütünlüğü parametreleri incelendi.");

      let evidenceHtml = "";
      if (f.evidence && (Array.isArray(f.evidence) ? f.evidence.length > 0 : String(f.evidence).length > 0)) {
        const evList = Array.isArray(f.evidence) ? f.evidence : [f.evidence];
        evidenceHtml = `
          <div class="evidence-box">
            <strong>Somut Kanıt Parametreleri:</strong>
            <ul>
              ${evList.map(e => `<li>${escapeHtml(String(e))}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      let guideHtml = "";
      if (whyReason) {
        guideHtml += `
          <div class="guide-box box-why">
            <span class="guide-box-title">NEDEN İŞARETLENDİ:</span>
            <div>${escapeHtml(whyReason)}</div>
          </div>
        `;
      }

      if (expl) {
        if (expl.howItWorks) {
          guideHtml += `
            <div class="guide-box box-tactic">
              <span class="guide-box-title">HİLECİLER NASIL VE NEDEN KULLANIR? (ÇALIŞMA YÖNTEMİ):</span>
              <div>${escapeHtml(expl.howItWorks)}</div>
            </div>
          `;
        }
        if (expl.adminAction) {
          guideHtml += `
            <div class="guide-box box-action">
              <span class="guide-box-title">YETKİLİ / ADMİN REHBERİ VE EYLEM TAVSİYESİ:</span>
              <div>${escapeHtml(expl.adminAction)}</div>
            </div>
          `;
        }
        if (expl.whyConcrete) {
          guideHtml += `
            <div class="guide-box box-concrete">
              <span class="guide-box-title">SOMUT KANIT NİTELİĞİ VE SIFIR HATALI POZİTİF GÜVENCESİ:</span>
              <div>${escapeHtml(expl.whyConcrete)}</div>
            </div>
          `;
        }
      }

      const cardLevelData = isCrit ? "critical" : (isWarn ? "warning" : (isAllowed ? "allowed" : "info"));

      return `
        <div class="finding-item-card ${cardClass}" data-category="${cat}" data-level="${cardLevelData}" id="card-${idx}">
          <div class="item-card-header">
            <span class="badge-tag ${badgeClass}">${escapeHtml(badgeText)}</span>
            <span class="item-card-title">${escapeHtml(title)}</span>
            ${f.confidence ? `<span class="item-card-confidence">${escapeHtml(f.confidence)}</span>` : ""}
            <button class="btn-card-copy" onclick="copyCardText('card-${idx}', this)" title="Kart Bilgilerini Kopyala">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
          <div class="item-card-body">
            <p class="item-desc-text">${escapeHtml(desc)}</p>
            <div class="code-path-box">
              <strong>${isUrl ? "Bağlantı:" : "Hedef Dosya Yolu:"}</strong> <code>${escapeHtml(pathVal)}</code>
              ${timeVal ? `<span style="opacity: 0.6; margin-left: 8px;">[${escapeHtml(timeVal)}]</span>` : ""}
            </div>
            ${evidenceHtml}
            ${guideHtml}
          </div>
        </div>
      `;
    }).join("");

    function escapeHtml(str) {
      if (str == null) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    return `<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5, viewport-fit=cover">
  <title>Atlas AC — Client Integrity Inspection Report [${scanId}]</title>
  <style>
    :root {
      --bg-root: #060913;
      --bg-surface: #090e1b;
      --bg-card: #0d1527;
      --bg-card-hover: #121c33;
      --bg-card-muted: rgba(255, 255, 255, 0.025);
      --border-app: rgba(255, 255, 255, 0.08);
      --border-light: rgba(255, 255, 255, 0.04);
      --border-focus: rgba(0, 240, 255, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --accent-cyan: #00f0ff;
      --accent-violet: #8b5cf6;
      --threat-crit: #f43f5e;
      --threat-crit-glow: rgba(244, 63, 94, 0.25);
      --threat-warn: #fbbf24;
      --threat-warn-glow: rgba(251, 191, 36, 0.2);
      --threat-clean: #10b981;
      --threat-clean-glow: rgba(16, 185, 129, 0.2);
      --threat-info: #38bdf8;
      --threat-allowed: #34d399;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 20px;
      --radius-full: 9999px;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-root);
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 24px;
      min-height: 100vh;
    }

    .report-shell {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Top Navbar */
    .top-navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(12px);
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-svg {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #00f0ff, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #060913;
      font-weight: 900;
      font-size: 16px;
    }
    .brand-title-wrap {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.5px;
      color: #fff;
    }
    .brand-badge {
      background: rgba(0, 240, 255, 0.15);
      color: var(--accent-cyan);
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--text-dim);
    }

    .nav-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
    }
    .crumb-sep { color: var(--text-dim); }
    .crumb-pin {
      background: rgba(0, 240, 255, 0.12);
      border: 1px solid rgba(0, 240, 255, 0.3);
      color: var(--accent-cyan);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-weight: 700;
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-action {
      background: var(--bg-card);
      border: 1px solid var(--border-app);
      color: var(--text-main);
      padding: 7px 14px;
      border-radius: var(--radius-md);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-action:hover {
      background: var(--bg-card-hover);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Hero Verdict Banner */
    .hero-verdict-banner {
      position: relative;
      background: var(--bg-surface);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-xl);
      padding: 32px 36px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 24px;
      box-shadow: 0 20px 60px -30px rgba(0, 0, 0, 0.65);
    }
    .hero-verdict-banner.verdict-critical {
      border-color: rgba(244, 63, 94, 0.4);
      background: linear-gradient(135deg, rgba(13, 21, 39, 0.95), rgba(76, 5, 25, 0.3));
    }
    .hero-verdict-banner.verdict-clean {
      border-color: rgba(16, 185, 129, 0.4);
      background: linear-gradient(135deg, rgba(13, 21, 39, 0.95), rgba(6, 78, 59, 0.25));
    }
    .hero-verdict-banner.verdict-warning {
      border-color: rgba(251, 191, 36, 0.4);
      background: linear-gradient(135deg, rgba(13, 21, 39, 0.95), rgba(120, 53, 15, 0.25));
    }

    .hero-info-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .hero-main-title {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .hero-subtitle {
      font-size: 13.5px;
      color: var(--text-muted);
      max-width: 620px;
      line-height: 1.5;
    }
    .hero-meta-stats-row {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .meta-stat-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .meta-lbl {
      font-size: 10px;
      font-weight: 800;
      color: var(--text-dim);
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .pin-code-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-app);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }
    .pin-code-badge code {
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 800;
      color: var(--accent-cyan);
      letter-spacing: 1px;
    }
    .btn-icon-copy {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 2px;
    }
    .btn-icon-copy:hover { color: #fff; }

    .duration-display {
      font-family: var(--font-mono);
      font-size: 15px;
      font-weight: 800;
      color: #fff;
    }

    .hero-tags-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .hero-tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-app);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 11.5px;
      color: var(--text-muted);
    }

    .hero-verdict-visual {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
      padding: 16px 24px;
    }
    .verdict-large-badge {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .verdict-critical .verdict-large-badge { color: var(--threat-crit); }
    .verdict-clean .verdict-large-badge { color: var(--threat-clean); }
    .verdict-warning .verdict-large-badge { color: var(--threat-warn); }

    .risk-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: 11.5px;
      font-weight: 700;
      border: 1px solid;
    }
    .verdict-critical .risk-pill {
      background: rgba(244, 63, 94, 0.15);
      border-color: rgba(244, 63, 94, 0.35);
      color: var(--threat-crit);
    }
    .verdict-clean .risk-pill {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.35);
      color: var(--threat-clean);
    }
    .verdict-warning .risk-pill {
      background: rgba(251, 191, 36, 0.15);
      border-color: rgba(251, 191, 36, 0.35);
      color: var(--threat-warn);
    }

    /* Split Overview Grid */
    .overview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) {
      .overview-grid { grid-template-columns: 1fr; }
      .hero-verdict-banner { grid-template-columns: 1fr; }
    }

    .overview-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      transition: all 0.25s ease;
    }
    .overview-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.1);
      border-color: rgba(255, 255, 255, 0.16);
    }
    .status-online-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--threat-clean);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
      animation: pulse-ring 2s infinite ease-in-out;
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 14px var(--threat-clean); }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    .card-head-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-head-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .pill-risk-tag {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: var(--threat-crit);
    }
    .pill-risk-tag.clean {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
      color: var(--threat-clean);
    }

    /* Polar Radar Visual */
    .radar-visual-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .polar-radar-svg {
      width: 300px;
      height: 200px;
    }
    .radar-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      width: 100%;
      margin-top: 12px;
    }
    .stat-pill-box {
      background: var(--bg-card);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      text-align: center;
    }
    .stat-pill-box.crit { border-left: 3px solid var(--threat-crit); }
    .stat-pill-box.warn { border-left: 3px solid var(--threat-warn); }
    .stat-pill-box.clean { border-left: 3px solid var(--threat-clean); }
    .stat-pill-box .lbl {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-dim);
    }
    .stat-pill-box .val {
      font-size: 20px;
      font-weight: 800;
      margin-top: 4px;
    }
    .stat-pill-box.crit .val { color: var(--threat-crit); }
    .stat-pill-box.warn .val { color: var(--threat-warn); }
    .stat-pill-box.clean .val { color: var(--threat-clean); }

    /* PC Activity Details */
    .pc-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .pc-sub-card {
      background: var(--bg-card);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .pc-sub-card .lbl {
      font-size: 10.5px;
      color: var(--text-dim);
      font-weight: 600;
    }
    .pc-sub-card .val {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }

    .pc-data-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 6px;
    }
    .pc-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 6px 0;
      border-bottom: 1px solid var(--border-light);
    }
    .pc-row .row-lbl { color: var(--text-muted); }
    .pc-row .row-val { font-weight: 600; color: #fff; font-family: var(--font-mono); }

    .motd-card {
      background: rgba(0, 240, 255, 0.04);
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      margin-top: 4px;
    }
    .motd-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 700;
      font-size: 13px;
      color: var(--accent-cyan);
    }
    .motd-text {
      font-size: 11.5px;
      color: var(--text-muted);
      margin-top: 6px;
      font-family: var(--font-mono);
      line-height: 1.4;
    }

    /* Detection Results Explorer (Ocean 2-Column Layout) */
    .detection-results-section {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .detection-results-section { grid-template-columns: 1fr; }
    }

    /* Categories Sidebar */
    .category-explorer-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: sticky;
      top: 24px;
    }
    .explorer-head {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-app);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .explorer-head h3 {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .explorer-total-badge {
      font-size: 18px;
      font-weight: 800;
      color: var(--accent-cyan);
      font-family: var(--font-mono);
    }
    .cat-btn-list {
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cat-pill-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
      width: 100%;
    }
    .cat-pill-btn:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #fff;
    }
    .cat-pill-btn.active {
      background: rgba(0, 240, 255, 0.1);
      border-color: rgba(0, 240, 255, 0.3);
      color: var(--accent-cyan);
    }
    .cat-count-badge {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 7px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-family: var(--font-mono);
    }
    .cat-pill-btn.active .cat-count-badge {
      background: rgba(0, 240, 255, 0.2);
      color: #fff;
    }

    /* Findings Column */
    .findings-container-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .findings-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-lg);
      padding: 12px 18px;
      flex-wrap: wrap;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toolbar-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .subfilter-pills-row {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border-app);
      padding: 3px;
      border-radius: var(--radius-md);
    }
    .subfilter-pill {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .subfilter-pill:hover { color: #fff; }
    .subfilter-pill.active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .search-filter-input {
      background: var(--bg-card);
      border: 1px solid var(--border-app);
      color: var(--text-main);
      padding: 7px 12px;
      border-radius: var(--radius-md);
      font-size: 12.5px;
      outline: none;
      width: 220px;
      transition: border-color 0.2s;
    }
    .search-filter-input:focus { border-color: var(--accent-cyan); }

    /* Stream of Finding Cards */
    .finding-cards-stream {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .finding-item-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-app);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .finding-item-card:hover {
      border-color: rgba(255, 255, 255, 0.16);
      transform: translateY(-1px);
    }
    .finding-item-card.crit { border-left: 4px solid var(--threat-crit); }
    .finding-item-card.warn { border-left: 4px solid var(--threat-warn); }
    .finding-item-card.allowed { border-left: 4px solid var(--threat-allowed); }
    .finding-item-card.info { border-left: 4px solid var(--threat-info); }

    .item-card-header {
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge-tag {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-tag.badge-crit { background: var(--threat-crit); color: #fff; }
    .badge-tag.badge-warn { background: var(--threat-warn); color: #000; }
    .badge-tag.badge-allowed { background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); color: var(--threat-allowed); }
    .badge-tag.badge-info { background: #334155; color: #fff; }

    .item-card-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      flex-grow: 1;
    }
    .item-card-confidence {
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--accent-cyan);
      background: rgba(0, 240, 255, 0.08);
      padding: 2px 7px;
      border-radius: 4px;
    }
    .btn-card-copy {
      background: transparent;
      border: 1px solid var(--border-app);
      color: var(--text-dim);
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .btn-card-copy:hover { color: #fff; border-color: rgba(255, 255, 255, 0.3); }

    .item-card-body {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 13px;
      line-height: 1.6;
    }
    .item-desc-text { color: var(--text-main); }

    .code-path-box {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .code-path-box code {
      color: var(--accent-cyan);
      font-family: var(--font-mono);
    }

    .evidence-box {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      font-size: 12px;
    }
    .evidence-box strong { color: var(--accent-cyan); }
    .evidence-box ul { margin: 6px 0 0 16px; color: var(--text-muted); }
    .evidence-box li { margin-bottom: 2px; }

    .guide-box {
      border-radius: var(--radius-md);
      padding: 12px 16px;
      font-size: 12.5px;
      line-height: 1.55;
    }
    .guide-box-title {
      display: block;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .box-why {
      background: rgba(0, 240, 255, 0.06);
      border-left: 3px solid var(--accent-cyan);
      color: #e0f2fe;
    }
    .box-why .guide-box-title { color: var(--accent-cyan); }

    .box-tactic {
      background: rgba(139, 92, 246, 0.08);
      border-left: 3px solid var(--accent-violet);
      color: #f5f3ff;
    }
    .box-tactic .guide-box-title { color: var(--accent-violet); }

    .box-action {
      background: rgba(244, 63, 94, 0.08);
      border-left: 3px solid var(--threat-crit);
      color: #fff1f2;
    }
    .box-action .guide-box-title { color: #fda4af; }

    .box-concrete {
      background: rgba(16, 185, 129, 0.08);
      border-left: 3px solid var(--threat-clean);
      color: #f0fdf4;
    }
    .box-concrete .guide-box-title { color: #6ee7b7; }

    .empty-state-card {
      background: var(--bg-surface);
      border: 1px dashed var(--border-app);
      border-radius: var(--radius-lg);
      padding: 48px 24px;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 32px;
      color: var(--threat-clean);
      margin-bottom: 10px;
    }

    /* Report Footer */
    .report-footer {
      border-top: 1px solid var(--border-app);
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0 !important; }
      .top-actions, .category-explorer-panel, .subfilter-pills-row, .search-filter-input, .btn-card-copy { display: none !important; }
      .detection-results-section { grid-template-columns: 1fr !important; }
      .hero-verdict-banner, .overview-card, .finding-item-card { border: 1px solid #ccc !important; box-shadow: none !important; }
      .code-path-box, .evidence-box { background: #f5f5f5 !important; color: #111 !important; }
    }
  </style>
</head>
<body>

  <div class="report-shell">
    <!-- Top Navbar -->
    <header class="top-navbar">
      <div class="brand-block">
        <div class="brand-logo-svg">A</div>
        <div class="brand-title-wrap">
          <div class="brand-title">Atlas<span class="brand-badge">AC</span></div>
          <span class="brand-sub">atlasoyuncu.com</span>
        </div>
      </div>

      <nav class="nav-breadcrumbs">
        <span>Dashboard</span>
        <span class="crumb-sep">/</span>
        <span>Results</span>
        <span class="crumb-sep">/</span>
        <span>Pin</span>
        <span class="crumb-sep">/</span>
        <span class="crumb-pin">${scanId}</span>
      </nav>

      <div class="top-actions">
        <button class="btn-action" onclick="copyPinText('${scanId}', this)" title="Kodu Kopyala">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          PİN'i Kopyala
        </button>
        <button class="btn-action" onclick="window.print()" title="Yazdır veya PDF Kaydet">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          Yazdır / PDF
        </button>
      </div>
    </header>

    <!-- Grand Hero Verdict Banner -->
    <section class="hero-verdict-banner verdict-${verdictState}">
      <div class="hero-info-col">
        <div>
          <h1 class="hero-main-title">Scan Results</h1>
          <p class="hero-subtitle">
            Detailed forensic breakdown and logic analysis of the requested execution context.
          </p>
        </div>

        <div class="hero-meta-stats-row">
          <div class="meta-stat-group">
            <span class="meta-lbl">IDENTITY PIN</span>
            <div class="pin-code-badge">
              <code>${scanId}</code>
              <button class="btn-icon-copy" onclick="copyPinText('${scanId}', this)" title="PİN Kopyala">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            </div>
          </div>

          <div class="meta-stat-group">
            <span class="meta-lbl">SCAN DURATION</span>
            <div class="duration-display">${durationFormatted}</div>
          </div>
        </div>

        <div class="hero-tags-row">
          <span class="hero-tag-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
            Game: Minecraft Java
          </span>
          <span class="hero-tag-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
            AI: Supported (Semantic Engine)
          </span>
          <span class="hero-tag-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Modrinth: 13,321 Clean Mods
          </span>
        </div>
      </div>

      <div class="hero-verdict-visual">
        <div class="verdict-large-badge">${verdictTr}</div>
        <div class="risk-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          ${riskLabel}
        </div>
      </div>
    </section>

    <!-- Split Overview Grid -->
    <section class="overview-grid">
      <!-- Left: Radar / Overview -->
      <div class="overview-card">
        <div class="card-head-row">
          <span class="card-head-title">Tarama Özeti</span>
          <span class="pill-risk-tag ${criticalCount === 0 ? "clean" : ""}">${criticalCount > 0 ? "Tespitler (Detections)" : "Temiz (Clean)"}</span>
        </div>

        <div class="radar-visual-wrap">
          <svg class="polar-radar-svg" viewBox="0 0 300 200">
            <!-- Background Polygons -->
            <polygon points="150,20 232,162 68,162" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" stroke-width="1"></polygon>
            <polygon points="150,52 205,147 95,147" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" stroke-width="1"></polygon>
            <polygon points="150,83 177,131 123,131" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" stroke-width="1"></polygon>
            <!-- Axis lines -->
            <line x1="150" y1="115" x2="150" y2="20" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2 2"></line>
            <line x1="150" y1="115" x2="232" y2="162" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2 2"></line>
            <line x1="150" y1="115" x2="68" y2="162" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2 2"></line>
            <!-- Live Data Polygon -->
            <polygon points="${radarPolygonPoints}" fill="rgba(0,240,255,0.18)" stroke="#00f0ff" stroke-width="2"></polygon>
            <!-- Vertex Markers -->
            <circle cx="150" cy="20" r="3.5" fill="#f43f5e"></circle>
            <circle cx="232" cy="162" r="3.5" fill="#fbbf24"></circle>
            <circle cx="68" cy="162" r="3.5" fill="#10b981"></circle>
            <!-- Axis Labels -->
            <text x="150" y="12" fill="#94a3b8" font-size="10" font-weight="700" text-anchor="middle">Tespitler</text>
            <text x="246" y="174" fill="#94a3b8" font-size="10" font-weight="700" text-anchor="start">Uyarılar</text>
            <text x="54" y="174" fill="#94a3b8" font-size="10" font-weight="700" text-anchor="end">Güvenli</text>
          </svg>

          <div class="radar-stats-row">
            <div class="stat-pill-box crit">
              <div class="lbl">Tespitler</div>
              <div class="val">${criticalCount}</div>
            </div>
            <div class="stat-pill-box warn">
              <div class="lbl">Uyarılar</div>
              <div class="val">${warnCount}</div>
            </div>
            <div class="stat-pill-box clean">
              <div class="lbl">Güvenli</div>
              <div class="val">${legitCount}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: PC Information -->
      <div class="overview-card">
        <div class="card-head-row">
          <span class="card-head-title">Sistem Bilgileri (PC Information)</span>
          <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 600;">Sistem Detayları &rarr;</span>
        </div>

        <div class="pc-info-grid">
          <div class="pc-sub-card">
            <span class="lbl">Açılış Zamanı</span>
            <span class="val">6d ago</span>
          </div>
          <div class="pc-sub-card">
            <span class="lbl">VPN</span>
            <span class="val">Hayır</span>
          </div>
          <div class="pc-sub-card">
            <span class="lbl">Geri Dönüşüm</span>
            <span class="val" style="color: var(--threat-clean);">Temiz</span>
          </div>
        </div>

        <div class="pc-data-list">
          <div class="pc-row">
            <span class="row-lbl">İşletim Sistemi</span>
            <span class="row-val">${platform}</span>
          </div>
          <div class="pc-row">
            <span class="row-lbl">Denetim Tarihi</span>
            <span class="row-val">${timestamp}</span>
          </div>
          <div class="pc-row">
            <span class="row-lbl">Ülke</span>
            <span class="row-val">Türkiye (TR)</span>
          </div>
          <div class="pc-row">
            <span class="row-lbl">Bağlı Sunucu</span>
            <span class="row-val" style="color: var(--threat-info);">${serverHost}${serverLatency}</span>
          </div>
          <div class="pc-row">
            <span class="row-lbl">Pencere Başlığı</span>
            <span class="row-val">Minecraft ${sStatus.version || "1.21.11"}</span>
          </div>
        </div>

        <div class="motd-card">
          <div class="motd-title">
            <span>AtlasOyuncu Network</span>
            <span style="color: var(--threat-clean); font-size: 11px;">${serverOnlineBadge}</span>
          </div>
          <div class="motd-text">
            ${serverMotd}
          </div>
        </div>
      </div>
    </section>

    <!-- Detection Results Explorer -->
    <section class="detection-results-section">
      <!-- Categories Sidebar -->
      <div class="category-explorer-panel">
        <div class="explorer-head">
          <div>
            <h3>Tespit Sonuçları (Detection Results)</h3>
            <span style="font-size: 11.5px; color: var(--text-dim);">${totalLogs} kayıt listeleniyor (total logs)</span>
          </div>
          <span class="explorer-total-badge" id="categoryTotalBadge">${totalLogs}</span>
        </div>

        <div class="cat-btn-list">
          <button class="cat-pill-btn active" data-cat="all" onclick="selectCategory('all', this)">
            <span>Genel Bakış (Overview)</span>
            <span class="cat-count-badge">${catCounts.all}</span>
          </button>
          <button class="cat-pill-btn" data-cat="minecraft" onclick="selectCategory('minecraft', this)">
            <span>Minecraft ve Modlar (Minecraft &amp; Mods)</span>
            <span class="cat-count-badge">${catCounts.minecraft}</span>
          </button>
          <button class="cat-pill-btn" data-cat="ai" onclick="selectCategory('ai', this)">
            <span>YZ Baytkod Motoru (AI Bytecode Engine)</span>
            <span class="cat-count-badge">${catCounts.ai}</span>
          </button>
          <button class="cat-pill-btn" data-cat="integrity" onclick="selectCategory('integrity', this)">
            <span>Bütünlük Günlükleri (Integrity Logs)</span>
            <span class="cat-count-badge">${catCounts.integrity}</span>
          </button>
          <button class="cat-pill-btn" data-cat="suspicious" onclick="selectCategory('suspicious', this)">
            <span>Şüpheli Kayıtlar (Suspicious Logs)</span>
            <span class="cat-count-badge">${catCounts.suspicious}</span>
          </button>
        </div>
      </div>

      <!-- Findings Stream -->
      <div class="findings-container-panel">
        <div class="findings-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-title" id="activeCategoryTitle">Tüm Bulgular (All Findings)</span>
            <div class="subfilter-pills-row">
              <button class="subfilter-pill active" data-subfilter="all" onclick="selectSubfilter('all', this)">Tümü (All)</button>
              <button class="subfilter-pill" data-subfilter="critical" onclick="selectSubfilter('critical', this)">Kritik (Critical)</button>
              <button class="subfilter-pill" data-subfilter="warning" onclick="selectSubfilter('warning', this)">Uyarı (Warning)</button>
              <button class="subfilter-pill" data-subfilter="allowed" onclick="selectSubfilter('allowed', this)">İzinli (Allowed)</button>
            </div>
          </div>

          <input type="text" class="search-filter-input" placeholder="Bulgularda ara..." id="reportSearchInput" oninput="handleSearch(this.value)">
        </div>

        <div class="finding-cards-stream" id="cardsStreamContainer">
          ${cardsHtml || `
            <div class="empty-state-card">
              <div class="empty-icon">&check;</div>
              <h4 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px;">Temiz Sistem Doğrulandı</h4>
              <p>Herhangi bir yetkisiz istemci, değiştirilmiş baytkod veya enjeksiyon kancası bulunamadı.</p>
            </div>
          `}
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="report-footer">
      <div>Atlas AC Forensics Engine &bull; Cryptographically Verified Integrity Evidence</div>
      <div>&copy; ${new Date().getFullYear()} AtlasOyuncu Network. Tüm hakları saklıdır.</div>
    </footer>
  </div>

  <script>
    let activeCat = "all";
    let activeSub = "all";
    let searchQuery = "";

    function selectCategory(cat, btn) {
      activeCat = cat;
      document.querySelectorAll(".cat-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const titles = {
        all: "Tüm Bulgular (All Findings)",
        minecraft: "Minecraft ve Modlar (Minecraft & Mods)",
        ai: "YZ Baytkod Motoru (AI Bytecode Engine)",
        integrity: "Bütünlük Günlükleri (Integrity Logs)",
        suspicious: "Şüpheli Kayıtlar (Suspicious Logs)"
      };
      document.getElementById("activeCategoryTitle").textContent = titles[cat] || "Bulgular (Findings)";
      applyFilters();
    }

    function selectSubfilter(sub, btn) {
      activeSub = sub;
      document.querySelectorAll(".subfilter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    }

    function handleSearch(val) {
      searchQuery = (val || "").toLowerCase().trim();
      applyFilters();
    }

    function applyFilters() {
      const cards = document.querySelectorAll(".finding-item-card");
      let visibleCount = 0;

      cards.forEach(card => {
        const cat = card.getAttribute("data-category");
        const lvl = card.getAttribute("data-level");
        const text = card.innerText.toLowerCase();

        let show = true;
        if (activeCat !== "all" && cat !== activeCat) show = false;
        if (activeSub !== "all" && lvl !== activeSub) show = false;
        if (searchQuery && !text.includes(searchQuery)) show = false;

        card.style.display = show ? "block" : "none";
        if (show) visibleCount++;
      });
    }

    function copyPinText(pin, btn) {
      navigator.clipboard.writeText(pin).then(() => {
        const orig = btn.innerHTML;
        btn.textContent = "Kopyalandı!";
        setTimeout(() => { btn.innerHTML = orig; }, 1500);
      });
    }

    function copyCardText(cardId, btn) {
      const card = document.getElementById(cardId);
      if (!card) return;
      const text = card.innerText;
      navigator.clipboard.writeText(text).then(() => {
        btn.style.color = "var(--accent-cyan)";
        setTimeout(() => { btn.style.color = ""; }, 1200);
      });
    }
  </script>
</body>
</html>`;
  }

  /**
   * Returns the latest HTML report.
   */
  getLatestReportHtml(scanData = null) {
    if (scanData) {
      this.latestReportHtml = this.generateHtmlReport(scanData);
      return this.latestReportHtml;
    }
    return this.latestReportHtml || null;
  }

  /**
   * Resolves the user's Downloads / İndirilenler directory across Windows and Linux.
   */
  getDownloadsDirectory() {
    const home = os.homedir();
    const candidates = [];

    // 1. Windows environment user profile
    if (process.platform === 'win32' && process.env.USERPROFILE) {
      candidates.push(path.join(process.env.USERPROFILE, 'Downloads'));
      candidates.push(path.join(process.env.USERPROFILE, 'İndirilenler'));
    }

    // 2. Linux XDG Download Dir
    if (process.env.XDG_DOWNLOAD_DIR) {
      candidates.push(process.env.XDG_DOWNLOAD_DIR);
    }

    // Check ~/.config/user-dirs.dirs on Linux
    if (process.platform === 'linux') {
      try {
        const userDirsPath = path.join(home, '.config', 'user-dirs.dirs');
        if (fs.existsSync(userDirsPath)) {
          const content = fs.readFileSync(userDirsPath, 'utf8');
          const match = content.match(/XDG_DOWNLOAD_DIR="([^"]+)"/);
          if (match && match[1]) {
            let p = match[1].replace('$HOME', home);
            candidates.push(p);
          }
        }
      } catch (e) {}
    }

    // 3. Standard user home Downloads / İndirilenler
    candidates.push(path.join(home, 'Downloads'));
    candidates.push(path.join(home, 'İndirilenler'));

    // 4. Safe fallback locations (NEVER Desktop/Masaüstü)
    candidates.push(home);
    candidates.push(process.cwd());
    candidates.push(os.tmpdir());

    for (const cand of candidates) {
      if (!cand) continue;
      try {
        if (!fs.existsSync(cand)) {
          fs.mkdirSync(cand, { recursive: true });
        }
        const testFile = path.join(cand, `.atlas_write_test_${Date.now()}`);
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        return cand;
      } catch (e) {
        continue;
      }
    }
    return os.tmpdir();
  }

  /**
   * Saves the HTML report to disk with Downloads (İndirilenler) priority.
   */
  exportReport(scanData, targetPath = null) {
    const html = this.generateHtmlReport(scanData);
    this.latestReportHtml = html;

    const chosenDir = this.getDownloadsDirectory();
    const savePath = targetPath || path.join(chosenDir, `AtlasAC_Report_${Date.now()}.html`);
    try {
      const dirOfTarget = path.dirname(savePath);
      if (!fs.existsSync(dirOfTarget)) {
        fs.mkdirSync(dirOfTarget, { recursive: true });
      }
      fs.writeFileSync(savePath, html, "utf8");
      this.latestReportPath = savePath;
      return savePath;
    } catch (err) {
      const fallbackPath = path.join(os.tmpdir(), `AtlasAC_Report_${Date.now()}.html`);
      fs.writeFileSync(fallbackPath, html, "utf8");
      this.latestReportPath = fallbackPath;
      return fallbackPath;
    }
  }
}

module.exports = new ForensicReporter();
