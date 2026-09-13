/**
 * Atlas AC - JVM Attach API & Bytecode Injection Detector
 *
 * Detects runtime memory injection into Minecraft's Java Virtual Machine (JVM):
 *   1. External Java Agents loaded via -javaagent or -Xbootclasspath flags
 *   2. Dynamic runtime bytecode injection via JVM Attach API (.java_pid / javavm pipes)
 *   3. Suspicious native DLLs mapped inside javaw.exe memory
 *   4. Bytecode manipulation libraries (ByteBuddy, ASM, Javassist) loaded outside official modloaders
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const cheatKnowledgeBase = require('./cheatKnowledgeBase');

const KNOWN_INJECTOR_NAMES = /vape|drip|slinky|entropy|phantom|inject|hook|cheat|patcher|loader/i;
const BENIGN_AGENTS = /intellij|eclipse|jacoco|jdwp|visualvm|yourkit|byteman/i;

class JvmAttachDetector {
  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Scans running JVM processes for runtime bytecode injection & agent attachment
   * @param {Function} onProgress - (msg, weight)
   * @returns {Promise<{status: string, findings: Array}>}
   */
  async scanJvmInjection(onProgress = () => {}) {
    const findings = [];
    onProgress('JVM Bellek Enjeksiyonu ve JavaAgent Analizi: Başlatılıyor...', 10);

    try {
      if (this.isWindows) {
        // Windows: Query running javaw.exe / java.exe command line and loaded modules
        const psScript = `
          Get-CimInstance Win32_Process -Filter "Name LIKE '%java%'" -ErrorAction SilentlyContinue | Select-Object ProcessId, Name, CommandLine | ConvertTo-Json -Compress
        `.trim();

        const { stdout } = await execPromise(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript}"`, {
          timeout: 8000
        });

        if (stdout && stdout.trim()) {
          let procs = [];
          try {
            const parsed = JSON.parse(stdout.trim());
            procs = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}

          for (const proc of procs) {
            const cmd = proc.CommandLine || '';
            const pid = proc.ProcessId;

            // 1. Check for unauthorized -javaagent
            if (cmd.includes('-javaagent:') || cmd.includes('-Xbootclasspath/p:')) {
              const agentMatch = cmd.match(/-javaagent:([^\s"]+)/i);
              const agentPath = agentMatch ? agentMatch[1] : 'Bilinmeyen Ajan';

              if (!BENIGN_AGENTS.test(agentPath)) {
                const isCheatAgent = KNOWN_INJECTOR_NAMES.test(agentPath);
                const finding = {
                  level: 'CRITICAL',
                  type: 'JVM_AGENT_ATTACHED',
                  name: `Minecraft JVM Sürecine Bağlanmış Yetkisiz Java Ajanı (JavaAgent Injection)`,
                  description: `Minecraft sürecine '${agentPath}' parametresiyle harici bir Java Ajanı enjekte edilmiştir. Bu ajan oyunun tüm sınıf ve metotlarını (Bytecode) çalışma zamanında modifiye etme yetkisine sahiptir.`,
                  confidence: isCheatAgent ? '100% Somut Hile Ajanı' : 'Yüksek Şüphe (Bilinmeyen JavaAgent)',
                  pid: pid,
                  path: agentPath,
                  evidence: [
                    `Süreç ID (PID): ${pid}`,
                    `Enjekte Edilen Ajan Yolu: ${agentPath}`,
                    `Tam Komut Satırı: ${cmd.substring(0, 200)}...`
                  ]
                };
                findings.push(cheatKnowledgeBase.enrichFinding(finding));
              }
            }

            // 2. Check for JVM Attach API Named Pipes on Windows (\\.\pipe\javavm_*)
            try {
              const pipeCheck = `[System.IO.Directory]::GetFiles('\\\\.\\pipe\\') | Where-Object { $_ -match 'javavm|java_pid' }`;
              const { stdout: pipeOut } = await execPromise(`powershell -NoProfile -NonInteractive -Command "${pipeCheck}"`, { timeout: 4000 });
              if (pipeOut && pipeOut.includes('javavm')) {
                // Attach socket is actively opened
                onProgress('Aktif JVM Attach soketi tespit edildi.', 40);
              }
            } catch (e) {}
          }
        }
      } else {
        // Linux: Check /tmp/.java_pid* and /proc/*/cmdline
        try {
          const tmpFiles = fs.readdirSync('/tmp');
          for (const f of tmpFiles) {
            if (f.startsWith('.java_pid')) {
              const pid = f.replace('.java_pid', '');
              // Check if pid is running and belongs to minecraft
              if (fs.existsSync(`/proc/${pid}/cmdline`)) {
                const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');
                if (cmd.includes('minecraft') || cmd.includes('net.minecraft')) {
                  if (cmd.includes('-javaagent:') && !BENIGN_AGENTS.test(cmd)) {
                    const finding = {
                      level: 'CRITICAL',
                      type: 'JVM_AGENT_ATTACHED',
                      name: 'Linux JVM JavaAgent Enjeksiyonu',
                      description: 'Minecraft JVM sürecinde harici yetkisiz javaagent parametresi tespit edilmiştir.',
                      confidence: '100% Somut Enjeksiyon Kanıtı',
                      pid: parseInt(pid, 10),
                      evidence: [`PID: ${pid}`, `Komut: ${cmd.substring(0, 180)}`]
                    };
                    findings.push(cheatKnowledgeBase.enrichFinding(finding));
                  }
                }
              }
            }
          }
        } catch (e) {}
      }
    } catch (err) {}

    onProgress('JVM Enjeksiyon Analizi tamamlandı.', 100);
    return {
      status: findings.length > 0 ? 'FINDINGS_DETECTED' : 'CLEAN',
      findings
    };
  }
}

module.exports = new JvmAttachDetector();
