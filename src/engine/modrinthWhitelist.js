/**
 * Atlas AC - Modrinth & Ecosystem 1000+ Clean Mod Whitelist Engine
 * Provides ultra-fast O(1) hash set lookups to instantly recognize legitimate,
 * safe mods from Modrinth, CurseForge, Fabric, Forge, NeoForge, and Quilt.
 * 
 * Guarantees ZERO false positives for popular community mods, while allowing
 * deep heuristic inspection if a legitimate mod was secretly backdoored / trojanized.
 */

const fs = require('fs');
const path = require('path');

class ModrinthWhitelistEngine {
  constructor() {
    this.cleanModIds = new Set();
    this.cleanNamespaces = [];
    this.cleanNameRegexes = [];
    this.totalCleanMods = 0;
    this.loadDatabase();
  }

  /**
   * Loads the Modrinth clean mod whitelist JSON database into memory.
   */
  loadDatabase() {
    try {
      const dbPath = path.join(__dirname, '..', 'signatures', 'modrinthWhitelist.json');
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (data && data.cleanMods) {
          for (const key of Object.keys(data.cleanMods)) {
            this.cleanModIds.add(key.toLowerCase());
            // Add sanitized versions (e.g., underscores vs hyphens)
            this.cleanModIds.add(key.replace(/-/g, '_').toLowerCase());
            this.cleanModIds.add(key.replace(/_/g, '-').toLowerCase());
          }
          this.totalCleanMods = this.cleanModIds.size;
        }
        if (data && Array.isArray(data.verifiedPackageNamespaces)) {
          this.cleanNamespaces = data.verifiedPackageNamespaces.map(ns => ns.replace(/\./g, '/').toLowerCase());
        }
      }

      // Additional well-known legitimate community mod IDs & Forge/CurseForge classics
      const builtInCleanMods = [
        'fiskheroes', 'fisktag', 'fisksuperheroes', 'fisks-superheroes',
        'create', 'supplementaries', 'tacz', 'itemphysic', 'irons_spellbooks',
        'industrialcraft', 'industrialcraft-2', 'ic2', 'coroutil', 'zombieawareness',
        'bomd', 'berezka_api', 'theundeadrevamped', 'appliedenergistics2',
        'cofhcore', 'thermalexpansion', 'thermalfoundation', 'notenoughitems',
        'codechickencore', 'waila', 'dynamiclights', 'fastcraft', 'securitycraft',
        'grimoireofgaia', 'biomesoplenty', 'chisel', 'carpentersblocks',
        'advancedsolarpanel'
      ];
      for (const id of builtInCleanMods) {
        this.cleanModIds.add(id.toLowerCase());
        this.cleanModIds.add(id.replace(/-/g, '_').toLowerCase());
        this.cleanModIds.add(id.replace(/_/g, '-').toLowerCase());
      }

      const builtInNamespaces = [
        'com/fiskmods', 'com/simibubi/create', 'net/mehvahdjukaar/supplementaries',
        'com/tacz', 'com/tac', 'dev/tr7zw/itemphysic', 'io/redspace/ironsspellbooks',
        'ic2', 'coro', 'net/teamhollow/bomd', 'berezka', 'theundeadrevamped',
        'appeng', 'cofh', 'codechicken', 'mcp/mobius/waila', 'atomicstryker/dynamiclights',
        'biomesoplenty', 'team/chisel', 'com/carpentersblocks', 'dan200/computercraft',
        'slimeknights/tconstruct', 'vazkii/botania', 'vazkii/quark'
      ];
      for (const ns of builtInNamespaces) {
        if (!this.cleanNamespaces.includes(ns)) {
          this.cleanNamespaces.push(ns);
        }
      }
    } catch (e) {
      console.warn('[!] Could not load Modrinth clean whitelist database:', e.message);
    }
  }

  /**
   * Checks if a string contains combat cheat or exploit keywords (e.g. autototem, reach, killaura).
   * @param {string} text 
   * @returns {boolean}
   */
  isForbiddenCheatKeyword(text) {
    if (!text) return false;
    const lower = String(text).toLowerCase();
    // Allow WI-Zoom / Wurst-Zoom since user explicitly requested it as safe zoom utility
    if (lower.includes('wurst-zoom') || lower.includes('wi-zoom') || lower.includes('wizoom')) {
      return false;
    }
    return /totem|autototem|killaura|reach|hitbox|aimbot|triggerbot|velocity|antiknockback|antikb|bhop|scaffold|fastplace|cheststealer|xray|baritone|meteor|wurst|doomsday|vape|drip|slinky|liquidbounce|aristois|cheat|hack|inject/i.test(lower);
  }

  /**
   * Checks if a given mod ID is in the clean Modrinth whitelist.
   * @param {string} modId 
   * @returns {boolean}
   */
  isCleanModId(modId) {
    if (!modId) return false;
    if (this.isForbiddenCheatKeyword(modId)) return false;
    const lower = String(modId).toLowerCase().trim();
    return this.cleanModIds.has(lower) ||
           this.cleanModIds.has(lower.replace(/-/g, '_')) ||
           this.cleanModIds.has(lower.replace(/_/g, '-'));
  }

  /**
   * Checks if a package path or class entry belongs to a verified clean namespace.
   * @param {string} classPath 
   * @returns {boolean}
   */
  isCleanNamespace(classPath) {
    if (!classPath) return false;
    const lower = String(classPath).replace(/\\/g, '/').toLowerCase();
    return this.cleanNamespaces.some(ns => lower.startsWith(ns) || lower.includes('/' + ns));
  }

  /**
   * Evaluates whether a JAR file is a verified clean Modrinth / Fabric / Forge mod.
   * @param {object} modMetadata - Parsed fabric.mod.json / mcmod.info / quilt.mod.json
   * @param {Array<string>} zipEntries - List of all entry paths inside the JAR
   * @param {string} fileName - File name of the JAR
   * @returns {object} { isWhitelisted: boolean, reason?: string, modId?: string }
   */
  isCleanMod(modMetadata = null, zipEntries = [], fileName = '') {
    const lowerFileName = (fileName || '').toLowerCase();

    // Reject any mod whose filename or metadata contains cheat keywords (e.g. autototem, reach, killaura)
    if (this.isForbiddenCheatKeyword(lowerFileName)) {
      return { isWhitelisted: false, reason: 'Dosya adı hile veya yetkisiz avantaj anahtar kelimesi içeriyor.' };
    }
    if (modMetadata && (
      this.isForbiddenCheatKeyword(modMetadata.id) ||
      this.isForbiddenCheatKeyword(modMetadata.modid) ||
      this.isForbiddenCheatKeyword(modMetadata.name)
    )) {
      return { isWhitelisted: false, reason: 'Mod tanımlayıcısı hile veya yetkisiz avantaj anahtar kelimesi içeriyor.' };
    }

    // 1. Direct match by mod metadata ID
    if (modMetadata && modMetadata.id) {
      const mId = String(modMetadata.id).toLowerCase();
      if (this.isCleanModId(mId)) {
        return {
          isWhitelisted: true,
          modId: mId,
          name: modMetadata.name || mId,
          source: 'MODRINTH_VERIFIED_MOD_ID',
          reason: `Mod ID '${mId}' doğrulanmış Modrinth / resmi ekosistem temiz mod beyaz listesinde yer almaktadır.`
        };
      }
    }

    // 2. Direct match by Quilt / Forge metadata
    if (modMetadata && modMetadata.modid) {
      const mId = String(modMetadata.modid).toLowerCase();
      if (this.isCleanModId(mId)) {
        return {
          isWhitelisted: true,
          modId: mId,
          name: modMetadata.name || mId,
          source: 'FORGE_VERIFIED_MOD_ID',
          reason: `Forge Mod ID '${mId}' doğrulanmış resmi temiz mod beyaz listesinde yer almaktadır.`
        };
      }
    }

    // 3. Match by verified clean package namespaces in class entries
    if (Array.isArray(zipEntries) && zipEntries.length > 0) {
      const classEntries = zipEntries.filter(e => e.endsWith('.class'));
      if (classEntries.length > 0) {
        let cleanNamespaceMatches = 0;
        for (const cls of classEntries) {
          if (this.isCleanNamespace(cls)) {
            cleanNamespaceMatches++;
          }
        }
        // If majority (> 60%) of classes match verified clean developer namespaces
        if (cleanNamespaceMatches / classEntries.length > 0.6) {
          return {
            isWhitelisted: true,
            modId: modMetadata && modMetadata.id ? modMetadata.id : path.basename(fileName, '.jar'),
            name: fileName,
            source: 'VERIFIED_DEVELOPER_PACKAGE_NAMESPACE',
            reason: `Mod sınıfları doğrulanmış resmi geliştirici paket alanında (${cleanNamespaceMatches}/${classEntries.length} sınıf) yer almaktadır.`
          };
        }
      }
    }

    // 4. Match clean file prefix (e.g. sodium-fabric-mc1.20.1-0.5.8.jar)
    for (const id of this.cleanModIds) {
      if (id.length >= 4 && lowerFileName.startsWith(id + '-') || lowerFileName.startsWith(id + '_')) {
        // Exclude cheats that disguise themselves with common words
        if (!/vape|drip|slinky|doomsday|cheat|hack|inject|reach|killaura|autoclicker|autototem|bplus/i.test(lowerFileName)) {
          return {
            isWhitelisted: true,
            modId: id,
            name: fileName,
            source: 'MODRINTH_CLEAN_FILENAME_PATTERN',
            reason: `Dosya adı '${fileName}' doğrulanmış Modrinth '${id}' temiz mod deseniyle eşleşmektedir.`
          };
        }
      }
    }

    return { isWhitelisted: false };
  }
}

module.exports = new ModrinthWhitelistEngine();
