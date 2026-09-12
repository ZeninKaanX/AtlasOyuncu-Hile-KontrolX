/**
 * Atlas AC - Signature Expander for Cyde.xyz Cheat Clients
 * Adds all cheat clients, Bedrock DLL cheats, Weave frameworks, and bypass tools
 * while excluding standalone autoclickers as requested by user.
 */

const fs = require('fs');
const path = require('path');

const sigFilePath = path.join(__dirname, '../src/signatures/defaultSignatures.json');
const signatures = JSON.parse(fs.readFileSync(sigFilePath, 'utf8'));

// 1. Update existing raven_b_series to explicitly cover Raven BS, Raven B++, Raven N+, Raven XD, and Weave versions
const ravenRule = signatures.clientRules.find(r => r.id === 'raven_b_series');
if (ravenRule) {
  const extraPackages = [
    'me.blowsy.raven',
    'ravenbplusplus',
    'ravennplus',
    'ravenxd',
    'keystrokesmod.ravenxd',
    'keystrokesmod.ravenn'
  ];
  for (const pkg of extraPackages) {
    if (!ravenRule.packages.includes(pkg)) ravenRule.packages.push(pkg);
  }

  const extraStrings = [
    'Raven BS',
    'Raven bS',
    'Raven B++',
    'Raven N+',
    'Raven N+ Lite',
    'Raven XD',
    'Raven B+ (Weave)',
    'Raven B++ (Weave)'
  ];
  for (const str of extraStrings) {
    if (!ravenRule.memoryStrings.includes(str)) ravenRule.memoryStrings.push(str);
  }

  const extraPatterns = [
    '*Raven*BS*.jar',
    '*Raven*B++*.jar',
    '*Raven*N+*.jar',
    '*Raven*XD*.jar',
    '*RavenBPlus*.jar'
  ];
  if (!ravenRule.filePatterns) ravenRule.filePatterns = [];
  for (const pat of extraPatterns) {
    if (!ravenRule.filePatterns.includes(pat)) ravenRule.filePatterns.push(pat);
  }
}

// 2. Update existing thunderhack_client to include ThunderHack Recode
const thunderRule = signatures.clientRules.find(r => r.id === 'thunderhack_client');
if (thunderRule) {
  if (!thunderRule.modIds.includes('thunderhack-recode')) thunderRule.modIds.push('thunderhack-recode');
  if (!thunderRule.packages.includes('thunder.hack')) thunderRule.packages.push('thunder.hack');
  if (!thunderRule.packages.includes('thunderhack.core')) thunderRule.packages.push('thunderhack.core');
  if (!thunderRule.memoryStrings.includes('ThunderHack Recode')) thunderRule.memoryStrings.push('ThunderHack Recode');
}

// 3. Define new cheat client rules
const newClientRules = [
  {
    id: "sixtyseven_client",
    name: "67 Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 Ghost Client with closet combat modules and stealth packaging.",
    packages: ["me.sixseven", "sixseven.client", "com.sixseven"],
    classes: ["67Client.class", "SixSevenClient.class", "me/sixseven/Client.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/67client", ".minecraft/67", ".minecraft/config/67.json"],
    memoryStrings: ["67 Client", "sixseven.client", "me/sixseven"],
    filePatterns: ["*67*client*.jar", "*67Client*.jar"],
    usnPatterns: [".*67.*client.*\\.jar$"]
  },
  {
    id: "dark_client",
    name: "Dark Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Minecraft Forge 1.8.9 Ghost Client featuring closet combat modules.",
    packages: ["darkclient", "me.dark.client", "com.darkclient", "net.darkclient"],
    classes: ["DarkClient.class", "Dark.class", "darkclient/DarkClient.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class", "FastPlace.class"],
    configPaths: [".minecraft/darkclient", ".minecraft/dark", ".minecraft/config/darkclient.json"],
    memoryStrings: ["Dark Client", "darkclient", "me/dark/client"],
    filePatterns: ["*dark*client*.jar", "*DarkClient*.jar"],
    usnPatterns: [".*dark.*client.*\\.jar$"]
  },
  {
    id: "tuff_client",
    name: "Tuff Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 closet cheat client with disguise capabilities.",
    packages: ["me.tuff", "tuff.client", "com.tuff.client", "tuffclient"],
    classes: ["TuffClient.class", "Tuff.class", "me/tuff/client/Tuff.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/tuff", ".minecraft/tuffclient", ".minecraft/config/tuff.json"],
    memoryStrings: ["Tuff Client", "tuff.client", "me/tuff"],
    filePatterns: ["*tuff*client*.jar", "*TuffClient*.jar"],
    usnPatterns: [".*tuff.*client.*\\.jar$"]
  },
  {
    id: "breeze_client",
    name: "Breeze Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "External"],
    description: "Closet ghost client with Forge loader and native memory injector.",
    packages: ["me.breeze", "breeze.client", "com.breeze.client"],
    classes: ["BreezeClient.class", "Breeze.class", "me/breeze/client/Breeze.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/breeze", ".minecraft/breezeclient", "AppData/Roaming/Breeze"],
    memoryStrings: ["Breeze Client", "breeze.client", "BreezeClient.exe", "breezeclient.org"],
    filePatterns: ["*breeze*client*.jar", "*Breeze*.exe", "*Breeze*.dll"],
    prefetchPatterns: ["BREEZE.EXE", "BREEZECLIENT.EXE"],
    usnPatterns: [".*breeze.*client.*\\.jar$", ".*breeze.*\\.exe$"],
    browserDomains: ["breezeclient.org", "breezeclient.net"]
  },
  {
    id: "silk_client",
    name: "Silk Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Closet Forge ghost client designed for undetectable combat assistance.",
    packages: ["me.silk", "silk.client", "com.silk.client", "silkclient"],
    classes: ["SilkClient.class", "Silk.class", "me/silk/client/Silk.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/silk", ".minecraft/silkclient"],
    memoryStrings: ["Silk Client", "silk.client", "me/silk"],
    filePatterns: ["*silk*client*.jar", "*SilkClient*.jar"],
    usnPatterns: [".*silk.*client.*\\.jar$"]
  },
  {
    id: "cyemer_client",
    name: "Cyemer Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with customizable GUI and silent aim modules.",
    packages: ["me.cyemer", "cyemer.client", "com.cyemer"],
    classes: ["CyemerClient.class", "Cyemer.class", "me/cyemer/client/Cyemer.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/cyemer", ".minecraft/config/cyemer.json"],
    memoryStrings: ["Cyemer Client", "cyemer.client", "me/cyemer"],
    filePatterns: ["*cyemer*client*.jar", "*Cyemer*.jar"],
    usnPatterns: [".*cyemer.*client.*\\.jar$"]
  },
  {
    id: "lunar_account_manager",
    name: "Lunar Account Manager GO",
    category: "Account Swapper / Auth Bypass",
    severity: "CRITICAL",
    targetVersions: ["Lunar Client"],
    description: "External tool that modifies Lunar Client accounts, dumps session tokens, and bypasses official authentication.",
    classes: ["LunarAccountManager.class", "AccountManagerGO.class"],
    configPaths: [".lunarclient/accounts", ".lunarclient/offline", ".lunarclient/settings/game/accounts.json"],
    memoryStrings: ["Lunar Account Manager", "Lunar Account Manager GO", "lunar-accounts.json", "LAM.exe"],
    filePatterns: ["*Lunar*Account*Manager*.exe", "*LAM*.exe", "*LunarAccountManager*"],
    prefetchPatterns: ["LUNAR ACCOUNT MANAGER.EXE", "LAM.EXE", "LUNARACCOUNTMANAGER.EXE"],
    usnPatterns: [".*lunar.*account.*manager.*\\.exe$", ".*lam.*\\.exe$"]
  },
  {
    id: "volt_client",
    name: "Volt Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Minecraft Forge ghost client with low-profile packet manipulation.",
    packages: ["me.volt", "volt.client", "net.voltclient", "voltclient"],
    classes: ["VoltClient.class", "Volt.class", "me/volt/client/Volt.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/volt", ".minecraft/voltclient"],
    memoryStrings: ["Volt Client", "volt.client", "me/volt"],
    filePatterns: ["*volt*client*.jar", "*VoltClient*.jar"],
    usnPatterns: [".*volt.*client.*\\.jar$"]
  },
  {
    id: "remnant_client",
    name: "Remnant Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client featuring closet hit registration modifiers.",
    packages: ["me.remnant", "remnant.client", "com.remnant"],
    classes: ["RemnantClient.class", "Remnant.class", "me/remnant/client/Remnant.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/remnant", ".minecraft/config/remnant.json"],
    memoryStrings: ["Remnant Client", "remnant.client", "me/remnant"],
    filePatterns: ["*remnant*client*.jar", "*RemnantClient*.jar"],
    usnPatterns: [".*remnant.*client.*\\.jar$"]
  },
  {
    id: "badlion_offline",
    name: "Badlion Offline",
    category: "Launcher Crack / Anti-Cheat Bypass",
    severity: "CRITICAL",
    targetVersions: ["Badlion Client"],
    description: "Cracked Badlion launcher and patcher that disables BAC telemetry and enables unverified client sessions.",
    configPaths: [".badlion/offline", "AppData/Roaming/Badlion Client/offline"],
    memoryStrings: ["Badlion Offline", "BLC Offline", "BadlionOffline.exe", "blc-offline"],
    filePatterns: ["*Badlion*Offline*.exe", "*BLCOffline*.exe", "*badlion-offline*.jar"],
    prefetchPatterns: ["BADLIONOFFLINE.EXE", "BLCOFFLINE.EXE"],
    usnPatterns: [".*badlion.*offline.*\\.exe$", ".*badlion-offline.*\\.jar$"]
  },
  {
    id: "haru_client",
    name: "Haru Client / Haru Reborn Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Anime-themed Forge ghost client with custom packet cancelling and reach vectors.",
    packages: ["me.haru", "haru.client", "me.harureborn", "harureborn"],
    classes: ["HaruClient.class", "Haru.class", "HaruReborn.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/haru", ".minecraft/harureborn"],
    memoryStrings: ["Haru Client", "Haru Reborn", "me/haru", "me/harureborn"],
    filePatterns: ["*haru*client*.jar", "*HaruReborn*.jar"],
    usnPatterns: [".*haru.*client.*\\.jar$", ".*harureborn.*\\.jar$"]
  },
  {
    id: "hydrogen_cheat_client",
    name: "Hydrogen Cheat Client",
    category: "Hacked Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "1.20+"],
    description: "Hacked client with combat modules (strictly separated from CaffeineMC Hydrogen optimization mod).",
    packages: ["me.hydrogen.client", "hydrogen.cheat", "net.hydrogenclient"],
    classes: ["HydrogenClient.class", "me/hydrogen/client/Hydrogen.class"],
    combatClasses: ["KillAura.class", "Reach.class", "Velocity.class", "AutoCrystal.class"],
    configPaths: [".minecraft/hydrogen_cheat", ".minecraft/hydrogenclient"],
    memoryStrings: ["Hydrogen Client", "Hydrogen Cheat", "me/hydrogen/client"],
    filePatterns: ["*hydrogen*cheat*.jar", "*HydrogenClient*.jar"],
    usnPatterns: [".*hydrogen.*cheat.*\\.jar$"],
    falsePositiveGuards: {
      excludeIfPackage: "me.jellysquid.mods.hydrogen",
      excludeIfModId: "hydrogen",
      requireCombatClasses: true,
      note: "CaffeineMC Hydrogen is a legitimate chunk memory optimizer. Only flag if cheat packages or combat classes are present."
    }
  },
  {
    id: "uboa_client",
    name: "Uboa V2 Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Closet Forge 1.8.9 ghost client with hit delay reduction.",
    packages: ["me.uboa", "uboa.client", "com.uboa"],
    classes: ["UboaClient.class", "Uboa.class", "UboaV2.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/uboa", ".minecraft/config/uboa.json"],
    memoryStrings: ["Uboa Client", "Uboa V2", "uboa.client"],
    filePatterns: ["*uboa*client*.jar", "*Uboa*.jar"],
    usnPatterns: [".*uboa.*client.*\\.jar$"]
  },
  {
    id: "arsenic_client",
    name: "Arsenic Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Open source Forge 1.8.9 ghost client created by BlebDaPleb.",
    packages: ["me.blebdapleb.arsenic", "arsenic.client", "com.arsenic", "arsenic"],
    classes: ["Arsenic.class", "ArsenicClient.class", "me/blebdapleb/arsenic/Arsenic.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/arsenic", ".minecraft/config/arsenic.json"],
    memoryStrings: ["Arsenic Client", "BlebDaPleb", "me/blebdapleb/arsenic"],
    filePatterns: ["*arsenic*client*.jar", "*Arsenic*.jar"],
    usnPatterns: [".*arsenic.*client.*\\.jar$"]
  },
  {
    id: "wax_client",
    name: "Wax Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Closet Forge ghost client with custom rendering and click assist.",
    packages: ["waxclient", "me.wax.client", "com.wax"],
    classes: ["WaxClient.class", "Wax.class", "waxclient/Wax.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/wax", ".minecraft/waxclient"],
    memoryStrings: ["Wax Client", "waxclient", "me/wax"],
    filePatterns: ["*wax*client*.jar", "*WaxClient*.jar"],
    usnPatterns: [".*wax.*client.*\\.jar$"]
  },
  {
    id: "argon_client",
    name: "Argon Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with subtle hit registration improvements.",
    packages: ["argonclient", "me.argon.client", "com.argon"],
    classes: ["ArgonClient.class", "Argon.class", "argonclient/Argon.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/argon", ".minecraft/argonclient"],
    memoryStrings: ["Argon Client", "argonclient", "me/argon"],
    filePatterns: ["*argon*client*.jar", "*ArgonClient*.jar"],
    usnPatterns: [".*argon.*client.*\\.jar$"]
  },
  {
    id: "feather_cracked",
    name: "Feather Client Cracked",
    category: "Launcher Crack / Auth Bypass",
    severity: "CRITICAL",
    targetVersions: ["Feather Client"],
    description: "Cracked Feather client launcher and bypass tool.",
    configPaths: [".feather/cracked", "AppData/Roaming/Feather/cracked"],
    memoryStrings: ["Feather Cracked", "Feather Client Cracked", "FeatherBypass"],
    filePatterns: ["*Feather*Cracked*.exe", "*FeatherCracked*.jar", "*FeatherBypass*.exe"],
    prefetchPatterns: ["FEATHERCRACKED.EXE", "FEATHERBYPASS.EXE"],
    usnPatterns: [".*feather.*cracked.*\\.exe$", ".*feather.*cracked.*\\.jar$"]
  },
  {
    id: "vtf_advanced_client",
    name: "VTF Advanced Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "VTF Advanced closet ghost client with internal GUI menu.",
    packages: ["vtf", "me.vtf", "vtfadvanced", "com.vtf"],
    classes: ["VTFClient.class", "VTF.class", "vtf/VTF.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/vtf", ".minecraft/vtfadvanced"],
    memoryStrings: ["VTF Advanced", "VTF Client", "vtfadvanced"],
    filePatterns: ["*vtf*advanced*.jar", "*VTF*.jar"],
    usnPatterns: [".*vtf.*advanced.*\\.jar$"]
  },
  {
    id: "zoomin_client",
    name: "Zoomin Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client disguise module with aim assist.",
    packages: ["zoominclient", "me.zoomin.client", "com.zoomin"],
    classes: ["ZoominClient.class", "Zoomin.class", "zoominclient/Zoomin.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/zoomin", ".minecraft/zoominclient"],
    memoryStrings: ["Zoomin Client", "zoominclient", "me/zoomin"],
    filePatterns: ["*zoomin*client*.jar", "*ZoominClient*.jar"],
    usnPatterns: [".*zoomin.*client.*\\.jar$"]
  },
  {
    id: "softether_vpn",
    name: "SoftEther VPN",
    category: "VPN / Ban Evasion Tool",
    severity: "HIGH",
    targetVersions: ["Windows", "Linux"],
    description: "SoftEther VPN client used by cheaters to bypass IP bans and proxy telemetry.",
    configPaths: ["C:\\Program Files\\SoftEther VPN Client", "AppData/Roaming/SoftEther VPN Client"],
    memoryStrings: ["SoftEther VPN", "vpnclient.exe", "vpnclient_x64.exe"],
    filePatterns: ["*vpnclient*.exe", "*SoftEther*VPN*"],
    prefetchPatterns: ["VPNCLIENT.EXE", "VPNCLIENT_X64.EXE"],
    usnPatterns: [".*vpnclient.*\\.exe$"]
  },
  {
    id: "oxy_client",
    name: "Oxy Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 closet ghost client with subtle reach and velocity tuning.",
    packages: ["me.oxy", "oxy.client", "com.oxy.client", "oxyclient"],
    classes: ["OxyClient.class", "Oxy.class", "me/oxy/client/Oxy.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/oxy", ".minecraft/oxyclient"],
    memoryStrings: ["Oxy Client", "oxy.client", "me/oxy"],
    filePatterns: ["*oxy*client*.jar", "*OxyClient*.jar"],
    usnPatterns: [".*oxy.*client.*\\.jar$"]
  },
  {
    id: "slack_client",
    name: "Slack Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client disguise system.",
    packages: ["me.slack", "slack.client", "com.slack.client", "slackclient"],
    classes: ["SlackClient.class", "Slack.class", "me/slack/client/Slack.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/slack", ".minecraft/slackclient"],
    memoryStrings: ["Slack Client", "slack.client", "me/slack"],
    filePatterns: ["*slack*client*.jar", "*SlackClient*.jar"],
    usnPatterns: [".*slack.*client.*\\.jar$"]
  },
  {
    id: "tarasande_client",
    name: "Tarasande Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Famous Japanese competitive ghost client designed to bypass screenshare checks.",
    packages: ["me.tarasande", "tarasande.client", "com.tarasande", "tarasande"],
    classes: ["Tarasande.class", "TarasandeClient.class", "me/tarasande/Tarasande.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class", "SilentAim.class"],
    configPaths: [".minecraft/tarasande", ".minecraft/config/tarasande.json"],
    memoryStrings: ["Tarasande Client", "tarasande", "Sumandora/tarasande"],
    filePatterns: ["*tarasande*client*.jar", "*tarasande*.jar"],
    usnPatterns: [".*tarasande.*\\.jar$"]
  },
  {
    id: "aoba_client",
    name: "Aoba Client",
    category: "Hacked Client / Utility Mod",
    severity: "CRITICAL",
    targetVersions: ["1.20+", "Fabric"],
    description: "Open source Fabric utility and hacked client with combat modules.",
    modIds: ["aoba"],
    packages: ["me.earth.aoba", "aoba.client", "com.aoba"],
    classes: ["AobaClient.class", "Aoba.class", "me/earth/aoba/Aoba.class"],
    combatClasses: ["KillAura.class", "AutoCrystal.class", "Velocity.class", "Reach.class"],
    configPaths: [".minecraft/aoba", ".minecraft/config/aoba"],
    memoryStrings: ["Aoba Client", "me/earth/aoba", "Cocolots/Aoba-Client"],
    filePatterns: ["*aoba*client*.jar", "*Aoba*.jar"],
    usnPatterns: [".*aoba.*\\.jar$"]
  },
  {
    id: "acrimony_client",
    name: "Acrimony Client",
    category: "Blatant Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Blatant Minecraft 1.8.9 cheat client with server disablers and movement exploits.",
    modIds: ["acrimony"],
    packages: ["me.aqac.acrimony", "acrimony", "com.acrimony"],
    classes: ["Acrimony.class", "AcrimonyClient.class", "me/aqac/acrimony/Acrimony.class"],
    combatClasses: ["KillAura.class", "Velocity.class", "Speed.class", "Fly.class"],
    configPaths: [".minecraft/acrimony", ".minecraft/config/acrimony"],
    memoryStrings: ["Acrimony Client", "me/aqac/acrimony", "Acrimony.class"],
    filePatterns: ["*acrimony*client*.jar", "*Acrimony*.jar"],
    usnPatterns: [".*acrimony.*\\.jar$"]
  },
  {
    id: "crosssine_client",
    name: "CrossSine Client",
    category: "Blatant Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "Forge"],
    description: "Open source 1.8.9 Forge hack client fork of LiquidBounce NextGen by shxp3.",
    modIds: ["crosssine"],
    packages: ["cn.tianwen.crosssine", "crosssine", "crosssine.modules"],
    classes: ["CrossSine.class", "cn/tianwen/crosssine/CrossSine.class"],
    combatClasses: ["KillAura.class", "Velocity.class", "Aimbot.class", "FastBow.class"],
    configPaths: [".minecraft/crosssine", ".minecraft/CrossSine"],
    memoryStrings: ["CrossSine Client", "cn/tianwen/crosssine", "CrossSine"],
    filePatterns: ["*crosssine*.jar", "*CrossSine*.jar"],
    usnPatterns: [".*crosssine.*\\.jar$"]
  },
  {
    id: "sakura_client",
    name: "Sakura Client",
    category: "Hacked Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "1.20+"],
    description: "Fabric and Forge hack client with stealth GUI and flight exploits.",
    modIds: ["sakura"],
    packages: ["me.sakura", "sakura.client", "com.sakura"],
    classes: ["Sakura.class", "SakuraClient.class", "me/sakura/Sakura.class"],
    combatClasses: ["KillAura.class", "Velocity.class", "Fly.class", "NoFall.class"],
    configPaths: [".minecraft/sakura", ".minecraft/config/sakura.json"],
    memoryStrings: ["Sakura Client", "me/sakura", "SakuraClient"],
    filePatterns: ["*sakura*client*.jar", "*Sakura*.jar"],
    usnPatterns: [".*sakura.*\\.jar$"]
  },
  {
    id: "horion_client",
    name: "Horion Client",
    category: "Bedrock Hacked Client",
    severity: "CRITICAL",
    targetVersions: ["Bedrock Windows 10/11"],
    description: "Foremost Minecraft Bedrock Edition cheat injecting into Minecraft.Windows.exe via Horion.dll.",
    memoryStrings: ["Horion Client", "Horion.dll", "HorionInjector.exe", "horionbeta.club", "HorionBeta"],
    filePatterns: ["*Horion*.dll", "*HorionInjector*.exe", "*Horion*.exe"],
    prefetchPatterns: ["HORIONINJECTOR.EXE", "HORION.EXE"],
    usnPatterns: [".*horion.*\\.dll$", ".*horion.*\\.exe$"],
    browserDomains: ["horionbeta.club", "horion.download"]
  },
  {
    id: "borion_client",
    name: "Borion Client",
    category: "Bedrock Hacked Client",
    severity: "CRITICAL",
    targetVersions: ["Bedrock Windows 10/11"],
    description: "Fork of Horion Bedrock cheat client with customized modules and loader.",
    memoryStrings: ["Borion Client", "Borion.dll", "BorionInjector.exe", "BorionBeta"],
    filePatterns: ["*Borion*.dll", "*BorionInjector*.exe"],
    prefetchPatterns: ["BORIONINJECTOR.EXE", "BORION.EXE"],
    usnPatterns: [".*borion.*\\.dll$", ".*borion.*\\.exe$"]
  },
  {
    id: "nitro_client",
    name: "Nitro Client / Nitro Lite",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with customizable RGB accent theme and closet hitboxes.",
    packages: ["me.nitro", "nitro.client", "nitrolite", "com.nitro"],
    classes: ["NitroClient.class", "Nitro.class", "NitroLite.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/nitro", ".minecraft/nitrolite"],
    memoryStrings: ["Nitro Client", "Nitro Lite", "me/nitro"],
    filePatterns: ["*nitro*client*.jar", "*NitroLite*.jar"],
    usnPatterns: [".*nitro.*client.*\\.jar$"]
  },
  {
    id: "solstice_client",
    name: "Solstice Client",
    category: "Hacked Client",
    severity: "CRITICAL",
    targetVersions: ["1.20+", "Fabric"],
    description: "Open source Fabric utility and hacked client with crystal and combat automation.",
    modIds: ["solstice", "solstice-client"],
    packages: ["me.solstice", "solstice.client", "com.solstice"],
    classes: ["Solstice.class", "SolsticeClient.class", "me/solstice/Solstice.class"],
    combatClasses: ["KillAura.class", "AutoCrystal.class", "Velocity.class"],
    configPaths: [".minecraft/solstice", ".minecraft/config/solstice"],
    memoryStrings: ["Solstice Client", "me/solstice", "SolsticeClient"],
    filePatterns: ["*solstice*client*.jar", "*Solstice*.jar"],
    usnPatterns: [".*solstice.*\\.jar$"]
  },
  {
    id: "fractal_client",
    name: "Fractal Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 closet cheat client with clean GUI tabs for combat and render.",
    packages: ["me.fractal", "fractal.client", "com.fractal"],
    classes: ["FractalClient.class", "Fractal.class", "me/fractal/Fractal.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/fractal", ".minecraft/config/fractal.json"],
    memoryStrings: ["Fractal Client", "me/fractal", "fractal.client"],
    filePatterns: ["*fractal*client*.jar", "*Fractal*.jar"],
    usnPatterns: [".*fractal.*\\.jar$"]
  },
  {
    id: "nightx_client",
    name: "NightX Client",
    category: "Blatant Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "Forge"],
    description: "LiquidBounce fork blatant client featuring auto gapple, velocity, and fly bypasses.",
    modIds: ["nightx"],
    packages: ["me.nightx", "nightx", "cn.nightx"],
    classes: ["NightX.class", "NightXClient.class", "me/nightx/NightX.class"],
    combatClasses: ["KillAura.class", "Velocity.class", "Fly.class", "AutoGapple.class"],
    configPaths: [".minecraft/nightx", ".minecraft/NightX"],
    memoryStrings: ["NightX Client", "me/nightx", "NightX"],
    filePatterns: ["*nightx*.jar", "*NightX*.jar"],
    usnPatterns: [".*nightx.*\\.jar$"]
  },
  {
    id: "offline_lunar_tool",
    name: "Offline Lunar Tool",
    category: "Launcher Crack / Auth Bypass",
    severity: "CRITICAL",
    targetVersions: ["Lunar Client"],
    description: "Tool to run Lunar Client offline, avoiding server checks and anti-cheat telemetry.",
    configPaths: [".lunarclient/offline", "AppData/Roaming/.lunarclient/offline"],
    memoryStrings: ["Offline Lunar Tool", "Offline Lunar", "LunarOffline.jar"],
    filePatterns: ["*Offline*Lunar*.exe", "*LunarOffline*.jar", "*OfflineLunar*"],
    prefetchPatterns: ["OFFLINELUNAR.EXE", "OFFLINE LUNAR TOOL.EXE"],
    usnPatterns: [".*offline.*lunar.*\\.exe$", ".*lunaroffline.*\\.jar$"]
  },
  {
    id: "nemui_client",
    name: "Nemui Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Japanese Forge 1.8.9 ghost client with hit delay fix and smooth aim assist.",
    packages: ["me.nemui", "nemui.client", "com.nemui", "nemui"],
    classes: ["NemuiClient.class", "Nemui.class", "me/nemui/Nemui.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/nemui", ".minecraft/config/nemui.json"],
    memoryStrings: ["Nemui Client", "nemui.client", "me/nemui"],
    filePatterns: ["*nemui*client*.jar", "*Nemui*.jar"],
    usnPatterns: [".*nemui.*\\.jar$"]
  },
  {
    id: "toad_client",
    name: "Toad Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client companion to Toad Clicker with reach and velocity.",
    packages: ["me.toad", "toad.client", "com.toad.client", "toadclient"],
    classes: ["ToadClient.class", "Toad.class", "me/toad/Toad.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/toad", ".minecraft/toadclient"],
    memoryStrings: ["Toad Client", "toad.client", "me/toad"],
    filePatterns: ["*toad*client*.jar", "*ToadClient*.jar"],
    usnPatterns: [".*toad.*client.*\\.jar$"]
  },
  {
    id: "coffee_client",
    name: "Coffee Client",
    category: "Hacked Client",
    severity: "CRITICAL",
    targetVersions: ["1.20.1", "Fabric"],
    description: "Fabric 1.20.1 hack client specializing in crystal combat and exploit modules.",
    modIds: ["coffee", "coffee-client"],
    packages: ["me.coffee", "coffee.client", "coffee.mod", "com.coffee"],
    classes: ["CoffeeClient.class", "Coffee.class", "me/coffee/Coffee.class"],
    combatClasses: ["KillAura.class", "AutoCrystal.class", "Velocity.class", "Surround.class"],
    configPaths: [".minecraft/coffee", ".minecraft/config/coffee"],
    memoryStrings: ["Coffee Client", "me/coffee", "CoffeeClient"],
    filePatterns: ["*coffee*client*.jar", "*Coffee*.jar"],
    usnPatterns: [".*coffee.*\\.jar$"]
  },
  {
    id: "lumina_client",
    name: "Lumina Client",
    category: "Hacked / Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.20.1", "Fabric"],
    description: "Modern Fabric 1.19 / 1.20.1 open-source ghost and blatant client by stormcoph.",
    modIds: ["lumina", "lumina-client"],
    packages: ["me.lumina", "lumina.client", "stormcoph.lumina", "com.lumina"],
    classes: ["LuminaClient.class", "Lumina.class", "me/lumina/Lumina.class"],
    combatClasses: ["KillAura.class", "AutoCrystal.class", "Reach.class", "Velocity.class"],
    configPaths: [".minecraft/lumina", ".minecraft/config/lumina"],
    memoryStrings: ["Lumina Client", "stormcoph/LuminaClient", "me/lumina"],
    filePatterns: ["*lumina*client*.jar", "*Lumina*.jar"],
    usnPatterns: [".*lumina.*\\.jar$"]
  },
  {
    id: "crypt_client",
    name: "Crypt Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "External"],
    description: "Crypt ghost client with internal GUI, obfuscated loader, and closet combat hooks.",
    packages: ["me.crypt", "crypt.client", "com.crypt", "cryptclient"],
    classes: ["CryptClient.class", "Crypt.class", "me/crypt/Crypt.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/crypt", ".minecraft/cryptclient", "AppData/Roaming/Crypt"],
    memoryStrings: ["Crypt Client", "crypt.client", "CryptClient.exe", "crypt.gg"],
    filePatterns: ["*crypt*client*.jar", "*Crypt*.exe", "*Crypt*.dll"],
    prefetchPatterns: ["CRYPT.EXE", "CRYPTCLIENT.EXE"],
    usnPatterns: [".*crypt.*client.*\\.jar$", ".*crypt.*\\.exe$"]
  },
  {
    id: "eternal_client",
    name: "Eternal Client (Lite & V2)",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with customizable closet modules and low knockback modifier.",
    packages: ["me.eternal", "eternal.client", "com.eternal", "eternallite"],
    classes: ["EternalClient.class", "Eternal.class", "EternalLite.class", "EternalV2.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/eternal", ".minecraft/eternallite"],
    memoryStrings: ["Eternal Client", "Eternal Lite", "Eternal V2", "me/eternal"],
    filePatterns: ["*eternal*client*.jar", "*Eternal*.jar"],
    usnPatterns: [".*eternal.*\\.jar$"]
  },
  {
    id: "ripterms_ghost",
    name: "Ripterms Ghost",
    category: "JNI / JVMTI Internal Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "Lunar", "Forge"],
    description: "Open source C++/JNI JVMTI internal injection ghost client targeting Lunar 1.8.9 and Forge using MinHook.",
    memoryStrings: [
      "Ripterms",
      "RiptermsGhost",
      "ClassPatcherJar",
      "ClientBrandChanger",
      "mappings_lunar_1_8_9",
      "Ripterms/Modules/Reach",
      "Ripterms/Modules/AimAssist",
      "Ripterms/Modules/Velocity"
    ],
    filePatterns: ["*Ripterms*.dll", "*RiptermsInjector*.exe", "*RiptermsGhost*"],
    prefetchPatterns: ["RIPTERMSINJECTOR.EXE", "RIPTERMS.EXE"],
    usnPatterns: [".*ripterms.*\\.dll$", ".*ripterms.*\\.exe$"],
    browserDomains: ["github.com/66hh/RiptermsGhost"]
  },
  {
    id: "raid0_client",
    name: "Raid0 Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with custom auto-block and velocity cancel.",
    packages: ["me.raid0", "raid0.client", "com.raid0"],
    classes: ["Raid0Client.class", "Raid0.class", "me/raid0/Raid0.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/raid0", ".minecraft/config/raid0.json"],
    memoryStrings: ["Raid0 Client", "raid0.client", "me/raid0"],
    filePatterns: ["*raid0*client*.jar", "*Raid0*.jar", "*Raid0*.exe"],
    usnPatterns: [".*raid0.*\\.jar$", ".*raid0.*\\.exe$"]
  },
  {
    id: "styx_client",
    name: "Styx Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Private ghost client with closet hitboxes and jitter click emulator.",
    packages: ["me.styx", "styx.client", "com.styx", "styxclient"],
    classes: ["StyxClient.class", "Styx.class", "me/styx/Styx.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/styx", ".minecraft/styxclient"],
    memoryStrings: ["Styx Client", "styx.client", "me/styx"],
    filePatterns: ["*styx*client*.jar", "*StyxClient*.jar"],
    usnPatterns: [".*styx.*client.*\\.jar$"]
  },
  {
    id: "fusion_internal_client",
    name: "Fusion Internal Client",
    category: "Internal DLL Injection Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "Lunar"],
    description: "C++ internal DLL cheat client injecting directly into Minecraft / Lunar Client memory space.",
    memoryStrings: ["Fusion Internal", "Fusion Client", "FusionInternal.dll", "fusionclient.xyz"],
    filePatterns: ["*FusionInternal*.dll", "*Fusion*.dll", "*FusionInjector*.exe"],
    prefetchPatterns: ["FUSIONINJECTOR.EXE", "FUSIONCLIENT.EXE"],
    usnPatterns: [".*fusion.*internal.*\\.dll$", ".*fusion.*\\.dll$"],
    browserDomains: ["fusionclient.xyz"]
  },
  {
    id: "weave_manager",
    name: "Weave Manager & Weave Loader",
    category: "Injection Framework / Mod Hook",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "Lunar", "Vanilla"],
    description: "Hooking framework and mod manager loaded via JavaAgent into Lunar and Forge (often hosting Raven Weave / Ripterms).",
    packages: ["net.weavemc", "net.weavemc.loader", "weave.loader"],
    classes: ["net/weavemc/loader/Main.class", "WeaveLoader.class"],
    configPaths: [".weave", ".weave/mods", ".weave/loader.jar", "AppData/Roaming/.weave"],
    memoryStrings: ["net.weavemc.loader", "Weave-Loader", "WeaveManager.exe", ".weave/mods"],
    filePatterns: ["*WeaveManager*.exe", "*weave-loader*.jar", "*Weave-Manager*"],
    prefetchPatterns: ["WEAVEMANAGER.EXE", "WEAVE-MANAGER.EXE"],
    usnPatterns: [".*weave.*manager.*\\.exe$", ".*\\.weave.*mods.*"]
  },
  {
    id: "legitish_client",
    name: "Legit-ish Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Closet Forge 1.8.9 cheat client masking combat modules as legitimate utilities.",
    packages: ["legitish", "me.legitish", "com.legitish"],
    classes: ["LegitishClient.class", "Legitish.class", "legitish/Legitish.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/legitish", ".minecraft/config/legitish.json"],
    memoryStrings: ["Legit-ish", "legitish", "me/legitish"],
    filePatterns: ["*legit-ish*.jar", "*legitish*.jar"],
    usnPatterns: [".*legit.*ish.*\\.jar$"]
  },
  {
    id: "physiological_client",
    name: "Physiological Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with humanized click randomization.",
    packages: ["physiological", "me.physiological", "com.physiological"],
    classes: ["PhysiologicalClient.class", "Physiological.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/physiological"],
    memoryStrings: ["Physiological Client", "physiological"],
    filePatterns: ["*physiological*client*.jar", "*Physiological*.jar"],
    usnPatterns: [".*physiological.*\\.jar$"]
  },
  {
    id: "enthapy_client",
    name: "Enthapy Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Entropy client derivative featuring closet aim assistance and hitboxes.",
    packages: ["enthapy", "me.enthapy", "com.enthapy"],
    classes: ["EnthapyClient.class", "Enthapy.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/enthapy"],
    memoryStrings: ["Enthapy Client", "enthapy", "me/enthapy"],
    filePatterns: ["*enthapy*client*.jar", "*Enthapy*.jar"],
    usnPatterns: [".*enthapy.*\\.jar$"]
  },
  {
    id: "dope_client",
    name: "Dope V2 Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with closet combat modules.",
    packages: ["dopev2", "me.dope.client", "com.dope"],
    classes: ["DopeClient.class", "Dope.class", "DopeV2.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/dope", ".minecraft/dopev2"],
    memoryStrings: ["Dope V2", "Dope Client", "dopev2"],
    filePatterns: ["*dope*v2*.jar", "*DopeClient*.jar"],
    usnPatterns: [".*dope.*v2.*\\.jar$"]
  },
  {
    id: "sapphire_lite_client",
    name: "Sapphire Lite Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client with subtle reach and velocity.",
    packages: ["sapphirelite", "me.sapphire.client", "com.sapphire"],
    classes: ["SapphireLite.class", "Sapphire.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/sapphire", ".minecraft/sapphirelite"],
    memoryStrings: ["Sapphire Lite", "sapphirelite", "me/sapphire"],
    filePatterns: ["*sapphire*lite*.jar", "*SapphireLite*.jar"],
    usnPatterns: [".*sapphire.*lite.*\\.jar$"]
  },
  {
    id: "smok_client",
    name: "Smok Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 closet ghost client.",
    packages: ["smokclient", "me.smok.client", "com.smok"],
    classes: ["SmokClient.class", "Smok.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/smok", ".minecraft/smokclient"],
    memoryStrings: ["Smok Client", "smokclient", "me/smok"],
    filePatterns: ["*smok*client*.jar", "*SmokClient*.jar"],
    usnPatterns: [".*smok.*client.*\\.jar$"]
  },
  {
    id: "exodus_aim_assist",
    name: "Exodus Aim Assist",
    category: "External Aim Assist / Ghost Tool",
    severity: "CRITICAL",
    targetVersions: ["External Windows"],
    description: "External aim assist and tracking cheat tool operating outside the JVM.",
    memoryStrings: ["Exodus Aim Assist", "ExodusAimAssist.exe", "Exodus.exe", "Exodus Aim"],
    filePatterns: ["*Exodus*Aim*Assist*.exe", "*Exodus*.exe"],
    prefetchPatterns: ["EXODUSAIMASSIST.EXE", "EXODUS.EXE"],
    usnPatterns: [".*exodus.*aim.*assist.*\\.exe$", ".*exodus.*\\.exe$"]
  },
  {
    id: "icetea_client",
    name: "Icetea Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Ghost client with configurable reach and hit timing.",
    packages: ["iceteaclient", "me.icetea.client", "com.icetea"],
    classes: ["IceteaClient.class", "Icetea.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/icetea", ".minecraft/iceteaclient"],
    memoryStrings: ["Icetea Client", "iceteaclient", "me/icetea"],
    filePatterns: ["*icetea*client*.jar", "*IceteaClient*.jar"],
    usnPatterns: [".*icetea.*client.*\\.jar$"]
  },
  {
    id: "lithium_cheat_client",
    name: "Lithium Ghost Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9"],
    description: "Forge 1.8.9 ghost client (strictly separated from CaffeineMC Lithium server optimization mod).",
    packages: ["me.curse.lithium", "lithiumclient", "com.lithium.client"],
    classes: ["LithiumGhost.class", "LithiumClient.class", "me/curse/lithium/Lithium.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/lithium_cheat", ".minecraft/lithiumclient"],
    memoryStrings: ["Lithium Ghost Client", "Lithium Client", "me/curse/lithium"],
    filePatterns: ["*lithium*ghost*.jar", "*LithiumClient*.jar"],
    usnPatterns: [".*lithium.*ghost.*\\.jar$"],
    falsePositiveGuards: {
      excludeIfPackage: "me.jellysquid.mods.lithium",
      excludeIfModId: "lithium",
      requireCombatClasses: true,
      note: "CaffeineMC Lithium is a legitimate physics/server optimization mod. Only flag if cheat packages or combat classes are present."
    }
  },
  {
    id: "koid_client",
    name: "Koid Ghost Client",
    category: "Ghost Client",
    severity: "CRITICAL",
    targetVersions: ["1.8.9", "External"],
    description: "Popular open source C#/C++ external ghost client by Litarvan and Koid with closet reach/velocity.",
    packages: ["koidclient", "me.koid.client", "com.koid"],
    classes: ["KoidClient.class", "Koid.class"],
    combatClasses: ["Reach.class", "Velocity.class", "AimAssist.class", "AutoClicker.class"],
    configPaths: [".minecraft/koid", "AppData/Roaming/Koid"],
    memoryStrings: ["Koid Ghost Client", "Koid Client", "Koid.exe", "KoidClient.exe"],
    filePatterns: ["*Koid*.exe", "*koid*client*.jar"],
    prefetchPatterns: ["KOID.EXE", "KOIDCLIENT.EXE"],
    usnPatterns: [".*koid.*\\.exe$", ".*koid.*client.*\\.jar$"]
  }
];

// Add unique rules
let addedCount = 0;
for (const rule of newClientRules) {
  const existingIdx = signatures.clientRules.findIndex(r => r.id === rule.id);
  if (existingIdx >= 0) {
    signatures.clientRules[existingIdx] = rule;
  } else {
    signatures.clientRules.push(rule);
    addedCount++;
  }
}

// Write back updated file with 2 space indentation
signatures.lastUpdated = new Date().toISOString();
fs.writeFileSync(sigFilePath, JSON.stringify(signatures, null, 2), 'utf8');

console.log(`[+] Successfully processed signatures!`);
console.log(`[+] Added ${addedCount} new cheat client rules.`);
console.log(`[+] Total clientRules count is now: ${signatures.clientRules.length}`);
