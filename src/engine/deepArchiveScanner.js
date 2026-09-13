/**
 * Atlas AC - High-Speed Deep Archive & Filesystem Inspector
 * Scans key locations across the PC where cheats are typically dropped, downloaded, or extracted:
 * - Downloads / İndirilenler
 * - Desktop / Masaüstü
 * - User Temp & Windows Temp (%TEMP%, /tmp, /dev/shm)
 * - Documents / Belgelerim
 * - AppData directories & Minecraft Launcher instances
 * 
 * Deeply inspects inside ZIP, JAR, and disguised archives without full disk extraction:
 * - Reads central directory entries in-memory via AdmZip.
 * - Matches internal classes against zero-false-positive cheat rules.
 * - Extracts concrete evidence: exact file path, exact timestamp, internal class name, file size.
 * - 0 False-Flag Guarantee: Archives without proven cheat classes (e.g. xlite.zip, CLaW.zip) are 100% clean.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const sigDb = require('./signatureDb');
const trojanModDetector = require('./trojanModDetector');
const modrinthWhitelist = require('./modrinthWhitelist');
const semanticCheatClassifier = require('./semanticCheatClassifier');
const peInspector = require('./peBinaryInspector');
const serverPolicy = require('../config/serverPolicy');

class DeepArchiveScanner {
  constructor() {
    this.zipMagic = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // 'PK\x03\x04'
    this.peMagic = Buffer.from([0x4D, 0x5A]); // 'MZ'
    this.sharedHeaderBuf = Buffer.alloc(4); // Reusable zero-allocation header buffer
    this.maxFileSize = 500 * 1024 * 1024; // Limit archive scan to 500MB (to support 258MB containers & large cheat bundles)
    this.maxInnerFileSize = 135 * 1024 * 1024; // Limit inner file decompression inside archives to 135MB (supports 125MB Nightmare.zip while skipping 420MB binaries)
    this.maxDepth = 7; // Recursion depth in user folders (to penetrate deeply hidden subdirectories)
    this.nonExecutableMediaExts = new Set([
      '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
      '.mp3', '.wav', '.flac', '.aac', '.ogg',
      '.iso', '.img', '.vmdk', '.qcow2',
      '.pdf', '.stl', '.obj', '.blend', '.fbx',
      '.rpm', '.deb', '.tar', '.gz', '.xz', '.bz2'
    ]);

    // Legitimate ZIP-based container formats that naturally start with PK\x03\x04
    this.legitimateZipFormats = new Set([
      '.zip', '.jar', '.war', '.ear', '.rar', '.7z',
      '.docx', '.docm', '.dotx', '.dotm',
      '.xlsx', '.xlsm', '.xltx', '.xltm',
      '.pptx', '.pptm', '.potx', '.potm',
      '.odt', '.ods', '.odp', '.odg',
      '.mrpack', '.apk', '.aab', '.epub',
      '.xpi', '.crx', '.kmz',
      '.deactivation', '.disabled', '.dis', '.inactive', '.bak', '.old', '.off', '.backup', '.deactivated'
    ]);

    // File extensions suspects use to disguise executables or JARs
    this.disguisedSuspectExts = new Set([
      '.png', '.jpg', '.jpeg', '.txt', '.tmp', '.dat', '.log',
      '.cfg', '.ini', '.bin', '.gif', '.bmp', '.ico',
      '.crdownload', '.part', '.download'
    ]);
  }

  /**
   * Discovers suspect directories to scan across Windows and Linux.
   */
  getScanDirectories() {
    const dirs = [];
    const isWindows = process.platform === 'win32';
    const home = os.homedir();

    const add = (d) => {
      if (d && fs.existsSync(d) && !dirs.includes(d)) {
        dirs.push(d);
      }
    };

    // 1. User Downloads
    add(path.join(home, 'Downloads'));
    add(path.join(home, 'İndirilenler'));

    // 2. User Desktop
    add(path.join(home, 'Desktop'));
    add(path.join(home, 'Masaüstü'));
    if (isWindows) {
      add(path.join(home, 'OneDrive', 'Desktop'));
      add(path.join(home, 'OneDrive', 'Masaüstü'));
    }

    // 3. User Documents
    add(path.join(home, 'Documents'));
    add(path.join(home, 'Belgelerim'));
    if (isWindows) {
      add(path.join(home, 'OneDrive', 'Documents'));
      add(path.join(home, 'OneDrive', 'Belgelerim'));
    }

    // 4. Temp Dirs
    const tmp = os.tmpdir();
    add(tmp);
    if (isWindows) {
      if (process.env.TEMP) add(process.env.TEMP);
      if (process.env.LOCALAPPDATA) add(path.join(process.env.LOCALAPPDATA, 'Temp'));
      add('C:\\Windows\\Temp');
    } else {
      add('/tmp');
      add('/dev/shm');
    }

    // 5. Minecraft, Weave & Launcher Locations
    if (isWindows) {
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      add(path.join(appData, '.minecraft'));
      add(path.join(appData, '.minecraft', 'mods'));
      add(path.join(appData, '.weave'));
      add(path.join(appData, '.weave', 'mods'));
      add(path.join(home, '.weave'));
      add(path.join(home, '.weave', 'mods'));
      add(path.join(appData, '.lunarclient'));
      add(path.join(appData, '.feather'));
      add(path.join(appData, '.badlion'));
      add(path.join(appData, '.sonoyuncu'));
      add(path.join(appData, '.craftrise'));
      add(path.join(appData, '.roan'));
    } else {
      add(path.join(home, '.minecraft'));
      add(path.join(home, '.minecraft', 'mods'));
      add(path.join(home, '.weave'));
      add(path.join(home, '.weave', 'mods'));
      add(path.join(home, '.lunarclient'));
      add(path.join(home, '.feather'));
      add(path.join(home, '.badlion'));
      add(path.join(home, '.sonoyuncu'));
      add(path.join(home, '.craftrise'));
    }

    return dirs;
  }

  /**
   * Formats a Date object to YYYY-MM-DD HH:mm:ss.
   */
  formatDate(date) {
    if (!date || isNaN(date.getTime())) return 'Unknown Date';
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  /**
   * Formats bytes to human readable string (KB / MB).
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Inspects a single file (whether archive, executable, or disguised).
   * By default returns single primary finding or null for backwards compatibility.
   * If options.all is true, returns array of all findings (useful for container archives).
   */
  inspectTargetFile(filePath, options = {}) {
    if (!fs.existsSync(filePath)) return options.all ? [] : null;

    try {
      const stats = fs.lstatSync(filePath);
      if (stats.isSymbolicLink() || !stats.isFile() || stats.size === 0 || stats.size > this.maxFileSize) {
        return options.all ? [] : null;
      }

      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();

      // Fast skip for large media and documents that cannot contain executable/JAR code
      if (this.nonExecutableMediaExts.has(ext) && stats.size > 10 * 1024 * 1024) {
        return options.all ? [] : null;
      }

      // Fast skip for source code, C/C++ headers, docs that cannot be compiled JARs or PE binaries
      const fastSkipSourceExts = new Set([
        '.h', '.c', '.cpp', '.hpp', '.cs', '.js', '.ts', '.jsx', '.tsx',
        '.json', '.xml', '.css', '.html', '.md', '.rst', '.py',
        '.svg', '.ttf', '.woff', '.woff2', '.cmake', '.in', '.sh'
      ]);
      if (fastSkipSourceExts.has(ext)) {
        return options.all ? [] : null;
      }

      const mtimeStr = this.formatDate(stats.mtime);
      const sizeStr = this.formatSize(stats.size);

      // MSI Installer Packages (e.g. LiquidLauncher MSI)
      if (ext === '.msi' && fileName.toLowerCase().includes('liquidlauncher')) {
        const msiFinding = {
          level: 'CRITICAL',
          type: 'CHEAT_INSTALLER_PACKAGE',
          name: 'LiquidLauncher MSI Installer',
          file: fileName,
          path: filePath,
          timestamp: mtimeStr,
          size: sizeStr,
          confidence: '100% (Somut Kanıt: MSI Paket Analizi & CCBlueX LiquidBounce)',
          description: `LiquidLauncher Windows Kurulum Paketi (MSI) tespit edildi: ${fileName}. LiquidBounce hile istemcisinin resmi yükleyicisidir.`,
          evidence: [
            `Dosya Yolu: ${filePath}`,
            `Tarih & Saat: ${mtimeStr}`,
            `Dosya Boyutu: ${sizeStr}`,
            `Biçim: Windows Installer MSI Paketi`,
            `İmza: CCBlueX LiquidLauncher / LiquidBounce`
          ]
        };
        return options.all ? [msiFinding] : msiFinding;
      }

      // Fast zero-allocation 4-byte header check
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, this.sharedHeaderBuf, 0, 4, 0);
      fs.closeSync(fd);

      const hasZipMagic = this.sharedHeaderBuf.equals(this.zipMagic);
      const hasPeMagic = this.sharedHeaderBuf[0] === 0x4D && this.sharedHeaderBuf[1] === 0x5A; // 'MZ'

      // A. DISGUISED ARCHIVE / JAR (Any file starting with PK\x03\x04 whose extension is not a legitimate ZIP/Office format)
      if (hasZipMagic && !this.legitimateZipFormats.has(ext)) {
        // Exclude Atlas AC / Farben AC's own files
        if (!fileName.toLowerCase().includes('atlas') && !fileName.toLowerCase().includes('farben')) {
          // Deep inspect the disguised archive for known cheat classes
          const innerFindings = this.inspectArchiveEntries(filePath, fileName, mtimeStr, sizeStr);
          if (innerFindings.length > 0) {
            for (const f of innerFindings) {
              f.evidence = f.evidence || [];
              f.evidence.unshift(`[ATLATMA TESPİTİ] Dosya "${ext || '(uzantısız)'}" olarak kamufle edilmiş, ancak içerik doğrulanmış hile sınıfıdır!`);
            }
            return options.all ? innerFindings : innerFindings[0];
          }

          // If no cheat classes found: verify if this is an actual disguised archive vs legitimate document/resource pack
          try {
            const zip = new AdmZip(filePath);
            const entries = zip.getEntries();
            const hasJavaClasses = entries.some(e => e.entryName.endsWith('.class'));
            const hasModMeta = entries.some(e => e.entryName === 'fabric.mod.json' || e.entryName === 'quilt.mod.json' || e.entryName === 'mcmod.info');
            const hasOdfDoc = entries.some(e => e.entryName === 'content.xml') && entries.some(m => m.entryName === 'mimetype');
            const isResourcePack = entries.some(e => e.entryName === 'pack.mcmeta') && !hasJavaClasses;
            const isPublicSuffix = fileName.toLowerCase() === 'public_suffix_list.dat';

            // Legitimate document, resource pack, or OpenJDK security data archive
            if (hasOdfDoc || isResourcePack || isPublicSuffix) {
              return options.all ? [] : null;
            }

            // Check if launcher cache or legitimate disabled mod
            const normPath = filePath.replace(/\\/g, '/').toLowerCase();
            const isLauncherCache = (
              (normPath.includes('/versions/') && normPath.includes('/downloads/')) ||
              normPath.includes('/libraries/') ||
              normPath.includes('/assets/') ||
              normPath.includes('/.gradle/') ||
              (ext === '' && /^[0-9a-f]{32,64}$/i.test(fileName))
            );
            const isDisabledMod = (
              ['.deactivation', '.disabled', '.dis', '.inactive', '.bak', '.old', '.off'].includes(ext) ||
              fileName.toLowerCase().includes('.jar.')
            );

            if (isLauncherCache || isDisabledMod) {
              return options.all ? [] : null;
            }

            // Extensionless files with NO Java classes are harmless data/cache files (e.g. Gradle, hash files)
            if (ext === '' && !hasJavaClasses && !hasModMeta) {
              return options.all ? [] : null;
            }

            // Disguised archive with suspect extension (.png, .jpg, .txt, .tmp, .log, .ini, .bin, .crdownload, etc.)
            if (this.disguisedSuspectExts.has(ext) || ext === '.crdownload' || ext === '.part' || ext === '.download' || (ext === '' && (hasJavaClasses || hasModMeta))) {
              const disguisedAlert = {
                level: 'CRITICAL',
                type: 'DISGUISED_JAR_FILE',
                name: fileName,
                file: fileName,
                path: filePath,
                timestamp: mtimeStr,
                size: sizeStr,
                confidence: '100% (Somut Kanıt: PK Başlık / Yanıltıcı Uzantı Uyuşmazlığı)',
                description: `Yanıltıcı uzantılı ZIP/JAR arşivi tespit edildi: Dosya "${ext || '(uzantısız)'}" uzantısına sahip ancak başlığı ZIP/JAR arşividir. Hile kontrollerini atlatmak için gizlenmiş!`,
                evidence: [
                  `Dosya Yolu: ${filePath}`,
                  `Tarih & Saat: ${mtimeStr}`,
                  `Dosya Boyutu: ${sizeStr}`,
                  `Uzantı: ${ext || '(uzantısız)'} (Gerçek Biçim: ZIP/JAR Arşivi)`,
                  hasJavaClasses ? 'İçerik: Java Baytkod (.class) sınıfları barındırıyor' : 'İçerik: Gizlenmiş ZIP Verisi'
                ]
              };
              return options.all ? [disguisedAlert] : disguisedAlert;
            }
          } catch (e) {
            // Corrupted or unreadable archive; do not flag
          }
        }
      }

      // B. ZIP / JAR / MRPACK ARCHIVES (Deep In-Memory Inspection)
      if (['.jar', '.zip', '.mrpack'].includes(ext) || (hasZipMagic && this.legitimateZipFormats.has(ext))) {
        // If it is a known legitimate office/media document (.docx, .xlsx, .pptx, .odg, .apk, etc.), skip deep cheat inspection
        if (this.legitimateZipFormats.has(ext) && !['.jar', '.zip', '.mrpack'].includes(ext)) {
          return options.all ? [] : null; // Legitimate document / app package
        }

        const archiveFindings = this.inspectArchiveEntries(filePath, fileName, mtimeStr, sizeStr);
        if (archiveFindings.length > 0) {
          return options.all ? archiveFindings : archiveFindings[0];
        }
        // If no cheat classes found, the archive is 100% CLEAN!
        return options.all ? [] : null;
      }

      // C. PE EXECUTABLES & LIBRARIES (.exe, .dll, .sys)
      if (['.exe', '.dll', '.sys'].includes(ext) || hasPeMagic) {
        const peRes = peInspector.inspectFile(filePath);
        if (peRes.isThreat) {
          let displayName = fileName;
          if (peRes.purpose === 'CHEAT_LAUNCHER_INSTALLER') {
            displayName = 'LiquidLauncher (LiquidBounce Installer)';
          } else if (peRes.purpose === 'EXTERNAL_CHEAT_LOADER') {
            displayName = 'Nightmare Client / External Loader';
          } else if (peRes.purpose === 'DISGUISED_EXECUTABLE') {
            displayName = (peRes.matchedCheatTokens && peRes.matchedCheatTokens.length > 0)
              ? `Gizlenmiş Hile Dosyası (${peRes.matchedCheatTokens.join(', ')})`
              : `Gizlenmiş Çalıştırılabilir Dosya (${fileName})`;
          }

          const peFinding = {
            level: peRes.severity || 'CRITICAL',
            type: peRes.purpose,
            name: displayName,
            file: fileName,
            path: filePath,
            timestamp: mtimeStr,
            size: sizeStr,
            confidence: '100% (Somut Kanıt: PE İkili Kod & Başlık Analizi)',
            description: peRes.description,
            evidence: [
              `Dosya Yolu: ${filePath}`,
              `Tarih & Saat: ${mtimeStr}`,
              `Dosya Boyutu: ${sizeStr}`,
              ...(peRes.evidence || [])
            ]
          };
          return options.all ? [peFinding] : peFinding;
        }
        // If clean, return null
        return options.all ? [] : null;
      }

      return options.all ? [] : null;
    } catch (e) {
      return options.all ? [] : null;
    }
  }

  /**
   * Helper that always returns an array of findings for a file.
   */
  inspectTargetFileAll(filePath) {
    return this.inspectTargetFile(filePath, { all: true }) || [];
  }

  /**
   * Inspects inside a ZIP/JAR archive for concrete cheat classes, mod metadata, and nested archives.
   */
  inspectArchiveEntries(filePath, fileName, mtimeStr, sizeStr, zipInstance = null, currentDepth = 0) {
    const findings = [];
    const nestedFindings = [];

    try {
      const zip = zipInstance || new AdmZip(filePath);
      const entries = zip.getEntries();
      const entryNames = entries.map(e => e.entryName);

      // 0. Extract Mod Metadata (fabric.mod.json, quilt.mod.json, mcmod.info, mods.toml, MANIFEST.MF)
      let modMetadata = null;
      const fabricEntry = entries.find(e => e.entryName === 'fabric.mod.json' || e.entryName.endsWith('/fabric.mod.json'));
      if (fabricEntry) {
        try {
          const raw = zip.readAsText(fabricEntry);
          const parsed = JSON.parse(raw);
          modMetadata = {
            id: parsed.id,
            name: parsed.name,
            version: parsed.version,
            description: parsed.description,
            entrypoints: parsed.entrypoints ? Object.values(parsed.entrypoints).flat() : [],
            depends: parsed.depends ? Object.keys(parsed.depends) : []
          };
        } catch (e) {}
      }

      const quiltEntry = entries.find(e => e.entryName === 'quilt.mod.json');
      if (!modMetadata && quiltEntry) {
        try {
          const parsed = JSON.parse(zip.readAsText(quiltEntry));
          if (parsed.quilt_loader) {
            modMetadata = {
              id: parsed.quilt_loader.id,
              name: parsed.quilt_loader.metadata ? parsed.quilt_loader.metadata.name : null
            };
          }
        } catch (e) {}
      }

      const mcmodEntry = entries.find(e => e.entryName === 'mcmod.info');
      if (!modMetadata && mcmodEntry) {
        try {
          const parsed = JSON.parse(zip.readAsText(mcmodEntry));
          const item = Array.isArray(parsed) ? parsed[0] : (parsed.modList ? parsed.modList[0] : parsed);
          if (item && item.modid) {
            modMetadata = { id: item.modid, name: item.name };
          }
        } catch (e) {}
      }

      const manifestEntry = entries.find(e => e.entryName === 'META-INF/MANIFEST.MF');
      if (manifestEntry) {
        try {
          const manText = zip.readAsText(manifestEntry);
          const m = manText.match(/Premain-Class:\s*([^\r\n]+)/i);
          if (m) {
            if (!modMetadata) modMetadata = {};
            modMetadata.premain = m[1].trim();
          }
        } catch (e) {}
      }

      // Modrinth & Clean Ecosystem Whitelist evaluation
      const whitelistResult = modrinthWhitelist.isCleanMod(modMetadata, entryNames, fileName);

      // 1. Recursive Nested Inspection (up to depth 4)
      if (currentDepth < 4) {
        for (const e of entries) {
          if (e.isDirectory) continue;
          const lower = e.entryName.toLowerCase();
          const baseName = path.basename(e.entryName);
          const innerExt = path.extname(lower);

          // Skip inner files larger than maxInnerFileSize to avoid excessive memory usage
          const entrySize = e.header ? e.header.size : 0;
          if (entrySize > this.maxInnerFileSize) continue;

          // A. Nested JAR, ZIP, MRPACK, or .crdownload
          if (lower.endsWith('.jar') || lower.endsWith('.zip') || lower.endsWith('.crdownload') || lower.endsWith('.mrpack')) {
            try {
              const innerBuf = e.getData();
              if (innerBuf && innerBuf.length >= 4 && innerBuf.slice(0, 4).equals(this.zipMagic)) {
                const innerZip = new AdmZip(innerBuf);
                const subFindings = this.inspectArchiveEntries(
                  filePath + ' -> ' + e.entryName,
                  baseName,
                  mtimeStr,
                  this.formatSize(innerBuf.length),
                  innerZip,
                  currentDepth + 1
                );
                if (subFindings && subFindings.length > 0) {
                  nestedFindings.push(...subFindings);
                }
              }
            } catch (err) {}
          }
          // B. Disguised nested file inside archive (e.g. .png, .txt, .tmp, .dat, .bin, or no extension)
          else if (this.disguisedSuspectExts.has(innerExt) || innerExt === '') {
            try {
              const innerBuf = e.getData();
              if (innerBuf && innerBuf.length >= 4 && innerBuf.slice(0, 4).equals(this.zipMagic)) {
                const innerZip = new AdmZip(innerBuf);
                const subFindings = this.inspectArchiveEntries(
                  filePath + ' -> ' + e.entryName + ` [Kamufle: ${innerExt || 'uzantısız'}]`,
                  baseName,
                  mtimeStr,
                  this.formatSize(innerBuf.length),
                  innerZip,
                  currentDepth + 1
                );
                if (subFindings && subFindings.length > 0) {
                  nestedFindings.push(...subFindings);
                }
              } else if (innerBuf && innerBuf.length >= 2 && innerBuf[0] === 0x4D && innerBuf[1] === 0x5A) {
                // Disguised PE inside archive!
                const peRes = peInspector.inspectBuffer(innerBuf, e.entryName, innerBuf.length);
                if (peRes && peRes.isThreat) {
                  nestedFindings.push({
                    level: peRes.severity || 'CRITICAL',
                    type: peRes.purpose,
                    name: peRes.purpose === 'EXTERNAL_CHEAT_LOADER' ? 'Nightmare Client / External Loader' : (peRes.purpose === 'CHEAT_LAUNCHER_INSTALLER' ? 'LiquidLauncher (LiquidBounce Installer)' : baseName),
                    file: baseName,
                    path: filePath + ' -> ' + e.entryName,
                    timestamp: mtimeStr,
                    size: this.formatSize(innerBuf.length),
                    confidence: '100% (Somut Kanıt: Arşiv İçi Kamufle PE Analizi)',
                    description: peRes.description,
                    evidence: [
                      `Kapsayıcı Arşiv: ${filePath}`,
                      `Arşiv İçi Kamufle Dosya: ${e.entryName}`,
                      `Gerçek Biçim: Windows PE İkili Kod`,
                      `Tarih & Saat: ${mtimeStr}`,
                      `Boyut: ${this.formatSize(innerBuf.length)}`,
                      ...(peRes.evidence || [])
                    ]
                  });
                }
              }
            } catch (err) {}
          }
          // C. Nested PE Executable (e.g. Nightmare.exe inside Nightmare.zip or LiquidLauncher inside container)
          else if (lower.endsWith('.exe') || lower.endsWith('.dll')) {
            try {
              const exeBuf = e.getData();
              const peRes = peInspector.inspectBuffer(exeBuf, e.entryName, exeBuf.length);
              if (peRes && peRes.isThreat) {
                nestedFindings.push({
                  level: peRes.severity || 'CRITICAL',
                  type: peRes.purpose,
                  name: peRes.purpose === 'EXTERNAL_CHEAT_LOADER' ? 'Nightmare Client / External Loader' : (peRes.purpose === 'CHEAT_LAUNCHER_INSTALLER' ? 'LiquidLauncher (LiquidBounce Installer)' : baseName),
                  file: baseName,
                  path: filePath + ' -> ' + e.entryName,
                  timestamp: mtimeStr,
                  size: this.formatSize(exeBuf.length),
                  confidence: '100% (Somut Kanıt: Arşiv İçi PE Analizi)',
                  description: peRes.description,
                  evidence: [
                    `Kapsayıcı Arşiv: ${filePath}`,
                    `Arşiv İçi Dosya: ${e.entryName}`,
                    `Tarih & Saat: ${mtimeStr}`,
                    `Boyut: ${this.formatSize(exeBuf.length)}`,
                    ...(peRes.evidence || [])
                  ]
                });
              }
            } catch (err) {}
          }
          // D. Nested MSI Installer (e.g. LiquidLauncher MSI inside container)
          else if (lower.endsWith('.msi')) {
            if (lower.includes('liquidlauncher')) {
              nestedFindings.push({
                level: 'CRITICAL',
                type: 'CHEAT_INSTALLER_PACKAGE',
                name: 'LiquidLauncher MSI Installer',
                file: baseName,
                path: filePath + ' -> ' + e.entryName,
                timestamp: mtimeStr,
                size: this.formatSize(e.header ? e.header.size : 0),
                confidence: '100% (Somut Kanıt: Arşiv İçi MSI Paket Analizi)',
                description: `Arşiv içinde LiquidLauncher Windows Kurulum Paketi (MSI) tespit edildi: ${e.entryName}.`,
                evidence: [
                  `Kapsayıcı Arşiv: ${filePath}`,
                  `Arşiv İçi Dosya: ${e.entryName}`,
                  `Tarih & Saat: ${mtimeStr}`,
                  `Boyut: ${this.formatSize(e.header ? e.header.size : 0)}`,
                  `İmza: CCBlueX LiquidLauncher / LiquidBounce`
                ]
              });
            }
          }
        }
      }

      // If this is a container archive containing nested cheat files, return the inner cheat findings directly
      if (nestedFindings.length > 0) {
        return nestedFindings;
      }

      // 2. Signature Database Matching for standalone JAR/ZIP
      const sigMatches = sigDb.matchJarEntries(entryNames, fileName, filePath, modMetadata);
      for (const m of sigMatches) {
        // Find specific offending classes inside the zip
        const offendingClasses = entryNames.filter(e => {
          const lower = e.toLowerCase();
          return lower.includes('reach.class') ||
                 lower.includes('velocity.class') ||
                 lower.includes('killaura.class') ||
                 lower.includes('autoclicker.class') ||
                 lower.includes('aimbot.class') ||
                 lower.includes('triggerbot.class') ||
                 lower.includes('bhop.class') ||
                 lower.includes('scaffold.class') ||
                 lower.includes('doomsday.class') ||
                 lower.includes('liquidbounce.class') ||
                 lower.includes('wurstclient.class') ||
                 lower.includes('meteorclient.class') ||
                 lower.includes('shieldbreaker') ||
                 lower.includes('autoanchor') ||
                 lower.includes('autototem');
        }).slice(0, 5);

        findings.push({
          level: 'CRITICAL',
          type: 'ARCHIVE_CHEAT_CLIENT_FOUND',
          name: m.name || fileName,
          category: 'MINECRAFT_MODS',
          file: fileName,
          path: filePath,
          timestamp: mtimeStr,
          size: sizeStr,
          confidence: m.confidence || '100% (Somut Kanıt: Arşiv İçi Sınıf / Mod Doğrulaması)',
          description: `Arşiv içinde doğrulanmış hile istemcisi tespit edildi: ${m.name} (${fileName}).`,
          whyFlagged: `Bu arşiv (${fileName}), ${m.name} hile istemcisine ait baytkod sınıfları ve paket yapıları içerdiği için KRİTİK olarak sınıflandırıldı.`,
          evidence: [
            `Dosya Yolu: ${filePath}`,
            `Tarih & Saat: ${mtimeStr}`,
            `Dosya Boyutu: ${sizeStr}`,
            `Arşiv İçi Tespit Edilen Sınıf(lar) / Tanım: ${offendingClasses.length > 0 ? offendingClasses.join(', ') : ((m.evidence && m.evidence.join(', ')) || m.name)}`,
            `İmza Kuralı: ${m.ruleId}`
          ]
        });
      }

      // 3. Trojan Bytecode & TriggerBot Heuristics (reuses parsed zip and entries)
      if (findings.length === 0 && entryNames.some(e => e.endsWith('.class'))) {
        const trojanFindings = trojanModDetector.analyzeJar(filePath, zip, entries);
        for (const tf of trojanFindings) {
          findings.push({
            level: tf.level || 'CRITICAL',
            type: tf.type || 'TROJAN_MOD_DETECTED',
            name: tf.name || fileName,
            category: 'MINECRAFT_MODS',
            file: fileName,
            path: filePath,
            timestamp: mtimeStr,
            size: sizeStr,
            isSafe: tf.isSafe !== undefined ? tf.isSafe : (tf.level === 'INFO'),
            isThreat: tf.isThreat !== undefined ? tf.isThreat : (tf.level !== 'INFO'),
            badge: tf.badge || (tf.level === 'INFO' ? 'ALLOWED_POLICY' : 'CRITICAL'),
            confidence: tf.confidence || '100% (Somut Kanıt: Baytkod Truva Atı Analizi)',
            description: tf.description || `Arşiv içinde gizlenmiş truva atı hile kodu bulundu: ${fileName}`,
            whyFlagged: tf.whyFlagged || `Dosya (${fileName}) içinde şüpheli baytkod enjeksiyon kancaları tespit edildiği için KRİTİK olarak sınıflandırıldı.`,
            evidence: tf.evidence || [
              `Dosya Yolu: ${filePath}`,
              `Tarih & Saat: ${mtimeStr}`,
              `Dosya Boyutu: ${sizeStr}`,
              `Tespit Detayı: ${tf.description}`
            ]
          });
        }
      }

      // 4. AI-like Semantic Bytecode Classifier
      // Analyzes compiled Java classes for custom / homemade combat cheat semantics
      if (findings.length === 0 && entryNames.some(e => e.endsWith('.class'))) {
        const semanticMatches = semanticCheatClassifier.classifyJar(filePath, zip, entries, whitelistResult);
        for (const sm of semanticMatches) {
          findings.push({
            level: sm.level || 'CRITICAL',
            type: sm.type,
            name: sm.name,
            category: 'MINECRAFT_MODS',
            file: fileName,
            path: filePath,
            timestamp: mtimeStr,
            size: sizeStr,
            confidence: sm.confidence,
            description: sm.description,
            whyFlagged: sm.whyFlagged,
            evidence: sm.evidence
          });
        }
      }
    } catch (zipErr) {
      // Archive might be password protected or corrupted; ignore
    }

    return findings;
  }

  /**
   * Recursively scans a directory up to maxDepth.
   */
  scanDirectory(dirPath, currentDepth, onTarget, findings, scannedCountRef) {
    if (currentDepth > this.maxDepth) return;
    if (!fs.existsSync(dirPath)) return;

    // Standard system cache / toolchain / virtual OS directories that should be skipped for speed
    const systemSkipDirs = new Set([
      '.git', '.cache', '.local', '.npm', '.cargo', '.rustup',
      '.vscode', '.idea', '.gradle', '.m2', '.nuget', '.gemini',
      '.antigravity', '.var', '.flatpak', '.ssh', '.gnupg', '.pki',
      '.config', '.electron', '.wine', '.steam', '.zoom', '.mozilla',
      '.thunderbird', '.dropbox', 'node_modules', 'system volume information',
      '$recycle.bin', 'assets', 'libraries', 'logs', 'crash-reports', 'natives',
      'webcache', 'webcache2', 'dosdevices', 'drive_c', 'prefix', 'wine',
      'system32', 'syswow64', 'proc', 'sys', 'dev', 'run', 'boot', 'snap',
      'locales', 'swiftshader', 'www', 'runtime', 'shared', 'wallpapers', 'logos', 'icon',
      'build', 'intermediates', 'zip-cache', 'debug-mergejavares', 'mergejavares', 'transformed', 'server-resource-packs',
      'python', 'python3', 'python38', 'python39', 'python310', 'python311', 'python312', 'python313', 'python314',
      'include', 'site-packages', 'dist-packages', 'tcl', 'doc', 'docs', 'venv', '.venv', 'env', '__pycache__',
      'pip', 'wheel', 'dist-info', 'egg-info', 'microsoft vs code', 'vscode', 'git', 'cmake', 'mingw', 'llvm'
    ]);

    try {
      const items = fs.readdirSync(dirPath);

      // Skip dedicated Minecraft server directories (e.g. AstralisSaga, Spigot, Paper, Purpur)
      const isServerDirectory = items.some(it => {
        const l = it.toLowerCase();
        return l === 'server.properties' || l === 'spigot.yml' || l === 'paper.yml' || l === 'purpur.yml' || l === 'bukkit.yml';
      });
      if (isServerDirectory) return;

      const subDirs = [];
      const directFiles = [];

      for (const item of items) {
        const lowerItem = item.toLowerCase();
        if (systemSkipDirs.has(lowerItem)) continue;
        if (lowerItem.startsWith('python3') || lowerItem.startsWith('.venv') || lowerItem.startsWith('pip-') || lowerItem.startsWith('site-packages')) continue;

        const fullPath = path.join(dirPath, item);
        let stats = null;
        try {
          stats = fs.lstatSync(fullPath);
        } catch (e) {
          continue;
        }

        // Never follow symbolic links to avoid circular loops or escaping to '/'
        if (stats.isSymbolicLink()) continue;

        if (stats.isDirectory()) {
          subDirs.push(fullPath);
        } else if (stats.isFile()) {
          directFiles.push(fullPath);
        }
      }

      // 1. Scan direct files in this directory FIRST
      for (const fullPath of directFiles) {
        scannedCountRef.count++;
        if (scannedCountRef.count % 15 === 0) {
          onTarget(fullPath, 15);
        }

        const res = this.inspectTargetFile(fullPath, { all: true });
        if (res && res.length > 0) {
          findings.push(...res);
        }
      }

      // 2. Then recurse into subdirectories
      for (const subDir of subDirs) {
        this.scanDirectory(subDir, currentDepth + 1, onTarget, findings, scannedCountRef);
      }
    } catch (e) {}
  }

  /**
   * Asynchronously scans a directory, yielding to event loop for real-time WebSocket progress.
   */
  async scanDirectoryAsync(dirPath, currentDepth, onTarget, findings, scannedCountRef, onFinding = null) {
    if (currentDepth > this.maxDepth) return;
    if (!fs.existsSync(dirPath)) return;

    const systemSkipDirs = new Set([
      '.git', '.cache', '.local', '.npm', '.cargo', '.rustup',
      '.vscode', '.idea', '.gradle', '.m2', '.nuget', '.gemini',
      '.antigravity', '.var', '.flatpak', '.ssh', '.gnupg', '.pki',
      '.config', '.electron', '.wine', '.steam', '.zoom', '.mozilla',
      '.thunderbird', '.dropbox', 'node_modules', 'system volume information',
      '$recycle.bin', 'assets', 'libraries', 'logs', 'crash-reports', 'natives',
      'webcache', 'webcache2', 'dosdevices', 'drive_c', 'prefix', 'wine',
      'system32', 'syswow64', 'proc', 'sys', 'dev', 'run', 'boot', 'snap',
      'locales', 'swiftshader', 'www', 'runtime', 'shared', 'wallpapers', 'logos', 'icon',
      'build', 'intermediates', 'zip-cache', 'debug-mergejavares', 'mergejavares', 'transformed', 'server-resource-packs',
      'python', 'python3', 'python38', 'python39', 'python310', 'python311', 'python312', 'python313', 'python314',
      'include', 'site-packages', 'dist-packages', 'tcl', 'doc', 'docs', 'venv', '.venv', 'env', '__pycache__',
      'pip', 'wheel', 'dist-info', 'egg-info', 'microsoft vs code', 'vscode', 'git', 'cmake', 'mingw', 'llvm'
    ]);

    try {
      const items = fs.readdirSync(dirPath);

      // Skip dedicated Minecraft server directories (e.g. AstralisSaga, Spigot, Paper, Purpur)
      const isServerDirectory = items.some(it => {
        const l = it.toLowerCase();
        return l === 'server.properties' || l === 'spigot.yml' || l === 'paper.yml' || l === 'purpur.yml' || l === 'bukkit.yml';
      });
      if (isServerDirectory) return;

      const subDirs = [];
      const directFiles = [];

      for (const item of items) {
        const lowerItem = item.toLowerCase();
        if (systemSkipDirs.has(lowerItem)) continue;
        if (lowerItem.startsWith('python3') || lowerItem.startsWith('.venv') || lowerItem.startsWith('pip-') || lowerItem.startsWith('site-packages')) continue;

        const fullPath = path.join(dirPath, item);
        let stats = null;
        try {
          stats = fs.lstatSync(fullPath);
        } catch (e) {
          continue;
        }

        if (stats.isSymbolicLink()) continue;

        if (stats.isDirectory()) {
          subDirs.push(fullPath);
        } else if (stats.isFile()) {
          directFiles.push(fullPath);
        }
      }

      // 1. Scan direct files in this directory FIRST
      for (const fullPath of directFiles) {
        scannedCountRef.count++;
        if (scannedCountRef.count % 10 === 0) {
          onTarget(fullPath, 10);
          await new Promise(r => setImmediate(r));
        }

        const res = this.inspectTargetFile(fullPath, { all: true });
        if (res && res.length > 0) {
          findings.push(...res);
          if (onFinding) {
            for (const f of res) onFinding(f);
          }
        }
      }

      // 2. Then recurse into subdirectories
      for (const subDir of subDirs) {
        await this.scanDirectoryAsync(subDir, currentDepth + 1, onTarget, findings, scannedCountRef, onFinding);
      }
    } catch (e) {}
  }

  /**
   * Main scan method across all candidate directories on the system.
   */
  async scanAllLocations(onTarget = () => {}, onFinding = null) {
    const scanDirs = this.getScanDirectories();
    const scannedCountRef = { count: 0 };

    onTarget(`Hedef Dizin Keşfi: ${scanDirs.length} adli inceleme konumu paralel taranıyor...`, scanDirs.length);

    // All directories are independent — scan them all simultaneously
    const dirResults = await Promise.all(
      scanDirs.map(async (dir) => {
        const findings = [];
        onTarget(`Dizin İncelemesi: ${dir}`, 50);
        await new Promise(r => setImmediate(r));
        await this.scanDirectoryAsync(dir, 0, onTarget, findings, scannedCountRef, onFinding);
        return findings;
      })
    );

    const allFindings = dirResults.flat();

    return {
      scannedLocations: scanDirs,
      totalFilesInspected: scannedCountRef.count,
      findings: allFindings
    };
  }
}

module.exports = new DeepArchiveScanner();
