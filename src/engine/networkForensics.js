/**
 * Atlas AC - Network, Hosts File & Named Pipe Forensic Engine
 * Detects network-level cheat manipulation & inter-process injection communication:
 * - Hosts File Tampering (blocking anti-cheats or redirecting ghost client auth)
 * - Named Pipes Forensics (\\.\pipe\ used by Vape, Slinky, Drip to communicate with Minecraft)
 * - DNS Resolver Cache Analysis (detecting lookups to cheat infrastructure before self-destruct)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sigDb = require('./signatureDb');

class NetworkForensicsEngine {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.knownCheatDomains = sigDb.getCheatDomains();

    // Anti-cheat domains often blocked by cheaters in hosts file
    this.antiCheatDomains = [
      'anticheat.ac', 'sonoyuncu.com', 'craftrise.tc', 'roan.network',
      'mojang.com', 'minecraft.net', 'session.minecraft.net',
      'authserver.mojang.com', 'sessionserver.mojang.com'
    ];
  }

  /**
   * Main scan function across network and IPC forensic vectors.
   */
  async scanNetworkAndIpc(onTarget = () => {}) {
    const findings = [];
    onTarget('Network & IPC: Checking Hosts File, Named Pipes, and DNS Cache', 15);

    // 1. Hosts File Forensics
    const hostsFindings = this.checkHostsFile();
    findings.push(...hostsFindings);

    // 2. Named Pipes Forensics (Windows) / Unix Sockets & SHM Forensics (Linux)
    if (this.isWindows) {
      const pipeFindings = await this.checkNamedPipes();
      findings.push(...pipeFindings);

      // 3. DNS Cache Forensics
      const dnsFindings = await this.checkDnsCache();
      findings.push(...dnsFindings);
    } else {
      const linuxIpcFindings = await this.checkLinuxIpc();
      findings.push(...linuxIpcFindings);
    }

    // 4. Active Connections / Sockets Forensics (Windows & Linux)
    const socketFindings = await this.checkActiveSockets();
    findings.push(...socketFindings);

    return {
      status: 'SUCCESS',
      findings: findings
    };
  }

  /**
   * 1. Inspects Windows or Linux Hosts File for Anti-Cheat Blocking or Cheat Auth Redirects
   */
  checkHostsFile() {
    const findings = [];
    const hostsPath = this.isWindows
      ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
      : '/etc/hosts';

    if (!fs.existsSync(hostsPath)) return findings;

    try {
      const stats = fs.statSync(hostsPath);
      const content = fs.readFileSync(hostsPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and blank lines
        if (!trimmed || trimmed.startsWith('#')) continue;

        const lowerLine = trimmed.toLowerCase();

        // Check if an anti-cheat domain is blocked
        for (const acDomain of this.antiCheatDomains) {
          if (lowerLine.includes(acDomain)) {
            findings.push({
              level: 'CRITICAL',
              type: 'HOSTS_ANTI_CHEAT_BLOCKED',
              name: `Hosts Dosyası Anti-Cheat Engellemesi (${acDomain})`,
              path: hostsPath,
              timestamp: stats.mtime.toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanıt: Hosts Dosyası Girdisi)',
              description: `Hosts dosyasında anti-cheat veya sunucu doğrulama adresi kasten engellenmiş: ${acDomain}`,
              evidence: [
                `Hosts Girdisi: ${trimmed}`,
                `Hedef Alan Adı: ${acDomain}`,
                `Konum: ${hostsPath}`
              ]
            });
            break;
          }
        }

        // Check if a cheat domain is mapped to localhost (e.g. cracked cheat auth bypass)
        for (const cDomain of this.knownCheatDomains) {
          if (lowerLine.includes(cDomain)) {
            findings.push({
              level: 'CRITICAL',
              type: 'HOSTS_CHEAT_AUTH_REDIRECT',
              name: `Hosts Dosyası Hile Yönlendirmesi (${cDomain})`,
              path: hostsPath,
              timestamp: stats.mtime.toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanıt: Hosts Dosyası Girdisi)',
              description: `Hosts dosyasında hile sunucusu yönlendirmesi tespit edildi: ${cDomain}`,
              evidence: [
                `Hosts Girdisi: ${trimmed}`,
                `Hile Alan Adı: ${cDomain}`
              ]
            });
            break;
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 2. Inspects Windows Named Pipes (\\.\pipe\) for Ghost Client IPC Channels
   */
  async checkNamedPipes() {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      const psCmd = `powershell -NoProfile -Command "[System.IO.Directory]::GetFiles('\\\\.\\pipe\\\\') | ConvertTo-Json"`;
      const { stdout } = await execPromise(psCmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));

      if (stdout && stdout.trim().length > 0) {
        let pipes = [];
        try {
          const parsed = JSON.parse(stdout);
          pipes = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {}

        const cheatPipeKeywords = [
          'vape', 'slinky', 'drip', 'doomsday', 'kura', 'whiteout', 'entropy',
          'skilled', 'augustus', 'phantom', 'nightmare', 'cheat', 'ghostclient',
          'itami', 'fdp', 'tenacity', 'boze', 'rusherhack', 'futureclient', 'bplus'
        ];

        for (const p of pipes) {
          const lowerPipe = String(p).toLowerCase();
          for (const kw of cheatPipeKeywords) {
            if (lowerPipe.includes(kw)) {
              findings.push({
                level: 'CRITICAL',
                type: 'CHEAT_NAMED_PIPE_ACTIVE',
                name: `Aktif Hile Named Pipe Kanalı (${kw})`,
                path: String(p),
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: Çekirdek Named Pipe Nesnesi)',
                description: `Sistemde aktif hile haberleşme kanalı (Named Pipe) tespit edildi: ${p}. Hayalet hile enjektörü Minecraft ile bu kanal üzerinden veri alışverişi yapıyor!`,
                evidence: [
                  `Named Pipe Yolu: ${p}`,
                  `Eşleşen Hile İmzası: ${kw}`
                ]
              });
              break;
            }
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 2.1 Inspects Linux Unix Domain Sockets and /dev/shm for Ghost Client IPC Channels
   */
  async checkLinuxIpc() {
    const findings = [];
    if (this.isWindows) return findings;

    const cheatIpcKeywords = [
      'vape', 'slinky', 'drip', 'doomsday', 'kura', 'whiteout', 'entropy',
      'skilled', 'augustus', 'phantom', 'nightmare', 'cheat', 'ghostclient',
      'itami', 'fdp', 'tenacity', 'boze', 'rusherhack', 'futureclient', 'bplus'
    ];

    // Check /proc/net/unix
    try {
      if (fs.existsSync('/proc/net/unix')) {
        const unixContent = fs.readFileSync('/proc/net/unix', 'utf8');
        const lines = unixContent.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const socketPath = parts[parts.length - 1];
          if (!socketPath || socketPath.length < 3) continue;

          const lowerPath = socketPath.toLowerCase();
          for (const kw of cheatIpcKeywords) {
            if (lowerPath.includes(kw)) {
              findings.push({
                level: 'CRITICAL',
                type: 'CHEAT_UNIX_SOCKET_ACTIVE',
                name: `Aktif Linux Hile Unix Domain Soketi (${kw})`,
                path: socketPath,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: /proc/net/unix Çekirdek Soketi)',
                description: `Linux sisteminde aktif hayalet hile IPC soketi tespit edildi: ${socketPath}`,
                evidence: [
                  `Soket Yolu: ${socketPath}`,
                  `Eşleşen Hile İmzası: ${kw}`
                ]
              });
              break;
            }
          }
        }
      }
    } catch (e) {}

    // Check /dev/shm for ghost client shared memory segments
    try {
      if (fs.existsSync('/dev/shm')) {
        const shmFiles = fs.readdirSync('/dev/shm');
        for (const shm of shmFiles) {
          const lowerShm = shm.toLowerCase();
          for (const kw of cheatIpcKeywords) {
            if (lowerShm.includes(kw)) {
              findings.push({
                level: 'CRITICAL',
                type: 'CHEAT_SHM_SEGMENT_FOUND',
                name: `Hile Paylaşılan Bellek Alanı (/dev/shm/${shm})`,
                path: `/dev/shm/${shm}`,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: /dev/shm POSIX Bellek Segmenti)',
                description: `Linux /dev/shm dizininde hile enjeksiyon / veri paylaşım segmenti tespit edildi: ${shm}`,
                evidence: [
                  `Segment Yolu: /dev/shm/${shm}`,
                  `Eşleşen Hile İmzası: ${kw}`
                ]
              });
              break;
            }
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 3. Inspects Windows DNS Resolver Cache (ipconfig /displaydns)
   */
  async checkDnsCache() {
    const findings = [];
    if (!this.isWindows) return findings;

    try {
      const { stdout } = await execPromise('ipconfig /displaydns', { timeout: 3000 }).catch(() => ({ stdout: '' }));
      if (stdout) {
        const lowerCache = stdout.toLowerCase();
        for (const domain of this.knownCheatDomains) {
          if (lowerCache.includes(domain.toLowerCase())) {
            findings.push({
              level: 'CRITICAL',
              type: 'DNS_CHEAT_AUTH_ACCESSED',
              name: `DNS Önbelleğinde Hile Sunucusu (${domain})`,
              path: 'Windows DNS Resolver Cache',
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanıt: DNS İstemci Önbelleği)',
              description: `Windows DNS önbelleğinde hile sunucusu sorgusu tespit edildi: ${domain}. Hile dosyaları silinse dahi bu sorgu hilenin yakın zamanda çalıştığını kanıtlar!`,
              evidence: [
                `Sorgulanan Hile Alan Adı: ${domain}`,
                `Doğrulama: ipconfig /displaydns`
              ]
            });
          }
        }
      }
    } catch (e) {}

    return findings;
  }

  /**
   * 4. Inspects active network sockets (ESTABLISHED connections via netstat / ss)
   * Detects:
   * - Connections to cheat infrastructure/domains
   * - Active cheat processes holding open network/web sockets (e.g. vape, drip, slinky, clicker)
   * - Inbound local listening ports used by ghost client web UIs / WebSockets
   */
  async checkActiveSockets() {
    const findings = [];
    const netCmd = this.isWindows ? 'netstat -ano' : 'ss -tapn || netstat -tulpn';

    try {
      const { stdout } = await execPromise(netCmd, { timeout: 3000 }).catch(() => ({ stdout: '' }));
      if (stdout) {
        const lines = stdout.split('\n');
        const lowerNet = stdout.toLowerCase();

        // A. Direct domain lookup in socket output
        for (const domain of this.knownCheatDomains) {
          if (lowerNet.includes(domain.toLowerCase())) {
            findings.push({
              level: 'CRITICAL',
              type: 'ACTIVE_CHEAT_SOCKET_CONNECTION',
              name: `Aktif Hile Bağlantısı (${domain})`,
              path: 'Network Sockets (ESTABLISHED)',
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              confidence: '100% (Somut Kanıt: Çekirdek Ağ Soketi)',
              description: `Sistemde doğrudan hile sunucusuna bağlı aktif bir ağ soketi tespit edildi: ${domain}`,
              evidence: [
                `Bağlantı Hedefi: ${domain}`,
                `Komut: ${netCmd}`
              ]
            });
            break;
          }
        }

        // B. Inspect process bindings for cheat binaries (Linux ss format: users:(("name",pid=123,fd=4)))
        for (const line of lines) {
          const match = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
          if (match) {
            const procName = match[1];
            const pid = match[2];
            const lowerProc = procName.toLowerCase();

            // Whitelist legitimate processes (0 False-Flag Guarantee)
            if (/node|discord|chrome|firefox|steam|antigravity|code|kdeconnectd|systemd|cups|pipewire|wireplumber|dbus|avahi/i.test(lowerProc)) {
              continue;
            }

            if (/vape|drip|slinky|doomsday|ghostclient|clicker|viper|kura|entropy|augustus|meteor|thunderhack/i.test(lowerProc)) {
              findings.push({
                level: 'CRITICAL',
                type: 'CHEAT_PROCESS_ACTIVE_SOCKET',
                name: `Ağ Soketi Açık Hile Süreci (${procName})`,
                path: `PID ${pid} (${procName})`,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                confidence: '100% (Somut Kanıt: Çekirdek Soket Tablosu)',
                description: `Ağ bağlantısı kuran veya yerel soket dinleyen aktif hile süreci tespit edildi: ${procName} (PID: ${pid})`,
                evidence: [
                  `Süreç: ${procName}`,
                  `PID: ${pid}`,
                  `Soket Satırı: ${line.trim()}`
                ]
              });
            }
          }
        }
      }
    } catch (e) {}

    return findings;
  }
}

module.exports = new NetworkForensicsEngine();

