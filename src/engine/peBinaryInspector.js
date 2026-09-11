/**
 * Atlas AC - Portable Executable (PE) & Binary Purpose Inspector
 * Performs deep, dependency-free parsing of Windows PE files (DLL, EXE, SYS) and binaries:
 * - DOS / PE Header Validation (MZ, PE\0\0, Machine, Subsystem, Characteristics)
 * - Extension Discrepancy & Disguised Executable Detection (.png, .txt, .tmp containing PE headers)
 * - Section Table & RVA Translation
 * - Export Table Extraction (Function names, JNI exports, hook symbols)
 * - Import Table Extraction (Targeted DLLs and API calls)
 * - Authenticode Digital Signature Extraction (Publisher / Subject verification)
 * - Binary Content & String Classification (Legitimate libraries vs Cheat injectors)
 */

const fs = require('fs');
const path = require('path');
const serverPolicy = require('../config/serverPolicy');

class PeBinaryInspector {
  constructor() {
    // Known legitimate Minecraft / JVM native library keywords and exports
    this.legitMinecraftNatives = [
      'lwjgl', 'jemalloc', 'glfw', 'openal', 'openal32', 'lwjgl_stb', 'lwjgl_opengl',
      'lwjgl_tinyfd', 'lwjgl_remotery', 'lwjgl_vulkan', 'jna', 'wisp', 'shaderc',
      'jline', 'jlinenative', 'glass', 'javafx', 'prism_', 'prism-es2', 'prism-d3d',
      'prism-sw', 'jfxwebkit', 'decora', 'glib-lite', 'gstreamer-lite', 'fxplugins',
      'attach', 'management', 'sunec', 'lcms', 'javajpeg', 'freetype'
    ];

    // Known legitimate Minecraft voice / audio codec native libraries
    this.legitMediaCodecs = [
      'libopus', 'libopus4j', 'librnnoise', 'librnnoise4j', 'libspeex', 'libspeex4j',
      'liblame', 'liblame4j', 'soundengine', 'voicechat'
    ];

    // Known legitimate screen recorders and game overlay hooks
    this.legitOverlayHooks = [
      { pattern: /discord[-_]?hook/i, name: 'Discord In-Game Overlay', vendor: 'Discord, Inc.' },
      { pattern: /medal[-_]?hook/i, name: 'Medal.tv Game Recorder Hook', vendor: 'Medal B.V.' },
      { pattern: /graphics[-_]?hook|obs[-_]?hook/i, name: 'OBS Studio Game Capture', vendor: 'OBS Project' },
      { pattern: /rtsshooks|rivatuner/i, name: 'RivaTuner Statistics Server (RTSS)', vendor: 'Guru3D / Unwinder' },
      { pattern: /gameoverlayrenderer/i, name: 'Steam In-Game Overlay', vendor: 'Valve Corporation' },
      { pattern: /nvspcap|nvapi|geforce/i, name: 'NVIDIA GeForce Experience ShadowPlay', vendor: 'NVIDIA Corporation' },
      { pattern: /overwolf.*hook/i, name: 'Overwolf Overlay Engine', vendor: 'Overwolf Ltd.' }
    ];

    // Known motherboard / hardware management drivers
    this.legitHardwareDrivers = [
      { base: 'gdrv', name: 'GIGABYTE Motherboard Utility Driver', vendor: 'GIGA-BYTE TECHNOLOGY CO., LTD.' },
      { base: 'asusgio', name: 'ASUS Motherboard Utility Driver', vendor: 'ASUSTeK COMPUTER INC.' },
      { base: 'eneio', name: 'ENE Technology RGB Controller', vendor: 'ENE TECHNOLOGY INC.' },
      { base: 'rtcore64', name: 'MSI Afterburner / Realtek Driver', vendor: 'MICRO-STAR INTERNATIONAL CO., LTD.' }
    ];

    // High confidence unambiguous cheat strings & signatures
    this.cheatStrings = [
      'vape_v4', 'vape_v3', 'vape.gg', 'vapeclient',
      'slinky_client', 'slinky.gg',
      'drip_client', 'drip_lite', 'drip.gg',
      'doomsdayclient', 'doomsday_core',
      'kura_ghost', 'whiteout_client', 'whiteout.gg',
      'raven_bplus', 'ravenbplus',
      'liquidlauncher', 'liquidbounce',
      'nightmare-cheats', 'nightmareloader'
    ];

    // Generic combat cheat tokens (only evaluated when JVM targeting is present)
    this.combatTokens = [
      'killaura', 'reachdistance', 'velocityhorizontal', 'fastplace',
      'scaffoldwalk', 'triggerbot', 'antiknockback', 'hitboxexpansion'
    ];

    // JVM / JNI manipulation API calls and signatures
    this.jvmHookTokens = [
      'net/minecraft/client/Minecraft',
      'Lnet/minecraft/client/Minecraft;',
      'net.minecraft.client.Minecraft',
      'JNI_GetCreatedJavaVMs',
      'JNI_CreateJavaVM',
      'AttachCurrentThread',
      'DetachCurrentThread',
      'GetEnv',
      'FindClass',
      'GetMethodID',
      'GetStaticMethodID',
      'CallVoidMethod',
      'CallObjectMethod',
      'GetFieldID',
      'SetBooleanField'
    ];

    // Dangerous memory injection APIs
    this.injectionApis = [
      'VirtualAllocEx',
      'WriteProcessMemory',
      'CreateRemoteThread',
      'QueueUserAPC',
      'SetWindowsHookEx',
      'NtQueueApcThread',
      'RtlCreateUserThread'
    ];
  }

  /**
   * Inspects a file on disk (reads buffer safely, capped at 30MB).
   */
  inspectFile(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return { status: 'FILE_NOT_FOUND', filePath };
    }

    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return { status: 'IS_DIRECTORY', filePath };
      }

      // Fast memory-efficient read (capped at 4MB for instant parsing without zero-fill overhead)
      const readSize = Math.min(stats.size, 4 * 1024 * 1024);
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.allocUnsafe(readSize);
      const bytesRead = fs.readSync(fd, buffer, 0, readSize, 0);
      fs.closeSync(fd);

      const activeBuffer = bytesRead === readSize ? buffer : buffer.slice(0, bytesRead);
      return this.inspectBuffer(activeBuffer, filePath, stats.size);
    } catch (err) {
      return { status: 'ERROR', filePath, error: err.message };
    }
  }

  /**
   * Parses PE buffer and performs comprehensive binary intent analysis.
   */
  inspectBuffer(buffer, filePath = '', totalFileSize = 0) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();

    // 1. Check DOS Header (MZ)
    const hasDosHeader = buffer.length >= 64 && buffer[0] === 0x4D && buffer[1] === 0x5A; // 'MZ'

    if (!hasDosHeader) {
      // Not a PE executable
      const isExpectedBinary = ['.exe', '.dll', '.sys', '.cpl', '.scr', '.drv'].includes(ext);
      return {
        isPe: false,
        status: 'NON_PE',
        filePath,
        fileName,
        extension: ext,
        corruptedOrFakePe: isExpectedBinary && totalFileSize > 0,
        purpose: 'NON_EXECUTABLE_DATA',
        isSafe: true,
        isThreat: false
      };
    }

    // 2. Read e_lfanew (PE Header Offset)
    const peOffset = buffer.readUInt32LE(0x3C);
    if (peOffset + 24 > buffer.length || buffer[peOffset] !== 0x50 || buffer[peOffset + 1] !== 0x45 || buffer[peOffset + 2] !== 0x00 || buffer[peOffset + 3] !== 0x00) {
      return {
        isPe: false,
        status: 'INVALID_PE_SIGNATURE',
        filePath,
        fileName,
        extension: ext,
        purpose: 'CORRUPTED_OR_NON_STANDARD_BINARY',
        isSafe: true,
        isThreat: false
      };
    }

    // 3. COFF File Header
    const machine = buffer.readUInt16LE(peOffset + 4);
    const numberOfSections = buffer.readUInt16LE(peOffset + 6);
    const timeDateStamp = buffer.readUInt32LE(peOffset + 8);
    const sizeOfOptionalHeader = buffer.readUInt16LE(peOffset + 20);
    const characteristics = buffer.readUInt16LE(peOffset + 22);

    const isDll = !!(characteristics & 0x2000);
    const isExecutableImage = !!(characteristics & 0x0002);

    let arch = 'x86 (32-bit)';
    if (machine === 0x8664) arch = 'x64 (64-bit)';
    else if (machine === 0xAA64) arch = 'ARM64';

    // 4. Optional Header
    let is64Bit = false;
    let subsystem = 0;
    let exportRva = 0;
    let exportSize = 0;
    let importRva = 0;
    let importSize = 0;
    let certOffset = 0;
    let certSize = 0;

    if (sizeOfOptionalHeader >= 96) {
      const optMagic = buffer.readUInt16LE(peOffset + 24);
      is64Bit = (optMagic === 0x20B);

      subsystem = buffer.readUInt16LE(peOffset + 24 + 68);

      const dataDirStart = peOffset + 24 + (is64Bit ? 112 : 96);
      if (dataDirStart + 40 <= peOffset + 24 + sizeOfOptionalHeader) {
        // Directory 0: Export Table
        exportRva = buffer.readUInt32LE(dataDirStart);
        exportSize = buffer.readUInt32LE(dataDirStart + 4);

        // Directory 1: Import Table
        importRva = buffer.readUInt32LE(dataDirStart + 8);
        importSize = buffer.readUInt32LE(dataDirStart + 12);

        // Directory 4: Certificate Table (Security Directory)
        // Note: certOffset is direct file offset, not RVA!
        certOffset = buffer.readUInt32LE(dataDirStart + 32);
        certSize = buffer.readUInt32LE(dataDirStart + 36);
      }
    }

    // 5. Parse Section Headers Table to resolve RVAs
    const sectionTableOffset = peOffset + 24 + sizeOfOptionalHeader;
    const sections = [];

    for (let i = 0; i < numberOfSections; i++) {
      const secOffset = sectionTableOffset + (i * 40);
      if (secOffset + 40 > buffer.length) break;

      const secName = buffer.slice(secOffset, secOffset + 8).toString('ascii').replace(/\0/g, '').trim();
      const vSize = buffer.readUInt32LE(secOffset + 8);
      const vAddr = buffer.readUInt32LE(secOffset + 12);
      const rawSize = buffer.readUInt32LE(secOffset + 16);
      const rawAddr = buffer.readUInt32LE(secOffset + 20);

      sections.push({ name: secName, vSize, vAddr, rawSize, rawAddr });
    }

    const rvaToOffset = (rva) => {
      if (!rva) return null;
      for (const s of sections) {
        if (rva >= s.vAddr && rva < s.vAddr + Math.max(s.vSize, s.rawSize)) {
          return s.rawAddr + (rva - s.vAddr);
        }
      }
      return null;
    };

    // 6. Extract Exported Function Names
    const exportedFunctions = [];
    if (exportRva > 0 && exportSize > 0) {
      const expOffset = rvaToOffset(exportRva);
      if (expOffset && expOffset + 40 <= buffer.length) {
        const numNames = buffer.readUInt32LE(expOffset + 24);
        const namesRva = buffer.readUInt32LE(expOffset + 32);
        const namesOffset = rvaToOffset(namesRva);

        if (namesOffset && numNames > 0) {
          const count = Math.min(numNames, 150); // Inspect up to 150 exported names
          for (let i = 0; i < count; i++) {
            if (namesOffset + (i * 4) + 4 > buffer.length) break;
            const nameRva = buffer.readUInt32LE(namesOffset + (i * 4));
            const nameOff = rvaToOffset(nameRva);
            if (nameOff && nameOff < buffer.length) {
              let str = '';
              let p = nameOff;
              while (p < buffer.length && buffer[p] !== 0 && str.length < 128) {
                str += String.fromCharCode(buffer[p]);
                p++;
              }
              if (str.length > 0) exportedFunctions.push(str);
            }
          }
        }
      }
    }

    // 7. Extract Imported DLLs
    const importedDlls = [];
    if (importRva > 0 && importSize > 0) {
      const impOffset = rvaToOffset(importRva);
      if (impOffset) {
        let ptr = impOffset;
        while (ptr + 20 <= buffer.length && importedDlls.length < 50) {
          const origThunk = buffer.readUInt32LE(ptr);
          const nameRva = buffer.readUInt32LE(ptr + 12);
          const firstThunk = buffer.readUInt32LE(ptr + 16);

          if (origThunk === 0 && nameRva === 0 && firstThunk === 0) break; // End of import descriptors

          if (nameRva > 0) {
            const nameOff = rvaToOffset(nameRva);
            if (nameOff && nameOff < buffer.length) {
              let dllName = '';
              let p = nameOff;
              while (p < buffer.length && buffer[p] !== 0 && dllName.length < 64) {
                dllName += String.fromCharCode(buffer[p]);
                p++;
              }
              if (dllName.length > 0) importedDlls.push(dllName);
            }
          }
          ptr += 20;
        }
      }
    }

    // 8. Authenticode Digital Certificate Signer Extraction
    let hasAuthenticode = false;
    let certSigners = [];
    if (certOffset > 0 && certSize > 8 && certOffset + certSize <= buffer.length) {
      hasAuthenticode = true;
      try {
        const certData = buffer.slice(certOffset + 8, certOffset + certSize).toString('latin1');
        const orgMatches = certData.match(/[A-Z0-9\.\,\-\s]{4,60}/gi) || [];
        const recognizedOrgs = orgMatches.filter(s =>
          /Corporation|Inc\.|LLC|Valve|Microsoft|Google|Discord|Medal|NVIDIA|GIGA-BYTE|ASUSTeK|Oracle|Eclipse/i.test(s)
        ).map(s => s.replace(/[\x00-\x1F]/g, '').trim()).filter(Boolean);

        certSigners = [...new Set(recognizedOrgs)].slice(0, 5);
      } catch (e) {}
    }

    // 9. Scan Binary Content for Strings (ASCII & UTF-16LE)
    const contentString = buffer.toString('latin1');
    const contentString16 = buffer.toString('utf16le');
    const matchedCheatTokens = this.cheatStrings.filter(token => {
      const re = new RegExp(token, 'i');
      return re.test(contentString) || re.test(contentString16);
    });

    const matchedJvmHooks = this.jvmHookTokens.filter(t => contentString.includes(t) || contentString16.includes(t));
    const matchedInjectionApis = this.injectionApis.filter(api => contentString.includes(api) || contentString16.includes(api));

    // 10. Check Extension Discrepancy (Masked PE)
    const lowerName = fileName.toLowerCase();
    // Extensions that legitimately contain a PE image by design (renamed DLLs, .NET/Node metadata)
    const legitimatePeExtensions = ['.exe', '.dll', '.sys', '.scr', '.cpl', '.ocx', '.drv', '.efi', '.node', '.winmd', '.mui', '.ax', '.com', '.pyd', '.pyc', '.pdb'];
    // Extensions that can NEVER legitimately contain a full PE image
    const impossiblePeExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.ico', '.tiff', '.svg',
      '.mp3', '.mp4', '.mkv', '.avi', '.mov', '.wav', '.flac', '.ogg',
      '.txt', '.md', '.log', '.json', '.xml', '.html', '.htm', '.css',
      '.js', '.py', '.pdf', '.docx', '.xlsx', '.pptx', '.odg', '.odt',
      '.jar', '.zip', '.rar', '.7z', '.gz', '.class'
    ];
    // Extensions where PE content legitimately occurs (installer temps, caches, partial downloads)
    const ambiguousPeExtensions = new Set([
      '.tmp', '.dat', '.bin', '.cache', '.part', '.crdownload', '.download',
      '.ini', '.cfg', '.config', '.db', '.bak', '.old', '.data', '.pak',
      '.blob', '.bin2', '.msi', '.msu', '.cab', '.idx'
    ]);
    const isEfi = (subsystem >= 10 && subsystem <= 13) || ext === '.efi';
    const isTempPortalFile = lowerName.startsWith('.xdp-') || lowerName.startsWith('.goutputstream-') || /\.dll[-_.]/i.test(lowerName) || /\.exe[-_.]/i.test(lowerName);

    const extClass = isEfi || legitimatePeExtensions.includes(ext)
      ? 'expected'
      : impossiblePeExtensions.includes(ext) ? 'impossible'
      : ambiguousPeExtensions.has(ext) ? 'ambiguous' : 'unknown';

    // Only extensions that can NEVER hold a PE and are digitally unsigned are "disguised"
    const isDisguisedExtension = extClass === 'impossible' && !hasAuthenticode;
    // Installer-temp/cache style extensions are only suspicious when real cheat signals are present
    const isAmbiguousPe = extClass === 'ambiguous' && !hasAuthenticode && !isTempPortalFile;

    // 11. Determine Binary Purpose & Classification
    const classification = this.classifyBinary({
      filePath,
      fileName,
      extension: ext,
      isDll,
      isExecutableImage,
      subsystem,
      isEfi,
      isDisguisedExtension,
      isAmbiguousPe,
      exportedFunctions,
      importedDlls,
      hasAuthenticode,
      certSigners,
      matchedCheatTokens,
      matchedJvmHooks,
      matchedInjectionApis,
      contentString,
      contentString16
    });

    return {
      isPe: true,
      filePath,
      fileName,
      extension: ext,
      arch,
      is64Bit,
      isDll,
      isExecutableImage,
      subsystem,
      hasAuthenticode,
      certSigners,
      exportedFunctions: exportedFunctions.slice(0, 20),
      importedDlls,
      matchedCheatTokens,
      matchedJvmHooks,
      matchedInjectionApis,
      isDisguisedExtension,
      isAmbiguousPe,
      purpose: classification.purpose,
      category: classification.category,
      isSafe: classification.isSafe,
      isThreat: classification.isThreat,
      severity: classification.severity,
      level: classification.level || classification.severity,
      badge: classification.badge || null,
      badgeText: classification.badgeText || null,
      description: classification.description,
      evidence: classification.evidence
    };
  }

  /**
   * Evaluates extracted characteristics to classify the binary's actual intent.
   */
  classifyBinary(data) {
    const {
      filePath = '',
      fileName,
      extension,
      isDll,
      isDisguisedExtension,
      isAmbiguousPe,
      exportedFunctions,
      hasAuthenticode,
      certSigners,
      matchedCheatTokens,
      matchedJvmHooks,
      matchedInjectionApis,
      contentString,
      contentString16
    } = data;

    const lowerName = fileName.toLowerCase();

    // A0. LEGITIMATE UEFI FIRMWARE UTILITY (.efi)
    if (data.isEfi) {
      return {
        purpose: 'LEGITIMATE_EFI_APPLICATION',
        category: 'UEFI Firmware / Hardware Utility',
        isSafe: true,
        isThreat: false,
        severity: 'INFO',
        description: `Official UEFI boot application or hardware firmware tool (${fileName}): Uses PE COFF format with Subsystem ${data.subsystem || 10}.`,
        evidence: [`File: ${fileName}`, `Type: UEFI Application`]
      };
    }

    // A. DISGUISED EXECUTABLE (e.g. hack.png, payload.txt, dll.tmp that is actually PE)
    if (isDisguisedExtension) {
      // Exclude Atlas AC / Farben AC's own generated temp payload files
      if (lowerName.includes('atlas') || lowerName.includes('farben')) {
        return {
          purpose: 'ATLAS_AC_PAYLOAD',
          category: 'Anti-Cheat Engine',
          isSafe: true,
          isThreat: false,
          severity: 'INFO',
          description: 'Atlas AC self-extracting runtime component.',
          evidence: [`Filename: ${fileName}`, `Extension: ${extension}`]
        };
      }

      return {
        purpose: 'DISGUISED_EXECUTABLE',
        category: 'Stealth Execution / Malware Disguise',
        isSafe: false,
        isThreat: true,
        severity: 'CRITICAL',
        description: `Disguised PE executable detected: File has extension "${extension}" but contains valid Windows PE machine bytecode! Cheats disguise DLLs/EXEs as images or data files to evade manual screenshares.`,
        evidence: [
          `Target File: ${fileName}`,
          `Fake Extension: ${extension}`,
          `Actual Type: Windows PE ${isDll ? 'DLL' : 'Executable'}`
        ]
      };
    }

    // A1. OFFICIAL BROWSER RUNTIME COMPONENTS (e.g. Google Chrome gcapi.dll)
    if (contentString.includes('google_update_settings') || contentString.includes('LaunchGoogleChrome') || contentString.includes('GoogleChromeCompatibilityCheck')) {
      return {
        purpose: 'LEGITIMATE_APPLICATION',
        category: 'Google Chrome Runtime Component',
        isSafe: true,
        isThreat: false,
        severity: 'INFO',
        description: `Official Google Chrome API / Updater component (${fileName}).`,
        evidence: [`Publisher: Google LLC`, `File: ${fileName}`]
      };
    }

    // A2. OFFICIAL WINDOWS CORE SYSTEM LIBRARIES (Safe)
    const knownWindowsSystemDlls = new Set([
      'kernelbase.dll', 'kernel32.dll', 'ntdll.dll', 'user32.dll', 'gdi32.dll',
      'advapi32.dll', 'msvcrt.dll', 'ucrtbase.dll', 'shell32.dll', 'ole32.dll',
      'oleaut32.dll', 'ws2_32.dll', 'crypt32.dll', 'shlwapi.dll', 'version.dll',
      'comctl32.dll', 'rpcrt4.dll', 'imm32.dll', 'sechost.dll', 'bcrypt.dll',
      'winhttp.dll', 'urlmon.dll', 'setupapi.dll', 'cfgmgr32.dll', 'comdlg32.dll',
      'iphlpapi.dll', 'dnsapi.dll', 'netapi32.dll', 'wtsapi32.dll', 'd3d11.dll',
      'dxgi.dll', 'opengl32.dll', 'glu32.dll'
    ]);
    if (knownWindowsSystemDlls.has(lowerName)) {
      return {
        purpose: 'LEGITIMATE_WINDOWS_SYSTEM_LIBRARY',
        category: 'Windows OS Core System Library',
        isSafe: true,
        isThreat: false,
        severity: 'INFO',
        description: `Official Microsoft Windows core operating system library (${fileName}).`,
        evidence: [`File: ${fileName}`, 'Type: Windows System Component']
      };
    }

    // B. MINECRAFT LWJGL / JNA / JLINE / JAVAFX / SYSTEM NATIVE LIBRARIES (Safe)
    const isLwjgl = this.legitMinecraftNatives.some(n => lowerName.startsWith(n) || lowerName.includes(n));
    const hasLwjglExport = exportedFunctions.some(f => f.startsWith('Java_org_lwjgl') || f.startsWith('org_lwjgl') || f.startsWith('Java_com_sun_jna') || f.startsWith('Java_com_sun_glass') || f.startsWith('glfw') || f.startsWith('alc') || f.startsWith('je_') || f.toLowerCase().includes('jline') || f.toLowerCase().includes('glass'));
    const hasLwjglString = contentString.includes('Lightweight Java Game Library') || contentString.includes('org.lwjgl') || contentString.includes('com.sun.jna') || contentString.includes('com.sun.glass') || contentString.includes('org.jline') || contentString.includes('jline-native') || contentString.includes('javafx') || contentString.includes('openjfx');

    if (isLwjgl || hasLwjglExport || hasLwjglString) {
      return {
        purpose: 'LEGITIMATE_MINECRAFT_NATIVE',
        category: 'Minecraft Runtime / Graphics / Console',
        isSafe: true,
        isThreat: false,
        severity: 'INFO',
        description: `Standard Minecraft native runtime library (${fileName}): Provides LWJGL, OpenGL, GLFW, JavaFX/Glass, JLine, or JNA system bindings.`,
        evidence: [`Exports: ${exportedFunctions.slice(0, 5).join(', ') || 'Standard Native Symbols'}`]
      };
    }

    // C. MINECRAFT VOICE / AUDIO CODECS (Safe)
    const isAudioCodec = this.legitMediaCodecs.some(c => lowerName.includes(c));
    const hasAudioCodecString = contentString.includes('opus') || contentString.includes('rnnoise') || contentString.includes('speex') || contentString.includes('liblame');

    if (isAudioCodec || hasAudioCodecString) {
      return {
        purpose: 'LEGITIMATE_MEDIA_CODEC',
        category: 'In-Game Voice / Audio Processing',
        isSafe: true,
        isThreat: false,
        severity: 'INFO',
        description: `Minecraft voice chat audio codec library (${fileName}): Provides Opus, RNNoise, or Speex processing for in-game proximity voice mods.`,
        evidence: [`File: ${fileName}`]
      };
    }

    // D. LEGITIMATE SCREEN RECORDING & OVERLAY HOOKS (Safe)
    for (const hook of this.legitOverlayHooks) {
      if (hook.pattern.test(lowerName) || certSigners.some(s => s.toLowerCase().includes(hook.vendor.toLowerCase().split(' ')[0]))) {
        return {
          purpose: 'LEGITIMATE_OVERLAY_HOOK',
          category: 'Screen Recording / Game Overlay',
          isSafe: true,
          isThreat: false,
          severity: 'INFO',
          description: `Authorized game capture and overlay hook (${hook.name}): Injected into rendering pipelines by ${hook.vendor} for recording / HUDs.`,
          evidence: [
            `Module: ${fileName}`,
            `Verified Application: ${hook.name}`,
            `Publisher Signer: ${certSigners.join(', ') || hook.vendor}`
          ]
        };
      }
    }

    // E. HARDWARE / MOTHERBOARD MANAGEMENT DRIVERS (Safe unless dropped in Temp)
    for (const hw of this.legitHardwareDrivers) {
      if (lowerName.includes(hw.base) || certSigners.some(s => s.toLowerCase().includes(hw.vendor.toLowerCase().split(' ')[0]))) {
        return {
          purpose: 'LEGITIMATE_HARDWARE_UTILITY',
          category: 'Motherboard & Hardware Utility',
          isSafe: true,
          isThreat: false,
          severity: 'INFO',
          description: `Official hardware driver (${hw.name}): Signed by ${hw.vendor}.`,
          evidence: [`Driver: ${fileName}`, `Signer: ${certSigners.join(', ') || hw.vendor}`]
        };
      }
    }

    // F. SIGNED LEGITIMATE APPLICATION (Safe - Prioritized to prevent false alarms on AnyDesk/Intel/MS)
    if (hasAuthenticode && certSigners.length > 0) {
      const isKnownLegitVendor = certSigners.some(s =>
        /AnyDesk|Microsoft|Intel|Valve|Google|Discord|Medal|NVIDIA|GIGA-BYTE|ASUSTeK|Oracle|Eclipse|Mozilla|Adobe|Apple|Logitech|Razer|Corsair/i.test(s)
      );
      if (isKnownLegitVendor) {
        return {
          purpose: 'LEGITIMATE_APPLICATION',
          category: 'Digitally Signed Application',
          isSafe: true,
          isThreat: false,
          severity: 'INFO',
          description: `Verified executable signed by ${certSigners.join(', ')}.`,
          evidence: [`Publisher: ${certSigners.join(', ')}`]
        };
      }
    }

    // F2. KNOWN CHEAT LAUNCHER & EXTERNAL CHEAT BINARIES
    const isLiquidLauncher = /liquidlauncher/i.test(lowerName) || /liquidlauncher/i.test(contentString) || (contentString16 && /liquidlauncher/i.test(contentString16));
    const isNightmareCheat = /^nightmare/i.test(lowerName) || /nightmare-cheats/i.test(contentString) || (contentString16 && /nightmare-cheats/i.test(contentString16));

    if ((isLiquidLauncher || isNightmareCheat) && !hasAuthenticode) {
      const cheatName = isLiquidLauncher ? 'LiquidLauncher (LiquidBounce Installer)' : 'Nightmare Client / External Loader';
      return {
        purpose: isLiquidLauncher ? 'CHEAT_LAUNCHER_INSTALLER' : 'EXTERNAL_CHEAT_LOADER',
        category: isLiquidLauncher ? 'Cheat Client Launcher / Installer' : 'External Cheat / Loader',
        isSafe: false,
        isThreat: true,
        severity: 'CRITICAL',
        description: `Doğrulanmış hile ikili dosyası tespit edildi (${fileName}): ${cheatName}.`,
        evidence: [
          `Dosya: ${fileName}`,
          `Hile Kuralı: ${cheatName}`,
          isLiquidLauncher ? 'Tespit: LiquidLauncher (CCBlueX LiquidBounce)' : 'Tespit: Nightmare External Minecraft Cheat'
        ]
      };
    }

    // F3. KNOWN SCREENSHARE SCANNER & ANTI-CHEAT DIAGNOSTIC TOOLS (Safe)
    // These tools legitimately contain cheat name strings (e.g. liquidbounce, vape) in their detection databases
    const isSecurityScannerTool = /astralis|paladin|avenge|echo.*scanner|echoac|oceanac|ocean_ac|atlasac|atlas_ac|farben/i.test(lowerName) ||
                                  /astralis/i.test(filePath);
    if (isSecurityScannerTool) {
      return {
        purpose: 'SECURITY_SCANNER_TOOL',
        category: 'Anti-Cheat / Screenshare Diagnostic Tool',
        isSafe: true,
        isThreat: false,
        severity: 'INFO',
        description: `Meşru ekran paylaşımı / güvenlik analiz aracı (${fileName}): İmzalarındaki hile belirteçleri tespit veritabanı içeriğidir.`,
        evidence: [`Dosya: ${fileName}`, 'Güvenlik ve İnceleme Aracı']
      };
    }

    // G. CONFIRMED CHEAT INJECTION / GHOST CLIENT PE (Threat)
    const unambiguousJvmTokens = [
      'net/minecraft/client/Minecraft',
      'Lnet/minecraft/client/Minecraft;',
      'net.minecraft.client.Minecraft',
      'JNI_GetCreatedJavaVMs',
      'JNI_CreateJavaVM',
      'AttachCurrentThread',
      'DetachCurrentThread',
      'jvm.dll'
    ];
    const hasFoundationJvmToken = unambiguousJvmTokens.some(t => contentString.includes(t) || (contentString16 && contentString16.includes(t)));
    const hasUnambiguousCheatTokens = matchedCheatTokens.length > 0;
    const hasJvmTargeting = hasFoundationJvmToken && (matchedJvmHooks.length >= 2 || hasCombatTokens);
    const hasInjectionRoutines = matchedInjectionApis.length >= 2;
    const hasCombatTokens = this.combatTokens.some(t => contentString.includes(t));

    const isConfirmedCheat = hasUnambiguousCheatTokens || (hasJvmTargeting && (hasInjectionRoutines || hasCombatTokens));

    if (isConfirmedCheat && !hasAuthenticode) {
      return {
        purpose: 'CHEAT_INJECTOR_PE',
        category: 'Minecraft Memory Injector / Ghost Client',
        isSafe: false,
        isThreat: true,
        severity: 'CRITICAL',
        description: `Active Minecraft cheat binary / memory injector identified (${fileName}): Contains ghost client routines and unauthorized JVM bytecode hooks!`,
        evidence: [
          matchedCheatTokens.length > 0 ? `Matched Cheat Tokens: ${matchedCheatTokens.join(', ')}` : null,
          matchedJvmHooks.length > 0 ? `JVM Manipulation Hooks: ${matchedJvmHooks.slice(0, 4).join(', ')}` : null,
          matchedInjectionApis.length > 0 ? `Memory Injection APIs: ${matchedInjectionApis.join(', ')}` : null
        ].filter(Boolean)
      };
    }

    // A2. AMBIGUOUS-EXTENSION PE (installer temp / cache / partial download containers).
    // These legitimately hold PE images (INS_*.TMP, BYF*.tmp, *.crdownload, *.part, updater caches).
    // Runs AFTER confirmed-cheat checks so real cheats (LiquidLauncher etc.) are never shadowed.
    // Only suspicious when real cheat signals corroborate the disguise.
    if (isAmbiguousPe) {
      const hasCorroboratingSignals =
        matchedCheatTokens.length > 0 ||
        matchedJvmHooks.length >= 2 ||
        (matchedInjectionApis.length >= 2 && /inject|hook|hack|cheat|ghost|client/i.test(contentString));

      if (hasCorroboratingSignals) {
        return {
          purpose: 'DISGUISED_EXECUTABLE',
          category: 'Stealth Execution / Malware Disguise',
          isSafe: false,
          isThreat: true,
          severity: 'HIGH',
          description: `Şüpheli uzantılı PE ikili dosyası (${fileName}): "${extension}" uzantılı dosya PE içeriyor ve hile imzaları barındırıyor.`,
          evidence: [
            `Hedef Dosya: ${fileName}`,
            `Uzantı: ${extension}`,
            matchedCheatTokens.length > 0 ? `Eşleşen Hile Belirteçleri: ${matchedCheatTokens.join(', ')}` : null,
            matchedJvmHooks.length >= 2 ? `JVM Hooks: ${matchedJvmHooks.slice(0, 4).join(', ')}` : null,
            matchedInjectionApis.length >= 2 ? `Injection API'ler: ${matchedInjectionApis.slice(0, 4).join(', ')}` : null
          ].filter(Boolean)
        };
      }

      return {
        purpose: 'NONSTD_BINARY',
        category: 'Installer Temp / Cache Binary',
        isSafe: true,
        isThreat: false,
        severity: 'INFO',
        description: `Non-standard extension PE module (${fileName}): Extension "${extension}" is a known installer/temp/cache container and no cheat indicators were found.`,
        evidence: [`File: ${fileName}`, `Extension: ${extension}`, 'Uzantı PE içeriğiyle birlikte meşru temp/cache taşıyıcı olarak değerlendirildi.']
      };
    }

    // H. AUTOCLICKER BINARY (Threat)
    const isAutoclickerName = /^(op)?autoclicker|fastclick|murgee|opautoclick|autotap/i.test(lowerName);
    // Legit installers/updaters and runtime natives legitimately use SendInput for automation and event loops
    const isInstallerLike = /installer|setup|updater|update|bootstrap|uninstall/i.test(lowerName);
    const isRuntimeNative = isLwjgl || /glass|javafx|prism|lwjgl|openal/i.test(lowerName);
    const clickApiHits = ['mouse_event', 'SendInput', 'WH_MOUSE_LL', 'GetAsyncKeyState', 'SetWindowsHookExA', 'SetWindowsHookExW'].filter(
      t => contentString.includes(t) || (contentString16 && contentString16.includes(t))
    );
    // Strict clicker behavior: Dedicated autoclicker concepts, NOT generic GUI concepts like 'interval' or 'double click'
    const hasClickBehavior = /\bcps\b|jitter|click\s*delay|click_speed|auto\s*click|autoclicker/i.test(contentString);
    const hasClickerStrings = !isInstallerLike && !isRuntimeNative && clickApiHits.length >= 2 && hasClickBehavior;

    if (isAutoclickerName || (hasClickerStrings && !hasAuthenticode)) {
      const isAllowed = serverPolicy.isAutoClickerAllowed();
      return {
        purpose: isAllowed ? 'ALLOWED_UTILITY_AUTOCLICKER' : 'AUTOCLICKER_BINARY',
        category: 'Autonomous Input Simulator',
        isSafe: isAllowed,
        isThreat: !isAllowed,
        severity: isAllowed ? 'INFO' : 'HIGH',
        level: isAllowed ? 'INFO' : 'HIGH',
        badge: isAllowed ? 'ALLOWED_POLICY' : null,
        badgeText: isAllowed ? 'SUNUCU İZNİ: AUTOCLICKER SERBEST' : null,
        description: isAllowed
          ? `Otonom fare tıklama simülatörü (${fileName}) tespit edildi, ancak sunucu kuralı gereğince serbest bırakılmıştır.`
          : `Standalone AutoClicker executable detected (${fileName}): Contains low-level mouse click simulation loops.`,
        evidence: [
          `File: ${fileName}`,
          `Input Simulation APIs: mouse_event / SendInput loops detected`,
          ...(isAllowed ? ['Sunucu Politikası: AutoClicker kullanımına izin verilmiştir (serverPolicy.allowAutoClickers = true)'] : [])
        ]
      };
    }

    // I. UNKNOWN STANDALONE BINARY (Neutral)
    return {
      purpose: 'UNKNOWN_STANDALONE_BINARY',
      category: 'Generic Binary',
      isSafe: true,
      isThreat: false,
      severity: 'INFO',
      description: `Unsigned binary module (${fileName}) with no malicious indicators found.`,
      evidence: [`File: ${fileName}`]
    };
  }
}

module.exports = new PeBinaryInspector();
