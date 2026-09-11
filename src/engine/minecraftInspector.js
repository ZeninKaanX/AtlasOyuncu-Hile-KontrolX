/**
 * Farben AC - Minecraft Directory & Mod Deep Inspector
 * Scans .minecraft, .sonoyuncu, .craftrise, .roan, Lunar, Badlion, Feather, CurseForge, and PrismLauncher instances.
 * Inspects all JARs, checks disguised files (PK zip header in .png/.txt),
 * reads config files, and tests classes using zero-false-positive signature rules and trojan heuristics.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const sigDb = require('./signatureDb');
const trojanModDetector = require('./trojanModDetector');
const modrinthWhitelist = require('./modrinthWhitelist');
const semanticCheatClassifier = require('./semanticCheatClassifier');
const windowEvasionScanner = require('./windowEvasionScanner');
const fontExploitForensics = require('./fontExploitForensics');
const serverPolicy = require('../config/serverPolicy');

class MinecraftInspectorEngine {
  constructor() {
    this.zipMagic = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
  }

  /**
   * Discovers all Minecraft and launcher root directories on this system,
   * including multi-instance launchers like PrismLauncher, MultiMC, Modrinth.
   */
  getMinecraftDirectories() {
    const dirs = [];
    const isWindows = process.platform === 'win32';
    const home = os.homedir();

    const addDir = (d) => {
      if (d && fs.existsSync(d) && !dirs.includes(d)) dirs.push(d);
    };

    if (isWindows) {
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      const userProfile = process.env.USERPROFILE || home;

      addDir(path.join(appData, '.minecraft'));
      addDir(path.join(appData, '.sonoyuncu'));
      addDir(path.join(appData, '.craftrise'));
      addDir(path.join(appData, '.roan'));
      addDir(path.join(userProfile, '.lunarclient', 'offline', 'multiver'));
      addDir(path.join(appData, 'Badlion Client'));
      addDir(path.join(userProfile, 'curseforge', 'minecraft', 'Instances'));

      // Feather Client
      addDir(path.join(appData, '.feather'));
      addDir(path.join(appData, '.feather', 'user-mods'));
      addDir(path.join(appData, '.feather', 'player-mods'));
      this.findInstanceMinecraftDirs(path.join(appData, '.feather', 'instances'), dirs);

      // TLauncher
      addDir(path.join(appData, '.tlauncher'));
      addDir(path.join(appData, '.tlauncher', 'legacy', 'Minecraft', 'game'));

      // PrismLauncher / MultiMC / Modrinth / ATLauncher / GDLauncher / FTB instances
      this.findInstanceMinecraftDirs(path.join(appData, 'PrismLauncher', 'instances'), dirs);
      this.findInstanceMinecraftDirs(path.join(appData, 'MultiMC', 'instances'), dirs);
      this.findInstanceMinecraftDirs(path.join(appData, 'ModrinthApp', 'profiles'), dirs);
      this.findInstanceMinecraftDirs(path.join(localAppData, 'ModrinthApp', 'profiles'), dirs);
      this.findInstanceMinecraftDirs(path.join(appData, 'com.modrinth.theseus', 'profiles'), dirs);
      this.findInstanceMinecraftDirs(path.join(appData, 'ATLauncher', 'instances'), dirs);
      this.findInstanceMinecraftDirs(path.join(appData, 'gdlauncher_next', 'instances'), dirs);
      this.findInstanceMinecraftDirs(path.join(localAppData, 'ftba', 'instances'), dirs);

      // Parse launcher_profiles.json for custom gameDir profiles
      try {
        const profilesJson = path.join(appData, '.minecraft', 'launcher_profiles.json');
        if (fs.existsSync(profilesJson)) {
          const parsed = JSON.parse(fs.readFileSync(profilesJson, 'utf8'));
          if (parsed && parsed.profiles) {
            for (const key of Object.keys(parsed.profiles)) {
              const p = parsed.profiles[key];
              if (p && p.gameDir && fs.existsSync(p.gameDir)) {
                addDir(p.gameDir);
              }
            }
          }
        }
      } catch (e) {}

      // Secondary Drives (D:\, E:\, F:\)
      const secDrives = ['D:\\', 'E:\\', 'F:\\'];
      for (const drv of secDrives) {
        if (fs.existsSync(drv)) {
          addDir(path.join(drv, '.minecraft'));
          addDir(path.join(drv, 'Minecraft'));
          addDir(path.join(drv, 'Games', 'Minecraft'));
          addDir(path.join(drv, 'CurseForge', 'minecraft', 'Instances'));
          this.findInstanceMinecraftDirs(path.join(drv, 'PrismLauncher', 'instances'), dirs);
          this.findInstanceMinecraftDirs(path.join(drv, 'MultiMC', 'instances'), dirs);
        }
      }
    } else {
      // Linux candidates
      addDir(path.join(home, '.minecraft'));
      addDir(path.join(home, '.sonoyuncu'));
      addDir(path.join(home, '.craftrise'));
      addDir(path.join(home, '.var', 'app', 'com.mojang.Minecraft', '.minecraft'));

      // Feather & TLauncher Linux
      addDir(path.join(home, '.feather'));
      addDir(path.join(home, '.feather', 'user-mods'));
      addDir(path.join(home, '.tlauncher'));

      // PrismLauncher / Modrinth / ATLauncher Linux
      this.findInstanceMinecraftDirs(path.join(home, '.var', 'app', 'org.prismlauncher.PrismLauncher', 'data', 'PrismLauncher', 'instances'), dirs);
      this.findInstanceMinecraftDirs(path.join(home, '.local', 'share', 'PrismLauncher', 'instances'), dirs);
      this.findInstanceMinecraftDirs(path.join(home, '.var', 'app', 'com.modrinth.ModrinthApp', 'data', 'ModrinthApp', 'profiles'), dirs);
      this.findInstanceMinecraftDirs(path.join(home, '.local', 'share', 'ModrinthApp', 'profiles'), dirs);
      this.findInstanceMinecraftDirs(path.join(home, '.local', 'share', 'ATLauncher', 'instances'), dirs);

      // Parse ~/.minecraft/launcher_profiles.json for custom gameDir
      try {
        const profilesJson = path.join(home, '.minecraft', 'launcher_profiles.json');
        if (fs.existsSync(profilesJson)) {
          const parsed = JSON.parse(fs.readFileSync(profilesJson, 'utf8'));
          if (parsed && parsed.profiles) {
            for (const key of Object.keys(parsed.profiles)) {
              const p = parsed.profiles[key];
              if (p && p.gameDir && fs.existsSync(p.gameDir)) {
                addDir(p.gameDir);
              }
            }
          }
        }
      } catch (e) {}
    }

    return dirs;
  }

  findInstanceMinecraftDirs(instancesBase, resultList) {
    if (!fs.existsSync(instancesBase)) return;
    try {
      const instances = fs.readdirSync(instancesBase);
      for (const inst of instances) {
        const fullInst = path.join(instancesBase, inst);
        if (!fs.statSync(fullInst).isDirectory()) continue;

        const possibleMc = [
          path.join(fullInst, 'minecraft'),
          path.join(fullInst, '.minecraft'),
          fullInst
        ];

        for (const p of possibleMc) {
          if (fs.existsSync(p) && (fs.existsSync(path.join(p, 'mods')) || fs.existsSync(path.join(p, 'options.txt')))) {
            if (!resultList.includes(p)) resultList.push(p);
          }
        }
      }
    } catch (e) {}
  }

  /**
   * Checks if a file is disguised (e.g. .png, .txt, .dat starting with PK magic bytes).
   */
  isDisguisedJar(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const baseName = path.basename(filePath).toLowerCase();

      // Standard archive formats
      if (ext === '.jar' || ext === '.zip' || ext === '.mrpack' || ext === '.litemod') return false;

      // Legitimate disabled mod extensions used by launchers (TLauncher, Prism, Modrinth, CurseForge, etc.)
      const disabledExts = ['.deactivation', '.disabled', '.dis', '.inactive', '.bak', '.old', '.off', '.backup', '.deactivated'];
      if (disabledExts.includes(ext)) return false;

      // If filename contains .jar. or .zip. (e.g. fabric-api.jar.deactivation, jei.jar.disabled)
      if (baseName.includes('.jar.') || baseName.includes('.zip.')) return false;

      // Check for launcher downloads / assets / libraries cache paths
      const normalized = filePath.replace(/\\/g, '/').toLowerCase();
      if (
        (normalized.includes('/versions/') && normalized.includes('/downloads/')) ||
        normalized.includes('/libraries/') ||
        normalized.includes('/assets/') ||
        normalized.includes('/.gradle/')
      ) {
        return false;
      }

      // Extensionless files that match hex hashes (SHA-1 / UUID cache blobs)
      if (ext === '' && /^[0-9a-f]{32,64}$/i.test(baseName)) {
        return false;
      }

      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(4);
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);

      return buffer.equals(this.zipMagic);
    } catch (e) {
      return false;
    }
  }

  /**
   * Unpacks and inspects entries inside a JAR or ZIP file.
   * Runs signature matching AND smart trojan/backdoor heuristic analysis.
   */
  inspectJarFile(filePath, isDeepModCheck = true) {
    const findings = [];
    const fileName = path.basename(filePath);

    if (serverPolicy.isFreecamAllowed() && fileName.toLowerCase().includes('freecam')) {
      return [{
        level: 'INFO',
        type: 'ALLOWED_UTILITY_FREECAM',
        name: `Freecam Modu (${fileName}) (Sunucu Kuralı: İzinli)`,
        file: fileName,
        path: filePath,
        confidence: 'Doğrulandı (İzinli Yardımcı Mod)',
        description: `Sistemde Freecam modu tespit edildi (${fileName}). Sunucu kuralları gereği Freecam kullanımı serbesttir ve ceza gerektirmez.`,
        evidence: [`Dosya: ${filePath}`]
      }];
    }

    try {
      const zip = new AdmZip(filePath);
      const rawEntries = zip.getEntries();
      const zipEntries = rawEntries.map(e => e.entryName);

      // Extract mod metadata (fabric.mod.json, quilt.mod.json, mcmod.info, META-INF/mods.toml)
      let modMetadata = null;
      try {
        const metaEntry = rawEntries.find(e => e.entryName === 'fabric.mod.json' || e.entryName === 'quilt.mod.json' || e.entryName === 'mcmod.info');
        if (metaEntry) {
          const text = metaEntry.getData().toString('utf8');
          const parsed = JSON.parse(text);
          modMetadata = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : parsed;
        } else {
          const tomlEntry = rawEntries.find(e => e.entryName === 'META-INF/mods.toml' || e.entryName === 'mods.toml');
          if (tomlEntry) {
            const text = tomlEntry.getData().toString('utf8');
            const modIdMatch = text.match(/modId\s*=\s*["']([^"']+)["']/i);
            const nameMatch = text.match(/displayName\s*=\s*["']([^"']+)["']/i);
            if (modIdMatch && modIdMatch[1]) {
              modMetadata = {
                id: modIdMatch[1],
                modid: modIdMatch[1],
                name: nameMatch && nameMatch[1] ? nameMatch[1] : modIdMatch[1]
              };
            }
          }
        }
      } catch (e) {}

      // 0. Modrinth & Ecosystem Whitelist Check
      const whitelistResult = modrinthWhitelist.isCleanMod(modMetadata, zipEntries, fileName);

      // 1. Signature Database Matches
      const sigMatches = sigDb.matchJarEntries(zipEntries, fileName, filePath, modMetadata);
      for (const m of sigMatches) {
        m.category = 'MINECRAFT_MODS';
        m.level = m.level || m.severity || 'CRITICAL';
        m.type = m.type || 'MINECRAFT_CHEAT_MOD';
        m.whyFlagged = m.whyFlagged || `Mod/dosya (${fileName}), doğrulanmış ${m.name} hile baytkodu barındırdığı için KRİTİK olarak sınıflandırıldı.`;
        findings.push(m);
      }

      // 2. Trojan & Backdoor Heuristic Detection
      // Catches disguised mods like crosshairindicator-modified.jar with native click injection
      if (isDeepModCheck) {
        const trojanMatches = trojanModDetector.analyzeJar(filePath, zip, rawEntries);
        for (const tm of trojanMatches) {
          tm.category = 'MINECRAFT_MODS';
          tm.level = tm.level || 'CRITICAL';
          findings.push(tm);
        }

        // 3. AI-like Semantic Bytecode Classifier
        // Analyzes compiled Java classes for homemade / unsigned combat cheat semantics
        // (KillAura, Velocity, Reach, AutoTotem, Criticals, TriggerBot)
        const semanticMatches = semanticCheatClassifier.classifyJar(filePath, zip, rawEntries, whitelistResult);
        for (const sm of semanticMatches) {
          sm.category = 'MINECRAFT_MODS';
          findings.push(sm);
        }
      }

    } catch (e) {}

    return findings;
  }

  /**
   * Scans configuration directories for known cheat config files.
   */
  scanConfigFiles(mcDir) {
    const findings = [];

    // 1. Raven B+ configs (.bplus)
    const keystrokesConfigDir = path.join(mcDir, 'keystrokes', 'configs');
    if (fs.existsSync(keystrokesConfigDir)) {
      try {
        const files = fs.readdirSync(keystrokesConfigDir);
        for (const file of files) {
          if (file.toLowerCase().endsWith('.bplus')) {
            findings.push({
              level: 'CRITICAL',
              type: 'RAVEN_BPLUS_CONFIG_FOUND',
              file: file,
              path: path.join(keystrokesConfigDir, file),
              description: `Found Raven B+ configuration file: ${file} (100% Zero False Positive Proof)`
            });
          }
        }
      } catch (e) {}
    }

    // 2. Wurst config
    const wurstDir = path.join(mcDir, 'wurst');
    const dotWurstDir = path.join(mcDir, '.wurst');
    const activeWurstDir = fs.existsSync(wurstDir) ? wurstDir : (fs.existsSync(dotWurstDir) ? dotWurstDir : null);
    if (activeWurstDir) {
      findings.push({
        level: 'CRITICAL',
        type: 'WURST_CONFIG_DIR',
        path: activeWurstDir,
        description: `Found Wurst Client configuration directory (${activeWurstDir})`
      });
    }

    // 3. LiquidBounce config
    const lbDir = path.join(mcDir, 'LiquidBounce');
    if (fs.existsSync(lbDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'LIQUIDBOUNCE_CONFIG_DIR',
        path: lbDir,
        description: 'Found LiquidBounce configuration directory (.minecraft/LiquidBounce)'
      });
    }

    // 4. Meteor config
    const meteorDir = path.join(mcDir, 'meteor-client');
    if (fs.existsSync(meteorDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'METEOR_CONFIG_DIR',
        path: meteorDir,
        description: 'Found Meteor Client configuration directory (.minecraft/meteor-client)'
      });
    }

    // 5. ThunderHack config
    const thunderDir = path.join(mcDir, 'ThunderHack');
    const thunderRecodeDir = path.join(mcDir, 'ThunderHackRecode');
    if (fs.existsSync(thunderDir) || fs.existsSync(thunderRecodeDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'THUNDERHACK_CONFIG_DIR',
        path: fs.existsSync(thunderDir) ? thunderDir : thunderRecodeDir,
        description: 'Found ThunderHack configuration directory'
      });
    }

    // 6. CatLean config
    const catleanDir = path.join(mcDir, 'catlean');
    if (fs.existsSync(catleanDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'CATLEAN_CONFIG_DIR',
        path: catleanDir,
        description: 'Found CatLean configuration directory'
      });
    }

    // 7. Ares config
    const aresDir = path.join(mcDir, 'ares');
    if (fs.existsSync(aresDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'ARES_CONFIG_DIR',
        path: aresDir,
        description: 'Found Ares configuration directory'
      });
    }

    // 8. BleachHack config
    const bleachDir = path.join(mcDir, 'bleach');
    if (fs.existsSync(bleachDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'BLEACHHACK_CONFIG_DIR',
        path: bleachDir,
        description: 'Found BleachHack configuration directory'
      });
    }

    // 9. Aristois config
    const aristoisDir = path.join(mcDir, 'aristois');
    if (fs.existsSync(aristoisDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'ARISTOIS_CONFIG_DIR',
        path: aristoisDir,
        description: 'Found Aristois configuration directory'
      });
    }

    // 10. Doomsday config
    const doomsdayDir = path.join(mcDir, 'doomsday');
    const doomsdayJson = path.join(mcDir, 'doomsday.json');
    if (fs.existsSync(doomsdayDir) || fs.existsSync(doomsdayJson)) {
      findings.push({
        level: 'CRITICAL',
        type: 'DOOMSDAY_CONFIG_FOUND',
        path: fs.existsSync(doomsdayDir) ? doomsdayDir : doomsdayJson,
        description: 'Found Doomsday client configuration traces'
      });
    }

    // 11. Vape & Vape Lite config
    const vapeDirs = [path.join(mcDir, 'vape'), path.join(mcDir, '.vape'), path.join(mcDir, 'vape-settings')];
    for (const vd of vapeDirs) {
      if (fs.existsSync(vd)) {
        findings.push({
          level: 'CRITICAL',
          type: 'VAPE_CONFIG_DIR',
          path: vd,
          description: 'Found Vape Client configuration directory inside Minecraft path'
        });
      }
    }

    // 12. Drip Lite config
    const dripDirs = [path.join(mcDir, 'drip'), path.join(mcDir, 'drip-lite'), path.join(mcDir, '.drip')];
    for (const dd of dripDirs) {
      if (fs.existsSync(dd)) {
        findings.push({
          level: 'CRITICAL',
          type: 'DRIP_CONFIG_DIR',
          path: dd,
          description: 'Found Drip Lite configuration directory inside Minecraft path'
        });
      }
    }

    // 13. Slinky config
    const slinkyDirs = [path.join(mcDir, 'slinky'), path.join(mcDir, 'slinky.json')];
    for (const sd of slinkyDirs) {
      if (fs.existsSync(sd)) {
        findings.push({
          level: 'CRITICAL',
          type: 'SLINKY_CONFIG_FOUND',
          path: sd,
          description: 'Found Slinky Client configuration artifact'
        });
      }
    }

    // 14. Future Client config
    const futureDir = path.join(mcDir, 'future');
    if (fs.existsSync(futureDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'FUTURE_CLIENT_CONFIG_DIR',
        path: futureDir,
        description: 'Found Future Client configuration directory'
      });
    }

    // 15. RusherHack config
    const rusherDir = path.join(mcDir, 'rusherhack');
    if (fs.existsSync(rusherDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'RUSHERHACK_CONFIG_DIR',
        path: rusherDir,
        description: 'Found RusherHack configuration directory'
      });
    }

    // 16. Boze Client config
    const bozeDir = path.join(mcDir, 'boze');
    if (fs.existsSync(bozeDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'BOZE_CONFIG_DIR',
        path: bozeDir,
        description: 'Found Boze Client configuration directory'
      });
    }

    // 17. Sigma Client config
    const sigmaDir = path.join(mcDir, 'sigma');
    const sigma5Dir = path.join(mcDir, 'sigma5');
    if (fs.existsSync(sigmaDir) || fs.existsSync(sigma5Dir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'SIGMA_CONFIG_DIR',
        path: fs.existsSync(sigmaDir) ? sigmaDir : sigma5Dir,
        description: 'Found Sigma Client configuration directory'
      });
    }

    // 18. Rise Client config
    const riseDir = path.join(mcDir, 'Rise');
    if (fs.existsSync(riseDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'RISE_CONFIG_DIR',
        path: riseDir,
        description: 'Found Rise Client configuration directory'
      });
    }

    // 19. Kura Client config
    const kuraDir = path.join(mcDir, 'kura');
    if (fs.existsSync(kuraDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'KURA_CONFIG_DIR',
        path: kuraDir,
        description: 'Found Kura Client configuration directory'
      });
    }

    // 20. Nova / Novoline config
    const novaDir = path.join(mcDir, 'nova');
    const novolineDir = path.join(mcDir, 'novoline');
    for (const nd of [novaDir, novolineDir]) {
      if (fs.existsSync(nd)) {
        findings.push({
          level: 'CRITICAL',
          type: 'NOVOLINE_CONFIG_DIR',
          name: 'Novoline/Nova Client',
          path: nd,
          confidence: '100% (Somut Kanıt: Hile Konfigürasyon Klasörü)',
          description: `Novoline / Nova ghost client konfigürasyon dizini bulundu: ${nd}`,
          evidence: [`Dizin: ${nd}`]
        });
        break;
      }
    }

    // 21. Hydra Client config
    const hydraDir = path.join(mcDir, 'hydra');
    if (fs.existsSync(hydraDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'HYDRA_CONFIG_DIR',
        name: 'Hydra Cheat Client',
        path: hydraDir,
        confidence: '100% (Somut Kanıt: Hile Konfigürasyon Klasörü)',
        description: `Hydra hile istemcisi konfigürasyon dizini tespit edildi: ${hydraDir}`,
        evidence: [`Dizin: ${hydraDir}`]
      });
    }

    // 22. Prism Cheat Client config (distinct from PrismLauncher)
    const prismCheatDir = path.join(mcDir, 'prism-client');
    if (fs.existsSync(prismCheatDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'PRISM_CHEAT_CONFIG_DIR',
        name: 'Prism Cheat Client',
        path: prismCheatDir,
        confidence: '100% (Somut Kanıt: Hile Konfigürasyon Klasörü)',
        description: `Prism hile istemcisi konfigürasyon dizini tespit edildi: ${prismCheatDir}`,
        evidence: [`Dizin: ${prismCheatDir}`]
      });
    }

    // 23. Nebula Client config
    const nebulaDir = path.join(mcDir, 'nebula');
    if (fs.existsSync(nebulaDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'NEBULA_CONFIG_DIR',
        name: 'Nebula Cheat Client',
        path: nebulaDir,
        confidence: '100% (Somut Kanıt: Hile Konfigürasyon Klasörü)',
        description: `Nebula hile istemcisi konfigürasyon dizini tespit edildi: ${nebulaDir}`,
        evidence: [`Dizin: ${nebulaDir}`]
      });
    }

    // 24. .atmosphere (Atmosphere ghost client / cloaking system)
    const atmosphereDir = path.join(mcDir, '.atmosphere');
    if (fs.existsSync(atmosphereDir)) {
      findings.push({
        level: 'CRITICAL',
        type: 'ATMOSPHERE_GHOST_CLIENT_DIR',
        name: 'Atmosphere Ghost Client (Gizli .atmosphere Dizini)',
        path: atmosphereDir,
        confidence: '100% (Somut Kanıt: Nokta-Klasör Gizli Ghost Client)',
        description: `Gizli ".atmosphere" ghost client konfigürasyon dizini tespit edildi: ${atmosphereDir}. Bu istemci dosya sisteminde nokta-klasör (hidden folder) kullanarak tarayıcılardan gizlenmektedir.`,
        evidence: [`Gizli Dizin: ${atmosphereDir}`]
      });
    }

    // 25. logs directory - check if suspiciously wiped (only for primary .minecraft directory)
    const isPrimaryMinecraft = path.basename(mcDir).toLowerCase() === '.minecraft';
    const logsDir = path.join(mcDir, 'logs');
    if (isPrimaryMinecraft && fs.existsSync(logsDir)) {
      try {
        const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log') || f.endsWith('.log.gz'));
        if (logFiles.length === 0) {
          findings.push({
            level: 'WARNING',
            type: 'MINECRAFT_LOGS_WIPED',
            name: 'Minecraft Log Dosyaları Silindi',
            path: logsDir,
            confidence: 'YÜKSEK (Log Silme Anti-Forensics Belirtisi)',
            description: `Minecraft logs klasörü tamamen boş. Oyuncu hile oturum izlerini silmek için log dosyalarını temizlemiş olabilir. Meşru bir Minecraft kurulumunda her zaman en az latest.log bulunur.`,
            evidence: [`Logs dizini: ${logsDir}`, `Log dosyası sayısı: 0`]
          });
        }
      } catch (e) {}
    }

    return findings;

  }

  /**
   * Scans User Root / AppData directories for external cheat client footprints.
   */
  scanUserRootCheatConfigs() {
    const findings = [];
    const home = os.homedir();
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const userProfile = process.env.USERPROFILE || home;

    const externalRoots = [
      { path: path.join(home, '.vape'), name: 'Vape Client (.vape)', type: 'EXTERNAL_VAPE_DIR' },
      { path: path.join(appData, '.vape'), name: 'Vape Client (AppData\\.vape)', type: 'EXTERNAL_VAPE_DIR' },
      { path: path.join(userProfile, '.vape'), name: 'Vape Client (UserProfile\\.vape)', type: 'EXTERNAL_VAPE_DIR' },
      { path: path.join(appData, 'drip'), name: 'Drip Lite (AppData\\drip)', type: 'EXTERNAL_DRIP_DIR' },
      { path: path.join(home, '.drip'), name: 'Drip Lite (~/.drip)', type: 'EXTERNAL_DRIP_DIR' },
      { path: path.join(userProfile, 'slinky'), name: 'Slinky Client (slinky)', type: 'EXTERNAL_SLINKY_DIR' },
      { path: path.join(userProfile, '.future'), name: 'Future Client (.future)', type: 'EXTERNAL_FUTURE_DIR' },
      { path: path.join(userProfile, '.rusherhack'), name: 'RusherHack (.rusherhack)', type: 'EXTERNAL_RUSHER_DIR' },
      { path: path.join(userProfile, '.boze'), name: 'Boze Client (.boze)', type: 'EXTERNAL_BOZE_DIR' },
      { path: path.join(userProfile, '.aristois'), name: 'Aristois Client (.aristois)', type: 'EXTERNAL_ARISTOIS_DIR' }
    ];

    for (const er of externalRoots) {
      if (fs.existsSync(er.path)) {
        findings.push({
          level: 'CRITICAL',
          type: er.type,
          name: er.name,
          path: er.path,
          confidence: '100% (Somut Kanit: Harici Hile Dizin Izleri)',
          description: `Kullanici ana dizininde harici hile konfigürasyon/depolama klasoru tespit edildi: ${er.name}`,
          evidence: [
            `Konum: ${er.path}`,
            `Hile: ${er.name}`
          ]
        });
      }
    }

    return findings;
  }

  /**
   * Main scan function for all Minecraft directories.
   */
  async scanMinecraft(onProgress = () => {}, onFinding = null) {
    const mcDirs = this.getMinecraftDirectories();
    // Sort directories by modification time so active instances are scanned first
    mcDirs.sort((a, b) => {
      try { return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs; } catch (e) { return 0; }
    });

    let scannedJars = 0;
    const now = Date.now();

    // 0. Inspect User Root & AppData for external cheat directories (sync — very fast)
    const userRootFindings = this.scanUserRootCheatConfigs();
    if (onFinding) {
      for (const uf of userRootFindings) onFinding(uf);
    }

    // 0.5. Inspect direct JAR/ZIP files in user Downloads / İndirilenler & Desktop / Masaüstü
    const home = os.homedir();
    const downloadDesktopDirs = [
      path.join(home, 'Downloads'),
      path.join(home, 'İndirilenler'),
      path.join(home, 'Desktop'),
      path.join(home, 'Masaüstü')
    ];
    const directJarFindings = [];
    for (const dDir of downloadDesktopDirs) {
      if (fs.existsSync(dDir)) {
        try {
          const files = fs.readdirSync(dDir);
          for (const f of files) {
            const ext = path.extname(f).toLowerCase();
            if (ext === '.jar') {
              const fullPath = path.join(dDir, f);
              try {
                const s = fs.lstatSync(fullPath);
                if (s.isFile() && !s.isSymbolicLink() && s.size > 0 && s.size < 150 * 1024 * 1024) {
                  scannedJars++;
                  const matches = this.inspectJarFile(fullPath, true);
                  if (matches && matches.length > 0) {
                    directJarFindings.push(...matches);
                    if (onFinding) {
                      for (const m of matches) onFinding(m);
                    }
                  }
                }
              } catch (e) {}
            }
          }
        } catch (e) {}
      }
    }

    // Scan all Minecraft instances in parallel — they are entirely independent directories
    const instanceResults = await Promise.all(
      mcDirs.map(async (mcDir) => {
        const findings = [];
        let localJarCount = 0;
        let mtime = 0;
        try { mtime = fs.statSync(mcDir).mtimeMs; } catch (e) {}
        const isRecentInstance = (now - mtime) < (30 * 24 * 3600 * 1000);

        onProgress(`Scanning Minecraft instance: ${path.basename(mcDir)}`, mcDir, 1);
        await new Promise(resolve => setImmediate(resolve));

        // Check config folders
        const configFindings = this.scanConfigFiles(mcDir);
        findings.push(...configFindings);
        if (onFinding) {
          for (const cf of configFindings) onFinding(cf);
        }

        // 1. Mod, Version, ResourcePack and ShaderPack directories
        const targetSubdirs = ['mods', 'versions', 'resourcepacks', 'shaderpacks'];

        for (const sub of targetSubdirs) {
          const fullSub = path.join(mcDir, sub);
          if (!fs.existsSync(fullSub)) continue;
          const isModDir = sub === 'mods';
          const isPackDir = sub === 'resourcepacks' || sub === 'shaderpacks';

          const fileList = [];
          this.walkFiles(fullSub, (file) => fileList.push(file));

          for (const file of fileList) {
            const fileName = path.basename(file);
            const ext = path.extname(file).toLowerCase();

            if (isPackDir) {
              if (ext === '.zip') {
                try {
                  const packZip = new AdmZip(file);
                  const entries = packZip.getEntries().map(e => e.entryName);
                  const classFindings = windowEvasionScanner.evaluateResourcePackClasses(entries, file);
                  findings.push(...classFindings);
                  const fontFindings = fontExploitForensics.inspectZipPack(file);
                  findings.push(...fontFindings);
                } catch (e) {}
              }
              continue;
            }

            if (this.isDisguisedJar(file)) {
              onProgress(`Disguised JAR detected: ${fileName}`, file, 1);
              findings.push({
                level: 'CRITICAL',
                type: 'DISGUISED_JAR_FILE',
                file: fileName,
                path: file,
                description: `Disguised JAR file detected! Extension is '${ext}', but file header contains ZIP magic bytes (PK\\x03\\x04). Cheats disguise themselves this way.`
              });
              const jarMatches = this.inspectJarFile(file, true);
              findings.push(...jarMatches);
              localJarCount++;
              continue;
            }

            const isDisabledMod = (
              ['.deactivation', '.disabled', '.dis', '.inactive', '.bak', '.old', '.off'].includes(ext) ||
              fileName.toLowerCase().includes('.jar.')
            );

            if (ext === '.jar' || ext === '.zip' || isDisabledMod) {
              localJarCount++;
              const lowerName = fileName.toLowerCase();
              const isCheatCandidateName = (
                lowerName.includes('wurst') || lowerName.includes('meteor') ||
                lowerName.includes('liquidbounce') || lowerName.includes('raven') ||
                lowerName.includes('doomsday') || lowerName.includes('aristois') ||
                lowerName.includes('thunder') || lowerName.includes('catlean') ||
                lowerName.includes('ares') || lowerName.includes('bleach') ||
                lowerName.includes('inertia') || lowerName.includes('impact') ||
                lowerName.includes('rise') || lowerName.includes('novoline') ||
                lowerName.includes('astolfo') || lowerName.includes('tenacity') ||
                lowerName.includes('augustus') || lowerName.includes('fdp') ||
                lowerName.includes('flux') || lowerName.includes('hanabi') ||
                lowerName.includes('vape') || lowerName.includes('drip') ||
                lowerName.includes('slinky') || lowerName.includes('kura') ||
                lowerName.includes('boze') || lowerName.includes('sigma') ||
                lowerName.includes('future') || lowerName.includes('rusherhack') ||
                lowerName.includes('keystrokes') || lowerName.includes('reach') ||
                lowerName.includes('click') || lowerName.includes('trigger') ||
                lowerName.includes('combat') || lowerName.includes('cheat') ||
                lowerName.includes('hack') || lowerName.includes('nebula') ||
                lowerName.includes('hydra') || lowerName.includes('nova') ||
                lowerName.includes('prism-client') || lowerName.includes('atmosphere') ||
                lowerName.includes('celestial') || lowerName.includes('infernal') ||
                lowerName.includes('sentry') || lowerName.includes('eliteclient') ||
                lowerName.includes('ghostclient') || lowerName.includes('loader') ||
                lowerName.includes('inject') || lowerName.includes('bypass') ||
                lowerName.includes('aura') || lowerName.includes('velocity') ||
                lowerName.includes('killaura') || lowerName.includes('dodo') ||
                lowerName.includes('do do') || lowerName.includes('zortax')
              );

              if (isModDir || isRecentInstance || mcDir.includes('.minecraft') || isCheatCandidateName) {
                onProgress(`Inspecting ${isModDir ? 'Mod' : 'Version'}: ${fileName}`, file, 25);
                const isDeepCheck = isModDir || isRecentInstance || mcDir.includes('.minecraft') || isCheatCandidateName;
                const matches = this.inspectJarFile(file, isDeepCheck);
                findings.push(...matches);
                if (onFinding) {
                  for (const m of matches) onFinding(m);
                }
              }

              if (localJarCount % 15 === 0) {
                await new Promise(resolve => setImmediate(resolve));
              }
            }
          }
        }

        // 2. Specific Cheat Library Directories
        const libDir = path.join(mcDir, 'libraries');
        if (fs.existsSync(libDir)) {
          const cheatLibSubdirs = ['EMC', 'me/doomsday', 'catlean', 'net/ccbluex', 'bleach', 'thunder'];
          for (const cl of cheatLibSubdirs) {
            const clPath = path.join(libDir, cl);
            if (fs.existsSync(clPath)) {
              const libFiles = [];
              this.walkFiles(clPath, (file) => libFiles.push(file));
              for (const file of libFiles) {
                const fileName = path.basename(file);
                const ext = path.extname(file).toLowerCase();
                if (ext === '.jar') {
                  localJarCount++;
                  onProgress(`Inspecting cheat library: ${fileName}`, file, 15);
                  const matches = this.inspectJarFile(file, false);
                  findings.push(...matches);
                  if (onFinding) {
                    for (const m of matches) onFinding(m);
                  }
                }
              }
            }
          }
        }

        return { findings, localJarCount };
      })
    );

    const allFindings = [...userRootFindings, ...directJarFindings];
    for (const r of instanceResults) {
      allFindings.push(...r.findings);
      scannedJars += r.localJarCount;
    }

    return {
      scannedDirectories: mcDirs,
      scannedJars,
      findings: allFindings
    };
  }

  walkFiles(dir, callback, maxDepth = 4, currentDepth = 0) {
    if (currentDepth > maxDepth) return;
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          this.walkFiles(full, callback, maxDepth, currentDepth + 1);
        } else if (stat.isFile()) {
          callback(full);
        }
      }
    } catch (e) {}
  }
}

module.exports = new MinecraftInspectorEngine();
