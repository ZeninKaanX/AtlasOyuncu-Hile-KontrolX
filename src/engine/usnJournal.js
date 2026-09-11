/**
 * Atlas AC - Filesystem Deletion & Change Journal Forensic Engine
 * Windows: Parses NTFS USN Change Journal ($UsnJrnl:$J) and $Recycle.Bin.
 * Linux: Parses Trash (~/.local/share/Trash), unlinked open process handles (/proc/PID/fd/),
 * and shell deletion histories to catch self-destructed jars and clickers with exact timestamps.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sigDb = require('./signatureDb');
const serverPolicy = require('../config/serverPolicy');

class UsnJournalEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans filesystem deletion journals across Windows or Linux.
   */
  async scanDrive(driveLetter = 'C:', onTarget = () => {}) {
    if (this.isWindows) {
      return this.scanWindowsUSN(driveLetter, onTarget);
    } else {
      return this.scanLinuxDeletions(onTarget);
    }
  }

  /**
   * Formats Date to YYYY-MM-DD HH:mm:ss
   */
  formatTimestamp(date) {
    if (!date) return new Date().toISOString().replace('T', ' ').slice(0, 19);
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return String(date);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    } catch (e) {
      return String(date);
    }
  }

  /**
   * Windows NTFS USN Change Journal, Deletion Carving & Wiping Forensics
   */
  async scanWindowsUSN(driveLetter = 'C:', onTarget = () => {}) {
    const findings = [];
    const rawEvents = [];
    onTarget(`NTFS USN Change Journal (${driveLetter}\\$Extend\\$UsnJrnl)`, 20);

    try {
      // 1. Verify USN Journal existence and state
      const checkCmd = `fsutil usn queryjournal ${driveLetter}`;
      const { stdout: queryOut } = await execPromise(checkCmd, { windowsHide: true, timeout: 5000 }).catch(() => ({ stdout: '' }));

      if (!queryOut || queryOut.toLowerCase().includes('error')) {
        findings.push({
          level: 'CRITICAL',
          type: 'USN_JOURNAL_PURGED',
          name: 'NTFS USN Günlüğü Devre Dışı Bırakılmış / Silinmiş (Wiped)',
          path: `${driveLetter}:\\$Extend\\$UsnJrnl`,
          timestamp: this.formatTimestamp(new Date()),
          confidence: '100% (Journal Missing / Deleted)',
          description: `Sürücü ${driveLetter} üzerindeki NTFS USN Değişiklik Günlüğü kapatılmış veya 'fsutil usn deletejournal' ile silinmiştir! Dosya silinme kanıtları karartılmış.`,
          evidence: [
            `Sorgu Komutu: ${checkCmd}`,
            `Çıktı / Hata: ${queryOut.trim() || 'Günlük bulunamadı'}`,
            `Hedef Sürücü: ${driveLetter}`
          ]
        });

        return {
          journalStatus: 'TAMPERED_OR_DISABLED',
          warning: `USN Journal on ${driveLetter} is disabled or deleted! Suspect may have run 'fsutil usn deletejournal'.`,
          findings,
          rawEvents: []
        };
      }

      let journalId = 'Unknown';
      const idMatch = queryOut.match(/(?:Usn Journal ID|Usn Günlük Kimliği|Journal ID)\s*:\s*(0x[0-9a-fA-F]+|[0-9]+)/i);
      if (idMatch) journalId = idMatch[1];

      // 2. Deep Anti-Forensics Analysis: Journal Creation Time vs System Boot & Uptime
      try {
        const bootScript = `powershell -NoProfile -Command "$boot=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime; $uptime=(New-TimeSpan -Start $boot -End (Get-Date)).TotalMinutes; $file=(Get-Item -Force '${driveLetter}\\$Extend\\$UsnJrnl' -ErrorAction SilentlyContinue); $fileTime = if($file){ $file.CreationTime } else { $null }; Write-Output ('BOOT|' + $boot.ToString('yyyy-MM-dd HH:mm:ss') + '|' + [int]$uptime + '|' + (if($fileTime){$fileTime.ToString('yyyy-MM-dd HH:mm:ss')}else{'NONE'}))"`;
        const { stdout: bootOut } = await execPromise(bootScript, { windowsHide: true, timeout: 5000 }).catch(() => ({ stdout: '' }));
        if (bootOut && bootOut.includes('BOOT|')) {
          const parts = bootOut.trim().split('|');
          const bootStr = parts[1] || '';
          const uptimeMin = parseInt(parts[2], 10) || 0;
          const jrnlCreateStr = parts[3] || '';

          // A. Journal Recreated During Session (File creation time > Boot time)
          if (jrnlCreateStr && jrnlCreateStr !== 'NONE') {
            const bootDate = new Date(bootStr);
            const jrnlDate = new Date(jrnlCreateStr);
            // Margin of 60 seconds to prevent clock synchronization jitter
            if (jrnlDate.getTime() - bootDate.getTime() > 60000) {
              findings.push({
                level: 'CRITICAL',
                type: 'USN_JOURNAL_RECREATED_DURING_SESSION',
                name: 'Oturum Sırasında Sıfırlanan USN Günlüğü',
                path: `${driveLetter}:\\$Extend\\$UsnJrnl`,
                timestamp: jrnlCreateStr,
                confidence: '100% (Matematiksel Kanıt: USN Oluşturma Zamanı > Sistem Boot Zamanı)',
                description: `NTFS USN Değişiklik Günlüğü bilgisayar açıkken ve aktif oturum sırasında (${jrnlCreateStr}) silinip yeniden başlatılmıştır! Normal şartlarda USN günlüğü işletim sistemi kurulumuyla oluşur.`,
                evidence: [
                  `Sistem Açılış Zamanı (LastBootUpTime): ${bootStr}`,
                  `USN Günlüğü Oluşturulma Zamanı: ${jrnlCreateStr}`,
                  `Aktif Oturum Süresi: ${uptimeMin} dakika`,
                  `Hedef Sürücü: ${driveLetter}`
                ]
              });
            }
          }

          // B. Anomaly: Uptime > 30 minutes, but Next Usn < 512 KB and Lowest Valid Usn == 0
          const nextUsnMatch = queryOut.match(/(?:Next|Sonraki)\s*Usn\s*:\s*(0x[0-9a-fA-F]+|[0-9]+)/i);
          const lowestMatch = queryOut.match(/(?:Lowest Valid Usn|En Düşük Geçerli Usn|En Dusuk Gecerli Usn)\s*:\s*(0x[0-9a-fA-F]+|[0-9]+)/i);
          if (nextUsnMatch && uptimeMin > 30) {
            try {
              const nextUsnVal = BigInt(nextUsnMatch[1]);
              const lowestVal = lowestMatch ? BigInt(lowestMatch[1]) : 0n;
              if (nextUsnVal < 524288n && lowestVal === 0n) {
                findings.push({
                  level: 'CRITICAL',
                  type: 'USN_JOURNAL_WIPED_ANTI_FORENSICS',
                  name: 'NTFS USN Günlüğü Yakın Zamanda Temizlenmiş (Anti-Forensics)',
                  path: `${driveLetter}:\\$Extend\\$UsnJrnl`,
                  timestamp: this.formatTimestamp(new Date()),
                  confidence: '100% (Somut USN Boyut Tutarsızlığı)',
                  description: `Sistem ${uptimeMin} dakikadır aktif çalışmasına rağmen USN Günlüğünde sadece ${Number(nextUsnVal)} bayt (< 512 KB) kayıt bulunmaktadır. Bu durum kontrol öncesinde 'fsutil usn deletejournal' çalıştırıldığını kanıtlar.`,
                  evidence: [
                    `Sistem Çalışma Süresi (Uptime): ${uptimeMin} dakika`,
                    `Next Usn Değeri: 0x${nextUsnVal.toString(16)} (${Number(nextUsnVal)} bytes)`,
                    `Lowest Valid Usn: 0x${lowestVal.toString(16)}`,
                    `Journal ID: ${journalId}`,
                    `Sürücü: ${driveLetter}`
                  ]
                });
              }
            } catch (e) {}
          }
        }
      } catch (e) {}

      // 3. Check for 'fsutil' or 'deletejournal' in PowerShell Console History
      try {
        const psHistoryPath = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'PowerShell', 'PSReadLine', 'ConsoleHost_history.txt');
        if (fs.existsSync(psHistoryPath)) {
          const psHistory = fs.readFileSync(psHistoryPath, 'utf8');
          const lines = psHistory.split('\n');
          for (const line of lines) {
            if (/fsutil\s+usn\s+deletejournal|deletejournal\s+\/d/i.test(line)) {
              findings.push({
                level: 'CRITICAL',
                type: 'USN_JOURNAL_DELETE_COMMAND_DETECTED',
                name: 'PowerShell USN Silme Komutu (fsutil usn deletejournal)',
                path: psHistoryPath,
                timestamp: this.formatTimestamp(fs.statSync(psHistoryPath).mtime),
                confidence: '100% (Konsol Komut Geçmişi Kaydı)',
                description: `Oyuncunun konsolda doğrudan USN günlüğünü silme komutu çalıştırdığı tespit edildi: ${line.trim()}`,
                evidence: [
                  `Çalıştırılan Komut: ${line.trim()}`,
                  `Komut Dosyası: ${psHistoryPath}`
                ]
              });
              break;
            }
          }
        }
      } catch (e) {}

      // 4. Query Recycle Bin files with exact timestamps and paths
      const recycleBinCmd = `powershell -NoProfile -Command "Get-ChildItem '${driveLetter}:\\$Recycle.Bin' -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Extension -match 'jar|exe|dll|bat|bplus|ps1' } | Select-Object FullName, LastWriteTime, Length"`;
      const { stdout: recycleOut } = await execPromise(recycleBinCmd, { windowsHide: true, timeout: 8000 }).catch(() => ({ stdout: '' }));

      if (recycleOut && recycleOut.trim().length > 0) {
        const lines = recycleOut.split('\n');
        for (const line of lines) {
          const match = line.match(/(.*)\s+(\d{1,2}\/\d{1,2}\/\d{4}.*)/);
          if (match) {
            const filePath = match[1].trim();
            const rawTime = match[2].trim();
            const time = this.formatTimestamp(rawTime);
            const fileName = filePath.split('\\').pop();

            if (/wi-?zoom|w1-?zoom|wurst-?zoom/i.test(fileName)) {
              continue; // Legitimate standalone zoom mod
            }

            const isAc = /autoclicker|murgee|speedclicker|opautoclick/i.test(fileName);
            const isAcAllowed = isAc && serverPolicy.isAutoClickerAllowed();
            if (isAcAllowed) {
              findings.push({
                level: 'INFO',
                name: `Geri Dönüşüm Kutusunda İzinli Araç (${fileName})`,
                type: 'ALLOWED_UTILITY_AUTOCLICKER',
                file: fileName,
                path: filePath,
                timestamp: time,
                isSafe: true,
                isThreat: false,
                badge: 'ALLOWED_POLICY',
                badgeText: 'SUNUCU İZNİ: AUTOCLICKER SERBEST',
                confidence: '100% (Found in Recycle Bin)',
                description: `Geri Dönüşüm Kutusunda silinmiş AutoClicker bulundu, ancak sunucu kuralı gereğince izinlidir: ${fileName}`,
                evidence: [
                  `Dosya Adı: ${fileName}`,
                  `Tam Yol: ${filePath}`,
                  `Silinme Zamanı: ${time}`,
                  `Sunucu Politikası: AutoClicker serbesttir (serverPolicy.allowAutoClickers = true)`
                ]
              });
              continue;
            }

            const usnDetections = sigDb.matchUsnRecord({ fileName, path: filePath, timestamp: time });
            if (usnDetections.length > 0) {
              findings.push(...usnDetections);
            } else if (/raven|vape|drip|slinky|doomsday|meteor|wurst|liquid|catlean|ares|bleach|reach|autoclicker|autototem|shieldbreaker|autoanchor|instantcrystal|auraclient|vacuumhax|mathax|prestige|nightmare|arvion|macro|ghost/i.test(fileName)) {
              findings.push({
                level: 'CRITICAL',
                name: `Geri Dönüşüm Kutusunda Hile (${fileName})`,
                type: 'DELETED_CHEAT_IN_RECYCLE_BIN',
                file: fileName,
                path: filePath,
                timestamp: time,
                confidence: '100% (Found in Recycle Bin)',
                description: `Geri Dönüşüm Kutusunda silinmiş hile tespit edildi (${time}): ${fileName}`,
                evidence: [
                  `Dosya Adı: ${fileName}`,
                  `Tam Yol: ${filePath}`,
                  `Silinme/Değişiklik Zamanı: ${time}`
                ]
              });
            }
          }
        }
      }

      // 5. Read and Parse Recent Records from NTFS USN Change Journal ($UsnJrnl:$J)
      try {
        let startUsnParam = '';
        const nextUsnMatch = queryOut.match(/(?:Next|Sonraki)\s*Usn\s*:\s*(0x[0-9a-fA-F]+|[0-9]+)/i);
        if (nextUsnMatch) {
          try {
            const nextUsnVal = BigInt(nextUsnMatch[1]);
            // Read last ~64 MB of journal records for deep inspection
            const offset = BigInt(64 * 1024 * 1024);
            const startUsn = nextUsnVal > offset ? nextUsnVal - offset : 0n;
            startUsnParam = `startusn=0x${startUsn.toString(16)} `;
          } catch (e) {}
        }

        const readCmd = `fsutil usn readjournal ${driveLetter} ${startUsnParam}csv | findstr /i /r "\\.jar \\.exe \\.dll \\.bat \\.cmd \\.ps1 \\.bplus \\.zip"`;
        const { stdout: journalCsv } = await execPromise(readCmd, {
          maxBuffer: 30 * 1024 * 1024,
          timeout: 20000,
          windowsHide: true
        }).catch(err => ({ stdout: (err && err.stdout) ? err.stdout : '' }));

        if (journalCsv && journalCsv.length > 0) {
          const lines = journalCsv.split('\n');
          for (const line of lines) {
            const parsed = this.parseUsnCsvLine(line);
            if (!parsed) continue;

            const { usn, fileName, reason, timestamp } = parsed;
            if (!fileName) continue;
            if (/wi-?zoom|w1-?zoom|wurst-?zoom/i.test(fileName)) {
              continue; // Legitimate standalone zoom mod
            }

            const reasonHex = parseInt(reason, 16);
            const isDelete = (!isNaN(reasonHex) && (reasonHex & 0x00000200) !== 0) ||
                             /File delete|Sil|0x[0-9a-f]*2[0-9a-f]{2}|0x00000200/i.test(reason);
            const isRename = (!isNaN(reasonHex) && ((reasonHex & 0x00002000) !== 0 || (reasonHex & 0x00004000) !== 0)) ||
                             /Rename|Yeniden adlandır|0x00002000|0x00004000/i.test(reason);

            if (isDelete || isRename) {
              const isAutoClicker = /autoclicker|murgee|speedclicker|opautoclick/i.test(fileName);
              const isAllowedAc = isAutoClicker && serverPolicy.isAutoClickerAllowed();

              if (isAllowedAc) {
                findings.push({
                  level: 'INFO',
                  type: 'ALLOWED_UTILITY_AUTOCLICKER',
                  name: isDelete ? `Silinmiş İzinli Araç USN Kaydı (${fileName})` : `USN İzinli Araç Kaydı (${fileName})`,
                  file: fileName,
                  path: `${driveLetter}\\...\\${fileName}`,
                  timestamp: timestamp,
                  confidence: '100% (Somut Kanıt: NTFS USN Journal Kaydı)',
                  isSafe: true,
                  isThreat: false,
                  badge: 'ALLOWED_POLICY',
                  badgeText: 'SUNUCU İZNİ: AUTOCLICKER SERBEST',
                  description: `NTFS USN Günlüğünde AutoClicker kaydı tespit edildi, ancak sunucu politikası gereğince serbest bırakılmıştır: ${fileName} (${reason})`,
                  evidence: [
                    `Dosya Adı: ${fileName}`,
                    `USN Numarası: ${usn}`,
                    `İşlem Nedeni: ${reason}`,
                    `İşlem Zamanı: ${timestamp}`,
                    `Sunucu Politikası: AutoClicker serbesttir (serverPolicy.allowAutoClickers = true)`
                  ]
                });
                continue;
              }

              const matched = sigDb.matchUsnRecord({ fileName, path: fileName, timestamp });
              if (matched.length > 0) {
                for (const m of matched) {
                  findings.push({
                    ...m,
                    level: 'CRITICAL',
                    type: isDelete ? 'USN_JOURNAL_DELETED_CHEAT' : 'USN_JOURNAL_RENAMED_CHEAT',
                    name: isDelete ? `Silinmiş Hile USN Kaydı (${fileName})` : `Adı Değiştirilmiş Hile USN Kaydı (${fileName})`,
                    confidence: '100% (Somut Kanıt: NTFS USN Journal Kaydı)',
                    evidence: [
                      `Dosya Adı: ${fileName}`,
                      `USN Numarası: ${usn}`,
                      `İşlem Nedeni: ${reason}`,
                      `İşlem Zamanı: ${timestamp}`,
                      `Sürücü: ${driveLetter}`
                    ]
                  });
                }
              } else if (/\.(jar|exe|dll|bat|cmd|ps1|bplus)$/i.test(fileName) && /vape|drip|slinky|doomsday|raven|kura|meteor|wurst|liquid|catlean|ares|bleach|reach|autoclicker|autototem|shieldbreaker|autoanchor|instantcrystal|auraclient|vacuumhax|mathax|prestige|nightmare|arvion|totem.*replac|macro|ghost|velocity|hitbox|bplus|inject|bypass|cleaner|manthe|murgee|speedclicker/i.test(fileName)) {
                findings.push({
                  level: 'CRITICAL',
                  name: isDelete ? `Silinmiş Hile USN Kaydı (${fileName})` : `Adı Değiştirilmiş Hile USN Kaydı (${fileName})`,
                  type: isDelete ? 'USN_JOURNAL_DELETED_CHEAT' : 'USN_JOURNAL_RENAMED_CHEAT',
                  file: fileName,
                  path: `${driveLetter}\\...\\${fileName}`,
                  timestamp: timestamp,
                  confidence: '100% (Somut Kanıt: NTFS USN Journal Kaydı)',
                  description: `NTFS USN Değişiklik Günlüğünde silinmiş/değiştirilmiş hile tespit edildi: ${fileName} (${reason})`,
                  evidence: [
                    `Dosya Adı: ${fileName}`,
                    `USN Numarası: ${usn}`,
                    `İşlem Nedeni: ${reason}`,
                    `İşlem Zamanı: ${timestamp}`,
                    `Sürücü: ${driveLetter}`
                  ]
                });
              } else if (isDelete && /\.(bat|cmd|ps1|vbs)$/i.test(fileName) && /(clean|wipe|del|self|destruct|vanish|hide|echo|patch)/i.test(fileName)) {
                findings.push({
                  level: 'HIGH',
                  name: `Silinmiş Kendini İmha Betiği USN Kaydı (${fileName})`,
                  type: 'USN_JOURNAL_DELETED_CHEAT',
                  file: fileName,
                  path: `${driveLetter}\\...\\${fileName}`,
                  timestamp: timestamp,
                  confidence: '95% (NTFS USN Self-Destruct Script Record)',
                  description: `NTFS USN Günlüğünde silinmiş şüpheli temizleyici / kendini imha betiği kaydı tespit edildi: ${fileName}`,
                  evidence: [
                    `Dosya Adı: ${fileName}`,
                    `USN Numarası: ${usn}`,
                    `İşlem Nedeni: ${reason}`,
                    `İşlem Zamanı: ${timestamp}`,
                    `Sürücü: ${driveLetter}`
                  ]
                });
              }
            }
          }
        }
      } catch (e) {}

      return {
        journalStatus: 'ACTIVE',
        journalId: journalId,
        findings: findings,
        rawEvents: rawEvents
      };

    } catch (err) {
      return {
        journalStatus: 'ERROR',
        error: err.message,
        findings: findings,
        rawEvents: []
      };
    }
  }

  /**
   * Helper: Parses a single line from fsutil usn readjournal CSV output
   */
  parseUsnCsvLine(line) {
    if (!line || !line.trim()) return null;
    const parts = line.split(',');
    if (parts.length < 5) return null;
    return {
      usn: parts[0].trim(),
      fileName: parts[1].trim(),
      fileNameLength: parts[2].trim(),
      reason: parts[3].trim(),
      timestamp: parts[4].trim(),
      fileAttributes: parts[5] ? parts[5].trim() : '',
      fileId: parts[6] ? parts[6].trim() : '',
      parentFileId: parts[7] ? parts[7].trim() : ''
    };
  }

  /**
   * Linux Deletion & Trash Forensics Engine
   */
  async scanLinuxDeletions(onTarget = () => {}) {
    const findings = [];
    const home = os.homedir();

    // 1. Scan Linux Trash (~/.local/share/Trash/files/ and /info/)
    const trashFilesDir = path.join(home, '.local', 'share', 'Trash', 'files');
    const trashInfoDir = path.join(home, '.local', 'share', 'Trash', 'info');

    onTarget('Linux Filesystem Deletion Forensics (~/.local/share/Trash)', 5);

    if (fs.existsSync(trashFilesDir)) {
      try {
        const files = fs.readdirSync(trashFilesDir);
        for (const file of files) {
          const fullPath = path.join(trashFilesDir, file);
          onTarget(fullPath, 1);
          const lower = file.toLowerCase();

          // Try reading exact deletion timestamp from .trashinfo
          let deleteTime = null;
          let originalPath = fullPath;
          const infoPath = path.join(trashInfoDir, `${file}.trashinfo`);
          if (fs.existsSync(infoPath)) {
            try {
              const infoContent = fs.readFileSync(infoPath, 'utf8');
              const dateMatch = infoContent.match(/DeletionDate=([^\r\n]+)/);
              if (dateMatch) deleteTime = this.formatTimestamp(dateMatch[1]);
              const pathMatch = infoContent.match(/Path=([^\r\n]+)/);
              if (pathMatch) originalPath = pathMatch[1].trim();
            } catch (e) {}
          }

          if (!deleteTime) {
            try {
              deleteTime = this.formatTimestamp(fs.statSync(fullPath).mtime);
            } catch (e) {
              deleteTime = this.formatTimestamp(new Date());
            }
          }

          if (/wi-?zoom|w1-?zoom|wurst-?zoom/i.test(lower)) {
            continue; // Legitimate standalone zoom mod
          }

          const isAc = /autoclicker|murgee|speedclicker|opautoclick/i.test(lower);
          const isAcAllowed = isAc && serverPolicy.isAutoClickerAllowed();
          if (isAcAllowed) {
            findings.push({
              level: 'INFO',
              name: `Çöp Kutusunda İzinli Araç (${file})`,
              type: 'ALLOWED_UTILITY_AUTOCLICKER',
              file: file,
              path: originalPath,
              timestamp: deleteTime,
              isSafe: true,
              isThreat: false,
              badge: 'ALLOWED_POLICY',
              badgeText: 'SUNUCU İZNİ: AUTOCLICKER SERBEST',
              confidence: '100% (Found in Linux Trash)',
              description: `Çöp kutusunda silinmiş AutoClicker bulundu, ancak sunucu kuralı gereğince izinlidir: ${file}`,
              evidence: [
                `Orijinal Yol: ${originalPath}`,
                `Çöp Deposu: ${fullPath}`,
                `Silinme Zamanı: ${deleteTime}`,
                `Sunucu Politikası: AutoClicker serbesttir`
              ]
            });
            continue;
          }

          const matched = sigDb.matchUsnRecord({ fileName: file, path: originalPath, timestamp: deleteTime });
          if (matched.length > 0) {
            findings.push(...matched);
          } else if (/raven|vape|drip|slinky|doomsday|meteor|wurst|liquid|catlean|ares|bleach|reach|autoclicker|autototem|shieldbreaker|autoanchor|instantcrystal|auraclient|vacuumhax|mathax|prestige|nightmare|arvion|macro|ghost/i.test(lower)) {
            findings.push({
              level: 'CRITICAL',
              name: file,
              type: 'DELETED_CHEAT_IN_LINUX_TRASH',
              file: file,
              path: originalPath,
              timestamp: deleteTime,
              confidence: '100% (Found in Linux Trash)',
              description: `Deleted cheat binary identified in system Trash on ${deleteTime}: ${file}`,
              evidence: [
                `Original Path: ${originalPath}`,
                `Trash Storage: ${fullPath}`,
                `Deletion Timestamp: ${deleteTime}`
              ]
            });
          }
        }
      } catch (e) {}
    }

    // 2. Scan /proc/*/fd for unlinked open files (Processes holding deleted cheats in memory)
    try {
      const procDirs = fs.readdirSync('/proc').filter(f => /^\d+$/.test(f));
      for (const pid of procDirs) {
        const fdDir = `/proc/${pid}/fd`;
        if (!fs.existsSync(fdDir)) continue;

        try {
          const fds = fs.readdirSync(fdDir);
          for (const fd of fds) {
            const linkPath = path.join(fdDir, fd);
            try {
              const target = fs.readlinkSync(linkPath);
              if (target.includes('(deleted)') && (target.includes('.jar') || target.includes('.so') || target.includes('.bplus'))) {
                const cleanTarget = target.replace(/\s*\(deleted\)$/, '');
                const fileName = path.basename(cleanTarget);

                let procTime = this.formatTimestamp(new Date());
                try {
                  procTime = this.formatTimestamp(fs.statSync(`/proc/${pid}`).mtime);
                } catch (e) {}

                if (/wi-?zoom|w1-?zoom|wurst-?zoom/i.test(fileName)) {
                  continue; // Legitimate standalone zoom mod
                }

                if (/raven|vape|drip|slinky|doomsday|clicker|meteor|wurst|liquid|catlean|ares|bleach|autototem|shieldbreaker|autoanchor|instantcrystal|auraclient|vacuumhax|mathax|prestige|nightmare|arvion|crosshair/i.test(fileName)) {
                  findings.push({
                    level: 'CRITICAL',
                    type: 'UNLINKED_ACTIVE_MEMORY_FILE',
                    name: 'Deleted Binary Running in Memory',
                    pid: pid,
                    file: fileName,
                    path: cleanTarget,
                    timestamp: procTime,
                    confidence: '100% (Open /proc fd pointing to deleted file)',
                    description: `Cheat file was deleted from disk but is still kept active in process memory by PID ${pid} since ${procTime}: ${cleanTarget}`,
                    evidence: [
                      `Unlinked Path: ${cleanTarget}`,
                      `Holding PID: ${pid}`,
                      `Execution Timestamp: ${procTime}`
                    ]
                  });
                }
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
    } catch (e) {}

    // 3. Scan Shell History for self-destruct deletion commands
    const historyFiles = [
      path.join(home, '.bash_history'),
      path.join(home, '.zsh_history'),
      path.join(home, '.config', 'fish', 'fish_history')
    ];

    for (const hFile of historyFiles) {
      if (fs.existsSync(hFile)) {
        try {
          let fileTime = this.formatTimestamp(fs.statSync(hFile).mtime);
          const content = fs.readFileSync(hFile, 'utf8');
          const lines = content.split('\n');
          for (const line of lines) {
            if (/rm\s+.*(raven|vape|drip|meteor|wurst|liquid|bplus|\.jar)|shred\s+.*(raven|vape|drip|meteor|wurst|liquid|bplus|\.jar)|srm\s+|wipe\s+|journalctl\s+--vacuum/i.test(line)) {
              findings.push({
                level: 'HIGH',
                type: 'SHELL_DELETION_COMMAND',
                name: 'Terminal Kendini İmha / Günlük Silme Komutu',
                command: line.trim(),
                path: hFile,
                timestamp: fileTime,
                confidence: 'High (Shell History Record)',
                description: `Terminal kendini imha / log temizleme komutu tespit edildi (${fileTime}): ${line.trim()}`,
                evidence: [
                  `Komut: ${line.trim()}`,
                  `Geçmiş Dosyası: ${hFile}`,
                  `Dosya Zamanı: ${fileTime}`
                ]
              });
              break;
            }
          }
        } catch (e) {}
      }
    }

    return {
      journalStatus: 'LINUX_FORENSICS_ACTIVE',
      findings: findings,
      rawEvents: []
    };
  }
}

module.exports = new UsnJournalEngine();
