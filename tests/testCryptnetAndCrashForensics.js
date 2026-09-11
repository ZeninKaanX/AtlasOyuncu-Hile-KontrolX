/**
 * Atlas AC - CryptnetUrlCache, App Crash & Font Exploit Test Suite
 * Validates:
 * 1. CryptnetUrlCache URL extraction and cheat domain detection
 * 2. 0 False-Flag PKI whitelisting (DigiCert, Sectigo, Microsoft, Let's Encrypt)
 * 3. Application Error (Event ID 1000) javaw.exe injected DLL fault detection
 * 4. 0 False-Flag Minecraft JVM libraries, GPU drivers, and certified hooks
 * 5. Direct cheat crash event detection (vape.exe, slinky.exe)
 * 6. Font Exploit circular reference crash detection
 * 7. Font Exploit oversized matrix overflow detection
 * 8. Disguised Base64 Java bytecode in resource packs
 * 9. 0 False-Flag for clean resource packs and standard font JSON
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const cryptnetForensics = require('../src/engine/cryptnetForensics');
const appCrashForensics = require('../src/engine/appCrashForensics');
const fontExploitForensics = require('../src/engine/fontExploitForensics');

console.log('====================================================');
console.log('   ATLAS AC - CRYPTNET, CRASH & FONT EXPLOIT SUITE  ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// 1. TEST: CryptnetUrlCache Binary Buffer URL Extraction
runTest('CryptnetUrlCache: İkili tampon verisinden HTTP/HTTPS URL adresleri çıkarılmalı', () => {
  const fakeBuffer = Buffer.from('PADDING\x00http://crl.sectigo.com/SectigoRSATimeStampingCA.crl\x00EXTRA\x00https://vape.gg/auth/verify.php\x00END');
  const urls = cryptnetForensics.extractUrlsFromBuffer(fakeBuffer);
  assert(urls.length >= 2, `En az 2 URL çıkarılmalıydı, çıkarılan: ${urls.length}`);
  assert(urls.includes('http://crl.sectigo.com/SectigoRSATimeStampingCA.crl'));
  assert(urls.includes('https://vape.gg/auth/verify.php'));
});

// 2. TEST: CryptnetUrlCache Cheat Domain Detection
runTest('CryptnetUrlCache: vape.gg veya drip.gg doğrulama kaydı somut kanıtla yakalanmalı', () => {
  const res1 = cryptnetForensics.evaluateCachedUrl('https://vape.gg/auth/verify.php', 'C:\\Users\\Test\\AppData\\LocalLow\\Microsoft\\CryptnetUrlCache\\MetaData\\ABC123');
  assert(res1, 'vape.gg URL kaydı yakalanmalıydı');
  assert.strictEqual(res1.level, 'CRITICAL');
  assert.strictEqual(res1.type, 'CRYPTNET_URLCACHE_CHEAT_DOMAIN_FOUND');
  assert(res1.confidence.includes('100%'));

  const res2 = cryptnetForensics.evaluateCachedUrl('http://drip.gg/crl/cert.crl', 'MetaData\\DEF456');
  assert(res2, 'drip.gg URL kaydı yakalanmalıydı');
  assert.strictEqual(res2.level, 'CRITICAL');
});

// 3. TEST: 0 False-Flag for Legitimate PKI Infrastructure in CryptnetUrlCache
runTest('0 False-Flag Cryptnet: DigiCert, Sectigo, Microsoft, Google ve Let\'s Encrypt ASLA hile sayılmamalı', () => {
  const cleanUrls = [
    'http://crl.sectigo.com/SectigoRSATimeStampingCA.crl',
    'http://ocsp.digicert.com/MFEwTzBNMEswSTAJBgUrDgMCGgU',
    'http://www.microsoft.com/pkiops/crl/MicWinProPCA2011_2011-10-19.crl',
    'http://r3.o.lencr.org',
    'http://pki.goog/repo/certs/gts1c3.der',
    'https://cloudflare.com/pki/crl.pem'
  ];

  for (const u of cleanUrls) {
    const res = cryptnetForensics.evaluateCachedUrl(u, 'MetaData\\CLEAN');
    assert.strictEqual(res, null, `Meşru PKI URL'si (${u}) yanlış alarm üretmemeliydi!`);
  }
});

// 4. TEST: App Crash Forensics - Direct Cheat Process Crash
runTest('Uygulama Çökme Kaydı: vape.exe veya slinky.exe çökme olayı CRITICAL olarak tanınmalı', () => {
  const res = appCrashForensics.evaluateAppCrashEvent('vape.exe', 'ntdll.dll', 'C:\\Windows\\System32\\ntdll.dll', '2026-09-09 08:30:00');
  assert(res, 'vape.exe çökmesi yakalanmalıydı');
  assert.strictEqual(res.level, 'CRITICAL');
  assert.strictEqual(res.type, 'CHEAT_PROCESS_CRASH_EVENT');
  assert(res.confidence.includes('100%'));
});

// 5. TEST: App Crash Forensics - Injected DLL Crash Inside javaw.exe
runTest('Uygulama Çökme Kaydı: javaw.exe içinde Temp klasöründeki harici modül çökmesi yakalanmalı', () => {
  const res = appCrashForensics.evaluateAppCrashEvent(
    'javaw.exe',
    'injector_payload.dll',
    'C:\\Users\\Test\\AppData\\Local\\Temp\\injector_payload.dll',
    '2026-09-09 08:45:00'
  );
  assert(res, 'javaw.exe içi enjekte modül çökmesi yakalanmalıydı');
  assert.strictEqual(res.level, 'CRITICAL');
  assert.strictEqual(res.type, 'JAVAW_INJECTED_MODULE_CRASH');
  assert(res.confidence.includes('100%'));
});

// 6. TEST: 0 False-Flag for Legitimate Game Libraries in App Crash Forensics
runTest('0 False-Flag Çökme: Meşru JVM kütüphaneleri, ekran kartı sürücüleri ve katman kancaları temiz kalmalı', () => {
  const cleanEvents = [
    { app: 'javaw.exe', mod: 'jvm.dll', path: 'C:\\Program Files\\Java\\bin\\server\\jvm.dll' },
    { app: 'javaw.exe', mod: 'lwjgl.dll', path: 'C:\\Users\\Test\\.minecraft\\bin\\lwjgl.dll' },
    { app: 'javaw.exe', mod: 'nvoglv64.dll', path: 'C:\\Windows\\System32\\DriverStore\\nvoglv64.dll' },
    { app: 'javaw.exe', mod: 'ig9ic64.dll', path: 'C:\\Windows\\System32\\DriverStore\\ig9ic64.dll' },
    { app: 'javaw.exe', mod: 'DiscordHook64.dll', path: 'C:\\Users\\Test\\AppData\\Local\\Discord\\DiscordHook64.dll' },
    { app: 'javaw.exe', mod: 'medal-hook64.dll', path: 'C:\\Users\\Test\\AppData\\Local\\Medal\\medal-hook64.dll' },
    { app: 'javaw.exe', mod: 'GameOverlayRenderer64.dll', path: 'C:\\Program Files (x86)\\Steam\\GameOverlayRenderer64.dll' }
  ];

  for (const ev of cleanEvents) {
    const res = appCrashForensics.evaluateAppCrashEvent(ev.app, ev.mod, ev.path, '2026-09-09 08:00:00');
    assert.strictEqual(res, null, `Meşru modül çökmesi (${ev.mod}) yanlış alarm üretmemeliydi!`);
  }
});

// 7. TEST: Font Exploit Circular Reference Detection
runTest('Font İstismarı: Kendine referans veren (circular reference) font tanımı CRITICAL olarak yakalanmalı', () => {
  const circularJson = JSON.stringify({
    providers: [
      {
        type: 'reference',
        id: 'minecraft:default'
      }
    ]
  });

  const res = fontExploitForensics.inspectFontJsonContent(circularJson, 'assets/minecraft/font/default.json');
  assert(res.length >= 1, 'Özyinelemeli font tanımı yakalanmalıydı');
  assert.strictEqual(res[0].level, 'CRITICAL');
  assert.strictEqual(res[0].type, 'MINECRAFT_FONT_CIRCULAR_CRASH_EXPLOIT');
  assert(res[0].confidence.includes('100%'));
});

// 8. TEST: Font Exploit Extreme Matrix Sizing Detection
runTest('Font İstismarı: Aşırı boyutlu matris (height > 10000) bellek tüketimi istismarı yakalanmalı', () => {
  const overflowJson = JSON.stringify({
    providers: [
      {
        type: 'bitmap',
        file: 'minecraft:font/glyph.png',
        height: 999999,
        ascent: 999999,
        chars: ['A']
      }
    ]
  });

  const res = fontExploitForensics.inspectFontJsonContent(overflowJson, 'assets/minecraft/font/custom.json');
  assert(res.length >= 1, 'Aşırı boyutlu font matrisi yakalanmalıydı');
  assert.strictEqual(res[0].level, 'CRITICAL');
  assert.strictEqual(res[0].type, 'MINECRAFT_FONT_OVERFLOW_EXPLOIT');
  assert(res[0].confidence.includes('100%'));
});

// 9. TEST: Disguised Base64 Java Bytecode Inside JSON
runTest('Gizli Bytecode: JSON içine saklanmış Base64 0xCAFEBABE Java ikili kodu yakalanmalı', () => {
  // yv66vgAA = 0xCAFEBABE in Base64
  const payloadBase64 = 'yv66vgAAADIAOAoABwAZBwAaBwAbAQAGPGluaXQ+AQADKClWAQAEQ29kZQEAD0xpbmVOdW1iZXJUYWJsZQEAEkxvY2FsVmFyaWFibGVUYWJsZQEABHRoaXMBAAhMQXVyYTt4AAAAAAA=';
  const maliciousJson = JSON.stringify({
    language: 'English',
    keys: {
      'menu.play': 'Play',
      'secret.payload': payloadBase64
    }
  });

  const res = fontExploitForensics.inspectJsonForEmbeddedBytecode(maliciousJson, 'assets/minecraft/lang/en_us.json');
  assert(res.length >= 1, 'Base64 kodlanmış Java bytecode yakalanmalıydı');
  assert.strictEqual(res[0].level, 'CRITICAL');
  assert.strictEqual(res[0].type, 'EMBEDDED_JAVA_BYTECODE_IN_RESOURCEPACK');
});

// 10. TEST: 0 False-Flag for Clean Standard Font JSON and Normal Resource Pack
runTest('0 False-Flag Font: Standart vanilla font JSON dosyası ve temiz dil dosyası TEMİZ kalmalı', () => {
  const standardFontJson = JSON.stringify({
    providers: [
      {
        type: 'bitmap',
        file: 'minecraft:font/ascii.png',
        ascent: 7,
        height: 8,
        chars: [' !\"#$%&\'()*+,-./', '0123456789:;<=>?']
      },
      {
        type: 'ttf',
        file: 'minecraft:font/include/unifont.zip',
        shift: [0, 0],
        size: 11.0,
        oversample: 2.0
      }
    ]
  });

  const res1 = fontExploitForensics.inspectFontJsonContent(standardFontJson, 'assets/minecraft/font/default.json');
  assert.strictEqual(res1.length, 0, 'Standart font JSON yanlış alarm üretmemeliydi');

  const standardLangJson = JSON.stringify({
    'menu.play': 'Play Singleplayer',
    'menu.multiplayer': 'Play Multiplayer',
    'menu.options': 'Options...'
  });

  const res2 = fontExploitForensics.inspectJsonForEmbeddedBytecode(standardLangJson, 'assets/minecraft/lang/en_us.json');
  assert.strictEqual(res2.length, 0, 'Standart lang JSON yanlış alarm üretmemeliydi');
});

console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);

if (require.main === module) {
  process.exit(passedTests === totalTests ? 0 : 1);
} else if (passedTests !== totalTests) {
  process.exit(1);
}
