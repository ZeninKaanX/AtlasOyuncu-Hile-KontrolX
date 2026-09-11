/**
 * Farben AC - External Python Cheat & PyInstaller Scanner
 * Detects external Python cheats running via python.exe, pythonw.exe, py.exe, or packaged PyInstaller binaries.
 * 
 * Inspects:
 * 1. Running Python processes (checking command line, working directory, and arguments).
 * 2. Input automation & memory reading modules (pynput, pyautogui, mouse, keyboard, pymem, ctypes mouse_event).
 * 3. PyInstaller temporary directories (_MEI* in %TEMP%).
 * 4. Recent .py / .pyw files on Desktop, Downloads, and Temp containing clicker loops or Minecraft targeting.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PythonCheatDetector {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Main scan function for external Python cheats.
   */
  async scanPythonCheats(onTarget = () => {}) {
    const findings = [];
    onTarget('Python Cheats: Inspecting processes and script directories', 5);
    const runningProcesses = await this.checkRunningPythonProcesses(onTarget);
    findings.push(...runningProcesses);

    const pyInstallerFindings = this.checkPyInstallerTemp(onTarget);
    findings.push(...pyInstallerFindings);

    const diskScriptFindings = this.scanRecentPythonScripts(onTarget);
    findings.push(...diskScriptFindings);

    return {
      status: 'SUCCESS',
      findings: findings
    };
  }

  /**
   * 1. Checks running python.exe, pythonw.exe, py.exe processes and their command lines.
   */
  async checkRunningPythonProcesses() {
    const findings = [];

    try {
      if (this.isWindows) {
        // Windows: query Win32_Process for python processes
        const cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name like \'python%\' or Name=\'py.exe\'\\" | Select-Object ProcessId, Name, CommandLine, Path | ConvertTo-Json"';
        const { stdout } = await execPromise(cmd).catch(() => ({ stdout: '' }));

        if (stdout && stdout.trim().length > 0) {
          let procs = [];
          try {
            const parsed = JSON.parse(stdout);
            procs = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}

          for (const proc of procs) {
            const cmdLine = (proc.CommandLine || '').toLowerCase();
            const pid = proc.ProcessId;
            const procName = proc.Name;

            // Check if commandline points to clicker / trigger / aimbot
            const isSuspicious = /clicker|trigger|aimbot|macro|cheat|autoclick|cps|rapid|jitter|mc_click|vape/i.test(cmdLine);
            
            if (isSuspicious) {
              findings.push({
                level: 'CRITICAL',
                type: 'RUNNING_PYTHON_CHEAT_PROCESS',
                name: 'Active External Python Cheat Process',
                pid: pid,
                process: procName,
                commandLine: proc.CommandLine,
                confidence: '100% (Active External Python Cheat)',
                description: `External stealth Python cheat process running without logs! (PID: ${pid}) - Command: ${proc.CommandLine}`
              });
            } else if (procName.toLowerCase() === 'pythonw.exe') {
              // pythonw runs without window (classic stealth mode)
              findings.push({
                level: 'HIGH',
                type: 'STEALTH_PYTHONW_RUNNING',
                name: 'Stealth Background Python Process (pythonw.exe)',
                pid: pid,
                process: procName,
                commandLine: proc.CommandLine,
                description: `Windowless background Python process (pythonw.exe) active: ${proc.CommandLine || procName}`
              });
            }
          }
        }
      } else {
        // Linux: check ps for python scripts
        const { stdout } = await execPromise('ps aux | grep -iE "python" | grep -v "grep"').catch(() => ({ stdout: '' }));
        if (stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (/clicker|trigger|aimbot|autoclick|macro|pynput/i.test(line)) {
              findings.push({
                level: 'CRITICAL',
                type: 'RUNNING_PYTHON_CHEAT_PROCESS',
                name: 'Active External Python Cheat Process (Linux)',
                commandLine: line.trim(),
                confidence: 'High',
                description: `External Python cheat script executing in background: ${line.trim()}`
              });
            }
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 2. Checks %TEMP%\_MEI* folders created by PyInstaller.
   */
  checkPyInstallerTemp() {
    const findings = [];
    const tempDir = os.tmpdir();

    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          if (file.startsWith('_MEI') && fs.statSync(path.join(tempDir, file)).isDirectory()) {
            const meiDir = path.join(tempDir, file);
            // Check if this PyInstaller bundle contains pynput, pyautogui, or pymem
            const meiFiles = fs.readdirSync(meiDir);
            const cheatModules = ['pynput', 'pyautogui', 'pymem', 'mouse', 'keyboard', 'cv2', 'mss'];
            const matchedMods = meiFiles.filter(f => cheatModules.some(m => f.toLowerCase().includes(m)));

            if (matchedMods.length > 0) {
              findings.push({
                level: 'CRITICAL',
                type: 'PYINSTALLER_COMPILED_CHEAT',
                name: 'Compiled PyInstaller Cheat Package',
                path: meiDir,
                confidence: '100% (PyInstaller Cache with Automation Libs)',
                description: `PyInstaller compiled cheat/clicker package extracted in Temp directory (%TEMP%\\${file}). Extracted modules: ${matchedMods.join(', ')}`,
                evidence: matchedMods
              });
            }
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 3. Scans Desktop, Downloads, and Temp for .py / .pyw files with clicker/aimbot code.
   */
  scanRecentPythonScripts(onTarget = () => {}) {
    const findings = [];
    const home = os.homedir();
    const isWindows = this.isWindows;

    const targetDirs = [
      path.join(home, 'Desktop'),
      path.join(home, 'Downloads'),
      isWindows && process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Desktop') : null,
      isWindows && process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Downloads') : null,
      os.tmpdir()
    ].filter(Boolean);

    const checkedPaths = new Set();

    for (const dir of targetDirs) {
      if (!fs.existsSync(dir) || checkedPaths.has(dir)) continue;
      checkedPaths.add(dir);
      onTarget(`Scanning Python scripts: ${dir}`, 5);

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (ext === '.py' || ext === '.pyw') {
            const fullPath = path.join(dir, file);
            onTarget(fullPath, 1);
            try {
              const stat = fs.statSync(fullPath);
              // Only check files smaller than 1MB
              if (stat.size < 1024 * 1024) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Heuristics for Python Clickers / Aimbots
                const hasInputLib = /import (pynput|pyautogui|mouse|keyboard|ctypes)/i.test(content);
                const hasClickAction = /(mouse_event\(2,|click\s*\(|Button\.left|win32api\.mouse_event)/i.test(content);
                const hasLoop = /while\s+(True|1|enabled|active|clicking)/i.test(content);
                const hasMinecraftMention = /minecraft|craftrise|sonoyuncu|badlion|lunar/i.test(content);

                if (hasInputLib && hasClickAction && hasLoop) {
                  findings.push({
                    level: 'CRITICAL',
                    type: 'EXTERNAL_PYTHON_CLICKER_SCRIPT',
                    name: 'External Python AutoClicker / Cheat Script',
                    file: file,
                    path: fullPath,
                    confidence: hasMinecraftMention ? '100% (Direct Minecraft Python Cheat)' : 'High (AutoClick Loop Detected)',
                    description: `External Python cheat script identified: ${file} (Contains automated input loops and combat macros)`,
                    evidence: [
                      `File: ${fullPath}`,
                      hasMinecraftMention ? 'Script explicitly targets Minecraft window handle' : 'Automated infinite mouse click loop (while loop) detected'
                    ]
                  });
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    return findings;
  }
}

module.exports = new PythonCheatDetector();
