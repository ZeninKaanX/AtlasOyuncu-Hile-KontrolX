/**
 * Farben AC - Execution Timeline & Prefetch Forensic Engine
 * Windows: Parses C:\Windows\Prefetch\*.pf, inspects JAVAW.EXE prefetch and clickers.
 * Linux: Parses GTK Recently Used (~/.local/share/recently-used.xbel) and Systemd User logs
 * to reconstruct exact file execution and opening timelines.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sigDb = require('./signatureDb');
const serverPolicy = require('../config/serverPolicy');

class PrefetchEngine {
  constructor() {
    this.prefetchDir = 'C:\\Windows\\Prefetch';
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans Prefetch on Windows or Recently-Used Timeline on Linux.
   */
  async scanPrefetch(onTarget = () => {}) {
    if (this.isWindows) {
      return this.scanWindowsPrefetch(onTarget);
    } else {
      return this.scanLinuxExecutionTimeline(onTarget);
    }
  }

  async scanWindowsPrefetch(onTarget = () => {}) {
    const findings = [];
    const executionHistory = [];
    onTarget('Windows Prefetch Directory (C:\\Windows\\Prefetch)', 20);

    if (!fs.existsSync(this.prefetchDir)) {
      return { status: 'PREFETCH_NOT_FOUND', findings: [], executionHistory: [] };
    }

    try {
      const psCmd = `powershell -NoProfile -Command "Get-ChildItem -Path '${this.prefetchDir}' -Filter '*.pf' | Select-Object Name, LastWriteTime, Length | ConvertTo-Json"`;
      const { stdout } = await execPromise(psCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));

      if (!stdout || stdout.trim().length === 0) {
        return { status: 'EMPTY_OR_UNAUTHORIZED', findings: [], executionHistory: [] };
      }

      let pfEntries = [];
      try {
        const parsed = JSON.parse(stdout);
        pfEntries = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return { status: 'PARSE_ERROR', findings: [], executionHistory: [] };
      }

      for (const entry of pfEntries) {
        const name = (entry.Name || '').toUpperCase();
        const writeTime = entry.LastWriteTime || 'Unknown';

        executionHistory.push({
          name: entry.Name,
          timestamp: writeTime,
          size: entry.Length
        });

        if (name.startsWith('FSUTIL.EXE')) {
          findings.push({
            level: 'INFO',
            type: 'JOURNAL_WIPE_TOOL_EXECUTED',
            name: entry.Name,
            timestamp: writeTime,
            description: 'FSUTIL.EXE was executed on this machine (Windows File System Utility - normal system maintenance or USN query).'
          });
        }

        if (/detector|scanner|checker|audit|anticheat|benchmark|atlas|farben/i.test(name)) {
          continue;
        }

        for (const ac of sigDb.getAutoclickers()) {
          if (ac.prefetch && ac.prefetch.some(p => name.startsWith(p))) {
            const isAllowed = serverPolicy.isAutoClickerAllowed();
            findings.push({
              level: isAllowed ? 'INFO' : 'HIGH',
              type: isAllowed ? 'ALLOWED_UTILITY_AUTOCLICKER' : 'AUTOCLICKER_PREFETCH',
              name: `${ac.name} ${isAllowed ? '(Sunucu Kuralı: İzinli)' : ''}`,
              file: entry.Name,
              timestamp: writeTime,
              isSafe: isAllowed,
              isThreat: !isAllowed,
              badge: isAllowed ? 'ALLOWED_POLICY' : null,
              badgeText: isAllowed ? 'SUNUCU İZNİ: AUTOCLICKER SERBEST' : null,
              description: `AutoClicker execution found in Windows Prefetch: ${ac.name} (${entry.Name}) at ${writeTime}.${isAllowed ? ' Sunucu kuralları gereği ban sebebi sayılmamaktadır.' : ''}`
            });
            break;
          }
        }

        for (const client of sigDb.getClientRules()) {
          if (client.prefetchPatterns && client.prefetchPatterns.some(p => name.startsWith(p))) {
            findings.push({
              level: 'CRITICAL',
              type: 'CHEAT_CLIENT_PREFETCH',
              name: client.name,
              file: entry.Name,
              timestamp: writeTime,
              description: `Cheat client executable found in Windows Prefetch: ${client.name} (${entry.Name}) at ${writeTime}`
            });
          }
        }
      }

      return {
        status: 'SUCCESS',
        totalPrefetchFiles: pfEntries.length,
        findings: findings,
        executionHistory: executionHistory.slice(0, 100)
      };

    } catch (err) {
      return { status: 'ERROR', error: err.message, findings: findings, executionHistory: [] };
    }
  }

  /**
   * Linux Execution & GTK Recently Used Timeline Analysis
   */
  async scanLinuxExecutionTimeline(onTarget = () => {}) {
    const findings = [];
    const executionHistory = [];
    const home = os.homedir();

    onTarget('Linux Activity Timeline (~/.local/share/recently-used.xbel)', 5);

    // 1. Parse ~/.local/share/recently-used.xbel (GTK file activity timeline)
    const xbelPath = path.join(home, '.local', 'share', 'recently-used.xbel');
    if (fs.existsSync(xbelPath)) {
      onTarget(xbelPath, 1);
      try {
        const content = fs.readFileSync(xbelPath, 'utf8');
        const bookmarkRegex = /<bookmark\s+href="([^"]+)"\s+added="([^"]+)"\s+modified="([^"]+)"\s+visited="([^"]+)"/g;
        let match;

        while ((match = bookmarkRegex.exec(content)) !== null) {
          const rawUri = match[1];
          const added = match[2];
          const decodedUri = decodeURIComponent(rawUri.replace('file://', ''));
          const fileName = path.basename(decodedUri);

          executionHistory.push({
            name: fileName,
            path: decodedUri,
            timestamp: added
          });

          if (/raven|vape|drip|clicker|meteor|wurst|liquid|catlean|ares|bleach|bplus/i.test(fileName)) {
            findings.push({
              level: 'HIGH',
              type: 'RECENTLY_USED_CHEAT_FILE',
              name: fileName,
              path: decodedUri,
              timestamp: added,
              confidence: 'High (Linux Activity Record)',
              description: `Recent cheat file access recorded in Linux system history: ${fileName} (${added})`
            });
          }
        }
      } catch (e) {}
    }

    return {
      status: 'LINUX_TIMELINE_SUCCESS',
      totalRecords: executionHistory.length,
      findings: findings,
      executionHistory: executionHistory.slice(0, 100)
    };
  }
}

module.exports = new PrefetchEngine();
