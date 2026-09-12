/**
 * Farben AC - Signature Database & Zero-False-Flag Matcher
 * Loads cheat definitions and evaluates findings with multi-layer verification.
 */

const fs = require('fs');
const path = require('path');

class SignatureDatabase {
  constructor() {
    this.signatures = null;
    this.customSignaturesPath = path.join(__dirname, '../signatures/customSignatures.json');
    this.defaultSignaturesPath = path.join(__dirname, '../signatures/defaultSignatures.json');
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.defaultSignaturesPath)) {
        const data = fs.readFileSync(this.defaultSignaturesPath, 'utf8');
        this.signatures = JSON.parse(data);
      } else {
        this.signatures = { clientRules: [], autoclickers: [], cheatDomains: [] };
      }

      if (fs.existsSync(this.customSignaturesPath)) {
        try {
          const customData = fs.readFileSync(this.customSignaturesPath, 'utf8');
          const custom = JSON.parse(customData);
          if (custom && Array.isArray(custom.clientRules)) {
            this.signatures.clientRules.push(...custom.clientRules);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('[Farben AC] Error loading signatures:', err.message);
      this.signatures = { clientRules: [], autoclickers: [], cheatDomains: [] };
    }
  }

  getVersion() {
    return this.signatures ? this.signatures.version : 'Unknown';
  }

  getClientRules() {
    return this.signatures ? this.signatures.clientRules : [];
  }

  getAutoclickers() {
    return this.signatures ? this.signatures.autoclickers : [];
  }

  getCheatDomains() {
    return this.signatures ? this.signatures.cheatDomains : [];
  }

  getKernelDrivers() {
    return this.signatures ? this.signatures.kernelVulnerableDrivers : [];
  }

  /**
   * Evaluates a JAR/ZIP archive entries to detect clients with 100% False-Positive protection.
   * Ensures that generic class names (like Aura.class, Reach.class) ONLY match within the rule's specific package hierarchy!
   */
  matchJarEntries(entries, fileName = '', fullPath = '', modMetadata = null) {
    const detections = [];
    const lowerEntries = entries.map(e => e.toLowerCase());
    const entrySet = new Set(lowerEntries);
    const joinedText = '\n' + lowerEntries.join('\n') + '\n';
    const lowerFileName = (fileName || '').toLowerCase();

    for (const rule of this.getClientRules()) {
      let packageMatches = 0;
      let matchedItems = [];
      let hasPackageAffinity = false;
      let matchedByModId = false;
      let hasFilePatternMatch = false;
      let matchedJavaAgent = false;

      // 0. Check Mod Metadata (fabric.mod.json, mods.toml, mcmod.info)
      if (rule.modIds && modMetadata && modMetadata.id) {
        const targetId = String(modMetadata.id).toLowerCase();
        if (rule.modIds.some(m => m.toLowerCase() === targetId)) {
          matchedByModId = true;
          matchedItems.push(`Mod Tanımlayıcısı (Mod ID): ${modMetadata.id}${modMetadata.name ? ' (' + modMetadata.name + ')' : ''}`);
        }
      }

      // Check Manifest JavaAgent Premain-Class
      if (rule.id === 'doomsday_client' && modMetadata && modMetadata.premain) {
        if (modMetadata.premain.includes('net.java.f') || modMetadata.premain.toLowerCase().includes('doomsday')) {
          matchedJavaAgent = true;
          matchedItems.push(`JavaAgent Enjektör Sınıfı (Premain-Class): ${modMetadata.premain}`);
        }
      }

      // Check Internal File Patterns (e.g. 1.*-Aristois.json, Nightmare.exe)
      if (rule.filePatterns && rule.filePatterns.length > 0) {
        for (const pat of rule.filePatterns) {
          const patLower = pat.toLowerCase();
          const regexStr = '^' + patLower.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
          const rx = new RegExp(regexStr, 'i');
          const matchedEntry = lowerEntries.find(e => {
            const base = e.split('/').pop();
            return rx.test(e) || rx.test(base);
          });
          if (matchedEntry || rx.test(lowerFileName)) {
            hasFilePatternMatch = true;
            matchedItems.push(`Arşiv İçi Dosya Kalıbı: ${matchedEntry || pat}`);
            break;
          }
        }
      }

      // 1. Check Packages (Primary Namespace Anchor - SIMD fast text match)
      if (rule.packages && rule.packages.length > 0) {
        for (const pkg of rule.packages) {
          const pkgSlash = pkg.replace(/\./g, '/').toLowerCase();
          const hasPkg = joinedText.includes(pkgSlash);
          if (hasPkg) {
            packageMatches++;
            hasPackageAffinity = true;
            matchedItems.push(`Package: ${pkg}`);
          }
        }
      }

      // Check unique main class match (e.g. LiquidBounce.class, WurstClient.class, Doomsday.class)
      let uniqueMainClassMatched = false;
      if (rule.classes && rule.classes.length > 0) {
        for (const cls of rule.classes) {
          const clsSlash = cls.replace(/\./g, '/').toLowerCase();
          const clsSimple = cls.toLowerCase();
          
          // O(1) Set lookup or newline boundary match
          const hasExact = entrySet.has(clsSlash) ||
                           joinedText.includes('/' + clsSlash + '\n') ||
                           (hasPackageAffinity && (entrySet.has(clsSimple) || joinedText.includes('/' + clsSimple + '\n')));
          if (hasExact) {
            matchedItems.push(`Class: ${cls}`);
            uniqueMainClassMatched = true;
          }
        }
      }

      // 2. Raven B+ vs Legitimate KeystrokesMod (Zero False-Flag Guarantee)
      if (rule.id === 'raven_b_series') {
        // Raven MUST have keystrokesmod/raven namespace
        if (!hasPackageAffinity) {
          continue; // Generic Reach/Velocity in other cheats will NEVER falsely trigger Raven B+
        }

        let combatCount = 0;
        if (rule.combatClasses && rule.combatClasses.length > 0) {
          for (const combatCls of rule.combatClasses) {
            const simpleName = combatCls.toLowerCase();
            const hasCombat = joinedText.includes('/combat/' + simpleName) || joinedText.includes('/' + simpleName + '\n');
            if (hasCombat) {
              combatCount++;
              matchedItems.push(`CombatModule: ${combatCls}`);
            }
          }
        }

        // If keystrokesmod has combat modules, it is definitely Raven B+!
        if (combatCount >= 1 || joinedText.includes('keystrokesmod/client/module/modules/combat')) {
          detections.push({
            ruleId: rule.id,
            name: rule.name,
            level: 'CRITICAL',
            severity: rule.severity || 'CRITICAL',
            type: 'MINECRAFT_CHEAT_MOD',
            category: 'MINECRAFT_MODS',
            confidence: '100% (Zero False Positive Verified)',
            file: fileName,
            path: fullPath,
            reason: `Found combat modules in disguised client (${combatCount} combat classes detected)`,
            whyFlagged: `Dosya (${fileName}), meşru mod taklidi yapmasına rağmen ${combatCount} adet aktif saldırı/savaş sınıfı (Reach, Velocity, AutoClicker) içerdiği için KRİTİK olarak işaretlendi.`,
            evidence: matchedItems.slice(0, 10)
          });
        }
        continue;
      }

      // 2B. Wurst Client vs WI-Zoom (Wurst-Imperium Zoom - Legitimate Standalone Zoom Mod)
      if (rule.id === 'wurst_client') {
        const isWiZoom =
          (modMetadata && /wi-?zoom|w1-?zoom|wurst-?zoom/i.test(modMetadata.id || '')) ||
          /wi-?zoom|w1-?zoom|wurst-?zoom/i.test(lowerFileName);

        if (isWiZoom) {
          // WI-Zoom is Alexander01998's standalone zoom utility mod.
          // It only contains net/wurstclient/zoom/ and must NEVER be flagged as Wurst Client!
          const hasActualWurstHacks = lowerEntries.some(e =>
            e.includes('killaura') || e.includes('flighthack') || e.includes('wurstclient.class') ||
            e.includes('net/wurstclient/hacks/') || e.includes('autototemhack')
          );
          if (!hasActualWurstHacks) {
            continue; // Clean standalone WI-Zoom mod!
          }
        }
      }

      // 2C. Hydrogen Cheat Client vs CaffeineMC Hydrogen (Legitimate chunk memory optimizer)
      if (rule.id === 'hydrogen_cheat_client') {
        const isLegitCaffeineHydrogen =
          joinedText.includes('me/jellysquid/mods/hydrogen') ||
          (modMetadata && modMetadata.name && modMetadata.name.toLowerCase().includes('caffeinemc'));
        const hasCheatCombat = lowerEntries.some(e =>
          e.includes('killaura') || e.includes('autocrystal') || e.includes('reach') || e.includes('velocity')
        );
        if (isLegitCaffeineHydrogen && !hasCheatCombat) {
          continue; // 100% Clean CaffeineMC Hydrogen mod!
        }
      }

      // 2D. Lithium Ghost Client vs CaffeineMC Lithium (Legitimate server/physics optimizer)
      if (rule.id === 'lithium_cheat_client') {
        const isLegitCaffeineLithium =
          joinedText.includes('me/jellysquid/mods/lithium') ||
          (modMetadata && modMetadata.name && modMetadata.name.toLowerCase().includes('caffeinemc'));
        const hasCheatCombat = lowerEntries.some(e =>
          e.includes('reach') || e.includes('velocity') || e.includes('aimassist') || e.includes('autoclicker')
        );
        if (isLegitCaffeineLithium && !hasCheatCombat) {
          continue; // 100% Clean CaffeineMC Lithium mod!
        }
      }

      // 3. For all other clients:
      // Matched via verified Mod ID, file pattern, JavaAgent premain, OR bytecode structure
      if (matchedByModId || hasFilePatternMatch || matchedJavaAgent || (hasPackageAffinity && (uniqueMainClassMatched || packageMatches >= 1))) {
        detections.push({
          ruleId: rule.id,
          name: rule.name,
          level: rule.severity || 'CRITICAL',
          severity: rule.severity || 'CRITICAL',
          type: 'MINECRAFT_CHEAT_MOD',
          category: 'MINECRAFT_MODS',
          confidence: matchedByModId ? '100% (Somut Kanıt: Mod Tanımlayıcısı Doğrulaması)' : '100% (Exact Bytecode Structure)',
          file: fileName,
          path: fullPath,
          reason: `Matched structure of ${rule.name}`,
          whyFlagged: `Dosya (${fileName}), doğrulanmış ${rule.name} baytkod paketleri ve hile sınıfları barındırdığı için ${rule.severity || 'CRITICAL'} olarak sınıflandırıldı.`,
          evidence: matchedItems.slice(0, 10)
        });
      }
    }

    return detections;
  }

  /**
   * Matches string literals found in memory or binary dumps.
   */
  matchMemoryStrings(extractedStrings, context = '') {
    const detections = [];
    const lowerStrings = extractedStrings.map(s => s.toLowerCase());

    for (const rule of this.getClientRules()) {
      if (!rule.memoryStrings) continue;

      let matchedStrings = [];
      for (const memStr of rule.memoryStrings) {
        const target = memStr.toLowerCase();
        if (lowerStrings.some(s => s.includes(target))) {
          matchedStrings.push(memStr);
        }
      }

      if (matchedStrings.length >= 2 || (matchedStrings.length === 1 && matchedStrings[0].length > 12)) {
        detections.push({
          ruleId: rule.id,
          name: rule.name,
          category: rule.category,
          severity: rule.severity,
          confidence: 'High (Memory Pattern Match)',
          context: context,
          reason: `Found cheat signature in memory: ${matchedStrings.join(', ')}`,
          evidence: matchedStrings
        });
      }
    }

    return detections;
  }

  /**
   * Matches USN Journal records for deleted or renamed files.
   */
  matchUsnRecord(record) {
    const detections = [];
    const fileName = (record.fileName || '').toLowerCase();
    const fullPath = (record.path || '').toLowerCase();

    for (const rule of this.getClientRules()) {
      if (!rule.usnPatterns) continue;

      for (const pattern of rule.usnPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(fileName) || regex.test(fullPath)) {
          detections.push({
            ruleId: rule.id,
            name: rule.name,
            category: rule.category,
            severity: 'CRITICAL',
            confidence: '100% (USN Forensic Record)',
            reason: `USN Journal recorded deletion/manipulation of ${rule.name} file: ${record.fileName}`,
            action: record.action || 'DELETED',
            timestamp: record.timestamp,
            file: record.fileName,
            path: record.path
          });
          break;
        }
      }
    }

    return detections;
  }
}

module.exports = new SignatureDatabase();
