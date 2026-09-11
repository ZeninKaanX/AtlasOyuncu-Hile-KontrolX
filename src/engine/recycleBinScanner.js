/**
 * Atlas AC - Recycle Bin & Trash Forensic Scanner
 * Reconstructs original file paths, deletion timestamps, and file sizes for files sent to Recycle Bin.
 * Windows: Parses C:\$Recycle.Bin\<SID>\$I* metadata headers and corresponding $R* files.
 * Linux: Parses ~/.local/share/Trash/info/*.trashinfo and ~/.local/share/Trash/files/.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const peInspector = require('./peBinaryInspector');
const deepArchiveScanner = require('./deepArchiveScanner');

class RecycleBinScanner {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.unambiguousCheatNames = [
      'raven', 'vape', 'drip', 'slinky', 'liquidbounce', 'wurst',
      'meteor', 'doomsday', 'catlean', 'bleachhack', 'opautoclicker',
      'speedclicker', 'murgee', 'kura', 'whiteout', 'entropy'
    ];
  }

  /**
   * Converts Windows FILETIME (64-bit integer of 100ns intervals since 1601) to Date string.
   */
  fileTimeToDate(low, high) {
    try {
      const fileTime = (BigInt(high) << 32n) + BigInt(low);
      const unixMs = Number((fileTime - 116444736000000000n) / 10000n);
      const d = new Date(unixMs);
      return isNaN(d.getTime()) ? 'Unknown Date' : d.toISOString().replace('T', ' ').slice(0, 19);
    } catch (e) {
      return 'Unknown Date';
    }
  }

  /**
   * Main scan function across Recycle Bin and Trash.
   */
  async scanRecycleBin(onTarget = () => {}) {
    const findings = [];
    onTarget('Recycle Bin: Inspecting deleted file indexes and recovery containers', 10);

    if (this.isWindows) {
      const winFindings = this.scanWindowsRecycleBin(onTarget);
      findings.push(...winFindings);
    } else {
      const linuxFindings = this.scanLinuxTrash(onTarget);
      findings.push(...linuxFindings);
    }

    return {
      status: 'SUCCESS',
      findings: findings
    };
  }

  /**
   * Windows $Recycle.Bin Index ($I) and Data ($R) Parser
   */
  scanWindowsRecycleBin(onTarget) {
    const findings = [];
    const rootDrives = ['C:\\', 'D:\\', 'E:\\'];

    for (const drive of rootDrives) {
      const recyclePath = path.join(drive, '$Recycle.Bin');
      if (!fs.existsSync(recyclePath)) continue;

      try {
        const userSids = fs.readdirSync(recyclePath);
        for (const sid of userSids) {
          const sidDir = path.join(recyclePath, sid);
          let sidStats = null;
          try {
            sidStats = fs.statSync(sidDir);
          } catch (e) { continue; }

          if (!sidStats.isDirectory()) continue;

          try {
            const files = fs.readdirSync(sidDir);
            const indexFiles = files.filter(f => f.startsWith('$I'));

            for (const iFile of indexFiles) {
              const iFilePath = path.join(sidDir, iFile);
              const rFileName = '$R' + iFile.substring(2);
              const rFilePath = path.join(sidDir, rFileName);

              const parsed = this.parseWindowsIndexFile(iFilePath);
              if (!parsed) continue;

              const originalPath = parsed.originalPath;
              const originalName = path.basename(originalPath).toLowerCase();
              const deletionTime = parsed.deletionTimestamp;
              const originalSize = deepArchiveScanner.formatSize(parsed.fileSize);

              // 1. Check if original name matches known cheats
              const isCheatName = this.unambiguousCheatNames.some(cn => originalName.includes(cn));

              // 2. Check content of corresponding $R file if it exists
              let deepEvidence = null;
              let isCheatContent = false;

              if (fs.existsSync(rFilePath)) {
                const innerRes = deepArchiveScanner.inspectTargetFile(rFilePath);
                if (innerRes && (innerRes.level === 'CRITICAL' || innerRes.level === 'HIGH') && innerRes.isThreat !== false) {
                  isCheatContent = true;
                  deepEvidence = innerRes.evidence;
                }
              }

              if (isCheatName || isCheatContent) {
                findings.push({
                  level: 'CRITICAL',
                  type: 'RECYCLE_BIN_DELETED_CHEAT',
                  name: `Geri Dönüşüm Kutusuna Silinen Hile (${originalName})`,
                  file: originalName,
                  path: originalPath,
                  timestamp: deletionTime,
                  size: originalSize,
                  confidence: '100% (Somut Kanıt: $Recycle.Bin İndeks Kaydı)',
                  description: `Geri Dönüşüm Kutusunda silinmiş hile dosyası tespit edildi: ${originalName}. Orijinal konumu: ${originalPath}`,
                  evidence: [
                    `Orijinal Dosya Yolu: ${originalPath}`,
                    `Silinme Zamanı: ${deletionTime}`,
                    `Dosya Boyutu: ${originalSize}`,
                    `Geri Dönüşüm Konumu: ${iFilePath}`,
                    deepEvidence ? `İçerik İncelemesi: ${Array.isArray(deepEvidence) ? deepEvidence.join(' | ') : deepEvidence}` : 'İsim Analizi: Bilinen hile istemcisi ile eşleşti'
                  ]
                });
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    return findings;
  }

  /**
   * Parses a single Windows $I index file (supports Windows 7, 8, 10, 11 versions).
   */
  parseWindowsIndexFile(filePath) {
    try {
      const buf = fs.readFileSync(filePath);
      if (buf.length < 28) return null;

      const version = buf.readBigInt64LE ? Number(buf.readBigInt64LE(0)) : buf.readUInt32LE(0);

      let fileSize = 0;
      let deletionTimestamp = 'Unknown Date';
      let originalPath = '';

      if (version === 2) {
        // Windows 10 & 11 format:
        // 0-7: Header (Version 2)
        // 8-15: File size (Int64)
        // 16-23: FILETIME timestamp
        // 24-27: Path character count
        // 28+: UTF-16LE path string
        fileSize = Number(buf.readBigInt64LE(8));
        const lowTime = buf.readUInt32LE(16);
        const highTime = buf.readUInt32LE(20);
        deletionTimestamp = this.fileTimeToDate(lowTime, highTime);

        const pathChars = buf.readUInt32LE(24);
        const pathBytes = buf.slice(28, 28 + (pathChars * 2));
        originalPath = pathBytes.toString('utf16le').replace(/\0/g, '');
      } else {
        // Windows 7 / 8 / Vista format:
        // 0-7: Header (Version 1)
        // 8-15: File size
        // 16-23: FILETIME timestamp
        // 24-543: Fixed 520-byte UTF-16LE path string
        fileSize = buf.readUInt32LE(8);
        const lowTime = buf.readUInt32LE(16);
        const highTime = buf.readUInt32LE(20);
        deletionTimestamp = this.fileTimeToDate(lowTime, highTime);

        const pathBytes = buf.slice(24, Math.min(buf.length, 544));
        originalPath = pathBytes.toString('utf16le').replace(/\0/g, '');
      }

      if (!originalPath) return null;

      return {
        fileSize,
        deletionTimestamp,
        originalPath
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Linux .local/share/Trash parser (.trashinfo & files)
   */
  scanLinuxTrash(onTarget) {
    const findings = [];
    const trashInfoDir = path.join(os.homedir(), '.local', 'share', 'Trash', 'info');
    const trashFilesDir = path.join(os.homedir(), '.local', 'share', 'Trash', 'files');

    if (!fs.existsSync(trashInfoDir)) return findings;

    try {
      const infos = fs.readdirSync(trashInfoDir);
      for (const info of infos) {
        if (!info.endsWith('.trashinfo')) continue;

        const infoPath = path.join(trashInfoDir, info);
        try {
          const content = fs.readFileSync(infoPath, 'utf8');
          const pathMatch = content.match(/Path=(.*)/);
          const dateMatch = content.match(/DeletionDate=(.*)/);

          if (!pathMatch) continue;

          const originalPath = decodeURIComponent(pathMatch[1].trim());
          const deletionDate = dateMatch ? dateMatch[1].trim().replace('T', ' ') : 'Unknown Date';
          const originalName = path.basename(originalPath).toLowerCase();

          const baseFile = info.replace('.trashinfo', '');
          const inTrashFilePath = path.join(trashFilesDir, baseFile);

          const isCheatName = this.unambiguousCheatNames.some(cn => originalName.includes(cn));
          let isCheatContent = false;
          let deepEvidence = null;

          if (fs.existsSync(inTrashFilePath)) {
            const innerRes = deepArchiveScanner.inspectTargetFile(inTrashFilePath);
            if (innerRes && (innerRes.level === 'CRITICAL' || innerRes.level === 'HIGH') && innerRes.isThreat !== false) {
              isCheatContent = true;
              deepEvidence = innerRes.evidence;
            }
          }

          if (isCheatName || isCheatContent) {
            findings.push({
              level: 'CRITICAL',
              type: 'LINUX_TRASH_DELETED_CHEAT',
              name: `Çöp Kutusuna Silinen Hile (${originalName})`,
              file: originalName,
              path: originalPath,
              timestamp: deletionDate,
              confidence: '100% (Somut Kanıt: Linux .trashinfo Kaydı)',
              description: `Linux Çöp Kutusunda silinmiş hile dosyası tespit edildi: ${originalName}`,
              evidence: [
                `Orijinal Dosya Yolu: ${originalPath}`,
                `Silinme Zamanı: ${deletionDate}`,
                `Çöp Kutusu Kaydı: ${infoPath}`,
                deepEvidence ? `İçerik İncelemesi: ${Array.isArray(deepEvidence) ? deepEvidence.join(' | ') : deepEvidence}` : 'İsim Analizi: Bilinen hile istemcisi ile eşleşti'
              ]
            });
          }
        } catch (e) {}
      }
    } catch (e) {}

    return findings;
  }
}

module.exports = new RecycleBinScanner();
