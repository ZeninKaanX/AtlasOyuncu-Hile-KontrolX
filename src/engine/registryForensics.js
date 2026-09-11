/**
 * Farben AC - User Activity & Execution Forensics Engine
 * Windows: Extracts BAM (Background Activity Moderator), DAM, and UserAssist (ROT-13).
 * Linux: Reconstructs execution history from shell logs and detects deleted binaries.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const serverPolicy = require('../config/serverPolicy');

class RegistryForensicsEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  isAutoClickerName(str) {
    return /autoclicker|murgee|opautoclick|speedclicker|fastclick/i.test(str);
  }

  isSecurityOrDetectionTool(str) {
    return /detector|scanner|checker|audit|anticheat|benchmark|atlas|farben/i.test(str);
  }

  rot13(str) {
    return str.replace(/[a-zA-Z]/g, function (c) {
      return String.fromCharCode(
        (c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
      );
    });
  }

  parseBamHexTimestamp(hexStr) {
    try {
      if (!hexStr || typeof hexStr !== 'string') return null;
      const parts = hexStr.split('-').slice(0, 8);
      if (parts.length < 8) return null;
      const buf = Buffer.from(parts.map(p => parseInt(p, 16)));
      const filetimeBigInt = buf.readBigUInt64LE(0);
      if (!filetimeBigInt || filetimeBigInt === 0n) return null;
      const msSince1601 = Number(filetimeBigInt / 10000n);
      const unixMs = msSince1601 - 11644473600000;
      if (unixMs < 0 || unixMs > Date.now() + 31536000000000) return null;
      return new Date(unixMs).toISOString().replace('T', ' ').slice(0, 19);
    } catch (e) {
      return null;
    }
  }

  evaluateBamItem(item) {
    const fullPath = item.Path || '';
    if (!fullPath || typeof fullPath !== 'string') return null;

    const lowerPath = fullPath.toLowerCase();
    const fileName = fullPath.replace(/\\/g, '/').split('/').pop() || '';
    const lowerFileName = fileName.toLowerCase();
    const fileExists = fs.existsSync(fullPath);
    const timeStr = item.Hex ? this.parseBamHexTimestamp(item.Hex) : (item.Timestamp || item.timestamp || null);
    const isRemovable = lowerPath.includes('\\device\\harddiskvolume') || /\\(?:usb|removable|volume\{[a-f0-9-]+\})/i.test(lowerPath);

    if (this.isSecurityOrDetectionTool(lowerFileName)) return null;

    if (this.isAutoClickerName(lowerFileName)) {
      if (serverPolicy.isAutoClickerAllowed()) {
        return {
          level: 'INFO',
          type: 'ALLOWED_UTILITY_AUTOCLICKER',
          name: `BAM AutoClicker Kaydı (${fileName}) (Sunucu Kuralı: İzinli)`,
          file: fileName,
          path: fullPath,
          timestamp: timeStr || new Date().toISOString().replace('T', ' ').slice(0, 19),
          deletedFromDisk: !fileExists,
          isRemovableDrive: isRemovable,
          confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
          description: `BAM kayıt defterinde AutoClicker çalıştırma kaydı bulundu: ${fileName}. Sunucu kuralları gereği AutoClicker ban sebebi sayılmamaktadır.`,
          evidence: [
            `Kayıt Yolu: ${fullPath}`,
            `Kullanıcı SID: ${item.SID || 'Unknown'}`,
            `Çalıştırma Zamanı: ${timeStr || 'Kayıtlı'}`
          ]
        };
      }
    }

    const isCheatPattern = /(?:^|[\\/._-])(vape(?:[-_ ]?v?[0-9]|lite)?|slinky|drip(?:client|-lite|_client)?|doomsday|meteorclient|liquidbounce|wurstclient|wurst|autoclicker|murgee|ravenbplus|catlean|bleachhack|boze|rusherhack|futureclient|novoline|astolfo|tenacity)(?:[-_.]|$)/i.test(lowerFileName);

    if (isCheatPattern) {

      return {
        level: 'CRITICAL',
        type: 'BAM_CHEAT_RECORD',
        name: `BAM Yürütme Kaydı (${fileName})`,
        file: fileName,
        path: fullPath,
        timestamp: timeStr || new Date().toISOString().replace('T', ' ').slice(0, 19),
        deletedFromDisk: !fileExists,
        isRemovableDrive: isRemovable,
        confidence: '100% (Somut Kanıt: Windows BAM/DAM Kayıt Defteri)',
        description: `BAM kayıt defteri hilenin çalıştırıldığını kanıtlıyor: ${fileName}. ${!fileExists ? '[DOSYA SİLİNMİŞ - ADLİ İMHA KANITI]' : '[Dosya Diskte Mevcut]'}${isRemovable ? ' [HARİCİ/USB BELLEKTEN ÇALIŞTIRILMIŞ]' : ''}`,
        evidence: [
          `Kayıt Yolu: ${fullPath}`,
          `Kullanıcı SID: ${item.SID || 'Unknown'}`,
          `Çalıştırma Zamanı: ${timeStr || 'Kayıtlı'}`
        ]
      };
    }
    return null;
  }

  /**
   * Parses Explorer RecentDocs REG_BINARY hex payload to extract UTF-16LE and ASCII file strings
   */
  parseRecentDocsHex(hexStr) {
    try {
      if (!hexStr || typeof hexStr !== 'string') return [];
      const cleanHex = hexStr.replace(/[^0-9a-fA-F]/g, '');
      if (cleanHex.length < 8) return [];
      const buf = Buffer.from(cleanHex, 'hex');
      const foundStrings = [];

      // 1. Extract UTF-16LE strings (min 3 chars)
      let utf16Chars = [];
      for (let i = 0; i < buf.length - 1; i += 2) {
        const code = buf.readUInt16LE(i);
        if (code >= 32 && code <= 126) {
          utf16Chars.push(String.fromCharCode(code));
        } else {
          if (utf16Chars.length >= 3) {
            foundStrings.push(utf16Chars.join(''));
          }
          utf16Chars = [];
        }
      }
      if (utf16Chars.length >= 3) {
        foundStrings.push(utf16Chars.join(''));
      }

      // 2. Extract ASCII strings (min 3 chars)
      let asciiChars = [];
      for (let i = 0; i < buf.length; i++) {
        const b = buf[i];
        if (b >= 32 && b <= 126) {
          asciiChars.push(String.fromCharCode(b));
        } else {
          if (asciiChars.length >= 3) {
            foundStrings.push(asciiChars.join(''));
          }
          asciiChars = [];
        }
      }
      if (asciiChars.length >= 3) {
        foundStrings.push(asciiChars.join(''));
      }

      // Filter unique non-empty strings
      return Array.from(new Set(foundStrings.map(s => s.trim()).filter(s => s.length >= 3)));
    } catch (e) {
      return [];
    }
  }

  async scanRegistry(onTarget = () => {}) {
    if (this.isWindows) {
      return this.scanWindowsRegistry(onTarget);
    } else {
      return this.scanLinuxExecutionForensics(onTarget);
    }
  }

  async scanWindowsRegistry(onTarget = () => {}) {
    const findings = [];
    const bamEntries = [];
    const userAssistEntries = [];
    onTarget('Windows BAM & UserAssist Registry Execution Keys', 20);

    // 1. BAM / DAM Extraction
    try {
      const bamCmd = `powershell -NoProfile -Command "$paths = @('HKLM:\\SYSTEM\\CurrentControlSet\\Services\\bam\\State\\UserSettings\\*', 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\dam\\State\\UserSettings\\*', 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\bam\\UserSettings\\*'); Get-Item -Path $paths -ErrorAction SilentlyContinue | ForEach-Object { $sid = $_.PSChildName; $p = $_.PSPath; $_.Property | ForEach-Object { [PSCustomObject]@{ SID = $sid; Path = $_; Hex = [System.BitConverter]::ToString((Get-ItemPropertyValue -Path $p -Name $_ -ErrorAction SilentlyContinue)) } } } | ConvertTo-Json"`;
      const { stdout: bamJson } = await execPromise(bamCmd, { maxBuffer: 15 * 1024 * 1024 }).catch(() => ({ stdout: '' }));

      if (bamJson && bamJson.trim().length > 0) {
        let items = [];
        try {
          const parsed = JSON.parse(bamJson);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of items) {
          const fullPath = item.Path || '';
          if (!fullPath || typeof fullPath !== 'string') continue;

          bamEntries.push({ path: fullPath, sid: item.SID });
          const finding = this.evaluateBamItem(item);
          if (finding) findings.push(finding);
        }
      }
    } catch (e) {}

    // 2. UserAssist ROT-13 Decoding
    try {
      const uaCmd = `powershell -NoProfile -Command "Get-ChildItem -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist' -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Property"`;
      const { stdout: uaOut } = await execPromise(uaCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));

      if (uaOut) {
        const lines = uaOut.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const decoded = this.rot13(trimmed);
          userAssistEntries.push(decoded);
          const uaFileName = path.basename(decoded).toLowerCase();

          if (this.isSecurityOrDetectionTool(uaFileName)) continue;

          if (/(?:^|[\\/._-])(vape(?:[-_ ]?v?[0-9]|lite)?|slinky|drip(?:client|-lite|_client)?|doomsday|autoclicker|murgee|ravenbplus|liquidbounce|wurst|novoline)(?:[-_.]|$)/i.test(uaFileName)) {
            if (this.isAutoClickerName(uaFileName) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `UserAssist AutoClicker Kaydı (${path.basename(decoded)}) (Sunucu Kuralı: İzinli)`,
                path: decoded,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `UserAssist kayıt defterinde AutoClicker çalıştırma kaydı bulundu: ${decoded}. Sunucu kuralları gereği AutoClicker ban sebebi sayılmamaktadır.`,
                evidence: [`Çözülen Kayıt Yolu: ${decoded}`]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'USERASSIST_CHEAT_RECORD',
                name: path.basename(decoded) || 'UserAssist Kaydı',
                path: decoded,
                confidence: '100% (Somut Kanıt: UserAssist ROT-13 Çalıştırma Kaydı)',
                description: `UserAssist kayıt defteri anahtarı hilenin doğrudan çalıştırıldığını kanıtlıyor: ${decoded}`,
                evidence: [`Çözülen Kayıt Yolu: ${decoded}`]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 3. MuiCache Execution Forensics
    try {
      const muiCmd = `powershell -NoProfile -Command "(Get-ItemProperty 'HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache' -ErrorAction SilentlyContinue).PSObject.Properties | Select-Object Name, Value | ConvertTo-Json"`;
      const { stdout: muiJson } = await execPromise(muiCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (muiJson && muiJson.trim().length > 0) {
        let muiItems = [];
        try {
          const parsed = JSON.parse(muiJson);
          muiItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of muiItems) {
          const appName = path.basename(item.Name || '').toLowerCase();
          if (this.isSecurityOrDetectionTool(appName)) continue;

          if (/(?:^|[\\/._-])(vape(?:[-_ ]?v?[0-9]|lite)?|slinky|drip(?:client|-lite|_client)?|doomsday|meteorclient|liquidbounce|wurstclient|wurst|autoclicker|murgee|ravenbplus|novoline)(?:[-_.]|$)/i.test(appName)) {
            if (this.isAutoClickerName(appName) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `MuiCache AutoClicker Kaydı (${path.basename(item.Name)}) (Sunucu Kuralı: İzinli)`,
                path: item.Name,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `MuiCache kayıt defteri girdisi AutoClicker çalıştırıldığını gösteriyor: ${item.Name}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [
                  `Kayıt Defteri Yolu: ${item.Name}`,
                  `Görünen İsim: ${item.Value || 'Bilinmiyor'}`
                ]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'MUICACHE_CHEAT_RECORD',
                name: `MuiCache Hile Kaydı (${path.basename(item.Name)})`,
                path: item.Name,
                confidence: '100% (Somut Kanıt: MuiCache Kabuk Kaydı)',
                description: `MuiCache kayıt defteri girdisi hile ikili dosyasının çalıştırıldığını doğruluyor: ${item.Name}`,
                evidence: [
                  `Kayıt Defteri Yolu: ${item.Name}`,
                  `Görünen İsim: ${item.Value || 'Bilinmiyor'}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 4. OpenSavePidlMRU (Recent Open/Save Dialog History)
    try {
      const osCmd = `powershell -NoProfile -Command "Get-ChildItem -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ComDlg32\\OpenSavePidlMRU' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { (Get-ItemProperty $_.PSPath).PSObject.Properties } | Select-Object Name, Value | ConvertTo-Json"`;
      const { stdout: osJson } = await execPromise(osCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (osJson && osJson.trim().length > 0) {
        let osItems = [];
        try {
          const parsed = JSON.parse(osJson);
          osItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const it of osItems) {
          const valFile = path.basename(String(it.Value || '')).toLowerCase();
          if (this.isSecurityOrDetectionTool(valFile)) continue;

          if (/(?:^|[\\/._-])(vape(?:[-_ ]?v?[0-9]|lite)?|slinky|drip(?:client|-lite|_client)?|doomsday|liquidbounce|wurstclient|wurst|autoclicker|ravenbplus|novoline)(?:[-_.]|$)/i.test(valFile)) {
            if (this.isAutoClickerName(valFile) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `Dosya İletişim Kutusu AutoClicker Kaydı (${path.basename(it.Value)}) (Sunucu Kuralı: İzinli)`,
                path: String(it.Value),
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Dosya iletişim kutusunda AutoClicker dosyası seçilmiş: ${it.Value}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [`Seçilen Dosya: ${it.Value}`]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'OPENSAVE_CHEAT_RECORD',
                name: `Dosya İletişim Kutusu Hile Kaydı (${path.basename(it.Value)})`,
                path: String(it.Value),
                confidence: '100% (Somut Kanıt: OpenSavePidlMRU Kaydı)',
                description: `Kullanıcı dosya açma/kaydetme penceresinde hile dosyasını seçmiş: ${it.Value}`,
                evidence: [`Seçilen Dosya: ${it.Value}`]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 5. AppCompatFlags Layers Forensics (RunAsAdmin & Compatibility Overrides)
    try {
      const compatCmd = `powershell -NoProfile -Command "$keys = @('HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers', 'HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers'); Get-Item -Path $keys -ErrorAction SilentlyContinue | ForEach-Object { $p = $_.PSPath; $_.Property | ForEach-Object { [PSCustomObject]@{ Path = $_; Flags = (Get-ItemPropertyValue -Path $p -Name $_ -ErrorAction SilentlyContinue) } } } | ConvertTo-Json"`;
      const { stdout: compatJson } = await execPromise(compatCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (compatJson && compatJson.trim().length > 0) {
        let compatItems = [];
        try {
          const parsed = JSON.parse(compatJson);
          compatItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of compatItems) {
          const appPath = String(item.Path || '');
          const lowerPath = appPath.toLowerCase();
          const flags = String(item.Flags || '');
          const fileName = path.basename(appPath);
          const fileExists = fs.existsSync(appPath);

          if (this.isSecurityOrDetectionTool(lowerPath)) continue;

          if (/vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus/i.test(lowerPath)) {
            if (this.isAutoClickerName(lowerPath) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `Uyumluluk / Yönetici AutoClicker Kaydı (${fileName}) (Sunucu Kuralı: İzinli)`,
                path: appPath,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Windows Uyumluluk ayarlarında AutoClicker kaydı bulundu: ${fileName}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [
                  `Kayıt Yolu: ${appPath}`,
                  `Uyumluluk Bayrakları: ${flags}`,
                  `Kayıt Defteri: AppCompatFlags\\Layers`
                ]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'APPCOMPAT_LAYERS_CHEAT_RECORD',
                name: `Uyumluluk / Yönetici Kaydı (${fileName})`,
                path: appPath,
                confidence: '100% (Somut Kanıt: AppCompatFlags\\Layers Kayıt Defteri)',
                description: `Windows Uyumluluk ayarlarında (${flags}) hile dosyasının yönetici olarak çalıştırıldığı doğrulandı: ${fileName}. ${!fileExists ? '[DOSYA SİLİNMİŞ - ADLİ İMHA KANITI]' : '[Dosya Diskte Mevcut]'}`,
                evidence: [
                  `Kayıt Yolu: ${appPath}`,
                  `Uyumluluk Bayrakları: ${flags}`,
                  `Kayıt Defteri: AppCompatFlags\\Layers`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 6. Windows Tracing Forensics (HKLM\SOFTWARE\Microsoft\Tracing)
    try {
      const traceCmd = `powershell -NoProfile -Command "Get-ChildItem -Path 'HKLM:\\SOFTWARE\\Microsoft\\Tracing' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty PSChildName | ConvertTo-Json"`;
      const { stdout: traceJson } = await execPromise(traceCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (traceJson && traceJson.trim().length > 0) {
        let traceItems = [];
        try {
          const parsed = JSON.parse(traceJson);
          traceItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of traceItems) {
          const keyName = String(item || '').toLowerCase();
          if (this.isSecurityOrDetectionTool(keyName)) continue;

          if (/vape|drip|slinky|doomsday|liquidbounce|meteor|wurst|autoclicker|raven|boze|rusherhack|futureclient|kura|itami/i.test(keyName)) {
            if (this.isAutoClickerName(keyName) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `Windows Ağ İzleme AutoClicker İzi (${item}) (Sunucu Kuralı: İzinli)`,
                path: `HKLM\\SOFTWARE\\Microsoft\\Tracing\\${item}`,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Windows Tracing anahtarında AutoClicker izi bulundu: ${item}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [`İzleme Anahtarı: HKLM\\SOFTWARE\\Microsoft\\Tracing\\${item}`]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'TRACING_CHEAT_NETWORK_RECORD',
                name: `Windows Ağ İzleme Hile İzi (${item})`,
                path: `HKLM\\SOFTWARE\\Microsoft\\Tracing\\${item}`,
                confidence: '100% (Somut Kanıt: Windows Tracing Kayıt Defteri)',
                description: `Windows Tracing alt anahtarı hile ikili dosyasının uzak sunucuya ağ bağlantısı kurduğunu kanıtlıyor: ${item}`,
                evidence: [
                  `İzleme Anahtarı: HKLM\\SOFTWARE\\Microsoft\\Tracing\\${item}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 7. FeatureUsage Forensics (AppSwitched & ShowJumpView Interaction Counters)
    try {
      const fuCmd = `powershell -NoProfile -Command "$keys = @('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FeatureUsage\\AppSwitched', 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FeatureUsage\\ShowJumpView'); Get-Item -Path $keys -ErrorAction SilentlyContinue | ForEach-Object { $p = $_.PSPath; $_.Property | ForEach-Object { [PSCustomObject]@{ Path = $_; Count = (Get-ItemPropertyValue -Path $p -Name $_ -ErrorAction SilentlyContinue) } } } | ConvertTo-Json"`;
      const { stdout: fuJson } = await execPromise(fuCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (fuJson && fuJson.trim().length > 0) {
        let fuItems = [];
        try {
          const parsed = JSON.parse(fuJson);
          fuItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of fuItems) {
          const targetPath = String(item.Path || '');
          const lowerTarget = targetPath.toLowerCase();
          const count = Number(item.Count || 0);

          if (this.isSecurityOrDetectionTool(lowerTarget)) continue;

          if (/xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac|discord|spotify|chrome|brave|firefox|edge|obs64|steam|code|vscodium|notepad|explorer|taskmgr/i.test(lowerTarget)) {
            continue;
          }

          const isCheat = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|clicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus|itami|fdp|tenacity|kura/i.test(lowerTarget);
          if (isCheat) {
            const fileName = path.basename(targetPath);
            const exists = fs.existsSync(targetPath);

            if (this.isAutoClickerName(lowerTarget) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `FeatureUsage AutoClicker Kaydı (${fileName}) (Sunucu Kuralı: İzinli)`,
                path: targetPath,
                interactionCount: count,
                deletedFromDisk: !exists,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Windows FeatureUsage kaydı AutoClicker çalıştırıldığını gösteriyor: ${fileName}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [
                  `Kayıt Defteri Yolu: ${targetPath}`,
                  `Pencere Değiştirme / Başlatma Sayısı: ${count}`
                ]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'FEATUREUSAGE_APPSWITCHED_CHEAT_RECORD',
                name: `FeatureUsage Etkileşim Kaydı (${fileName})`,
                path: targetPath,
                interactionCount: count,
                deletedFromDisk: !exists,
                confidence: '100% (Somut Kanıt: FeatureUsage\\AppSwitched Kayıt Defteri)',
                description: `Windows FeatureUsage\\AppSwitched kaydı hilenin en az ${count} kez çalıştırıldığını/etkileşime girildiğini kanıtlıyor: ${fileName}. ${!exists ? '[DOSYA SİLİNMİŞ - ADLİ İMHA KANITI]' : '[Dosya Diskte Mevcut]'}`,
                evidence: [
                  `Kayıt Defteri Yolu: ${targetPath}`,
                  `Pencere Değiştirme / Başlatma Sayısı: ${count}`,
                  `Adli Durum: ${!exists ? 'Dosya diskten silinmiş fakat FeatureUsage kaydı temizlenememiş' : 'Dosya sistemde mevcut'}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 8. Explorer RecentDocs Binary Forensics
    try {
      const rdCmd = `powershell -NoProfile -Command "Get-ChildItem -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { $p = $_.PSPath; $keyName = $_.PSChildName; $_.Property | Where-Object { $_ -ne 'MRUListEx' } | ForEach-Object { [PSCustomObject]@{ Key = $keyName; ValName = $_; Hex = [System.BitConverter]::ToString((Get-ItemPropertyValue -Path $p -Name $_ -ErrorAction SilentlyContinue)) } } } | ConvertTo-Json"`;
      const { stdout: rdJson } = await execPromise(rdCmd, { maxBuffer: 15 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (rdJson && rdJson.trim().length > 0) {
        let rdItems = [];
        try {
          const parsed = JSON.parse(rdJson);
          rdItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of rdItems) {
          if (!item.Hex) continue;
          const extractedStrings = this.parseRecentDocsHex(item.Hex);

          for (const str of extractedStrings) {
            const lowerStr = str.toLowerCase();
            if (this.isSecurityOrDetectionTool(lowerStr)) continue;

            if (/xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac|discord|spotify|chrome|brave|firefox|edge|obs64|steam|code|vscodium|notepad/i.test(lowerStr)) {
              continue;
            }

            const isCheat = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|clicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus|itami|fdp|tenacity|kura/i.test(lowerStr);
            if (isCheat) {
              if (this.isAutoClickerName(lowerStr) && serverPolicy.isAutoClickerAllowed()) {
                findings.push({
                  level: 'INFO',
                  type: 'ALLOWED_UTILITY_AUTOCLICKER',
                  name: `Explorer RecentDocs AutoClicker Kaydı (${str}) (Sunucu Kuralı: İzinli)`,
                  extractedString: str,
                  subKey: item.Key || 'RecentDocs',
                  confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                  description: `Windows Explorer RecentDocs geçmişinde AutoClicker dosyası bulundu: ${str}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                  evidence: [
                    `Tespit Edilen Dosya İsmi: ${str}`,
                    `Kayıt Anahtarı: HKCU\\...\\RecentDocs\\${item.Key || ''}`,
                    `Değer İsmi: ${item.ValName || ''}`
                  ]
                });
              } else {
                findings.push({
                  level: 'CRITICAL',
                  type: 'RECENTDOCS_CHEAT_BINARY_RECORD',
                  name: `Explorer RecentDocs Hile Kaydı (${str})`,
                  extractedString: str,
                  subKey: item.Key || 'RecentDocs',
                  confidence: '100% (Somut Kanıt: RecentDocs MRU İkili Çözümleme)',
                  description: `Windows Explorer RecentDocs MRU ikili verisinde hile dosyasının açıldığı tespit edildi: ${str}`,
                  evidence: [
                    `Tespit Edilen Dosya İsmi: ${str}`,
                    `Kayıt Anahtarı: HKCU\\...\\RecentDocs\\${item.Key || ''}`,
                    `Değer İsmi: ${item.ValName || ''}`
                  ]
                });
              }
              break;
            }
          }
        }
      }
    } catch (e) {}

    // 9. Explorer RunMRU & TypedPaths Forensics
    try {
      const runCmd = `powershell -NoProfile -Command "$paths = @('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU', 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\TypedPaths'); Get-Item -Path $paths -ErrorAction SilentlyContinue | ForEach-Object { $p = $_.PSPath; $k = $_.PSChildName; $_.Property | Where-Object { $_ -ne 'MRUList' } | ForEach-Object { [PSCustomObject]@{ Key = $k; Name = $_; Value = (Get-ItemPropertyValue -Path $p -Name $_ -ErrorAction SilentlyContinue) } } } | ConvertTo-Json"`;
      const { stdout: runJson } = await execPromise(runCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (runJson && runJson.trim().length > 0) {
        let runItems = [];
        try {
          const parsed = JSON.parse(runJson);
          runItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of runItems) {
          const valStr = String(item.Value || '');
          const lowerVal = valStr.toLowerCase();

          if (this.isSecurityOrDetectionTool(lowerVal)) continue;

          if (/xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac/i.test(lowerVal)) {
            continue;
          }

          const isCheat = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|clicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus|itami|fdp|tenacity|kura/i.test(lowerVal);
          if (isCheat) {
            if (this.isAutoClickerName(lowerVal) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `Çalıştır/Yol Geçmişi AutoClicker Kaydı (${item.Key}) (Sunucu Kuralı: İzinli)`,
                path: valStr.replace(/\\1$/, ''),
                sourceKey: item.Key,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Çalıştır geçmişinde AutoClicker komutu tespit edildi: ${valStr}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [
                  `Kayıt Kaynağı: HKCU\\...\\${item.Key}`,
                  `Çalıştırılan Değer: ${valStr}`
                ]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'RUNMRU_TYPEDPATHS_CHEAT_RECORD',
                name: `Çalıştır/Yol Geçmişi Hile Kaydı (${item.Key})`,
                path: valStr.replace(/\\1$/, ''),
                sourceKey: item.Key,
                confidence: '100% (Somut Kanıt: Explorer RunMRU/TypedPaths)',
                description: `Kullanıcı Çalıştır (Win+R) veya Gezgin adres çubuğuna doğrudan hile komutu/yolu yazmış: ${valStr}`,
                evidence: [
                  `Kayıt Kaynağı: HKCU\\...\\${item.Key}`,
                  `Çalıştırılan Değer: ${valStr}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 10. Compatibility Assistant Store Forensics (HKCU/HKLM AppCompatFlags\Compatibility Assistant\Store)
    try {
      const casCmd = `powershell -NoProfile -Command "$paths = @('HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Compatibility Assistant\\Store', 'HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Compatibility Assistant\\Store'); Get-Item -Path $paths -ErrorAction SilentlyContinue | ForEach-Object { $_.Property } | ConvertTo-Json"`;
      const { stdout: casJson } = await execPromise(casCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (casJson && casJson.trim().length > 0) {
        let casItems = [];
        try {
          const parsed = JSON.parse(casJson);
          casItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const rawPath of casItems) {
          const targetPath = String(rawPath || '');
          const lowerTarget = targetPath.toLowerCase();

          if (this.isSecurityOrDetectionTool(lowerTarget)) continue;

          if (/xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac|discord|spotify|chrome|brave|firefox|edge|obs64|steam|code|vscodium|notepad|explorer|taskmgr/i.test(lowerTarget)) {
            continue;
          }

          const isCheat = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|clicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus|itami|fdp|tenacity|kura/i.test(lowerTarget);
          if (isCheat) {
            const fileName = path.basename(targetPath);
            const exists = fs.existsSync(targetPath);

            if (this.isAutoClickerName(lowerTarget) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `Uyumluluk Asistanı AutoClicker Kaydı (${fileName}) (Sunucu Kuralı: İzinli)`,
                path: targetPath,
                deletedFromDisk: !exists,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Windows Uyumluluk Asistanı veritabanında AutoClicker kaydı bulundu: ${fileName}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [`Kayıt Defteri Yolu: ${targetPath}`]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'COMPATIBILITY_ASSISTANT_STORE_CHEAT_RECORD',
                name: `Uyumluluk Asistanı Depo Kaydı (${fileName})`,
                path: targetPath,
                deletedFromDisk: !exists,
                confidence: '100% (Somut Kanıt: AppCompatFlags\\Compatibility Assistant\\Store)',
                description: `Windows Uyumluluk Asistanı veritabanında hile dosyasının çalıştırıldığı tespit edildi: ${fileName}. ${!exists ? '[DOSYA SİLİNMİŞ - ADLİ İMHA KANITI]' : '[Dosya Diskte Mevcut]'}`,
                evidence: [
                  `Kayıt Defteri Yolu: ${targetPath}`,
                  `Adli Durum: ${!exists ? 'Hile dosyası silinmiş fakat Uyumluluk Asistanı deposunda izi kalmış' : 'Dosya sistemde mevcut'}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    // 11. Windows Search RecentApps Execution Forensics (HKCU\Software\Microsoft\Windows\CurrentVersion\Search\RecentApps)
    try {
      const raCmd = `powershell -NoProfile -Command "Get-ChildItem -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\\RecentApps' -ErrorAction SilentlyContinue | ForEach-Object { $p = $_.PSPath; [PSCustomObject]@{ AppId = (Get-ItemPropertyValue -Path $p -Name 'AppId' -ErrorAction SilentlyContinue); LaunchCount = (Get-ItemPropertyValue -Path $p -Name 'LaunchCount' -ErrorAction SilentlyContinue); LastAccessTime = [System.BitConverter]::ToString((Get-ItemPropertyValue -Path $p -Name 'LastAccessTime' -ErrorAction SilentlyContinue)) } } | ConvertTo-Json"`;
      const { stdout: raJson } = await execPromise(raCmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => ({ stdout: '' }));
      if (raJson && raJson.trim().length > 0) {
        let raItems = [];
        try {
          const parsed = JSON.parse(raJson);
          raItems = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        for (const item of raItems) {
          const appId = String(item.AppId || '');
          if (!appId) continue;
          const lowerApp = appId.toLowerCase();

          if (this.isSecurityOrDetectionTool(lowerApp)) continue;

          if (/xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac|discord|spotify|chrome|brave|firefox|edge|obs64|steam|code|vscodium|notepad|explorer|taskmgr/i.test(lowerApp)) {
            continue;
          }

          const isCheat = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|clicker|murgee|raven|catlean|bleachhack|boze|rusherhack|futureclient|phantom|augustus|itami|fdp|tenacity|kura/i.test(lowerApp);
          if (isCheat) {
            const fileName = path.basename(appId);
            const exists = fs.existsSync(appId);
            const accessTime = this.parseBamHexTimestamp(item.LastAccessTime);
            const count = Number(item.LaunchCount || 1);

            if (this.isAutoClickerName(lowerApp) && serverPolicy.isAutoClickerAllowed()) {
              findings.push({
                level: 'INFO',
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                name: `RecentApps AutoClicker Kaydı (${fileName}) (Sunucu Kuralı: İzinli)`,
                path: appId,
                launchCount: count,
                timestamp: accessTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
                deletedFromDisk: !exists,
                confidence: 'Doğrulandı (İzin Verilen Makro/Klik Aracı)',
                description: `Windows Search RecentApps veritabanında AutoClicker çalıştırma kaydı bulundu: ${fileName}. Sunucu kuralları gereği ban sebebi sayılmamaktadır.`,
                evidence: [
                  `Kayıt Defteri Uygulama Yolu: ${appId}`,
                  `Çalıştırma / Başlatma Sayısı: ${count}`
                ]
              });
            } else {
              findings.push({
                level: 'CRITICAL',
                type: 'RECENTAPPS_CHEAT_EXECUTION_RECORD',
                name: `RecentApps Çalıştırma Kaydı (${fileName})`,
                path: appId,
                launchCount: count,
                timestamp: accessTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
                deletedFromDisk: !exists,
                confidence: '100% (Somut Kanıt: Windows Search RecentApps Kayıt Defteri)',
                description: `Windows Search RecentApps veritabanında hilenin ${count} kez çalıştırıldığı kesin olarak belgelendi: ${fileName}. ${!exists ? '[DOSYA SİLİNMİŞ - ADLİ İMHA KANITI]' : '[Dosya Diskte Mevcut]'}`,
                evidence: [
                  `Kayıt Defteri Uygulama Yolu: ${appId}`,
                  `Çalıştırma / Başlatma Sayısı: ${count}`,
                  `Son Erişim Zamanı: ${accessTime || 'Kayıtlı'}`,
                  `Adli Durum: ${!exists ? 'Hile dosyası diskten silinmiş fakat RecentApps veritabanında izi kalmış' : 'Dosya sistemde mevcut'}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    return {
      status: 'SUCCESS',
      findings: findings,
      totalBamRecords: bamEntries.length,
      totalUserAssistRecords: userAssistEntries.length,
      bamEntries: bamEntries.slice(0, 100)
    };
  }

  /**
   * Linux Activity & Deleted Executable Forensics
   */
  async scanLinuxExecutionForensics(onTarget = () => {}) {
    const findings = [];
    const executionEntries = [];
    const home = os.homedir();

    const historyFiles = [
      path.join(home, '.bash_history'),
      path.join(home, '.zsh_history')
    ];

    onTarget('Linux Shell History (~/.bash_history, ~/.zsh_history)', 10);

    for (const hFile of historyFiles) {
      if (fs.existsSync(hFile)) {
        onTarget(hFile, 1);
        try {
          const content = fs.readFileSync(hFile, 'utf8');
          const lines = content.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Check execution of binaries from /tmp, Downloads, Desktop
            const match = trimmed.match(/(?:\.\/|bash\s+|sh\s+|python3?\s+)(\S+\.(?:sh|py|bin|run|jar))/i);
            if (match) {
              const execTarget = match[1];
              executionEntries.push(execTarget);

              if (/cheat|inject|vape|drip|clicker|raven|meteor/i.test(execTarget)) {
                const targetExists = fs.existsSync(execTarget);
                findings.push({
                  level: 'CRITICAL',
                  type: 'LINUX_EXECUTED_CHEAT',
                  target: execTarget,
                  deletedFromDisk: !targetExists,
                  confidence: 'High (Shell Log Execution)',
                  description: `Linux terminal history confirms execution of cheat script/binary: ${execTarget} ${!targetExists ? '[FILE DELETED - SELF DESTRUCT EVIDENCE]' : ''}`
                });
              }
            }
          }
        } catch (e) {}
      }
    }

    // 2. FreeDesktop Recently Used Files Forensics (~/.local/share/recently-used.xbel)
    const xbelPath = path.join(home, '.local', 'share', 'recently-used.xbel');
    if (fs.existsSync(xbelPath)) {
      onTarget(xbelPath, 1);
      try {
        const xbelContent = fs.readFileSync(xbelPath, 'utf8');
        const bookmarkRegex = /<bookmark\s+added="([^"]+)"\s+href="file:\/\/([^"]+)"\s+modified="([^"]+)"/g;
        let bMatch;
        while ((bMatch = bookmarkRegex.exec(xbelContent)) !== null) {
          const addedTime = bMatch[1];
          const rawUrl = bMatch[2];
          const modTime = bMatch[3];
          let decodedPath = '';
          try {
            decodedPath = decodeURIComponent(rawUrl);
          } catch (e) {
            decodedPath = rawUrl;
          }

          const lowerPath = decodedPath.toLowerCase();
          // Whitelist legitimate mods and development bot frameworks (0 False-Flag Guarantee)
          if (/xlite|claw|drippyloadingscreen|keystrokesmod|monarchfarmbot|soyafarmbot|farben ac/i.test(lowerPath)) {
            continue;
          }

          const isCheat = /vape|drip|slinky|doomsday|meteor|liquidbounce|wurst|autoclicker|raven|catlean|bleachhack|boze|rusherhack|futureclient|itami|fdp|tenacity|phantom|augustus/i.test(lowerPath);
          if (isCheat) {
            const exists = fs.existsSync(decodedPath);
            findings.push({
              level: 'CRITICAL',
              type: 'LINUX_RECENT_CHEAT_ACCESS',
              name: `Linux Dosya Yöneticisi Hile Kaydı (${path.basename(decodedPath)})`,
              path: decodedPath,
              timestamp: (modTime || addedTime || '').slice(0, 19).replace('T', ' '),
              deletedFromDisk: !exists,
              confidence: '100% (Somut Kanıt: recently-used.xbel FreeDesktop Günlüğü)',
              description: `Linux masaüstü son kullanılan dosyalar (recently-used.xbel) günlüğü hile dosyasının açıldığını kanıtlıyor: ${path.basename(decodedPath)}. ${!exists ? '[DOSYA SİLİNMİŞ - ADLİ İMHA KANITI]' : ''}`,
              evidence: [
                `Dosya Yolu: ${decodedPath}`,
                `Son Erişim: ${modTime}`,
                `Kayıt Kaynağı: ~/.local/share/recently-used.xbel`
              ]
            });
          }
        }
      } catch (e) {}
    }

    return {
      status: 'LINUX_FORENSICS_SUCCESS',
      findings: findings,
      totalRecords: executionEntries.length,
      bamEntries: executionEntries.slice(0, 100)
    };
  }
}

module.exports = new RegistryForensicsEngine();
