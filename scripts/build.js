/**
 * Atlas AC - Standalone Embedded Packaging & Compilation Pipeline
 * Produces:
 *  1. dist/AtlasAC-Linux (Compiled ELF binary for all Linux distros)
 *  2. dist/AtlasAC-Linux.run (Self-contained Linux runner with auto-cleanup)
 *  3. dist/AtlasAC-Windows.exe (Compiled 64-bit Windows binary)
 *  4. dist/AtlasAC.bat (All-in-one embedded self-extracting .bat for AnyDesk SS checks)
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('======================================================');
console.log('    ATLAS AC - EMBEDDED STANDALONE PACKAGING PIPELINE ');
console.log('======================================================\n');

// 1. Run Tests to guarantee 100% engine integrity
if (process.env.SKIP_TESTS === '1') {
  console.log('[*] Step 1: Skipping tests (SKIP_TESTS=1)...');
} else {
  console.log('[*] Step 1: Executing the full engine verification suite...');
  try {
    execSync('npm test', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('[+] All tests passed successfully.\n');
  } catch (err) {
    console.error('[!] Test suite failed! Aborting build.');
    process.exit(1);
  }
}

// 2. Compile with the maintained @yao-pkg/pkg fork. Never modify or replace
// downloaded runtime bases: their upstream integrity checks must remain intact.
console.log('[*] Step 2: Compiling standalone binaries with verified runtime bases...');
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Never let a successful-looking release reuse a binary from an older build.
// pkg can occasionally exit without producing every requested target, so all
// managed outputs are removed first and the fresh raw targets are required.
const managedOutputs = [
  'atlas-ac-linux', 'atlas-ac-win.exe', 'AtlasAC-Linux', 'AtlasAC',
  'AtlasAC.exe', 'AtlasAC-Windows.exe', 'AtlasAC-Windows.zip',
  'AtlasAC-Linux.zip', 'AtlasAC.exe.gz', 'AtlasAC.bat', 'AtlasAC.vbs',
  'AtlasAC-Linux.run', 'baslat.sh', 'SHA256SUMS.txt', 'test'
];
for (const name of managedOutputs) {
  fs.rmSync(path.join(DIST_DIR, name), { recursive: true, force: true });
}

try {
  // Some hosts cannot generate V8 bytecode for every dependency. Explicitly
  // retain source as a fallback so pkg never emits a "successful" but
  // unbootable executable when bytecode generation fails.
  const pkgCmd = `npx --no-install pkg . --targets node22-linux-x64,node22-win-x64 --out-path dist --compress GZip --fallback-to-source`;
  console.log(`[>] Running: ${pkgCmd}`);
  execSync(pkgCmd, { cwd: ROOT_DIR, stdio: 'inherit' });
  for (const expected of ['atlas-ac-linux', 'atlas-ac-win.exe']) {
    if (!fs.existsSync(path.join(DIST_DIR, expected))) {
      throw new Error(`Fresh pkg output missing: ${expected}`);
    }
  }
  console.log('[+] Pkg compilation complete.\n');
} catch (err) {
  console.error('[!] Pkg compilation error:', err.message);
  process.exit(1);
}

/// Standardize binary names
const rawLinuxBin = path.join(DIST_DIR, 'atlas-ac-linux');
const targetLinuxBin = path.join(DIST_DIR, 'AtlasAC-Linux');
const aliasLinuxBin = path.join(DIST_DIR, 'AtlasAC');

if (fs.existsSync(rawLinuxBin)) {
  fs.renameSync(rawLinuxBin, targetLinuxBin);
  fs.chmodSync(targetLinuxBin, 0o755);
}
if (fs.existsSync(targetLinuxBin)) {
  fs.copyFileSync(targetLinuxBin, aliasLinuxBin);
  fs.chmodSync(aliasLinuxBin, 0o755);
}

const rawWinBin = path.join(DIST_DIR, 'atlas-ac-win.exe');
const targetWinBin = path.join(DIST_DIR, 'AtlasAC.exe');
const aliasWinBin = path.join(DIST_DIR, 'AtlasAC-Windows.exe');

if (fs.existsSync(rawWinBin)) {
  fs.renameSync(rawWinBin, targetWinBin);
}
if (fs.existsSync(targetWinBin)) {
  try {
    if (fs.existsSync(aliasWinBin)) {
      try { fs.unlinkSync(aliasWinBin); } catch (e) {}
    }
    fs.copyFileSync(targetWinBin, aliasWinBin);
  } catch (e) {
    console.log('[!] Notice: AtlasAC-Windows.exe is locked by another process, skipping alias copy.');
  }
}

// Convert Windows EXEs to GUI Subsystem (IMAGE_SUBSYSTEM_WINDOWS_GUI = 2)
// Guarantees Windows allocates NO CMD / CONSOLE WINDOW when double-clicked!
for (const exePath of [targetWinBin, aliasWinBin]) {
  if (fs.existsSync(exePath)) {
    try {
      const fd = fs.openSync(exePath, 'r+');
      const headerBuf = Buffer.alloc(1024);
      fs.readSync(fd, headerBuf, 0, 1024, 0);
      const peOffset = headerBuf.readUInt32LE(0x3C);
      const subsystemOffset = peOffset + 24 + 68; // OptionalHeader.Subsystem in PE32+ (64-bit)
      const currentSubsystem = headerBuf.readUInt16LE(subsystemOffset);
      if (currentSubsystem === 3) {
        const patchBuf = Buffer.alloc(2);
        patchBuf.writeUInt16LE(2, 0); // 2 = IMAGE_SUBSYSTEM_WINDOWS_GUI
        fs.writeSync(fd, patchBuf, 0, 2, subsystemOffset);
        console.log(`[+] SUCCESS: Patched ${path.basename(exePath)} to GUI Subsystem (2). NO CMD WINDOW WILL OPEN!`);
      } else {
        console.log(`[+] Subsystem of ${path.basename(exePath)} is GUI (${currentSubsystem}).`);
      }
      fs.closeSync(fd);
    } catch (e) {
      console.warn(`[!] Warning: Could not patch PE subsystem for ${path.basename(exePath)}: ${e.message}`);
    }
  }
}

// Clean up any legacy helper scripts so only single standalone executables remain
const legacyFiles = ['AtlasAC.bat', 'AtlasAC.vbs', 'AtlasAC-Linux.run'];
for (const leg of legacyFiles) {
  const fPath = path.join(DIST_DIR, leg);
  if (fs.existsSync(fPath)) {
    fs.unlinkSync(fPath);
  }
}

// The private Storage project has a lower per-object limit than the embedded
// Node binaries. ZIP packages stay below that limit and are easy to extract on
// both supported platforms.
const windowsZipPath = path.join(DIST_DIR, 'AtlasAC-Windows.zip');
const linuxZipPath = path.join(DIST_DIR, 'AtlasAC-Linux.zip');
const windowsZip = new AdmZip();
windowsZip.addLocalFile(targetWinBin);
windowsZip.writeZip(windowsZipPath);
fs.chmodSync(windowsZipPath, 0o644);
const linuxZip = new AdmZip();
linuxZip.addLocalFile(targetLinuxBin);
linuxZip.writeZip(linuxZipPath);
fs.chmodSync(linuxZipPath, 0o644);

// Checksums must describe the binaries produced by this exact build. Keeping a
// stale checksum file is worse than having none because staff may trust the
// wrong artifact.
const checksumTargets = [targetWinBin, targetLinuxBin, windowsZipPath, linuxZipPath];
const checksumLines = checksumTargets.map(filePath => {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  return `${digest}  ${path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')}`;
});
fs.writeFileSync(path.join(DIST_DIR, 'SHA256SUMS.txt'), `${checksumLines.join('\n')}\n`, 'utf8');

console.log('======================================================');
console.log('                 BUILD COMPLETED SUCCESSFULLY!        ');
console.log('======================================================');
console.log('Standalone Single Binaries ready in dist/:');
console.log(`  1. Windows (Tek EXE): ${targetWinBin} (${(fs.statSync(targetWinBin).size / 1024 / 1024).toFixed(1)} MB)`);
console.log(`     -> Çift tıklandığında CMD veya normal site sekmesi açılmaz; özel tarayıcı penceresini başlatır.`);
console.log(`  2. Linux (Tek Binary): ${targetLinuxBin} (${(fs.statSync(targetLinuxBin).size / 1024 / 1024).toFixed(1)} MB)`);
console.log(`     -> ./AtlasAC veya ./AtlasAC-Linux olarak tek tıkla çalışır.`);
console.log('  3. Private packages: AtlasAC-Windows.zip, AtlasAC-Linux.zip');
console.log('======================================================\n');
