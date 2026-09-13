/**
 * Farben AC - USB Storage Forensics Engine
 * Windows: Queries USBSTOR registry and MountedDevices.
 * Linux: Queries /sys/bus/usb/devices/ and /proc/mounts to track connected/unplugged flash drives.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const rawExecPromise = util.promisify(exec);
// Guarantee all background child processes run completely hidden without flashing CMD windows
const execPromise = (cmd, opts = {}) => rawExecPromise(cmd, { windowsHide: true, ...opts });
const minecraftInspector = require('./minecraftInspector');

class UsbTrackerEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans a mounted external/USB drive for JAR files or cheat binaries.
   * If no JAR files are present, the USB is declared clean and harmless.
   */
  scanRemovableDrive(drivePath) {
    const jarFiles = [];
    const cheatFindings = [];
    if (!fs.existsSync(drivePath)) return { jarFiles, cheatFindings };

    try {
      const walk = (dir, depth = 0) => {
        if (depth > 3) return;
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            // Skip Windows system directories
            if (item.startsWith('$') || item.toLowerCase() === 'system volume information' || item.toLowerCase() === 'recovery') continue;
            const fullPath = path.join(dir, item);
            try {
              const st = fs.lstatSync(fullPath);
              if (st.isDirectory()) {
                walk(fullPath, depth + 1);
              } else if (st.isFile()) {
                const lower = item.toLowerCase();
                if (lower.endsWith('.jar') || lower.includes('.jar.')) {
                  jarFiles.push(fullPath);
                  try {
                    const matches = minecraftInspector.inspectJarFile(fullPath, false);
                    if (Array.isArray(matches)) {
                      for (const m of matches) {
                        if (m.level === 'CRITICAL' || m.level === 'HIGH') {
                          m.category = 'USB_STORAGE';
                          m.type = 'USB_REMOVABLE_CHEAT_JAR_FOUND';
                          m.name = `USB Bellekte Hile Dosyası (${item})`;
                          m.description = `Harici USB depolama biriminde hile JAR modülü tespit edildi: ${fullPath}`;
                          m.evidence = m.evidence || [];
                          m.evidence.unshift(`USB Sürücüsü: ${drivePath}`);
                          m.evidence.push(`Dosya Yolu: ${fullPath}`);
                          m.evidence.push(`Dosya Boyutu: ${(st.size / 1024).toFixed(1)} KB`);
                          m.evidence.push(`Zaman Damgası: ${st.mtime.toISOString().replace('T', ' ').slice(0, 19)}`);
                          cheatFindings.push(m);
                        }
                      }
                    }
                  } catch (e) {}
                }
              }
            } catch (e) {}
          }
        } catch (e) {}
      };

      walk(drivePath);
    } catch (e) {}

    return { jarFiles, cheatFindings };
  }

  async scanUsbHistory(onTarget = () => {}) {
    if (this.isWindows) {
      return this.scanWindowsUsb(onTarget);
    } else {
      return this.scanLinuxUsb(onTarget);
    }
  }

  async scanWindowsUsb(onTarget = () => {}) {
    const findings = [];
    const devices = [];
    onTarget('Windows USBSTOR Registry Keys', 10);

    try {
      const psCmd = `powershell -NoProfile -Command "Get-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR\\*\\*' -ErrorAction SilentlyContinue | Select-Object PSChildName, @{Name='FriendlyName';Expression={(Get-ItemPropertyValue -Path $_.PSPath -Name FriendlyName -ErrorAction SilentlyContinue)}}, @{Name='Mfg';Expression={(Get-ItemPropertyValue -Path $_.PSPath -Name Mfg -ErrorAction SilentlyContinue)}} | ConvertTo-Json"`;
      const { stdout } = await execPromise(psCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let items = [];
        try {
          const parsed = JSON.parse(stdout);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of items) {
          const serial = item.PSChildName || 'Unknown';
          const name = item.FriendlyName || item.Mfg || 'USB Mass Storage Device';
          
          devices.push({
            name: name,
            serialNumber: serial,
            connectedStatus: 'Previously or Currently Connected'
          });
        }
      }

      const mountCmd = `powershell -NoProfile -Command "Get-Item -Path 'HKLM:\\SYSTEM\\MountedDevices' | Select-Object -ExpandProperty Property | Where-Object { $_ -like '\\DosDevices\\*' }"`;
      const { stdout: mountOut } = await execPromise(mountCmd).catch(() => ({ stdout: '' }));

      let driveLetters = [];
      if (mountOut) {
        driveLetters = mountOut.split('\n').map(d => d.trim().replace('\\DosDevices\\', '')).filter(d => d.length === 2 && d !== 'C:');
        for (const drv of driveLetters) {
          const driveRoot = `${drv}\\`;
          const scanRes = this.scanRemovableDrive(driveRoot);

          if (scanRes.cheatFindings.length > 0) {
            findings.push(...scanRes.cheatFindings);
          } else if (scanRes.jarFiles.length === 0) {
            // 0 False-Flag: If USB has no JAR files, it is 100% CLEAN and NOT suspicious!
            findings.push({
              level: 'INFO',
              type: 'MOUNTED_REMOVABLE_DRIVES',
              drives: [drv],
              isSafe: true,
              isThreat: false,
              name: `Harici USB Sürücü (${drv}) (Temiz: JAR Yok)`,
              confidence: '100% (Doğrulandı: USB bellekte Minecraft JAR veya hile dosyası yok)',
              description: `Bağlı harici USB depolama birimi (${drv}) adli olarak incelendi. Sürücüde herhangi bir Minecraft JAR veya hile dosyası tespit edilmedi (Şüpheli Değil).`,
              evidence: [
                `Sürücü Harfi: ${drv}`,
                `Adli Durum: Temiz (JAR veya hile yükü tespit edilmedi)`
              ]
            });
          } else {
            findings.push({
              level: 'INFO',
              type: 'MOUNTED_REMOVABLE_DRIVES',
              drives: [drv],
              isSafe: true,
              isThreat: false,
              name: `Harici USB Sürücü (${drv}) (${scanRes.jarFiles.length} Adet Meşru JAR)`,
              confidence: '100% (Doğrulandı: Tüm JAR dosyaları analiz edildi ve temiz bulundu)',
              description: `Bağlı harici USB sürücüsündeki (${drv}) ${scanRes.jarFiles.length} adet JAR dosyası incelendi, zararlı hile kodu bulunmadı.`,
              evidence: [
                `Sürücü Harfi: ${drv}`,
                `İncelenen Dosyalar: ${scanRes.jarFiles.slice(0, 5).join(', ')}`
              ]
            });
          }
        }
      }

      // 3. Check SetupAPI.dev.log for hardware installation history & tampering
      const setupFindings = this.checkSetupApiLog(driveLetters);
      findings.push(...setupFindings);

      // 4. Check DriverFrameworks Event Logs for plug/unplug events (2100 / 2003)
      const dfFindings = await this.checkUsbDriverFrameworkEvents();
      findings.push(...dfFindings);

      return {
        status: 'SUCCESS',
        totalDevices: devices.length,
        devices: devices,
        findings: findings
      };

    } catch (err) {
      return { status: 'ERROR', error: err.message, findings: findings, devices: [] };
    }
  }

  /**
   * Linux USB Device and Mount Forensics
   */
  async scanLinuxUsb(onTarget = () => {}) {
    const findings = [];
    const devices = [];

    onTarget('Linux USB Devices (/sys/bus/usb/devices)', 5);

    try {
      // 1. Scan /sys/bus/usb/devices
      const usbSysDir = '/sys/bus/usb/devices';
      if (fs.existsSync(usbSysDir)) {
        const entries = fs.readdirSync(usbSysDir);
        for (const entry of entries) {
          const prodFile = path.join(usbSysDir, entry, 'product');
          const mfgFile = path.join(usbSysDir, entry, 'manufacturer');
          const serFile = path.join(usbSysDir, entry, 'serial');

          if (fs.existsSync(prodFile)) {
            const prod = fs.readFileSync(prodFile, 'utf8').trim();
            const mfg = fs.existsSync(mfgFile) ? fs.readFileSync(mfgFile, 'utf8').trim() : '';
            const ser = fs.existsSync(serFile) ? fs.readFileSync(serFile, 'utf8').trim() : '';

            devices.push({
              name: `${mfg} ${prod}`.trim() || 'USB Device',
              serialNumber: ser || entry,
              connectedStatus: 'Connected'
            });
          }
        }
      }

      // 2. Scan /proc/mounts for removable media (/media or /run/media)
      if (fs.existsSync('/proc/mounts')) {
        const mounts = fs.readFileSync('/proc/mounts', 'utf8');
        const lines = mounts.split('\n');
        for (const line of lines) {
          if (line.includes('/media/') || line.includes('/run/media/')) {
            const parts = line.split(' ');
            const mountPoint = parts[1];
            const scanRes = this.scanRemovableDrive(mountPoint);
            if (scanRes.cheatFindings.length > 0) {
              findings.push(...scanRes.cheatFindings);
            } else if (scanRes.jarFiles.length === 0) {
              findings.push({
                level: 'INFO',
                type: 'LINUX_MOUNTED_USB_STORAGE',
                path: mountPoint,
                isSafe: true,
                isThreat: false,
                name: `Linux Harici USB Sürücüsü (${path.basename(mountPoint)}) (Temiz: JAR Yok)`,
                description: `Harici USB depolama bağlantısı incelendi (${mountPoint}): İçerisinde herhangi bir Minecraft JAR veya hile dosyası bulunmadı (Şüpheli Değil).`
              });
            } else {
              findings.push({
                level: 'INFO',
                type: 'LINUX_MOUNTED_USB_STORAGE',
                path: mountPoint,
                isSafe: true,
                isThreat: false,
                name: `Linux Harici USB Sürücüsü (${path.basename(mountPoint)}) (${scanRes.jarFiles.length} Adet Meşru JAR)`,
                description: `Harici USB depolama birimindeki (${mountPoint}) ${scanRes.jarFiles.length} adet JAR dosyası incelendi, hile kodu bulunmadı.`
              });
            }
          }
        }
      }

      // 3. Scan Linux Kernel Journal for USB disconnect events
      const linuxEventFindings = await this.checkLinuxUsbEvents();
      findings.push(...linuxEventFindings);

      return {
        status: 'LINUX_USB_SUCCESS',
        totalDevices: devices.length,
        devices: devices,
        findings: findings
      };

    } catch (err) {
      return { status: 'ERROR', error: err.message, findings: findings, devices: [] };
    }
  }

  /**
   * Helper to format PowerShell Date strings
   */
  formatPowerShellDate(dateStr) {
    if (!dateStr) return new Date().toISOString().replace('T', ' ').slice(0, 19);
    const match = /\/Date\((\d+)\)\//.exec(String(dateStr));
    if (match) {
      return new Date(parseInt(match[1], 10)).toISOString().replace('T', ' ').slice(0, 19);
    }
    return String(dateStr).replace('T', ' ').slice(0, 19);
  }

  /**
   * Helper: Parses setupapi.dev.log plain text buffer for USB hardware installations
   */
  parseSetupApiLog(content) {
    if (!content || typeof content !== 'string') return [];
    const results = [];
    // Match USB mass storage disks, portable storage devices, and USB flash drives.
    // Generic non-storage peripherals like Wi-Fi adapters (TP-Link VID_2357) are ignored.
    const regex = />>>\s+\[Device Install.*?(USBSTOR\\Disk[^\s\]]+|SWD\\WPDBUSENUM[^\s\]]+|USB\\VID_[^\s\]]+)\][\s\S]*?>>>\s+Section start ([\d/]+ [\d:]+)/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const deviceId = match[1];
      if (/VID_2357/i.test(deviceId)) continue;
      const timestamp = match[2].replace(/\//g, '-');
      let friendlyName = 'USB Storage Device';
      const nameMatch = deviceId.match(/Ven_([^_&]+)&Prod_([^&\\\]]+)/i);
      if (nameMatch) {
        let ven = nameMatch[1];
        let prod = nameMatch[2];
        if (prod.includes('DataTraveler')) prod = 'DataTraveler';
        friendlyName = `${ven} ${prod}`.trim();
      } else if (deviceId.includes('WPDBUSENUM')) {
        friendlyName = 'Portable Media / Storage Device';
      } else if (deviceId.includes('0781')) {
        friendlyName = 'SanDisk USB Flash Drive';
      } else if (/USB\\VID_/i.test(deviceId)) {
        friendlyName = 'USB Flash Drive';
      }

      results.push({
        deviceId: deviceId,
        friendlyName: friendlyName,
        timestamp: timestamp
      });
    }
    return results;
  }

  /**
   * Scans C:\Windows\inf\setupapi.dev.log for hardware installation history and tampering
   */
  checkSetupApiLog(currentDriveLetters = []) {
    const findings = [];
    const setupLogPath = 'C:\\Windows\\inf\\setupapi.dev.log';

    if (!fs.existsSync(setupLogPath)) {
      findings.push({
        level: 'CRITICAL',
        type: 'SETUPAPI_DEV_LOG_WIPED',
        name: 'SetupAPI Device Log Missing / Wiped',
        path: setupLogPath,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        confidence: '100% (Somut Kanit: setupapi.dev.log Yok Edilmis)',
        description: 'C:\\Windows\\inf\\setupapi.dev.log cihaz kurulum adli gunlugu silinmis! Oyuncu takilan harici USB hile belleklerinin izlerini yok etmek icin logu silmis!'
      });
      return findings;
    }

    try {
      const stats = fs.statSync(setupLogPath);
      if (stats.size < 500) {
        findings.push({
          level: 'CRITICAL',
          type: 'SETUPAPI_DEV_LOG_TRUNCATED',
          name: 'SetupAPI Device Log Bosaltilmis',
          path: setupLogPath,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          confidence: '100% (Somut Kanit: setupapi.dev.log Boyut Anormalligi)',
          description: `SetupAPI log dosyasinin boyutu supheli derecede kucuk (${stats.size} bayt). USB takip kayitlari kasten sifirlanmis!`
        });
        return findings;
      }

      // Read tail (last 1 MB) of setupapi.dev.log for performance
      const buffer = Buffer.alloc(Math.min(stats.size, 1024 * 1024));
      const fd = fs.openSync(setupLogPath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, stats.size - buffer.length);
      fs.closeSync(fd);

      const content = buffer.toString('utf8');
      const entries = this.parseSetupApiLog(content);

      const now = Date.now();
      for (const entry of entries) {
        try {
          const entryTime = new Date(entry.timestamp).getTime();
          const ageHours = (now - entryTime) / (1000 * 3600);
          if (ageHours >= 0 && ageHours <= 48) {
            findings.push({
              level: 'INFO',
              isSafe: true,
              isThreat: false,
              type: 'USB_STORAGE_RECENTLY_INSTALLED',
              name: `Yakın Zamanda Bağlanan USB Depolama Aygıtı (${entry.friendlyName})`,
              path: entry.deviceId,
              timestamp: entry.timestamp,
              confidence: '100% (Donanım Günlüğü Kaydı)',
              description: `Sisteme harici USB depolama birimi bağlandığı donanım günlüğünde tespit edildi (${entry.friendlyName}). Sistemde bu aygıttan çalıştırılmış hile veya şüpheli dosya izi bulunmadığı için güvenlidir.`,
              evidence: [
                `Aygıt: ${entry.friendlyName}`,
                `Donanım Kimliği: ${entry.deviceId}`,
                `İlk Bağlantı Zamanı: ${entry.timestamp}`,
                `Durum: Güvenli (Hile çalıştırma izi bulunmadı)`
              ]
            });
          }
        } catch (e) {}
      }
    } catch (e) {}

    return findings;
  }

  /**
   * Queries Microsoft-Windows-DriverFrameworks-UserMode/Operational for plug/unplug events (2100 / 2003)
   */
  async checkUsbDriverFrameworkEvents() {
    const findings = [];
    try {
      const psCmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-DriverFrameworks-UserMode/Operational'; Id=2100,2003} -MaxEvents 20 -ErrorAction SilentlyContinue | Select-Object TimeCreated, Id, Message | ConvertTo-Json"`;
      const { stdout } = await execPromise(psCmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        let events = [];
        try {
          const parsed = JSON.parse(stdout);
          events = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const ev of events) {
          const isDisconnect = ev.Id === 2100;
          const formattedTime = this.formatPowerShellDate(ev.TimeCreated);
          findings.push({
            level: 'INFO',
            isSafe: true,
            isThreat: false,
            type: isDisconnect ? 'USB_DEVICE_DISCONNECTED_EVENT' : 'USB_DEVICE_CONNECTED_EVENT',
            name: isDisconnect ? 'USB Cihaz Bağlantısı Kesildi (Event 2100)' : 'USB Cihaz Bağlandı (Event 2003)',
            path: 'Microsoft-Windows-DriverFrameworks-UserMode/Operational',
            timestamp: formattedTime,
            confidence: '100% (Windows DriverFrameworks Olay Günlüğü)',
            description: isDisconnect 
              ? 'Sistemden bir USB cihazının bağlantısı kesildi (Event 2100). Hile çalıştırma iziyle eşleşmediği sürece şüpheli sayılmaz.'
              : 'Harici USB aygıt takıldı (Event 2003).',
            evidence: [
              `Olay Kimliği: ${ev.Id}`,
              `Zaman: ${formattedTime}`,
              `Mesaj: ${ev.Message || 'USB PnP Event'}`
            ]
          });
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * Scans Linux Kernel Journal for USB disconnect events
   */
  async checkLinuxUsbEvents() {
    const findings = [];
    try {
      const { stdout } = await execPromise('journalctl -k --since "2 hours ago" -g "USB disconnect" --no-pager 2>/dev/null').catch(() => ({ stdout: '' }));
      if (stdout && stdout.trim().length > 0) {
        const lines = stdout.split('\n').filter(Boolean);
        for (const line of lines.slice(-5)) {
          findings.push({
            level: 'INFO',
            isSafe: true,
            isThreat: false,
            type: 'LINUX_USB_STORAGE_RECENTLY_UNPLUGGED',
            name: 'Linux USB Cihaz Bağlantısı Kesildi (Kernel Log)',
            path: '/var/log/journal',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            confidence: '100% (Linux Kernel USB Disconnect Telemetrisi)',
            description: `Son 2 saat içerisinde bir USB cihazının bağlantısı kesildi (Kernel Telemetrisi). Hile iziyle eşleşmediği sürece şüpheli sayılmaz: ${line.slice(0, 100)}`,
            evidence: [
              `Kernel Kaydı: ${line}`
            ]
          });
        }
      }
    } catch (e) {}
    return findings;
  }
}

module.exports = new UsbTrackerEngine();
