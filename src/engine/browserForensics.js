/**
 * Atlas AC - Browser Forensic Engine
 * Extracts downloaded cheat files, target file paths, timestamps, and visited cheat sites across:
 * Chrome, Edge, Brave, Opera, Opera GX, and Firefox.
 * Queries SQLite databases safely via temporary snapshots to prevent lock contention.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const sigDb = require('./signatureDb');
const peInspector = require('./peBinaryInspector');
const trojanDetector = require('./trojanModDetector');
const deepArchiveScanner = require('./deepArchiveScanner');

class BrowserForensicsEngine {
  constructor() {
    this.knownCheatDomains = sigDb.getCheatDomains();
    this.tempDir = os.tmpdir();
  }

  /**
   * Discovers all browser history and download databases on the system.
   */
  getBrowserDatabasePaths() {
    const paths = [];
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      const localAppData = process.env.LOCALAPPDATA || '';
      const appData = process.env.APPDATA || '';

      // Chrome
      const chromeUserData = path.join(localAppData, 'Google', 'Chrome', 'User Data');
      if (fs.existsSync(chromeUserData)) {
        this.findHistoryFiles(chromeUserData, 'Google Chrome', paths);
      }

      // Edge
      const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');
      if (fs.existsSync(edgeUserData)) {
        this.findHistoryFiles(edgeUserData, 'Microsoft Edge', paths);
      }

      // Brave
      const braveUserData = path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data');
      if (fs.existsSync(braveUserData)) {
        this.findHistoryFiles(braveUserData, 'Brave', paths);
      }

      // Opera Stable
      const operaStable = path.join(appData, 'Opera Software', 'Opera Stable', 'History');
      if (fs.existsSync(operaStable)) {
        paths.push({ browser: 'Opera', type: 'Chromium', path: operaStable });
      }

      // Opera GX
      const operaGx = path.join(appData, 'Opera Software', 'Opera GX Stable', 'History');
      if (fs.existsSync(operaGx)) {
        paths.push({ browser: 'Opera GX', type: 'Chromium', path: operaGx });
      }

      // Firefox
      const firefoxProfiles = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
      if (fs.existsSync(firefoxProfiles)) {
        try {
          const profiles = fs.readdirSync(firefoxProfiles);
          for (const prof of profiles) {
            const placesDb = path.join(firefoxProfiles, prof, 'places.sqlite');
            if (fs.existsSync(placesDb)) {
              paths.push({ browser: 'Firefox', type: 'Gecko', path: placesDb });
            }
          }
        } catch (e) {}
      }
    } else {
      // Full Linux browser discovery (Native, Flatpak & Snap)
      const home = os.homedir();

      // Chrome (Native & Flatpak)
      const chromeDirs = [
        path.join(home, '.config', 'google-chrome'),
        path.join(home, '.var', 'app', 'com.google.Chrome', 'config', 'google-chrome')
      ];
      for (const cd of chromeDirs) {
        if (fs.existsSync(cd)) this.findHistoryFiles(cd, 'Google Chrome (Linux)', paths);
      }

      // Chromium (Native, Flatpak & Snap)
      const chromiumDirs = [
        path.join(home, '.config', 'chromium'),
        path.join(home, '.var', 'app', 'org.chromium.Chromium', 'config', 'chromium'),
        path.join(home, 'snap', 'chromium', 'common', 'chromium'),
        path.join(home, 'snap', 'chromium', 'current', '.config', 'chromium')
      ];
      for (const cmd of chromiumDirs) {
        if (fs.existsSync(cmd)) this.findHistoryFiles(cmd, 'Chromium (Linux)', paths);
      }

      // Brave (Native, Flatpak & Snap)
      const braveDirs = [
        path.join(home, '.config', 'BraveSoftware', 'Brave-Browser'),
        path.join(home, '.var', 'app', 'com.brave.Browser', 'config', 'BraveSoftware', 'Brave-Browser'),
        path.join(home, 'snap', 'brave', 'current', '.config', 'BraveSoftware', 'Brave-Browser')
      ];
      for (const bd of braveDirs) {
        if (fs.existsSync(bd)) this.findHistoryFiles(bd, 'Brave (Linux)', paths);
      }

      // Edge Linux (Native & Flatpak)
      const edgeDirs = [
        path.join(home, '.config', 'microsoft-edge'),
        path.join(home, '.var', 'app', 'com.microsoft.Edge', 'config', 'microsoft-edge')
      ];
      for (const ed of edgeDirs) {
        if (fs.existsSync(ed)) this.findHistoryFiles(ed, 'Edge (Linux)', paths);
      }

      // Opera Linux (Native & Flatpak)
      const operaPaths = [
        path.join(home, '.config', 'opera', 'History'),
        path.join(home, '.var', 'app', 'com.opera.Opera', 'config', 'opera', 'History'),
        path.join(home, '.config', 'opera-gx', 'History')
      ];
      for (const op of operaPaths) {
        if (fs.existsSync(op)) paths.push({ browser: 'Opera (Linux)', type: 'Chromium', path: op });
      }

      // Vivaldi (Native & Flatpak)
      const vivaldiDirs = [
        path.join(home, '.config', 'vivaldi'),
        path.join(home, '.var', 'app', 'com.vivaldi.Vivaldi', 'config', 'vivaldi')
      ];
      for (const vd of vivaldiDirs) {
        if (fs.existsSync(vd)) this.findHistoryFiles(vd, 'Vivaldi (Linux)', paths);
      }

      // Firefox, LibreWolf, Zen (Native, Flatpak & Snap)
      const ffDirs = [
        path.join(home, '.mozilla', 'firefox'),
        path.join(home, '.var', 'app', 'org.mozilla.firefox', '.mozilla', 'firefox'),
        path.join(home, 'snap', 'firefox', 'common', '.mozilla', 'firefox'),
        path.join(home, '.librewolf'),
        path.join(home, '.waterfox'),
        path.join(home, '.zen'),
        path.join(home, '.var', 'app', 'app.zen_browser.zen', '.zen')
      ];

      for (const ffBase of ffDirs) {
        if (fs.existsSync(ffBase)) {
          try {
            const profiles = fs.readdirSync(ffBase);
            for (const prof of profiles) {
              const placesDb = path.join(ffBase, prof, 'places.sqlite');
              if (fs.existsSync(placesDb)) {
                paths.push({ browser: 'Firefox (Linux)', type: 'Gecko', path: placesDb });
              }
            }
          } catch (e) {}
        }
      }
    }

    return paths;
  }

  findHistoryFiles(baseDir, browserName, results) {
    try {
      const subdirs = fs.readdirSync(baseDir);
      for (const dir of subdirs) {
        if (dir === 'Default' || dir.startsWith('Profile ')) {
          const historyPath = path.join(baseDir, dir, 'History');
          if (fs.existsSync(historyPath)) {
            results.push({ browser: `${browserName} (${dir})`, type: 'Chromium', path: historyPath });
          }
        }
      }
    } catch (e) {}
  }

  /**
  /**
   * Decodes Chromium visit transition bitmask into a clear, forensic visit type.
   */
  decodeChromiumTransition(transition) {
    if (transition === undefined || transition === null) return 'Bilinmiyor (Unknown)';
    const t = Number(transition);
    const core = t & 0xFF;
    let typeStr = '';

    switch (core) {
      case 0:
        typeStr = 'Bağlantıya Tıklandı (LINK)';
        break;
      case 1:
        typeStr = 'Doğrudan Adres Çubuğuna Yazıldı (TYPED)';
        break;
      case 2:
        typeStr = 'Yer İmlerinden Açıldı (BOOKMARK)';
        break;
      case 3:
      case 4:
        typeStr = 'Alt Çerçeve (SUBFRAME)';
        break;
      case 5:
        typeStr = 'Arama Önerisi / Omnibox (GENERATED)';
        break;
      case 6:
        typeStr = 'Başlangıç Sayfası (START_PAGE)';
        break;
      case 7:
        typeStr = 'Form Gönderimi (FORM_SUBMIT)';
        break;
      case 8:
        typeStr = 'Sayfa Yenilendi (RELOAD)';
        break;
      case 9:
      case 10:
        typeStr = 'Anahtar Kelime Araması (KEYWORD)';
        break;
      default:
        typeStr = `Geçiş Kodu ${core}`;
    }

    const qualifiers = [];
    if (t & 0x02000000) qualifiers.push('Adres Çubuğundan (FROM_ADDRESS_BAR)');
    if (t & 0x01000000) qualifiers.push('İleri/Geri Butonu (FORWARD_BACK)');
    if ((t & 0x40000000) || (t & 0x80000000)) qualifiers.push('Yönlendirme (REDIRECT)');

    if (qualifiers.length > 0) {
      return `${typeStr} [${qualifiers.join(', ')}]`;
    }
    return typeStr;
  }

  /**
   * Decodes Firefox visit_type integer into human-readable visit description.
   */
  decodeFirefoxVisitType(visitType) {
    if (visitType === undefined || visitType === null) return 'Bilinmiyor (Unknown)';
    const vt = Number(visitType);
    switch (vt) {
      case 1:
        return 'Bağlantıya Tıklandı (LINK)';
      case 2:
        return 'Doğrudan Adres Çubuğuna Yazıldı (TYPED)';
      case 3:
        return 'Yer İmlerinden Açıldı (BOOKMARK)';
      case 4:
        return 'Gömülü İçerik (EMBED)';
      case 5:
        return 'Kalıcı Yönlendirme (REDIRECT_PERM)';
      case 6:
        return 'Geçici Yönlendirme (REDIRECT_TEMP)';
      case 7:
        return 'Doğrudan Dosya İndirme (DOWNLOAD)';
      case 8:
        return 'Çerçeve İçi (FRAMED)';
      case 9:
        return 'Sayfa Yenilendi (RELOAD)';
      default:
        return `Ziyaret Kodu ${vt}`;
    }
  }

  /**
   * Correlates visited cheat domains with downloaded cheat files.
   * If a user entered a cheat portal and downloaded a cheat, sets BAN VERDICT.
   */
  correlateVisitsAndDownloads(visitedCheats, downloadedCheats, dbBrowser = 'Tarayıcı', dbPath = '') {
    const findings = [];
    const correlatedDlKeys = new Set();

    for (const visit of visitedCheats) {
      // Find matching downloaded cheat
      const matchingDl = downloadedCheats.find(dl => {
        const dlLower = (dl.fileName + ' ' + (dl.url || '') + ' ' + (dl.targetPath || '')).toLowerCase();
        const dlNorm = dlLower.replace(/[-_.\s]/g, '');

        const domainLower = (visit.domain || '').toLowerCase();
        const token = domainLower.replace(/\.(com|net|org|gg|rip|lol|xyz|ac|cc)$/i, '');
        const tokenNorm = token.replace(/[-_.\s]/g, '');
        const rootBrand = tokenNorm.replace(/(client|hack|cheat|mod)$/i, '');

        const matchesToken = dlNorm.includes(tokenNorm);
        const matchesBrand = rootBrand.length >= 4 && dlLower.includes(rootBrand);
        const matchesDomain = dl.url && dl.url.toLowerCase().includes(domainLower);

        return matchesToken || matchesBrand || matchesDomain;
      });

      if (matchingDl) {
        correlatedDlKeys.add(matchingDl.targetPath || matchingDl.fileName);
        findings.push({
          level: 'CRITICAL',
          type: 'BROWSER_CHEAT_VISITED_AND_DOWNLOADED',
          category: 'BROWSER_FORENSICS',
          name: `Hile Sitesi Ziyareti & İndirme: ${visit.domain} (${matchingDl.fileName})`,
          domain: visit.domain,
          file: matchingDl.fileName,
          path: matchingDl.targetPath || dbPath,
          url: visit.url,
          timestamp: matchingDl.timestamp || visit.timestamp,
          browser: dbBrowser,
          visitType: visit.visitType || 'Bilinmiyor',
          whyFlagged: `Tarayıcı geçmişinde hile dağıtım sitesi ziyareti (${visit.domain}) ve ardından (${matchingDl.fileName}) hile dosyasının indirilmesi adli SQLite kayıtlarıyla tespit edilmiştir.`,
          adminAction: 'Yetkili İnceleme Rehberi: Kullanıcının hile sitesini ziyaret ettiği ve dosyayı indirdiği adli kayıtlarla sabittir. Dosyanın diskteki durumunu ve çalıştırma geçmişini (BAM/Prefetch) kontrol ediniz.',
          banVerdict: 'Yetkili İncelemesi (KESİN BAN Değerlendirmesi / İndirme Doğrulandı)',
          confidence: '95% (Somut Kanıt: Ziyaret Türü + İndirme Doğrulandı)',
          description: `Kullanıcı tarayıcıda (${dbBrowser}) ${visit.domain} hile sitesini ziyaret etmiş [${visit.visitType}] ve ardından (${matchingDl.fileName}) hile dosyasını bilgisayarına indirmiş!`,
          evidence: [
            `Ziyaret Türü (Visit Type): ${visit.visitType}`,
            `Ziyaret Edilen URL: ${visit.url}`,
            `Sayfa Başlığı: ${visit.title || 'Bilinmiyor'}`,
            `Ziyaret Tarihi: ${visit.timestamp}`,
            `İndirilen Hile Dosyası: ${matchingDl.fileName}`,
            `İndirilen Dosya Yolu: ${matchingDl.targetPath || matchingDl.fileName}`,
            `İndirme Zamanı: ${matchingDl.timestamp}`,
            ...(matchingDl.url ? [`İndirme Bağlantısı: ${matchingDl.url}`] : []),
            `Adli Durum: Hile sitesi ziyareti ile dosya indirme kaydı eşleşmiştir.`
          ]
        });
      } else {
        const isStreamMatch = visit.visitType && (visit.visitType.includes('Stream') || visit.visitType.includes('Binary'));
        findings.push({
          level: 'INFO',
          severity: 'INFO',
          badge: 'INFO',
          badgeText: 'BİLGİ',
          type: 'BROWSER_CHEAT_DOMAIN_VISITED',
          category: 'BROWSER_FORENSICS',
          name: visit.domain,
          domain: visit.domain,
          path: dbPath,
          url: visit.url,
          timestamp: visit.timestamp,
          browser: dbBrowser,
          visitType: visit.visitType || 'Bilinmiyor',
          whyFlagged: `Tarayıcı geçmişi kayıtlarında bilinen hile/enjeksiyon sağlayıcısı veya kimlik doğrulama sunucusu (${visit.domain}) ziyareti tespit edilmiş olup doğrudan dosya indirmesi teyit edilmemiştir.`,
          adminAction: 'BİLGİ NOTU (CEZA UYGULANMAZ): Yalnızca web sitesi ziyareti tespit edilmiştir. Doğrudan dosya indirmesi veya sistemde hile modülü bulunmadığı sürece yalnızca gezinme sebebiyle ban cezası uygulanmaz.',
          confidence: isStreamMatch ? '85% (Tarayıcı Veritabanında Doğrulandı)' : '95% (Tarayıcı Geçmişi Doğrulandı)',
          description: `Kullanıcı (${dbBrowser}) tarayıcısında bilinen hile dağıtım sitesini ziyaret etmiş [${visit.visitType}]: ${visit.url || visit.domain} (Doğrudan indirme kaydı bulunamadı)`,
          evidence: [
            `Ziyaret Türü (Visit Type): ${visit.visitType}`,
            `Tam URL: ${visit.url}`,
            `Sayfa Başlığı: ${visit.title || 'Bilinmiyor'}`,
            `Ziyaret Tarihi: ${visit.timestamp}`,
            `İndirme Durumu: Bu ziyarette doğrudan dosya indirmesi eşleşmedi`
          ]
        });
      }
    }

    // Add remaining downloads not linked to a specific domain visit
    for (const dl of downloadedCheats) {
      const key = dl.targetPath || dl.fileName;
      if (!correlatedDlKeys.has(key)) {
        const isDiscord = (dl.url || '').includes('cdn.discordapp.com/attachments/');
        findings.push({
          level: 'CRITICAL',
          type: isDiscord ? 'DISCORD_CHEAT_DOWNLOAD' : 'BROWSER_CHEAT_FILE_DOWNLOADED',
          category: 'BROWSER_FORENSICS',
          name: dl.fileName,
          file: dl.fileName,
          path: dl.targetPath || dbPath,
          timestamp: dl.timestamp,
          url: dl.url,
          browser: dbBrowser,
          visitType: dl.visitType || 'Doğrudan Dosya İndirme (DOWNLOAD)',
          whyFlagged: isDiscord
            ? `Discord ek dosyaları (CDN) üzerinden hile/enjeksiyon aracı (${dl.fileName}) indirilmiştir.`
            : `Tarayıcı indirme geçmişinde bilinen hile veya bypass aracı (${dl.fileName}) tespit edilmiştir.`,
          adminAction: 'Yetkili İnceleme Rehberi: İndirilen dosyanın diskteki varlığını ve son çalıştırma zamanını adli loglarla doğrulayınız.',
          confidence: '95% (Somut Kanıt: Doğrulanmış İndirme Kaydı)',
          description: `Tarayıcıda (${dbBrowser}) hile dosyası indirme kaydı tespit edildi: ${dl.fileName}`,
          evidence: [
            `Ziyaret / İndirme Türü: ${dl.visitType || 'Doğrudan Dosya İndirme (DOWNLOAD)'}`,
            `Dosya Yolu: ${dl.targetPath || dl.fileName}`,
            ...(dl.url ? [`İndirme Bağlantısı: ${dl.url}`] : []),
            `Tarih & Saat: ${dl.timestamp}`
          ]
        });
      }
    }

    return findings;
  }

  /**
   * Scans a single browser database with SQLite structured queries,
   * falling back to binary stream analysis if necessary.
   */
  async scanDatabase(dbInfo) {
    const tempCopy = path.join(this.tempDir, `atlas_db_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`);
    const visitedCheats = [];
    const downloadedCheats = [];
    const rawDownloads = [];

    const safeKeywords = [
      'atlas', 'veritex', 'farben', 'evatex-background-video', 'dist.zip',
      'optifine', 'sodium', 'iris', 'fabric-api', 'forge', 'neoforge',
      'xlite', 'claw', 'monarchfarmbot', 'anydesk', 'discord', 'medal',
      'drippyloadingscreen', 'drippy', 'fancymenu'
    ];

    const cheatKeywords = [
      'doomsday', 'vape', 'slinky', 'raven', 'liquidbounce',
      'wurst', 'meteor', 'catlean', 'whiteout', 'kura', 'autoclicker',
      'drip_client', 'dripclient', 'drip.gg', 'drip-lite', 'driplite'
    ];

    try {
      fs.copyFileSync(dbInfo.path, tempCopy);
      const walSource = dbInfo.path + '-wal';
      const shmSource = dbInfo.path + '-shm';
      if (fs.existsSync(walSource)) {
        try { fs.copyFileSync(walSource, tempCopy + '-wal'); } catch (e) {}
      }
      if (fs.existsSync(shmSource)) {
        try { fs.copyFileSync(shmSource, tempCopy + '-shm'); } catch (e) {}
      }

      let dbMtime = 'Unknown';
      try {
        dbMtime = fs.statSync(dbInfo.path).mtime.toISOString().replace('T', ' ').slice(0, 19);
      } catch (e) {}

      let usedSqlite = false;

      // 1. Attempt Structured SQLite Querying
      try {
        if (dbInfo.type === 'Chromium') {
          // A. Query downloads
          const dlQuery = `SELECT target_path, tab_url, datetime(start_time / 1000000 + (strftime('%s', '1601-01-01')), 'unixepoch', 'localtime') AS dt, total_bytes FROM downloads WHERE target_path IS NOT NULL ORDER BY start_time DESC LIMIT 500;`;
          const dlRaw = execSync(`sqlite3 -cmd ".timeout 3000" "${tempCopy}" "${dlQuery}"`, { encoding: 'utf8', timeout: 5000 });
          const dlLines = dlRaw.split('\n').filter(Boolean);

          for (const line of dlLines) {
            const parts = line.split('|');
            const targetPath = (parts[0] || '').trim();
            const tabUrl = (parts[1] || '').trim();
            const timestamp = (parts[2] || dbMtime).trim();
            const dlObj = this.evaluateDownloadItem(targetPath, tabUrl, timestamp, dbInfo.browser);

            if (dlObj) {
              downloadedCheats.push(dlObj);
              rawDownloads.push({ name: dlObj.fileName, browser: dbInfo.browser, path: targetPath, timestamp });
            }
          }

          // B. Query visits with transition (visit type)
          const visitQuery = `SELECT u.url, u.title, datetime(v.visit_time / 1000000 + (strftime('%s', '1601-01-01')), 'unixepoch', 'localtime') AS vt, v.transition FROM urls u JOIN visits v ON u.id = v.url WHERE u.url IS NOT NULL ORDER BY v.visit_time DESC LIMIT 2000;`;
          const visitRaw = execSync(`sqlite3 -cmd ".timeout 3000" "${tempCopy}" "${visitQuery}"`, { encoding: 'utf8', timeout: 5000 });
          const visitLines = visitRaw.split('\n').filter(Boolean);

          for (const line of visitLines) {
            const parts = line.split('|');
            const url = (parts[0] || '').trim();
            const title = (parts[1] || '').trim();
            const timestamp = (parts[2] || dbMtime).trim();
            const transitionRaw = parts[3];
            const visitType = this.decodeChromiumTransition(transitionRaw);

            for (const domain of this.knownCheatDomains) {
              if (url.toLowerCase().includes(domain.toLowerCase())) {
                if (!visitedCheats.some(v => v.url === url && v.timestamp === timestamp)) {
                  visitedCheats.push({ domain, url, title, timestamp, visitType, browser: dbInfo.browser });
                }
                break;
              }
            }
          }

          usedSqlite = true;
        } else if (dbInfo.type === 'Gecko') {
          // A. Query Firefox downloads from moz_annos and moz_historyvisits
          try {
            const ffDlQuery = `SELECT p.url, a.content, datetime(h.visit_date / 1000000, 'unixepoch', 'localtime') AS vt, h.visit_type FROM moz_places p JOIN moz_annos a ON p.id = a.place_id JOIN moz_anno_attributes attr ON a.anno_attribute_id = attr.id LEFT JOIN moz_historyvisits h ON p.id = h.place_id WHERE attr.name = 'downloads/destinationFileURI' ORDER BY a.dateAdded DESC LIMIT 500;`;
            const ffDlRaw = execSync(`sqlite3 -cmd ".timeout 3000" "${tempCopy}" "${ffDlQuery}"`, { encoding: 'utf8', timeout: 5000 });
            const ffDlLines = ffDlRaw.split('\n').filter(Boolean);

            for (const line of ffDlLines) {
              const parts = line.split('|');
              const tabUrl = (parts[0] || '').trim();
              const content = (parts[1] || '').trim();
              const timestamp = (parts[2] || dbMtime).trim();
              const visitTypeRaw = parts[3];
              const visitType = this.decodeFirefoxVisitType(visitTypeRaw || 7);

              const targetPath = decodeURIComponent(content.replace(/^file:\/\//i, ''));
              const fileName = path.basename(targetPath);
              const lowerName = fileName.toLowerCase();

              if (safeKeywords.some(kw => lowerName.includes(kw))) continue;

              const isKnownCheatDomain = this.knownCheatDomains.some(d => tabUrl.toLowerCase().includes(d.toLowerCase()));
              const isCheatFileName = /(?:^|[\\/._-])(vape(?:[-_ ]?v?[0-9]|lite)?|slinky|drip(?:client|-lite|_client)?|doomsday|meteorclient|liquidbounce|wurstclient|wurst|autoclicker|murgee|ravenbplus|novoline)(?:[-_.]|$)/i.test(lowerName);

              let isCheat = isCheatFileName || isKnownCheatDomain;
              if (!isCheat && fs.existsSync(targetPath)) {
                const res = deepArchiveScanner.inspectTargetFile(targetPath);
                if (res && res.level) isCheat = true;
              }

              if (isCheat) {
                const dlObj = {
                  fileName,
                  targetPath,
                  timestamp,
                  url: tabUrl,
                  visitType
                };
                downloadedCheats.push(dlObj);
                rawDownloads.push({ name: fileName, browser: dbInfo.browser, path: targetPath, timestamp });
              }
            }
          } catch (e) {}

          // B. Query Firefox visits with visit_type
          const ffVisitQuery = `SELECT p.url, p.title, datetime(v.visit_date / 1000000, 'unixepoch', 'localtime') AS vt, v.visit_type FROM moz_places p JOIN moz_historyvisits v ON p.id = v.place_id WHERE p.url IS NOT NULL ORDER BY v.visit_date DESC LIMIT 2000;`;
          const ffVisitRaw = execSync(`sqlite3 -cmd ".timeout 3000" "${tempCopy}" "${ffVisitQuery}"`, { encoding: 'utf8', timeout: 5000 });
          const ffVisitLines = ffVisitRaw.split('\n').filter(Boolean);

          for (const line of ffVisitLines) {
            const parts = line.split('|');
            const url = (parts[0] || '').trim();
            const title = (parts[1] || '').trim();
            const timestamp = (parts[2] || dbMtime).trim();
            const visitTypeRaw = parts[3];
            const visitType = this.decodeFirefoxVisitType(visitTypeRaw);

            for (const domain of this.knownCheatDomains) {
              if (url.toLowerCase().includes(domain.toLowerCase())) {
                if (!visitedCheats.some(v => v.url === url && v.timestamp === timestamp)) {
                  visitedCheats.push({ domain, url, title, timestamp, visitType, browser: dbInfo.browser });
                }
                break;
              }
            }
          }

          usedSqlite = true;
        }
      } catch (e) {
        // Fallback to binary stream search
      }

      // 2. Binary Stream Fallback (If sqlite command failed or table missing)
      if (!usedSqlite) {
        const buffer = fs.readFileSync(tempCopy);
        const content = buffer.toString('binary');

        for (const domain of this.knownCheatDomains) {
          if (content.includes(domain)) {
            let bestUrl = `https://${domain}`;
            try {
              const domainEscaped = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const urlRegex = new RegExp(`https?:\\/\\/[a-zA-Z0-9.-]*?${domainEscaped}[^\\s\\0"'<>]{0,250}`, 'gi');
              const match = urlRegex.exec(content);
              if (match && match[0]) {
                bestUrl = match[0];
              }
            } catch (e) {}

            visitedCheats.push({
              domain,
              url: bestUrl,
              title: `${domain} Portal`,
              timestamp: dbMtime,
              visitType: 'Tarayıcı Geçmiş Kaydı (Binary Forensics)',
              browser: dbInfo.browser
            });
          }
        }

        // Search for downloaded files recorded in SQLite binary stream
        try {
          const dlPathRegex = /(?:[A-Za-z]:[\\/]|(?:\/home\/[^/\s]+\/|\/root\/))[^\s\0"'<>|?*]{1,250}\.(?:jar|exe|zip|msi)/gi;
          let pathMatch;
          const seenDlPaths = new Set();
          while ((pathMatch = dlPathRegex.exec(content)) !== null) {
            const matchedPath = pathMatch[0];
            if (seenDlPaths.has(matchedPath)) continue;
            seenDlPaths.add(matchedPath);
            const evalItem = this.evaluateDownloadItem(matchedPath, '', dbMtime, dbInfo.browser);
            if (evalItem) {
              downloadedCheats.push(evalItem);
              rawDownloads.push({ name: evalItem.fileName, browser: dbInfo.browser, path: evalItem.targetPath, timestamp: dbMtime });
            }
          }
        } catch (e) {}

        const discordRegex = /https:\/\/cdn\.discordapp\.com\/attachments\/[^\s\0"']+\.(jar|exe|zip|rar)/gi;
        let discordMatch;

        while ((discordMatch = discordRegex.exec(content)) !== null) {
          const dlUrl = discordMatch[0];
          const rawName = dlUrl.split('/').pop().toLowerCase();

          const isSafe = safeKeywords.some(kw => rawName.includes(kw));
          const isCheat = cheatKeywords.some(kw => rawName.includes(kw));

          if (isSafe || !isCheat) continue;

          downloadedCheats.push({
            fileName: dlUrl.split('/').pop(),
            targetPath: dbInfo.path,
            timestamp: dbMtime,
            url: dlUrl,
            visitType: 'Discord İndirmesi (CDN Attachment)'
          });
        }
      }

      // Correlate visits with downloads and assemble final findings
      const findings = this.correlateVisitsAndDownloads(visitedCheats, downloadedCheats, dbInfo.browser, dbInfo.path);
      return { findings, downloads: rawDownloads };

    } catch (err) {
      return { findings: [], downloads: [] };
    } finally {
      try {
        if (fs.existsSync(tempCopy)) fs.unlinkSync(tempCopy);
        if (fs.existsSync(tempCopy + '-wal')) fs.unlinkSync(tempCopy + '-wal');
        if (fs.existsSync(tempCopy + '-shm')) fs.unlinkSync(tempCopy + '-shm');
      } catch (e) {}
    }
  }

  /**
   * Evaluates a download entry from browser history for cheat origin.
   */
  evaluateDownloadItem(targetPath, tabUrl, timestamp = '', browser = 'Browser') {
    if (!targetPath && !tabUrl) return null;
    const cleanPath = (targetPath || '').replace(/\\/g, '/');
    const fileName = path.basename(cleanPath);
    const lowerName = fileName.toLowerCase();
    const safeKeywords = ['chrome', 'firefox', 'edge', 'brave', 'opera', 'discord', 'spotify', 'code', 'vscodium'];
    if (safeKeywords.some(kw => lowerName.includes(kw))) return null;

    const knownWindowsSystemDlls = new Set([
      'kernelbase.dll', 'kernel32.dll', 'ntdll.dll', 'user32.dll', 'gdi32.dll',
      'advapi32.dll', 'msvcrt.dll', 'ucrtbase.dll', 'shell32.dll', 'ole32.dll',
      'oleaut32.dll', 'ws2_32.dll', 'crypt32.dll', 'shlwapi.dll', 'version.dll',
      'comctl32.dll', 'rpcrt4.dll', 'imm32.dll', 'sechost.dll', 'bcrypt.dll'
    ]);
    if (knownWindowsSystemDlls.has(lowerName)) return null;

    const isKnownCheatDomain = this.knownCheatDomains.some(d => (tabUrl || '').toLowerCase().includes(d.toLowerCase()));
    const isCheatFileName = /(?:^|[\\/._-])(vape(?:[-_ ]?v?[0-9]|lite)?|slinky|drip(?:client|-lite|_client)?|doomsday(?:client|-client|_client)?|meteor(?:client|-client|_client)?|liquidbounce|liquidlauncher|wurst(?:client|-client|_client)?|autoclicker|murgee|raven(?:bplus|b|\+|xd|n\+)?|novoline|aristois|rise(?:client)?|tenacity|sigma(?:client|5)?|astolfo|future(?:client)?|rusherhack|boze|kura|inertia(?:client)?|impact(?:client)?|augustus|fdpclient|bleachhack|catlean|thunderhack)(?:[-_.]|$)/i.test(lowerName);

    let isCheat = isCheatFileName || isKnownCheatDomain;
    if (!isCheat && targetPath && fs.existsSync(targetPath)) {
      const res = deepArchiveScanner.inspectTargetFile(targetPath);
      if (res && (res.level === 'CRITICAL' || res.level === 'HIGH') && res.isThreat !== false) isCheat = true;
    }

    if (isCheat) {
      return {
        fileName,
        targetPath,
        timestamp,
        url: tabUrl,
        browser,
        visitType: 'Tarayıcı İndirmesi (DOWNLOAD)'
      };
    }
    return null;
  }

  /**
   * Main scan function across all discovered browsers.
   */
  async scanAllBrowsers(onTarget = () => {}, onFinding = null) {
    const dbs = this.getBrowserDatabasePaths();

    onTarget(`Discovered ${dbs.length} browser database profiles — scanning in parallel`, dbs.length);

    // All browser DBs are independent files — scan all simultaneously
    const results = await Promise.all(
      dbs.map(async (db) => {
        onTarget(`Inspecting Browser DB: ${db.browser} (${db.path})`, 50);
        const res = await this.scanDatabase(db).catch(() => ({ findings: [], downloads: [] }));
        if (onFinding && res.findings && res.findings.length > 0) {
          for (const f of res.findings) onFinding(f);
        }
        return res;
      })
    );

    const allFindings = results.flatMap(r => r.findings);
    const allDownloads = results.flatMap(r => r.downloads);

    return {
      totalBrowsersScanned: dbs.length,
      findings: allFindings,
      downloads: allDownloads
    };
  }
}

module.exports = new BrowserForensicsEngine();
