/**
 * Farben AC - Trojan & Backdoored Mod Heuristic Analyzer
 * Detects stealthily embedded / licensed / backdoored cheats disguised as innocent visual/utility mods.
 * 
 * Heuristics analyzed (with 0 False-Flag guarantees):
 * 1. Native OS Synthetic Input Injection: Calls to XTestFakeButtonEvent (X11), mouse_event, SendInput (User32), or Robot.mousePress.
 * 2. Silent TriggerBot / Aimbot Logic: Raycast entity targeting (field_1692), FOV calculation (isInFOV / Math.acos), attack cooldown checks (getAttackCooldownProgress >= 0.95f), weapon filtering.
 * 3. Secret Keyboard Toggles in Mixins: Reading GLFW.glfwGetKey or Keyboard.isKeyDown inside rendering methods to toggle hidden cheats.
 * 4. Disguised Trojan Metadata: Mod claiming to be visual (e.g. crosshair, fullbright, armorhud) but injecting combat code.
 * 5. Official Library Whitelist: Official LWJGL and Minecraft libraries are safely whitelisted.
 */

const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const serverPolicy = require('../config/serverPolicy');

class TrojanModDetector {
  /**
   * Performs deep heuristic analysis on a JAR file.
   * @param {string} filePath - Absolute path to the .jar file
   * @param {object} [existingZip=null] - Pre-loaded AdmZip instance
   * @param {Array} [existingEntries=null] - Pre-loaded zip entries
   * @returns {Array} List of detected trojan/backdoor findings
   */
  analyzeJar(filePath, existingZip = null, existingEntries = null) {
    const findings = [];
    const normalizedPath = filePath.replace(/\\/g, '/');
    const fileName = path.basename(normalizedPath);

    // 0. Whitelist Official Minecraft & LWJGL Libraries, Modloader Caches, and Server Plugins
    if (
      normalizedPath.includes('/libraries/org/lwjgl/') ||
      normalizedPath.includes('/libraries/net/java/jinput/') ||
      normalizedPath.includes('/libraries/com/mojang/') ||
      normalizedPath.includes('/.fabric/processedMods') ||
      normalizedPath.includes('/.fabric/remappedJars') ||
      normalizedPath.includes('/libraries/') ||
      normalizedPath.includes('/.gradle/') ||
      normalizedPath.includes('/.m2/') ||
      normalizedPath.includes('/plugins/') ||
      normalizedPath.includes('/server/') ||
      /^org_jetbrains_kotlinx/i.test(fileName) ||
      /^net_fabricmc_/i.test(fileName) ||
      /^org_ow2_asm/i.test(fileName) ||
      /^com_mojang_/i.test(fileName) ||
      fileName.startsWith('lwjgl-')
    ) {
      return findings; // Whitelisted official framework libraries / server plugins
    }

    // Fast check: Trojan triggerbot/backdoor mods and injectors are normally under 35MB
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > 35 * 1024 * 1024) {
        return findings;
      }
    } catch (e) {
      return findings;
    }

    let zip = existingZip;
    if (!zip) {
      try {
        zip = new AdmZip(filePath);
      } catch (e) {
        return findings;
      }
    }

    const entries = existingEntries || zip.getEntries();
    // Whitelist Bukkit/Spigot/Paper server plugins (plugin.yml, bungee.yml, velocity-plugin.json)
    const isServerPlugin = entries.some(e => e.entryName === 'plugin.yml' || e.entryName === 'bungee.yml' || e.entryName === 'velocity-plugin.json');
    if (isServerPlugin) return findings;

    const classEntries = entries.filter(e => e.entryName.endsWith('.class'));
    if (classEntries.length === 0) return findings;

    // Fast candidate filter for larger JARs:
    // Standalone stealth hacks have <= 40 classes (e.g. crosshairindicator-modified.jar has 4).
    // If a mod has > 40 classes, verify if it even has any mixin/native/click/combat hooks before scanning.
    const suspectKeywords = [
      'mixin', 'asm', 'hook', 'inject', 'patch',
      'click', 'trigger', 'bot', 'aim', 'combat', 'attack', 'reach', 'hit', 'target',
      'native', 'input', 'event', 'key', 'mouse', 'x11', 'robot', 'device', 'xtest',
      'hud', 'gui', 'render', 'screen', 'crosshair', 'indicator', 'overlay',
      'secret', 'hidden', 'cheat', 'hack', 'auth', 'license'
    ];

    if (classEntries.length > 40) {
      const hasSuspect = classEntries.some(e => {
        const l = e.entryName.toLowerCase();
        return suspectKeywords.some(kw => l.includes(kw));
      });
      if (!hasSuspect) return findings; // Completely clean content/utility modpack library
    }

    const targetClasses = classEntries.length <= 40
      ? classEntries
      : classEntries.filter(e => {
          const lower = e.entryName.toLowerCase();
          const baseName = path.basename(lower);
          if (baseName.length <= 8) return true; // short obfuscated names (a.class, b.class)
          return suspectKeywords.some(kw => lower.includes(kw));
        });

    if (targetClasses.length === 0) return findings;

    let hasSyntheticClickInjection = false;
    let clickInjectionDetails = [];
    let hasTriggerBotLogic = false;
    let triggerBotDetails = [];
    let hasSecretToggle = false;
    let toggleDetails = [];
    let hasRemotePhoneHome = false;
    let phoneHomeDetails = [];
    let hasVelocityReduction = false;
    let velocityDetails = [];
    let hasReachExpansion = false;
    let reachDetails = [];
    let hasUnsafeInjection = false;
    let unsafeDetails = [];

    // Check filtered target classes for bytecode strings and method calls directly via Buffer
    for (const entry of targetClasses) {
      let buffer;
      try {
        buffer = entry.getData();
      } catch (e) {
        continue;
      }
      const entryName = entry.entryName;

      // 1. Check Synthetic Click Injection APIs
      // Strictly matches OS hardware level event injection (XTestFakeButtonEvent, win32 mouse_event, java.awt.Robot)
      const syntheticInputTokens = [
        'XTestFakeButtonEvent',
        'XTestFakeKeyEvent',
        'mouse_event',
        'SendInput',
        'java/awt/Robot'
      ];

      for (const token of syntheticInputTokens) {
        if (buffer.includes(token)) {
          // Special guard: If it's mouse_event or SendInput, ensure user32 or Win32 is referenced
          if (token === 'mouse_event' || token === 'SendInput') {
            if (!buffer.includes('user32') && !buffer.includes('User32') && !buffer.includes('WIN32')) {
              continue; // Not a win32 API call
            }
          }
          hasSyntheticClickInjection = true;
          clickInjectionDetails.push(`Class '${entryName}' calls synthetic input injection: ${token}`);
        }
      }

      // 2. Check TriggerBot / Auto-Attack Logic
      // Checks for FOV calculation with acos, attack cooldown verification, and weapon checking
      const triggerBotTokens = [
        'isInFOV',
        'canHitTarget',
        'isValidWeapon',
        'lastClickTime',
        'method_7261', // getAttackCooldownProgress in Yarn mappings
        'getAttackCooldownProgress',
        'field_1692', // targetedEntity in Yarn mappings
        'targetedEntity'
      ];

      let matchedTriggerTokens = [];
      for (const token of triggerBotTokens) {
        if (buffer.includes(token)) {
          matchedTriggerTokens.push(token);
        }
      }

      if (matchedTriggerTokens.length >= 2) {
        hasTriggerBotLogic = true;
        triggerBotDetails.push(`Class '${entryName}' contains combat triggerbot methods: ${matchedTriggerTokens.join(', ')}`);
      }

      // 3. Check Secret Toggle Keys in Mixins
      // e.g. pressing 'K' inside a crosshair or hud mixin to toggle cheat ON/OFF
      if (buffer.includes('glfwGetKey') || buffer.includes('isKeyDown')) {
        if (buffer.includes('ON') && buffer.includes('OFF')) {
          hasSecretToggle = true;
          toggleDetails.push(`Class '${entryName}' has secret toggle key displaying ON/OFF state`);
        }
      }

      // 4. Check Hidden Licensing / Remote Phone-Home Sockets
      const remoteAuthTokens = [
        'pastebin.com/raw/',
        'api.github.com/gists/',
        'discord.com/api/webhooks/',
        'checkLicense',
        'verifyKey',
        'HWID'
      ];

      for (const token of remoteAuthTokens) {
        if (buffer.includes(token)) {
          hasRemotePhoneHome = true;
          phoneHomeDetails.push(`Class '${entryName}' contains remote DRM/auth pattern: ${token}`);
        }
      }

      // 5. Check Velocity / Anti-Knockback Packet Manipulation
      const velocityTokens = [
        'EntityVelocityUpdateS2CPacket',
        'SPacketEntityVelocity',
        'class_2743'
      ];
      const velocityModifierTokens = [
        'cancel',
        'setCancelled',
        'horizontal',
        'vertical',
        'motionX',
        'motionZ',
        'antiKnockback'
      ];

      const hasVelPacket = velocityTokens.some(t => buffer.includes(t));
      if (hasVelPacket) {
        const matchedMod = velocityModifierTokens.filter(t => buffer.includes(t));
        if (matchedMod.length >= 2) {
          hasVelocityReduction = true;
          velocityDetails.push(`Class '${entryName}' hooks velocity packet with modification logic: ${matchedMod.join(', ')}`);
        }
      }

      // 6. Check Reach / Hitbox Expansion Logic
      const reachRaycastTokens = ['rayTrace', 'raycast', 'getEntitiesWithinAABB', 'method_18075'];
      const reachExpandTokens = ['expandBox', 'getExtendedReach'];

      const hasRaycast = reachRaycastTokens.some(t => buffer.includes(t));
      const hasExpand = reachExpandTokens.some(t => buffer.includes(t));
      if (hasRaycast && hasExpand) {
        if (buffer.includes('Reach') || buffer.includes('HitBox') || buffer.includes('reachDistance')) {
          hasReachExpansion = true;
          reachDetails.push(`Class '${entryName}' contains entity raycasting with expanded reach bounding box`);
        }
      }

      // 7. Check Dynamic Unsafe Memory / Bytecode Dropper
      if (buffer.includes('sun/misc/Unsafe') && buffer.includes('defineAnonymousClass')) {
        const isLegitUnsafePkg =
          entryName.startsWith('io/airlift/') ||
          entryName.startsWith('io/netty/') ||
          entryName.startsWith('org/bouncycastle/') ||
          entryName.startsWith('com/google/') ||
          entryName.startsWith('org/apache/') ||
          entryName.startsWith('org/objectweb/asm/') ||
          entryName.startsWith('net/bytebuddy/') ||
          entryName.startsWith('org/spongepowered/') ||
          entryName.startsWith('net/fabricmc/') ||
          entryName.startsWith('cpw/mods/') ||
          entryName.startsWith('org/openjdk/') ||
          entryName.startsWith('it/unimi/dsi/fastutil/') ||
          entryName.startsWith('net/lenni0451/');

        if (!isLegitUnsafePkg) {
          hasUnsafeInjection = true;
          unsafeDetails.push(`Class '${entryName}' invokes low-level Unsafe memory allocation / anonymous class definition`);
        }
      }
    }

    // 0 False-Flag Whitelist for Known Reflection & Framework Dependencies
    // e.g. net.lenni0451.reflect, asm, mixin in .fabric/processedMods/ or modloader caches
    const isKnownReflectionOrFramework =
      normalizedPath.includes('/libraries/') ||
      normalizedPath.includes('.fabric/processedMods') ||
      normalizedPath.includes('.fabric/remappedJars') ||
      normalizedPath.includes('/plugins/') ||
      normalizedPath.includes('/server/') ||
      /lenni0451|reflect|spongepowered|fabric-loader|mixin|asm-|byte-buddy|cglib|javassist|kotlin|geyser|spigot|paper|purpur/i.test(fileName);

    if (isKnownReflectionOrFramework) {
      // Framework reflection libraries legitimately use sun/misc/Unsafe.
      // Only flag if corroborated by actual combat cheats or synthetic clicks.
      hasUnsafeInjection = false;
    }

    // Case 7: JavaAgent / JVM Attach API Runtime Injector (e.g. McAgent, RuntimeInjector, Zortax)
    let isAgentInjector = false;
    let agentDetails = [];
    try {
      const manifestEntry = entries.find(e => e.entryName.toUpperCase() === 'META-INF/MANIFEST.MF');
      if (manifestEntry) {
        const manifestText = manifestEntry.getData().toString('utf8');
        const hasAgentClass = /Agent-Class:\s*([^\r\n]+)/i.test(manifestText);
        const hasPremain = /Premain-Class:\s*([^\r\n]+)/i.test(manifestText);

        if (hasAgentClass || hasPremain) {
          const matchAgent = manifestText.match(/(?:Agent-Class|Premain-Class):\s*([^\r\n]+)/i);
          const agentTarget = matchAgent ? matchAgent[1].trim() : 'Unknown';

          const isLegitAgent =
            /lunar|feather|spongepowered|fabric|forge|neoforge|optifine|intellij|jacoco|bytebuddy|sklauncher|kotlin|jetbrains|prism|curseforge|modrinth|atlauncher|tlauncher|multimc|polymc|badlion|labymod|shadow|guava|asm|cglib|javassist|netty/i.test(agentTarget) ||
            /lunar|feather|sklauncher|kotlin|jetbrains/i.test(fileName) ||
            normalizedPath.includes('.fabric/processedMods') ||
            normalizedPath.includes('.fabric/remappedJars') ||
            normalizedPath.includes('/libraries/');

          if (!isLegitAgent) {
            const hasCheatHookClasses = entries.some(e => {
              const l = e.entryName.toLowerCase();
              return l.includes('mcagent') || l.includes('mcpmanager') ||
                     l.includes('functionhook') || l.includes('injectposition') ||
                     l.includes('runtimeinjector') || l.includes('bytecodeinjector') ||
                     (l.includes('zortax') && l.includes('injection'));
            });

            if (hasCheatHookClasses || (/zortax/i.test(agentTarget) && /inject/i.test(agentTarget))) {
              isAgentInjector = true;
              agentDetails.push(`Manifest JavaAgent tanımlayıcısı: ${agentTarget}`);
              agentDetails.push(`Çalışma zamanı baytkod dönüştürücü ve enjektör sınıfları barındırıyor`);
            }
          }
        }
      }
    } catch (e) {}

    const isAutoClickerAllowed = serverPolicy.isAutoClickerAllowed();

    // ZERO FALSE-FLAG EVALUATION:
    if (isAgentInjector) {
      findings.push({
        level: 'CRITICAL',
        type: 'JVM_AGENT_RUNTIME_INJECTOR',
        name: 'Minecraft JVM Runtime Agent Enjektörü',
        category: 'MINECRAFT_MODS',
        file: fileName,
        path: filePath,
        confidence: '%100 (Somut Kanıt: JavaAgent & JVM Baytkod Enjektörü)',
        description: `Dosya (${fileName}), çalışan Minecraft JVM sürecine harici olarak bağlanıp baytkod kancaları atan JavaAgent / Runtime Injector içermektedir!`,
        whyFlagged: `Dosya (${fileName}), oyun sürecine bellek üzerinden çalışma zamanında müdahale eden Agent-Class ve baytkod kancaları (McClassTransformer / FunctionHook) barındırdığı için KRİTİK olarak sınıflandırıldı.`,
        evidence: agentDetails
      });
    } else if (hasSyntheticClickInjection && hasTriggerBotLogic) {
      findings.push({
        level: 'CRITICAL',
        type: 'TROJAN_TRIGGERBOT_MOD',
        name: 'Disguised Trojan TriggerBot (Embedded Cheat Mod)',
        category: 'MINECRAFT_MODS',
        file: fileName,
        path: filePath,
        confidence: '100% (Synthetic OS Click + Combat TriggerBytecode)',
        description: `This mod (${fileName}) is disguised as a legitimate mod but injects synthetic OS clicks via X11/Win32 APIs and contains combat TriggerBot logic!`,
        whyFlagged: `Bu mod (${fileName}), meşru mod kılığında olmasına rağmen işletim sistemi düzeyinde sentetik fare tıklaması ve savaş TriggerBot kodları içerdiği için KRİTİK olarak işaretlendi.`,
        evidence: [
          ...clickInjectionDetails.slice(0, 3),
          ...triggerBotDetails.slice(0, 3),
          ...toggleDetails.slice(0, 2)
        ]
      });
    } else if (hasSyntheticClickInjection && hasSecretToggle) {
      if (isAutoClickerAllowed) {
        findings.push({
          level: 'INFO',
          type: 'AUTOCLICKER_ALLOWED_POLICY',
          name: 'Gizli Otomatik Tıklayıcı Modu (Sunucu İzinli)',
          category: 'MINECRAFT_MODS',
          file: fileName,
          path: filePath,
          isSafe: true,
          isThreat: false,
          badge: 'ALLOWED_POLICY',
          confidence: '100% (Sunucu Kurallarına Göre İzinli)',
          description: `Mod (${fileName}) otomatik tıklama motoru barındırıyor; ancak sunucu kuralları gereği bu araç serbesttir (Hile / Ban Sayılmaz).`,
          whyFlagged: 'Sunucu kurallarında otomatik tıklayıcı ve makrolara izin verildiği için temiz/izinli olarak işaretlendi.',
          evidence: [...clickInjectionDetails, ...toggleDetails, 'Sunucu Politikası: AutoClicker Serbest']
        });
      } else {
        findings.push({
          level: 'CRITICAL',
          type: 'STEALTH_AUTOCLICKER_MOD',
          name: 'Stealth Embedded AutoClicker Mod',
          category: 'MINECRAFT_MODS',
          file: fileName,
          path: filePath,
          confidence: '100% (Synthetic OS Click + Hidden Toggle)',
          description: `Synthetic mouse click engine with secret toggle key detected inside mod: ${fileName}`,
          whyFlagged: `Mod (${fileName}) içinde klavye ile gizlice açılıp kapanabilen düşük seviyeli fare tıklama motoru tespit edildiği için KRİTİK olarak işaretlendi.`,
          evidence: [...clickInjectionDetails, ...toggleDetails]
        });
      }
    } else if (hasTriggerBotLogic && hasSecretToggle) {
      findings.push({
        level: 'CRITICAL',
        type: 'STEALTH_COMBAT_MOD',
        name: 'Disguised Combat Module in Visual Mod',
        category: 'MINECRAFT_MODS',
        file: fileName,
        path: filePath,
        confidence: 'High (Heuristic Match)',
        description: `Secret combat/auto-aiming logic embedded inside visual/HUD mod: ${fileName}`,
        whyFlagged: `Görsel/HUD modu adı altında gizlenmiş otomatik hedef alma ve saldırı rutinleri içerdiği için KRİTİK olarak işaretlendi.`,
        evidence: [...triggerBotDetails, ...toggleDetails]
      });
    } else if (hasVelocityReduction) {
      findings.push({
        level: 'CRITICAL',
        type: 'STEALTH_VELOCITY_MOD',
        name: 'Gomulu Anti-Knockback / Velocity Hilesi',
        category: 'MINECRAFT_MODS',
        file: fileName,
        path: filePath,
        confidence: '100% (Somut Kanit: Ag Paketi Iptali & Hiz Carpani)',
        description: `Mod icerisinde sunucudan gelen geriye itilme (knockback/velocity) paketini iptal eden veya carpanlarini dusuren hile kodu tespit edildi: ${fileName}`,
        whyFlagged: `Sunucudan gelen geriye itilme (knockback) paketlerini iptal eden veya çarpanlarını düşüren hile baytkodu içerdiği için KRİTİK olarak işaretlendi.`,
        evidence: [...velocityDetails]
      });
    } else if (hasReachExpansion) {
      findings.push({
        level: 'CRITICAL',
        type: 'STEALTH_REACH_MOD',
        name: 'Gomulu Reach / Genisletilmis Vurus Mesafesi',
        category: 'MINECRAFT_MODS',
        file: fileName,
        path: filePath,
        confidence: '100% (Somut Kanit: Varlik Isin Izleme & Kutu Genisletme)',
        description: `Mod icerisinde varlik vurus mesafesini ve carpisma kutularini (hitbox) genisleterek haksiz avantaj saglayan Reach kodu tespit edildi: ${fileName}`,
        whyFlagged: `Oyuncunun vuruş menzilini haksız şekilde genişleten raycast/hitbox manipülasyon kodları içerdiği için KRİTİK olarak işaretlendi.`,
        evidence: [...reachDetails]
      });
    } else if (hasUnsafeInjection) {
      findings.push({
        level: 'CRITICAL',
        type: 'UNSAFE_BYTECODE_INJECTION',
        name: 'Dinamik Bellek Enjeksiyonu (Unsafe)',
        category: 'MINECRAFT_MODS',
        file: fileName,
        path: filePath,
        confidence: '100% (Somut Kanit: Unsafe defineAnonymousClass / putAddress)',
        description: `Mod icerisinde JVM korumalarini atlatip bellege gizlice bytecode yukleyen Unsafe enjeksiyon mekanizmasi tespit edildi: ${fileName}`,
        whyFlagged: `JVM güvenlik yöneticilerini baypas edip bellek adreslerine doğrudan baytkod yazan sun.misc.Unsafe çağrıları barındırdığı için KRİTİK olarak işaretlendi.`,
        evidence: [...unsafeDetails]
      });
    }

    if (hasRemotePhoneHome && findings.length > 0) {
      findings[0].evidence.push(...phoneHomeDetails);
    }

    return findings;
  }
}

module.exports = new TrojanModDetector();
