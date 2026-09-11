/**
 * Atlas AC - PowerShell Script Forensics Engine (Windows Only)
 *
 * Detects PowerShell-based cheat launchers, injection scripts, and self-destruct
 * mechanisms by examining:
 *
 *   1. Script Block Logging (Event ID 4104):
 *      Queries the Microsoft-Windows-PowerShell/Operational event log for the last
 *      200 script block execution events and checks each message for cheat keywords,
 *      injection API calls, and base64-encoded payloads.
 *
 *   2. PowerShell Transcription Logs:
 *      Searches common transcript directories for .txt files containing cheat-related
 *      command sequences.
 *
 *   3. Recent .ps1 scripts in Downloads / Desktop / Temp:
 *      Finds and inspects PowerShell scripts in user-writable locations for
 *      injection or cheat keywords.
 *
 *   4. Self-destruct scripts (.bat, .cmd, .vbs):
 *      Detects batch/VBScript files that forcibly delete themselves or their
 *      payload after execution — a hallmark of transient cheat loaders.
 *
 * Returns an empty result set on Linux / macOS.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cheat brand / technique keywords to match against script content. */
const CHEAT_KEYWORDS = [
  'vape', 'drip', 'slinky', 'liquidbounce', 'meteorclient', 'wurstclient',
  'wurst', 'riseclient', 'novoline', 'astolfo', 'tenacity', 'ravenbplus',
  'VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread',
  'NtUnmapViewOfSection'
];

/** Benign scripts and package managers whitelist to prevent false flags. */
const BENIGN_SCRIPT_KEYWORDS = [
  'chocolatey', 'chocolatey.org', 'scoop.sh', 'winget', 'nvm-windows',
  'rustup', 'oh-my-posh', 'docker', 'npm', 'yarn', 'pnpm', 'homebrew'
];

/** Regex built once from the keyword list for fast matching. */
const CHEAT_KEYWORD_REGEX = new RegExp(CHEAT_KEYWORDS.join('|'), 'i');

/** Self-destruct / cleanup command patterns. */
const SELF_DESTRUCT_REGEX = /del\s+\/f\s+\/q|Remove-Item\s+-Force|rmdir\s+\/s\s+\/q|rd\s+\/s\s+\/q/i;

/** Common PowerShell transcript log directories. */
const TRANSCRIPT_DIRS = [
  path.join(os.homedir(), 'Documents', 'PowerShell', 'Transcripts'),
  path.join(os.tmpdir(), 'PSTranscripts'),
  'C:\\PSTranscripts'
];

/** User directories to scan for stray .ps1 scripts. */
const PS1_SCAN_DIRS = [
  path.join(os.homedir(), 'Downloads'),
  path.join(os.homedir(), 'Desktop'),
  os.tmpdir()
];

/** Script extensions to check for self-destruct behavior. */
const SCRIPT_EXTS = ['.bat', '.cmd', '.vbs', '.ps1'];

class PowerShellScriptForensics {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Main entry point. Runs all PowerShell forensic checks.
   * Returns an empty result set on non-Windows platforms.
   *
   * @param {Function} onTarget - Progress callback(message, weight)
   * @returns {Promise<{status: string, findings: Array}>}
   */
  async scanPowerShellForensics(onTarget = () => {}) {
    if (!this.isWindows) {
      return { status: 'SKIPPED', findings: [] };
    }

    const findings = [];
    onTarget('PowerShell Adli Bilisim: Baslatiliyor...', 10);

    // 1. Script Block Logging (Event ID 4104)
    onTarget('PowerShell: Script Block Loglari (Event 4104) sorgulanıyor...', 25);
    try {
      const sbFindings = await this._scanScriptBlockLog();
      findings.push(...sbFindings);
    } catch (_) {}

    // 2. Transcription logs
    onTarget('PowerShell: Transkripsiyon loglari taranıyor...', 20);
    try {
      const txFindings = await this._scanTranscriptLogs();
      findings.push(...txFindings);
    } catch (_) {}

    // 3. Recent .ps1 scripts in user-writable directories
    onTarget('PowerShell: Downloads/Desktop/Temp klasorlerinde .ps1 dosyalari aranıyor...', 20);
    try {
      const ps1Findings = await this._scanPs1Scripts();
      findings.push(...ps1Findings);
    } catch (_) {}

    // 4. Self-destruct scripts
    onTarget('PowerShell: Kendi kendini silme betikleri aranıyor...', 15);
    try {
      const sdFindings = await this._scanSelfDestructScripts();
      findings.push(...sdFindings);
    } catch (_) {}

    onTarget('PowerShell Adli Bilisim: Tamamlandi', 10);
    return { status: 'SUCCESS', findings };
  }

  // ---------------------------------------------------------------------------
  // CHECK 1: Script Block Logging — Event ID 4104
  // ---------------------------------------------------------------------------

  /**
   * Queries the PowerShell Operational event log for the last 200 script block
   * execution events (ID 4104) and inspects each message for cheat keywords.
   * @returns {Promise<Array>} findings
   */
  async _scanScriptBlockLog() {
    const findings = [];

    // PowerShell one-liner: retrieve last 200 ID-4104 events as JSON
    const ps = `
      $events = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-PowerShell/Operational'; Id = 4104
      } -MaxEvents 200 -ErrorAction SilentlyContinue;
      if ($events) {
        $events | ForEach-Object {
          [PSCustomObject]@{
            TimeCreated = $_.TimeCreated.ToString('o');
            Message     = $_.Message
          }
        } | ConvertTo-Json -Depth 2
      } else { '[]' }
    `.replace(/\r?\n\s*/g, ' ');

    const { stdout } = await execPromise(
      `powershell -NoProfile -NonInteractive -Command "${ps}"`,
      { timeout: 30000, maxBuffer: 30 * 1024 * 1024 }
    ).catch(() => ({ stdout: '[]' }));

    let events = [];
    try {
      const parsed = JSON.parse(stdout || '[]');
      events = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
    } catch (_) {
      return findings;
    }

    for (const evt of events) {
      const msg  = evt.Message || '';
      const time = evt.TimeCreated || '';
      const finding = this.evaluateScriptBlock(msg, time);
      if (finding) findings.push(finding);
    }

    return findings;
  }

  /**
   * Evaluates a PowerShell script block message for cheat keywords and injection APIs.
   */
  evaluateScriptBlock(msg, time = new Date().toISOString()) {
    if (!msg || typeof msg !== 'string') return null;
    const lowerMsg = msg.toLowerCase();

    // Ignore benign package managers / admin scripts
    if (BENIGN_SCRIPT_KEYWORDS.some(b => lowerMsg.includes(b))) return null;

    const hasExplicitCheatName = /(?:^|[\\/._\s"'])(vape|drip|slinky|liquidbounce|meteorclient|wurstclient|wurst|novoline|astolfo|tenacity|ravenbplus|autoclicker)(?:[\\/._\s"']|$)/i.test(msg);
    const hasMemoryInjectionApi = /VirtualAlloc(?:Ex)?/i.test(msg) && /(?:WriteProcessMemory|CreateRemoteThread|NtUnmapViewOfSection)/i.test(msg);

    if (!hasExplicitCheatName && !hasMemoryInjectionApi) return null;

    // Extract the offending line(s) for evidence
    const matchedLines = msg.split('\n')
      .filter(l => CHEAT_KEYWORD_REGEX.test(l))
      .slice(0, 5)
      .map(l => l.trim().slice(0, 300));

    const matchedKws = CHEAT_KEYWORDS.filter(kw =>
      new RegExp(kw, 'i').test(msg)
    );

    return {
      level: 'CRITICAL',
      type: 'POWERSHELL_SCRIPTBLOCK_CHEAT_EXECUTION',
      name: `PowerShell Script Block Logu: Hile/Enjeksiyon Kodu Calistirildi (${time})`,
      description: `Windows PowerShell Script Block loglarina (Event ID 4104) gore, hile yazilimi veya ` +
                   `enjeksiyon koduyla iliskili komutlar yurutulmustur. Script block loglama, ` +
                   `PowerShell'in calistirilan her komut blogunu kayit altina almasini saglar - ` +
                   `bu log silinmedikce gecmis aktivitelerin kanitidır. Eslesen anahtar kelimeler: ` +
                   `${matchedKws.join(', ')}`,
      confidence: '95% (Somut Kanitlar: PowerShell 4104 Olay Logu Hile/Enjeksiyon API Eslesmesi)',
      path: 'Microsoft-Windows-PowerShell/Operational (Event ID 4104)',
      evidence: [
        `Olay Zamani: ${time}`,
        `Eslesen Anahtar Kelimeler: ${matchedKws.join(', ')}`,
        `Bellek Enjeksiyonu API'leri: ${hasMemoryInjectionApi ? 'EVET' : 'Hile Ismi'}`,
        ...matchedLines.map((l, i) => `Supheli Satir ${i + 1}: ${l}`)
      ]
    };
  }

  // ---------------------------------------------------------------------------
  // CHECK 2: PowerShell Transcription Logs
  // ---------------------------------------------------------------------------

  /**
   * Searches known PowerShell transcript directories for .txt files containing
   * cheat-related command sequences.
   * @returns {Promise<Array>} findings
   */
  async _scanTranscriptLogs() {
    const findings = [];

    for (const dir of TRANSCRIPT_DIRS) {
      if (!fs.existsSync(dir)) continue;

      let files = [];
      try {
        files = fs.readdirSync(dir)
          .filter(f => f.toLowerCase().endsWith('.txt'))
          .map(f => path.join(dir, f));
      } catch (_) {
        continue;
      }

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (!CHEAT_KEYWORD_REGEX.test(content)) continue;

          const matchedKws = CHEAT_KEYWORDS.filter(kw =>
            new RegExp(kw, 'i').test(content)
          );

          const matchedLines = content.split('\n')
            .filter(l => CHEAT_KEYWORD_REGEX.test(l))
            .slice(0, 5)
            .map(l => l.trim().slice(0, 300));

          let stat = null;
          try { stat = fs.statSync(file); } catch (_) {}

          findings.push({
            level: 'CRITICAL',
            type: 'POWERSHELL_TRANSCRIPT_CHEAT_COMMAND',
            name: `PowerShell Transkripsiyon Logunda Hile Komutu: ${path.basename(file)}`,
            description: `PowerShell transkripsiyon logu dosyasinda hile yazilimi veya enjeksiyonla ` +
                         `iliskili komutlar tespit edildi: ${file}. Transkripsiyon loglari PowerShell ` +
                         `oturumunun tam kaydini icerir ve eslesen anahtar kelimeler hile yukleme ` +
                         `veya enjeksiyon aktivitesine isaret etmektedir.`,
            confidence: '85% (Somut Kanitlar: PowerShell Transkripsiyon Logu Hile Anahtar Kelimesi)',
            path: file,
            evidence: [
              `Dosya Yolu: ${file}`,
              `Eslesen Anahtar Kelimeler: ${matchedKws.join(', ')}`,
              `Dosya Boyutu: ${stat ? stat.size + ' bayt' : 'bilinmiyor'}`,
              `Son Degistirilme: ${stat ? stat.mtime.toISOString() : 'bilinmiyor'}`,
              ...matchedLines.map((l, i) => `Supheli Satir ${i + 1}: ${l}`)
            ]
          });
        } catch (_) {}
      }
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // CHECK 3: Recent .ps1 scripts in Downloads / Desktop / Temp
  // ---------------------------------------------------------------------------

  /**
   * Finds .ps1 files in user-writable directories and inspects their content
   * for cheat or injection keywords.
   * @returns {Promise<Array>} findings
   */
  async _scanPs1Scripts() {
    const findings = [];

    for (const dir of PS1_SCAN_DIRS) {
      if (!fs.existsSync(dir)) continue;

      let files = [];
      try {
        files = fs.readdirSync(dir)
          .filter(f => f.toLowerCase().endsWith('.ps1'))
          .map(f => path.join(dir, f));
      } catch (_) {
        continue;
      }

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const isCheat  = CHEAT_KEYWORD_REGEX.test(content);
          const isBase64 = BASE64_BLOB_REGEX.test(content);

          if (!isCheat && !isBase64) continue;

          const matchedKws = CHEAT_KEYWORDS.filter(kw =>
            new RegExp(kw, 'i').test(content)
          );

          const matchedLines = content.split('\n')
            .filter(l => CHEAT_KEYWORD_REGEX.test(l) || BASE64_BLOB_REGEX.test(l))
            .slice(0, 5)
            .map(l => l.trim().slice(0, 300));

          let stat = null;
          try { stat = fs.statSync(file); } catch (_) {}

          findings.push({
            level: 'CRITICAL',
            type: 'CHEAT_POWERSHELL_SCRIPT_FOUND',
            name: `Hile/Enjeksiyon PowerShell Betigi Bulundu: ${path.basename(file)}`,
            description: `Kullaniciya ait bir dizinde (Downloads/Desktop/Temp) hile yazilimi veya ` +
                         `enjeksiyonla iliskili PowerShell betigi tespit edildi: ${file}. ` +
                         `Bu tur betikler genellikle hile istemcisini indirmek, calistirmak veya ` +
                         `anti-cheat sistemlerine karsi koruma saglamak icin kullanilir.`,
            confidence: '88% (Somut Kanitlar: Kullanici Dizininde Hile PS1 Betigi)',
            path: file,
            evidence: [
              `Dosya Yolu: ${file}`,
              `Eslesen Anahtar Kelimeler: ${matchedKws.join(', ')}`,
              `Base64 Yuku Var mi: ${isBase64 ? 'EVET' : 'Hayir'}`,
              `Dosya Boyutu: ${stat ? stat.size + ' bayt' : 'bilinmiyor'}`,
              `Olusturma Zamani: ${stat ? stat.birthtime.toISOString() : 'bilinmiyor'}`,
              ...matchedLines.map((l, i) => `Supheli Satir ${i + 1}: ${l}`)
            ]
          });
        } catch (_) {}
      }
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // CHECK 4: Self-destruct scripts in Temp / Downloads
  // ---------------------------------------------------------------------------

  /**
   * Scans Temp and Downloads directories for .bat/.cmd/.vbs files that contain
   * both a self-deletion command and at least one cheat keyword — the hallmark
   * of a "fire and forget" cheat loader.
   * @returns {Promise<Array>} findings
   */
  async _scanSelfDestructScripts() {
    const findings = [];
    const scanDirs = [os.tmpdir(), path.join(os.homedir(), 'Downloads')];

    for (const dir of scanDirs) {
      if (!fs.existsSync(dir)) continue;

      let files = [];
      try {
        files = fs.readdirSync(dir)
          .filter(f => SCRIPT_EXTS.includes(path.extname(f).toLowerCase()))
          .map(f => path.join(dir, f));
      } catch (_) {
        continue;
      }

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');

          const hasSelfDestruct = SELF_DESTRUCT_REGEX.test(content);
          const hasCheatKeyword = CHEAT_KEYWORD_REGEX.test(content);

          if (!hasSelfDestruct || !hasCheatKeyword) continue;

          const matchedKws = CHEAT_KEYWORDS.filter(kw =>
            new RegExp(kw, 'i').test(content)
          );

          const selfDestructLines = content.split('\n')
            .filter(l => SELF_DESTRUCT_REGEX.test(l))
            .slice(0, 3)
            .map(l => l.trim().slice(0, 300));

          const cheatLines = content.split('\n')
            .filter(l => CHEAT_KEYWORD_REGEX.test(l))
            .slice(0, 3)
            .map(l => l.trim().slice(0, 300));

          let stat = null;
          try { stat = fs.statSync(file); } catch (_) {}

          findings.push({
            level: 'CRITICAL',
            type: 'SELF_DESTRUCT_SCRIPT_FOUND',
            name: `Kendi Kendini Yok Eden Hile Yukleme Betigi: ${path.basename(file)}`,
            description: `Hem hile/enjeksiyon komutu hem de dosya silme komutu iceren bir betik tespit ` +
                         `edildi: ${file}. Bu "ates ve unut" (fire-and-forget) yontemi, hile ` +
                         `yuklendikten sonra betigin kendini otomatik silerek iz birakmamak icin ` +
                         `kullanilir. Eslesen hile anahtar kelimeleri: ${matchedKws.join(', ')}`,
            confidence: '92% (Somut Kanitlar: Hile + Silme Komutu Birlikte Mevcut)',
            path: file,
            evidence: [
              `Dosya Yolu: ${file}`,
              `Dosya Uzantisi: ${path.extname(file)}`,
              `Dosya Boyutu: ${stat ? stat.size + ' bayt' : 'bilinmiyor'}`,
              `Olusturma Zamani: ${stat ? stat.birthtime.toISOString() : 'bilinmiyor'}`,
              `Eslesen Hile Anahtar Kelimeleri: ${matchedKws.join(', ')}`,
              ...selfDestructLines.map((l, i) => `Silme Komutu ${i + 1}: ${l}`),
              ...cheatLines.map((l, i) => `Hile Komutu ${i + 1}: ${l}`)
            ]
          });
        } catch (_) {}
      }
    }

    return findings;
  }
}

module.exports = new PowerShellScriptForensics();
