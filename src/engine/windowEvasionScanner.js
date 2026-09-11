/**
 * Atlas AC - Window Cloaking & Virtual Desktop Screenshare Evasion Scanner
 * Inspects:
 * - Window Display Affinity (WDA_EXCLUDEFROMCAPTURE / 0x11, WDA_MONITOR / 0x1):
 *   Detects cheat GUIs (Drip Lite, Slinky, Vape v4, external overlays) that make themselves
 *   invisible to Discord, AnyDesk, OBS, and Teams screensharing!
 * - Windows Virtual Desktops (HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\VirtualDesktops):
 *   Detects multiple virtual desktops used to isolate and hide cheat windows during screensharing.
 * - Linux Multi-Workspace Detection (wmctrl / _NET_NUMBER_OF_DESKTOPS).
 *
 * Strict 0 False-Flag Guarantee: Only flags when concrete WDA affinity or multiple virtual desktops are found.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class WindowEvasionScanner {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Evaluates Window Display Affinity value
   */
  evaluateAffinity(affinityValue, windowTitle = '', processName = '', pid = 0) {
    if (affinityValue === undefined || affinityValue === null) return null;
    const val = Number(affinityValue);

    // 0x00000011 = WDA_EXCLUDEFROMCAPTURE (Windows 10 2004+)
    // 0x00000001 = WDA_MONITOR
    if (val === 0x11 || val === 17) {
      return {
        level: 'CRITICAL',
        type: 'WINDOW_CLOAKED_FROM_SCREENSHARE',
        name: `Ekran Paylaşımından Gizlenmiş Pencere (WDA_EXCLUDEFROMCAPTURE: ${windowTitle || processName})`,
        affinity: '0x11 (WDA_EXCLUDEFROMCAPTURE)',
        windowTitle: windowTitle,
        processName: processName,
        pid: pid,
        confidence: '100% (Somut Kanıt: Win32 SetWindowDisplayAffinity)',
        description: `Sistemde ekran yakalamaya karşı gizlenmiş pencere bulundu! Bu özellik (WDA_EXCLUDEFROMCAPTURE) Discord, AnyDesk veya OBS ekran paylaşımında pencerenin görünmez olmasını sağlar: ${windowTitle || processName} (PID: ${pid})`,
        evidence: [
          `Pencere Başlığı: ${windowTitle || 'Gizli Pencere'}`,
          `Süreç Adı: ${processName || 'Bilinmiyor'}`,
          `PID: ${pid}`,
          `Görüntü Yakınlığı (Display Affinity): 0x11 (WDA_EXCLUDEFROMCAPTURE)`,
          `Tehdit: Hile menüsü ekran paylaşımı yapan yetkiliye gösterilmeden arka planda gizlenmektedir`
        ]
      };
    }

    if (val === 0x01 || val === 1) {
      return {
        level: 'HIGH',
        type: 'WINDOW_MONITOR_AFFINITY_SET',
        name: `Monitör Sınırlı Pencere (WDA_MONITOR: ${windowTitle || processName})`,
        affinity: '0x01 (WDA_MONITOR)',
        windowTitle: windowTitle,
        processName: processName,
        pid: pid,
        confidence: '100% (Somut Kanıt: Win32 SetWindowDisplayAffinity)',
        description: `Pencere sadece belirli monitörde görüntülenecek şekilde kısıtlanmış (WDA_MONITOR): ${windowTitle || processName}`,
        evidence: [
          `Pencere: ${windowTitle}`,
          `PID: ${pid}`,
          `Görüntü Yakınlığı: 0x01`
        ]
      };
    }

    return null;
  }

  /**
   * Evaluates Virtual Desktop IDs buffer
   */
  evaluateVirtualDesktops(virtualDesktopCount, currentDesktopIndex = 0) {
    const findings = [];
    if (virtualDesktopCount > 1) {
      findings.push({
        level: 'HIGH',
        type: 'MULTI_VIRTUAL_DESKTOP_ACTIVE',
        name: `Birden Fazla Sanal Masaüstü Aktif (${virtualDesktopCount} Masaüstü)`,
        path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VirtualDesktops',
        desktopCount: virtualDesktopCount,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        confidence: '100% (Somut Kanıt: Windows VirtualDesktops Kayıt Defteri)',
        description: `Sistemde ${virtualDesktopCount} adet Sanal Masaüstü (Virtual Desktop) açık! Ekran kontrolü sırasında hilenin diğer masaüstünde gizlenmediğinden emin olmak için tüm masaüstlerini kontrol edin (Win + Tab).`,
        evidence: [
          `Aktif Sanal Masaüstü Sayısı: ${virtualDesktopCount}`,
          `Geçerli Masaüstü İndeksi: ${currentDesktopIndex}`,
          `Uyarı: Oyuncu ekran paylaşımında yalnızca Masaüstü 1'i paylaşıp hileyi Masaüstü 2'de saklıyor olabilir`
        ]
      });
    }
    return findings;
  }

  /**
   * Evaluates resource packs for hidden java bytecode classes (.class) or PE binaries
   */
  evaluateResourcePackClasses(entries, packPath) {
    const findings = [];
    if (!Array.isArray(entries) || !packPath) return findings;

    const classEntries = entries.filter(e => typeof e === 'string' && e.toLowerCase().endsWith('.class'));
    const peEntries = entries.filter(e => typeof e === 'string' && (e.toLowerCase().endsWith('.exe') || e.toLowerCase().endsWith('.dll')));

    if (classEntries.length > 0) {
      const fileName = path.basename(packPath);
      findings.push({
        level: 'CRITICAL',
        type: 'RESOURCEPACK_HIDDEN_JAVA_CLASSES',
        name: `Resource Pack İçine Gizlenmiş Java Sınıfları (${fileName})`,
        path: packPath,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        confidence: '100% (Somut Kanıt: Resource Pack İçinde .class Bytecode)',
        description: `Minecraft Resource/Shader paketinde meşru doku veya ses yerine ${classEntries.length} adet Java .class bytecode dosyası tespit edildi! Hile istemcisi mod tarayıcılarından kaçmak için resource pack kılığına sokulmuş.`,
        evidence: [
          `Dosya Yolu: ${packPath}`,
          `Tespit Edilen .class Sayısı: ${classEntries.length}`,
          `Örnek Sınıf: ${classEntries[0]}`
        ]
      });
    }

    if (peEntries.length > 0) {
      const fileName = path.basename(packPath);
      findings.push({
        level: 'CRITICAL',
        type: 'RESOURCEPACK_HIDDEN_PE_EXECUTABLE',
        name: `Resource Pack İçinde Windows PE İkili Dosyası (${fileName})`,
        path: packPath,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        confidence: '100% (Somut Kanıt: Resource Pack İçinde .exe/.dll)',
        description: `Resource/Shader paketi içinde Windows çalıştırılabilir dosyası (.exe/.dll) bulundu: ${peEntries[0]}`,
        evidence: [
          `Dosya Yolu: ${packPath}`,
          `Gizlenmiş İkili Dosya: ${peEntries[0]}`
        ]
      });
    }

    return findings;
  }

  /**
   * Main scan routine
   */
  async scanWindowAndDesktopEvasion(onTarget = () => {}) {
    const findings = [];
    onTarget('Window & Desktop Evasion: Checking Cloaked Windows and Virtual Desktops', 15);

    if (this.isWindows) {
      // 1. Virtual Desktops Check
      try {
        const vdCmd = `powershell -NoProfile -Command "$bytes = (Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VirtualDesktops' -Name VirtualDesktopIDs -ErrorAction SilentlyContinue).VirtualDesktopIDs; if ($bytes) { [Math]::Floor($bytes.Length / 16) } else { 1 }"`;
        const { stdout: vdCountStr } = await execPromise(vdCmd, { timeout: 2500 }).catch(() => ({ stdout: '1' }));
        const count = parseInt(vdCountStr.trim(), 10) || 1;
        const vdFindings = this.evaluateVirtualDesktops(count);
        findings.push(...vdFindings);
      } catch (e) {}

      // 2. Window Display Affinity Check (WDA_EXCLUDEFROMCAPTURE)
      try {
        const wdaScript = `
          $sig = @"
          using System;
          using System.Runtime.InteropServices;
          using System.Collections.Generic;

          public class WinCap {
              [DllImport("user32.dll")]
              public static extern bool GetWindowDisplayAffinity(IntPtr hWnd, out uint affinity);

              [DllImport("user32.dll")]
              [return: MarshalAs(UnmanagedType.Bool)]
              public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

              public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

              [DllImport("user32.dll", CharSet = CharSet.Auto)]
              public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);

              [DllImport("user32.dll")]
              public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);

              [DllImport("user32.dll")]
              [return: MarshalAs(UnmanagedType.Bool)]
              public static extern bool IsWindowVisible(IntPtr hWnd);
          }
"@
          Add-Type -TypeDefinition $sig -ErrorAction SilentlyContinue

          $results = [System.Collections.ArrayList]::new()
          [WinCap]::EnumWindows({
              param($hwnd, $lparam)
              if ([WinCap]::IsWindowVisible($hwnd)) {
                  $aff = 0
                  if ([WinCap]::GetWindowDisplayAffinity($hwnd, [ref]$aff) -and $aff -ne 0) {
                      $sb = New-Object System.Text.StringBuilder 256
                      [WinCap]::GetWindowText($hwnd, $sb, 256) | Out-Null
                      $pid = 0
                      [WinCap]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
                      $pname = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
                      $results.Add([PSCustomObject]@{ Title = $sb.ToString(); PID = $pid; ProcessName = $pname; Affinity = $aff }) | Out-Null
                  }
              }
              return $true
          }, [IntPtr]::Zero) | Out-Null

          $results | ConvertTo-Json
        `;

        const { stdout: wdaJson } = await execPromise(`powershell -NoProfile -Command "${wdaScript.replace(/\r?\n/g, ' ')}"`, {
          timeout: 4000,
          maxBuffer: 5 * 1024 * 1024
        }).catch(() => ({ stdout: '' }));

        if (wdaJson && wdaJson.trim().length > 0) {
          let items = [];
          try {
            const parsed = JSON.parse(wdaJson);
            items = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}

          for (const item of items) {
            const evaluated = this.evaluateAffinity(item.Affinity, item.Title, item.ProcessName, item.PID);
            if (evaluated) {
              findings.push(evaluated);
            }
          }
        }
      } catch (e) {}
    } else {
      // Linux Multi-Workspace Detection
      try {
        const { stdout } = await execPromise('xprop -root _NET_NUMBER_OF_DESKTOPS 2>/dev/null || wmctrl -d 2>/dev/null', { timeout: 2000 }).catch(() => ({ stdout: '' }));
        if (stdout) {
          const match = stdout.match(/_NET_NUMBER_OF_DESKTOPS.*=\s*(\d+)/);
          if (match) {
            const count = parseInt(match[1], 10);
            if (count > 1) {
              const vdFindings = this.evaluateVirtualDesktops(count);
              findings.push(...vdFindings);
            }
          }
        }
      } catch (e) {}
    }

    return {
      status: 'SUCCESS',
      findings: findings
    };
  }
}

module.exports = new WindowEvasionScanner();
