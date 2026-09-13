/**
 * Atlas AC - Real-Time Active Minecraft Server Detection Engine
 * 
 * Automatically detects which Minecraft server the player is currently connected to
 * during screenshare / anti-cheat inspections while Minecraft is running.
 * 
 * Techniques:
 * 1. Process Table Inspection: Queries running javaw.exe / java.exe / Minecraft client processes.
 * 2. Active TCP Sockets: Checks established remote TCP connections of the Minecraft PID (Windows Get-NetTCPConnection / Linux ss/lsof).
 * 3. Log Stream Analysis: Scans latest.log across .minecraft, Lunar, Badlion, Feather, Prism, CurseForge, SonOyuncu, CraftRise.
 * 4. Reverse DNS Resolution: Resolves remote IP back to server domain name.
 * 5. SLP Integration: Coordinates with ServerStatusTracker to ping the detected server in real-time.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns');
const { execSync } = require('child_process');

class ActiveMinecraftServerDetector {
  constructor() {
    this.defaultHost = 'mc.atlasoyuncu.com';
    this.defaultPort = 25565;
    this.cacheTtlMs = 8000; // 8 seconds cache
    this.lastDetection = null;
    this.lastDetectionTime = 0;
  }

  /**
   * Main entry point to detect current active Minecraft state and server
   */
  async detectActiveServer(force = false) {
    const now = Date.now();
    if (!force && this.lastDetection && (now - this.lastDetectionTime < this.cacheTtlMs)) {
      return this.lastDetection;
    }

    let proc = null;
    try {
      proc = this.findMinecraftProcess();
    } catch (e) {}

    const minecraftRunning = Boolean(proc);

    let detectedServer = null;
    let detectedVia = 'DEFAULT';
    let isConnected = false;

    if (minecraftRunning && proc.pid) {
      // 1. Try to find active established TCP connection of the Minecraft process
      try {
        const tcpConn = this.findEstablishedTcpConnection(proc.pid);
        if (tcpConn && tcpConn.remoteAddress) {
          let host = tcpConn.remoteAddress;
          const port = tcpConn.remotePort || this.defaultPort;

          // Try reverse DNS lookup
          const resolvedHost = await this.resolveHostname(host);
          if (resolvedHost) {
            host = resolvedHost;
          }

          detectedServer = { host, port };
          detectedVia = 'TCP_ESTABLISHED';
          isConnected = true;
        }
      } catch (e) {}

      // 2. If no TCP connection found, inspect recent latest.log
      if (!detectedServer) {
        try {
          const logConn = this.findRecentServerFromLogs();
          if (logConn && logConn.host) {
            detectedServer = logConn;
            detectedVia = 'LATEST_LOG';
            isConnected = true;
          }
        } catch (e) {}
      }
    } else {
      // Even if process not detected (e.g. permission or sandbox), check latest.log
      try {
        const logConn = this.findRecentServerFromLogs(30 * 60 * 1000); // within last 30 minutes
        if (logConn && logConn.host) {
          detectedServer = logConn;
          detectedVia = 'LATEST_LOG';
        }
      } catch (e) {}
    }

    if (!detectedServer) {
      detectedServer = {
        host: this.defaultHost,
        port: this.defaultPort
      };
      detectedVia = 'DEFAULT';
    }

    let gameState = 'NOT_RUNNING';
    let statusText = 'Minecraft Kapalı';

    if (minecraftRunning) {
      if (isConnected) {
        gameState = 'IN_GAME';
        statusText = `${detectedServer.host}:${detectedServer.port} (Oyuncu Oyunda - PID: ${proc.pid})`;
      } else {
        gameState = 'MAIN_MENU';
        statusText = `Minecraft Açık (Ana Menü / Tek Oyunculu - PID: ${proc.pid})`;
      }
    }

    const result = {
      minecraftRunning,
      process: proc,
      connected: isConnected,
      gameState,
      statusText,
      server: {
        host: detectedServer.host,
        port: detectedServer.port,
        detectedVia
      },
      timestamp: new Date().toISOString()
    };

    this.lastDetection = result;
    this.lastDetectionTime = now;
    return result;
  }

  /**
   * Discovers the running Minecraft / javaw process across Windows and Linux
   */
  findMinecraftProcess() {
    if (process.platform === 'win32') {
      try {
        const psCmd = `powershell -NoProfile -Command "Get-Process -Name 'javaw', 'java', 'Minecraft*' -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path | ConvertTo-Json"`;
        const stdout = execSync(psCmd, { encoding: 'utf8', timeout: 3500 }).trim();
        if (stdout && stdout !== 'null') {
          let data = JSON.parse(stdout);
          if (Array.isArray(data)) {
            // Prioritize javaw over java
            const javaw = data.find(p => String(p.ProcessName).toLowerCase().includes('javaw'));
            data = javaw || data[0];
          }
          if (data && data.Id) {
            return {
              pid: Number(data.Id),
              name: data.ProcessName || 'javaw',
              path: data.Path || 'javaw.exe'
            };
          }
        }
      } catch (e) {}

      // Fallback via tasklist
      try {
        const tlOut = execSync('tasklist /fi "IMAGENAME eq javaw.exe" /fo csv /nh', { encoding: 'utf8', timeout: 2500 }).trim();
        if (tlOut && !tlOut.toLowerCase().includes('no tasks')) {
          const parts = tlOut.split(',').map(s => s.replace(/"/g, '').trim());
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
            return {
              pid: Number(parts[1]),
              name: parts[0] || 'javaw.exe',
              path: 'javaw.exe'
            };
          }
        }
      } catch (e) {}
    } else {
      // Linux: Scan /proc
      try {
        const procDirs = fs.readdirSync('/proc');
        for (const dir of procDirs) {
          if (!/^\d+$/.test(dir)) continue;
          const pid = parseInt(dir, 10);
          try {
            const cmdlinePath = path.join('/proc', dir, 'cmdline');
            if (!fs.existsSync(cmdlinePath)) continue;
            const cmdline = fs.readFileSync(cmdlinePath, 'utf8').replace(/\0/g, ' ');
            const lowerCmd = cmdline.toLowerCase();
            if (
              (lowerCmd.includes('java') || lowerCmd.includes('minecraft')) &&
              (lowerCmd.includes('.minecraft') || lowerCmd.includes('prism') || lowerCmd.includes('lunar') ||
               lowerCmd.includes('net.minecraft') || lowerCmd.includes('fabric') || lowerCmd.includes('forge'))
            ) {
              let exePath = '';
              try {
                exePath = fs.readlinkSync(path.join('/proc', dir, 'exe'));
              } catch (e) {}
              return {
                pid,
                name: 'java',
                path: exePath || '/usr/bin/java',
                commandLine: cmdline.slice(0, 300)
              };
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
    return null;
  }

  /**
   * Queries active established TCP connection for a specific process PID
   */
  findEstablishedTcpConnection(pid) {
    if (!pid) return null;

    if (process.platform === 'win32') {
      // 1. PowerShell Get-NetTCPConnection
      try {
        const psCmd = `powershell -NoProfile -Command "Get-NetTCPConnection -OwningProcess ${pid} -State Established -ErrorAction SilentlyContinue | Select-Object RemoteAddress, RemotePort | ConvertTo-Json"`;
        const stdout = execSync(psCmd, { encoding: 'utf8', timeout: 3500 }).trim();
        if (stdout && stdout !== 'null') {
          let data = JSON.parse(stdout);
          if (!Array.isArray(data)) data = [data];
          for (const conn of data) {
            const addr = String(conn.RemoteAddress || '').trim();
            const port = Number(conn.RemotePort);
            if (this.isValidExternalAddress(addr, port)) {
              return { remoteAddress: addr, remotePort: port };
            }
          }
        }
      } catch (e) {}

      // 2. Netstat fallback on Windows
      try {
        const nsOut = execSync(`netstat -ano -p tcp`, { encoding: 'utf8', timeout: 3000 });
        const lines = nsOut.split('\n');
        for (const line of lines) {
          if (!line.includes('ESTABLISHED')) continue;
          if (!line.includes(String(pid))) continue;
          const tokens = line.trim().split(/\s+/);
          if (tokens.length >= 5) {
            const remote = tokens[2]; // IP:Port
            const rLastIdx = remote.lastIndexOf(':');
            if (rLastIdx > 0) {
              const addr = remote.slice(0, rLastIdx).replace(/\[|\]/g, '');
              const port = parseInt(remote.slice(rLastIdx + 1), 10);
              if (this.isValidExternalAddress(addr, port)) {
                return { remoteAddress: addr, remotePort: port };
              }
            }
          }
        }
      } catch (e) {}
    } else {
      // Linux: ss command
      try {
        const ssOut = execSync(`ss -ntp state established 2>/dev/null`, { encoding: 'utf8', timeout: 2500 });
        const lines = ssOut.split('\n');
        for (const line of lines) {
          if (!line.includes(`pid=${pid}`)) continue;
          const tokens = line.trim().split(/\s+/);
          if (tokens.length >= 4) {
            const remote = tokens[3]; // IP:Port
            const rLastIdx = remote.lastIndexOf(':');
            if (rLastIdx > 0) {
              const addr = remote.slice(0, rLastIdx).replace(/\[|\]/g, '');
              const port = parseInt(remote.slice(rLastIdx + 1), 10);
              if (this.isValidExternalAddress(addr, port)) {
                return { remoteAddress: addr, remotePort: port };
              }
            }
          }
        }
      } catch (e) {}

      // Linux: lsof fallback
      try {
        const lsofOut = execSync(`lsof -p ${pid} -i TCP -a -sTCP:ESTABLISHED -n -P 2>/dev/null`, { encoding: 'utf8', timeout: 2500 });
        const lines = lsofOut.split('\n');
        for (const line of lines) {
          const match = line.match(/->([0-9a-fA-F.:]+):(\d+)\s+\(ESTABLISHED\)/);
          if (match) {
            const addr = match[1].replace(/\[|\]/g, '');
            const port = parseInt(match[2], 10);
            if (this.isValidExternalAddress(addr, port)) {
              return { remoteAddress: addr, remotePort: port };
            }
          }
        }
      } catch (e) {}
    }

    return null;
  }

  /**
   * Verifies if an IP is an external target and not loopback/local
   */
  isValidExternalAddress(addr, port) {
    if (!addr || !port) return false;
    if (addr === '127.0.0.1' || addr === '::1' || addr === '0.0.0.0' || addr === '::') return false;
    if (addr.startsWith('10.') || addr.startsWith('192.168.')) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addr)) return false;
    // Disallow internal web UI ports
    if (port === 3317 || port === 80 || port === 443 || port === 8080) return false;
    return true;
  }

  /**
   * Reverse DNS resolution with short timeout
   */
  async resolveHostname(ip) {
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), 1200);
      dns.reverse(ip, (err, hostnames) => {
        clearTimeout(timer);
        if (!err && hostnames && hostnames.length > 0) {
          let candidate = hostnames[0];
          // If domain contains atlasoyuncu, normalize to standard subdomain
          if (candidate.toLowerCase().includes('atlasoyuncu')) {
            candidate = 'mc.atlasoyuncu.com';
          }
          resolve(candidate);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Scans latest.log files across launcher profiles to find the last server connection line
   */
  findRecentServerFromLogs(maxAgeMs = 12 * 60 * 60 * 1000) {
    const logCandidates = this.collectLogCandidates();
    let bestMatch = null;
    let latestMtime = 0;

    for (const logPath of logCandidates) {
      try {
        if (!fs.existsSync(logPath)) continue;
        const stat = fs.statSync(logPath);
        if (stat.mtimeMs < latestMtime) continue;
        if (Date.now() - stat.mtimeMs > maxAgeMs) continue;

        // Read the tail of the log file (up to 40KB)
        const fileSize = stat.size;
        const readSize = Math.min(fileSize, 40960);
        const buffer = Buffer.alloc(readSize);
        const fd = fs.openSync(logPath, 'r');
        fs.readSync(fd, buffer, 0, readSize, fileSize - readSize);
        fs.closeSync(fd);

        const content = buffer.toString('utf8');
        const lines = content.split('\n');

        // Look for the last "Connecting to <host>, <port>"
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          const match = line.match(/Connecting to\s+([a-zA-Z0-9.\-_]+)(?:,\s*|\s*:\s*)(\d+)/i);
          if (match) {
            const host = match[1].trim();
            const port = parseInt(match[2], 10) || 25565;
            bestMatch = { host, port, logFile: logPath };
            latestMtime = stat.mtimeMs;
            break;
          }
        }
      } catch (e) {}
    }

    return bestMatch;
  }

  /**
   * Collects all potential latest.log file paths for installed Minecraft launchers
   */
  collectLogCandidates() {
    const list = [];
    const home = os.homedir();

    if (process.platform === 'win32') {
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');

      list.push(path.join(appData, '.minecraft', 'logs', 'latest.log'));
      list.push(path.join(appData, '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'));
      list.push(path.join(home, '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'));
      list.push(path.join(appData, '.badlion', 'logs', 'latest.log'));
      list.push(path.join(appData, 'Feather', '.minecraft', 'logs', 'latest.log'));
      list.push(path.join(appData, '.sonoyuncu', 'logs', 'latest.log'));
      list.push(path.join(appData, '.craftrise', 'logs', 'latest.log'));

      // PrismLauncher instances on Windows
      const prismDir = path.join(appData, 'PrismLauncher', 'instances');
      if (fs.existsSync(prismDir)) {
        try {
          const instances = fs.readdirSync(prismDir);
          for (const inst of instances) {
            list.push(path.join(prismDir, inst, '.minecraft', 'logs', 'latest.log'));
            list.push(path.join(prismDir, inst, 'minecraft', 'logs', 'latest.log'));
          }
        } catch (e) {}
      }
    } else {
      // Linux
      list.push(path.join(home, '.minecraft', 'logs', 'latest.log'));
      list.push(path.join(home, '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'));

      // PrismLauncher on Linux
      const prismPaths = [
        path.join(home, '.local', 'share', 'PrismLauncher', 'instances'),
        path.join(home, '.var', 'app', 'org.prismlauncher.PrismLauncher', 'data', 'PrismLauncher', 'instances')
      ];
      for (const pPath of prismPaths) {
        if (fs.existsSync(pPath)) {
          try {
            const instances = fs.readdirSync(pPath);
            for (const inst of instances) {
              list.push(path.join(pPath, inst, '.minecraft', 'logs', 'latest.log'));
              list.push(path.join(pPath, inst, 'minecraft', 'logs', 'latest.log'));
            }
          } catch (e) {}
        }
      }
    }

    return list;
  }
}

module.exports = new ActiveMinecraftServerDetector();
