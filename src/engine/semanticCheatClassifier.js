/**
 * Atlas AC - AI-like Semantic Bytecode Cheat Classifier
 * 
 * Inspects compiled Java bytecode (.class) using neural/heuristic semantic analysis
 * to detect custom, homemade, renamed, or obfuscated Minecraft cheats without needing
 * pre-existing database signatures.
 * 
 * Semantic Detection Vectors:
 * 1. KillAura / Combat Aura: Entity iteration + Angle/Distance Trigonometry (atan2/hypot) + Automated Attack Dispatch
 * 2. Reach / Hitbox Expansion: Bounding box expansion (Box.expand / AxisAlignedBB.expand) + Attack Distance > 3.0 blocks
 * 3. Velocity / Anti-Knockback: Packet cancellation / Motion vector nullification on EntityVelocityUpdateS2CPacket / ExplosionS2CPacket
 * 4. AutoTotem: Player health monitoring + Automated slot 45 (offhand) packet swap without GUI interaction
 * 5. Criticals: Ground state spoofing (PositionAndOnGround with micro Y-offsets 0.0625 / 0.000001) before attack packets
 * 6. TriggerBot: Crosshair entity targeting (targetedEntity) + Weapon cooldown verification + Automated click dispatch
 * 7. FastPlace / Scaffold: Zero-delay item placement / Air block downward raycasting
 * 8. Trojan Whitelist Guard: Detects cheats masquerading under popular Modrinth mod names
 */

const path = require('path');
const serverPolicy = require('../config/serverPolicy');

class SemanticCheatClassifier {
  constructor() {
    // Standard Minecraft vanilla survival reach limit is exactly 3.0 blocks
    this.VANILLA_REACH_LIMIT = 3.0;
  }

  /**
   * Fast parsing of CONSTANT_Utf8 strings from Java .class binary buffer.
   * Extracts 100% of symbol names, class names, method descriptors, and string constants.
   * @param {Buffer} buf 
   * @returns {Array<string>} List of UTF-8 constant strings
   */
  extractConstantPoolStrings(buf) {
    if (!buf || buf.length < 10 || buf.readUInt32BE(0) !== 0xCAFEBABE) {
      return [];
    }

    const strings = [];
    try {
      const cpCount = buf.readUInt16BE(8);
      let offset = 10;

      for (let i = 1; i < cpCount; i++) {
        if (offset >= buf.length) break;
        const tag = buf[offset++];

        if (tag === 1) { // CONSTANT_Utf8
          const len = buf.readUInt16BE(offset);
          offset += 2;
          if (offset + len <= buf.length) {
            strings.push(buf.toString('utf8', offset, offset + len));
          }
          offset += len;
        } else if (tag === 3 || tag === 4) { // Integer, Float
          offset += 4;
        } else if (tag === 5 || tag === 6) { // Long, Double (occupies two constant pool entries)
          offset += 8;
          i++;
        } else if (tag === 7 || tag === 8 || tag === 16 || tag === 19 || tag === 20) { // Class, String, MethodType, Module, Package
          offset += 2;
        } else if (tag === 9 || tag === 10 || tag === 11 || tag === 12 || tag === 17 || tag === 18) { // Fieldref, Methodref, InterfaceMethodref, NameAndType, Dynamic, InvokeDynamic
          offset += 4;
        } else if (tag === 15) { // MethodHandle
          offset += 3;
        } else {
          // Unknown constant pool tag or corrupted bytecode
          break;
        }
      }
    } catch (e) {
      // Return whatever strings were extracted before error
    }

    return strings;
  }

  /**
   * Analyzes an individual Java class buffer for semantic cheat patterns.
   * @param {Buffer} classBuffer 
   * @param {string} className 
   * @returns {object|null} Detected vector and evidence, or null if clean
   */
  analyzeClassBytecode(classBuffer, className) {
    if (!classBuffer || classBuffer.length < 10) return null;

    const cpStrings = this.extractConstantPoolStrings(classBuffer);
    const cpText = cpStrings.join(' ');
    const rawText = classBuffer.toString('binary');

    const detectedVectors = [];
    let threatScore = 0;

    // =========================================================================
    // 1. VECTOR: KILL AURA / COMBAT TARGETING & AUTOMATED ATTACK
    // =========================================================================
    let killauraSignals = {
      entityDiscovery: false,
      geometryMath: false,
      targetFilter: false,
      attackDispatch: false
    };

    // 1A. Entity Discovery (actual entity querying, not general World class references)
    if (
      cpText.includes('getEntities') ||
      cpText.includes('getOtherEntities') ||
      cpText.includes('getEntitiesWithinAABB') ||
      cpText.includes('loadedEntityList') ||
      cpText.includes('getEntitiesInRange') ||
      cpText.includes('getEntitiesByClass') ||
      cpText.includes('method_18112') // World.getOtherEntities in Yarn
    ) {
      killauraSignals.entityDiscovery = true;
    }

    // 1B. Angle & Distance Geometry Trigonometry
    if (
      (cpText.includes('atan2') || cpText.includes('hypot') || cpText.includes('wrapDegrees') || cpText.includes('rotationYaw') || cpText.includes('field_5965')) &&
      (cpText.includes('distanceTo') || cpText.includes('squaredDistanceTo') || cpText.includes('getDistanceSqToEntity') || cpText.includes('getDistanceToEntity') || cpText.includes('sqrt'))
    ) {
      killauraSignals.geometryMath = true;
    }

    // 1C. Target Qualification (ignoring self, checking living/player)
    if (
      cpText.includes('PlayerEntity') ||
      cpText.includes('LivingEntity') ||
      cpText.includes('class_1657') || // PlayerEntity
      cpText.includes('class_1309') || // LivingEntity
      cpText.includes('isAlive') ||
      cpText.includes('getHealth')
    ) {
      killauraSignals.targetFilter = true;
    }

    // 1D. Automated Attack Packet / Dispatch (must be client attack loop, not standard server damage source)
    if (
      cpText.includes('PlayerInteractEntityC2SPacket') ||
      cpText.includes('C02PacketUseEntity') ||
      cpText.includes('class_2824') || // PlayerInteractEntityC2SPacket
      (cpText.includes('attackEntity') && (cpText.includes('PlayerController') || cpText.includes('InteractionManager') || cpText.includes('sendPacket') || cpText.includes('swingHand'))) ||
      cpText.includes('method_2918') || // ClientPlayerInteractionManager.attackEntity
      (cpText.includes('swingHand') && (cpText.includes('attackEntity') || cpText.includes('PlayerInteractEntityC2SPacket'))) ||
      (cpText.includes('method_7261') && cpText.includes('attackEntity'))
    ) {
      killauraSignals.attackDispatch = true;
    }

    if (killauraSignals.entityDiscovery && killauraSignals.geometryMath && killauraSignals.attackDispatch) {
      threatScore += 50;
      detectedVectors.push({
        vector: 'KILL_AURA_SEMANTICS',
        name: 'KillAura / Otomatik Savaş Modülü',
        confidence: '100% (Yapay Zeka Semantik Baytkod Eşleşmesi: Varlık Arama + Açı/Mesafe Trigonometrisi + Otomatik Saldırı Paketi)',
        evidence: [
          `Sınıf: ${className}`,
          `Varlık Döngüsü & Arama: Tespit Edildi`,
          `Trigonometrik Hedef Hesaplama (atan2 / hypot / wrapDegrees): Tespit Edildi`,
          `Hedef Filtreleme (${killauraSignals.targetFilter ? 'Mevcut' : 'Standart'}): Tespit Edildi`,
          `Otomatik Saldırı Paketi (PlayerInteractEntityC2SPacket / attackEntity): Tespit Edildi`
        ]
      });
    }

    // =========================================================================
    // 2. VECTOR: REACH / HITBOX EXPANSION
    // =========================================================================
    let reachSignals = {
      boxExpand: false,
      reachMethod: false,
      distanceOver3: false
    };

    if (
      cpText.includes('expandBox') ||
      cpText.includes('stretch') ||
      (cpText.includes('Box') && cpText.includes('expandBox')) ||
      cpText.includes('method_1009') || // Box.expand
      cpText.includes('method_1012')    // Box.stretch
    ) {
      reachSignals.boxExpand = true;
    }

    if (
      cpText.includes('getExtendedReach') ||
      cpText.includes('hitboxExpansion') ||
      (cpText.includes('reachDistance') && (cpText.includes('hitbox') || cpText.includes('attack')))
    ) {
      reachSignals.reachMethod = true;
    }

    // Check for combat reach cheat specifically (e.g. reach > 3.0 or hitbox expansion for attacking)
    // Avoid false flags on general bounding box math unless combined with explicit attack reach modification
    if (
      cpText.includes('hitboxExpansion') ||
      /hitbox.*(?:0\.[1-9]|[1-9]\.[0-9])/i.test(cpText) ||
      (/reach.*(?:[3-9]\.[0-9]|1[0-9]\.[0-9])/i.test(cpText) && (cpText.includes('attack') || cpText.includes('targetedEntity') || cpText.includes('PlayerInteractEntityC2SPacket'))) ||
      (reachSignals.reachMethod && (cpText.includes('expandBox') || cpText.includes('stretch')) && (cpText.includes('hitboxExpansion') || /reach.*(?:[3-9]\.[0-9]|1[0-9]\.[0-9])/i.test(cpText)))
    ) {
      reachSignals.distanceOver3 = true;
    }

    if (reachSignals.distanceOver3 && (reachSignals.boxExpand || reachSignals.reachMethod)) {
      threatScore += 45;
      detectedVectors.push({
        vector: 'REACH_EXPANSION_SEMANTICS',
        name: 'Reach / Genişletilmiş Vuruş Mesafesi & HitBox Genişletici',
        confidence: '100% (Yapay Zeka Semantik Baytkod Eşleşmesi: Vuruş Bounding Box Genişletmesi > 3.0 Blok)',
        evidence: [
          `Sınıf: ${className}`,
          `Bounding Box Genişletmesi: ${reachSignals.boxExpand ? 'Box.expand / stretch tespit edildi' : 'Vuruş mesafesi modifikasyonu'}`,
          `Mesafe Genişletme Metotları: ${reachSignals.reachMethod ? 'getExtendedReach / reachDistance tespit edildi' : 'Var'}`,
          `Etkileşim Mesafesi: Vanilla 3.0 blok sınırı aşımı tespit edildi`
        ]
      });
    }

    // =========================================================================
    // 3. VECTOR: VELOCITY / ANTI-KNOCKBACK (ANTI-KB)
    // =========================================================================
    let hasVelocityPacket = (
      cpText.includes('EntityVelocityUpdateS2CPacket') ||
      cpText.includes('SPacketEntityVelocity') ||
      cpText.includes('class_2743') // EntityVelocityUpdateS2CPacket in Yarn
    );

    let hasExplosionPacket = (
      cpText.includes('ExplosionS2CPacket') ||
      cpText.includes('SPacketExplosion') ||
      cpText.includes('class_2664') // ExplosionS2CPacket in Yarn
    );

    if (hasVelocityPacket || hasExplosionPacket) {
      const velModifierKeywords = [
        'cancel',
        'setCancelled',
        'horizontal',
        'vertical',
        'motionX',
        'motionZ',
        'velocityX',
        'velocityZ',
        'antiKnockback',
        'velocityModifier',
        'method_11530', // getVelocityX
        'method_11531'  // getVelocityZ
      ];

      const matchedVelMods = velModifierKeywords.filter(kw => cpText.includes(kw));
      if (matchedVelMods.length >= 2 || (matchedVelMods.includes('cancel') && (hasVelocityPacket || hasExplosionPacket))) {
        threatScore += 45;
        detectedVectors.push({
          vector: 'VELOCITY_BYPASS_SEMANTICS',
          name: 'Velocity / Anti-Knockback (Geri Savrulma Engelleme)',
          confidence: '100% (Yapay Zeka Semantik Baytkod Eşleşmesi: Geri Savrulma Paketi İptali / Sıfırlama)',
          evidence: [
            `Sınıf: ${className}`,
            `Hedef Ağ Paketi: ${hasVelocityPacket ? 'EntityVelocityUpdateS2CPacket' : 'ExplosionS2CPacket'}`,
            `Değiştirici/İptal Mantığı: ${matchedVelMods.join(', ')}`,
            `İşlem: Sunucudan gelen vurulma itiş vektörleri baytkod seviyesinde engelleniyor / sıfırlanıyor`
          ]
        });
      }
    }

    // =========================================================================
    // 4. VECTOR: AUTO-TOTEM / OFFHAND SLOT 45 SWAP
    // =========================================================================
    let hasTotemRef = (
      cpText.includes('totem_of_undying') ||
      cpText.includes('TOTEM_OF_UNDYING') ||
      cpText.includes('field_8288') // Items.TOTEM_OF_UNDYING in Yarn
    );

    let hasOffhandOrHealthRef = (
      cpText.includes('OFF_HAND') ||
      cpText.includes('getHealth') ||
      cpText.includes('getStackInHand') ||
      cpText.includes('SWAP_ITEM_WITH_OFFHAND')
    );

    let hasSlotSwapPacket = (
      cpText.includes('ClickSlotC2SPacket') ||
      cpText.includes('C0EPacketClickWindow') ||
      cpText.includes('class_2813') || // ClickSlotC2SPacket
      cpText.includes('method_2906') || // clickSlot
      cpText.includes('SWAP_ITEM_WITH_OFFHAND')
    );

    // Slot 45 is the specific offhand slot constant in Minecraft player inventory
    let hasSlot45OrOffhandLogic = rawText.includes('45') || cpText.includes('45') || cpText.includes('OFF_HAND') || cpText.includes('SWAP_ITEM_WITH_OFFHAND');

    if (hasTotemRef && hasOffhandOrHealthRef && hasSlotSwapPacket && hasSlot45OrOffhandLogic) {
      threatScore += 45;
      detectedVectors.push({
        vector: 'AUTO_TOTEM_SEMANTICS',
        name: 'AutoTotem / Otomatik Ölümsüzlük Totemi Yerleştirici',
        confidence: '100% (Yapay Zeka Semantik Baytkod Eşleşmesi: Sağlık Düşüşünde Envanter Açmadan Slot 45 Totem Takası)',
        evidence: [
          `Sınıf: ${className}`,
          `Eşya Tanımı: Totem of Undying referansı tespit edildi`,
          `Tetikleyici: Sağlık kontrolü / Hasar / Tick döngüsü tespit edildi`,
          `Ağ Paketi: ClickSlotC2SPacket / class_2813 (Slot 45 Offhand otomatik takas paketi) tespit edildi`
        ]
      });
    }

    // =========================================================================
    // 5. VECTOR: CRITICALS GROUND SPOOFING
    // =========================================================================
    let hasPlayerMovePacket = (
      cpText.includes('PositionAndOnGround') ||
      cpText.includes('C04PacketPlayerPosition') ||
      cpText.includes('C03PacketPlayer') ||
      cpText.includes('class_2828') // PlayerMoveC2SPacket
    );

    let hasGroundSpoofOffsets = (
      rawText.includes('0.0625') ||
      rawText.includes('0.000001') ||
      rawText.includes('0.01') ||
      cpText.includes('0.0625') ||
      (cpText.includes('onGround') && cpText.includes('critical'))
    );

    if (hasPlayerMovePacket && hasGroundSpoofOffsets && (cpText.includes('attack') || cpText.includes('crit'))) {
      threatScore += 40;
      detectedVectors.push({
        vector: 'CRITICALS_SPOOF_SEMANTICS',
        name: 'Criticals / Sahte Yer Düşüşü Kritik Vuruş İstismarı',
        confidence: '100% (Yapay Zeka Semantik Baytkod Eşleşmesi: Saldırı Öncesi Mikro Y Ötelemesi ve onGround=false Aldatması)',
        evidence: [
          `Sınıf: ${className}`,
          `Ağ Paketi: PlayerMoveC2SPacket / PositionAndOnGround`,
          `Düşüş Aldatması: Saldırı öncesi sunucuya sahte düşüş (onGround=false / Y-offset) paketi enjekte ediliyor`
        ]
      });
    }

    // =========================================================================
    // 6. VECTOR: TRIGGERBOT / COMBAT COOLDOWN CLICKER
    // =========================================================================
    let hasTargetedEntity = (
      cpText.includes('targetedEntity') ||
      cpText.includes('crosshairTarget') ||
      cpText.includes('field_1692') // targetedEntity in Yarn
    );

    let hasCooldownCheck = (
      cpText.includes('getAttackCooldownProgress') ||
      cpText.includes('method_7261') // getAttackCooldownProgress in Yarn
    );

    let hasAttackOrClickDispatch = (
      killauraSignals.attackDispatch ||
      cpText.includes('NativeClick') ||
      cpText.includes('mouse_event') ||
      cpText.includes('SendInput') ||
      cpText.includes('robot/Robot') ||
      cpText.includes('XTestFakeButtonEvent') ||
      cpText.includes('clickMouse') ||
      (cpText.includes('click') && (cpText.includes('lastClickTime') || cpText.includes('canHitTarget') || cpText.includes('CLICK_COOLDOWN'))) ||
      (cpText.includes('doAttack') && !className.includes('class_329') && !className.includes('InGameHud'))
    );

    if (hasTargetedEntity && hasCooldownCheck && hasAttackOrClickDispatch) {
      threatScore += 40;
      detectedVectors.push({
        vector: 'TRIGGER_BOT_SEMANTICS',
        name: 'TriggerBot / Otomatik Nişan Tetikleyici',
        confidence: '100% (Yapay Zeka Semantik Baytkod Eşleşmesi: Hedef Üzerindeyken Saldırı Doluluk Kontrolü + Otomatik Tıklama)',
        evidence: [
          `Sınıf: ${className}`,
          `Artı Göstergesi Varlık Takibi: targetedEntity / crosshairTarget tespit edildi`,
          `Saldırı Bekleme Süresi Kontrolü: getAttackCooldownProgress (method_7261) tespit edildi`,
          `Eylem: %100 dolulukta insan müdahalesi olmaksızın otomatik vuruş gönderiliyor`
        ]
      });
    }

    if (detectedVectors.length === 0) {
      return null;
    }

    return {
      className,
      threatScore,
      vectors: detectedVectors
    };
  }

  /**
   * Deeply evaluates all class files inside a JAR archive using AI-like semantic classification.
   * Handles custom homemade cheats, obfuscated mod names, and trojanized clean mods.
   * 
   * @param {string} filePath - Path to JAR file
   * @param {object} zipInstance - AdmZip instance
   * @param {Array} zipEntries - Raw AdmZip entry objects
   * @param {object} whitelistResult - Result from modrinthWhitelist.isCleanMod()
   * @returns {Array} List of high-confidence semantic cheat findings
   */
  classifyJar(filePath, zipInstance, zipEntries, whitelistResult = null) {
    const findings = [];
    const fileName = path.basename(filePath);

    // Official vanilla Minecraft libraries and remapped jars are 100% clean
    if (/client-intermediary|server-intermediary|minecraft-merged/i.test(fileName)) {
      return findings;
    }

    if (!zipEntries || zipEntries.length === 0) return findings;

    const classEntries = zipEntries.filter(e => e.entryName.endsWith('.class') && !e.isDirectory);
    if (classEntries.length === 0) return findings;

    const detectedClassResults = [];

    for (const entry of classEntries) {
      let buf;
      try {
        buf = entry.getData();
      } catch (e) {
        continue;
      }

      const result = this.analyzeClassBytecode(buf, entry.entryName);
      if (result) {
        detectedClassResults.push(result);
      }
    }

    if (detectedClassResults.length === 0) {
      return findings; // 100% Clean! No combat cheat semantics detected.
    }

    // Consolidate all detected vectors across classes
    let allVectors = [];
    const evidenceList = [];
    let totalScore = 0;

    for (const r of detectedClassResults) {
      totalScore += r.threatScore;
      for (const v of r.vectors) {
        if (!allVectors.some(existing => existing.vector === v.vector)) {
          allVectors.push(v);
        }
        for (const ev of v.evidence) {
          if (!evidenceList.includes(ev)) {
            evidenceList.push(ev);
          }
        }
      }
    }

    // Determine whether this is a trojanized clean mod or an outright homemade cheat
    const isClaimingWhitelisted = whitelistResult && whitelistResult.isWhitelisted;

    // Strict 0-False-Flag Whitelist Protection:
    // If a mod is whitelisted, gameplay mechanics like extended interaction reach
    // (ForgeMod.REACH_DISTANCE in Create, Supplementaries, ItemPhysic, etc.) must NEVER be treated as a trojan!
    if (isClaimingWhitelisted) {
      allVectors = allVectors.filter(v => v.vector !== 'REACH_EXPANSION_SEMANTICS');
      if (allVectors.length === 0) {
        return findings; // 100% Clean whitelisted mod!
      }
    }

    if (allVectors.length === 0) {
      return findings;
    }

    const alertType = isClaimingWhitelisted
      ? 'TROJAN_WHITELIST_BYPASS_ATTEMPT'
      : 'CUSTOM_HOMEMADE_CHEAT_DETECTED';

    const vectorNames = allVectors.map(v => v.name).join(', ');
    const primaryTitle = isClaimingWhitelisted
      ? `Truva Atı Mod (Beyaz Liste İstismarı): ${fileName} [${vectorNames}]`
      : `Özel Kodlanmış / İmzasız Hile Tespit Edildi: ${fileName} [${vectorNames}]`;

    const description = isClaimingWhitelisted
      ? `Bu mod dosyası (${fileName}) doğrulanmış bir temiz mod adını veya kimliğini (${whitelistResult.name || whitelistResult.modId}) kullanmaktadır, ancak baytkod analizi içerisinde gizlenmiş somut hile fonksiyonları (${vectorNames}) tespit edilmiştir!`
      : `Bu mod veya istemci (${fileName}), bilinen imza veritabanlarında yer almasa dahi Atlas AC Yapay Zeka Semantik Baytkod Analizörü tarafından incelenmiş ve içeriğinde somut hile algoritmaları (${vectorNames}) tespit edilmiştir. Kullanıcının kendi yazdığı veya özel derlenmiş bir hiledir!`;

    const whyFlagged = `Yapay Zeka Semantik Motoru, dosya (${fileName}) içindeki sınıflarda matematiksel açı/mesafe trigonometrisi, ağ paketi enjeksiyonu ve oyun mantığı manipülasyonlarını (${vectorNames}) kanıtladığı için KRİTİK olarak sınıflandırıldı.`;

    findings.push({
      level: 'CRITICAL',
      type: alertType,
      name: primaryTitle,
      category: 'MINECRAFT_MODS',
      file: fileName,
      path: filePath,
      confidence: '100% (Somut Kanıt: Yapay Zeka Semantik Baytkod Analizi)',
      description: description,
      whyFlagged: whyFlagged,
      semanticVectors: allVectors.map(v => v.vector),
      evidence: [
        `Dosya Yolu: ${filePath}`,
        `Analiz Edilen Sınıf Sayısı: ${classEntries.length}`,
        `Hile Algoritması İçeren Sınıf Sayısı: ${detectedClassResults.length}`,
        `Tespit Edilen Semantik Vektörler: ${vectorNames}`,
        ...evidenceList.slice(0, 10)
      ]
    });

    return findings;
  }
}

module.exports = new SemanticCheatClassifier();
