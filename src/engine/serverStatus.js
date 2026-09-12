/**
 * Atlas AC - Minecraft Server Status & Live Telemetry Module
 * Directly connects to Minecraft Java servers using standard Server List Ping (SLP)
 * protocol via native Node.js TCP sockets.
 * 
 * Target: mc.atlasoyuncu.com:25565
 * - Zero third-party web dependencies
 * - Non-blocking with 4000ms timeout
 * - In-memory caching (20 seconds TTL)
 * - Safe fallback if network is unreachable
 */

const net = require('net');

class ServerStatusTracker {
  constructor() {
    this.defaultHost = 'mc.atlasoyuncu.com';
    this.defaultPort = 25565;
    this.cacheTtlMs = 20000; // 20 seconds cache
    this.lastStatus = {
      online: true,
      host: this.defaultHost,
      port: this.defaultPort,
      players: {
        online: 500,
        max: 2026
      },
      version: '1.21.11',
      motd: 'TR atlasoyuncu.com 1.21.11 | GERÇEK KALİTE | SKYBLOCK | TOWNY | BOXPVP | PVP | SMP',
      latency: 120,
      favicon: null,
      lastChecked: new Date().toISOString()
    };
    this.lastFetchTime = 0;
    this.fetchPromise = null;
  }

  /**
   * Helper to write a Minecraft VarInt into a Buffer
   */
  writeVarInt(value) {
    const bytes = [];
    while (true) {
      if ((value & 0xffffff80) === 0) {
        bytes.push(value);
        return Buffer.from(bytes);
      }
      bytes.push((value & 0x7f) | 0x80);
      value >>>= 7;
    }
  }

  /**
   * Helper to read a Minecraft VarInt from a Buffer
   */
  readVarInt(buffer, offset = 0) {
    let result = 0;
    let numRead = 0;
    let currentByte;
    do {
      if (offset + numRead >= buffer.length) {
        return { value: 0, length: 0, incomplete: true };
      }
      currentByte = buffer[offset + numRead];
      result |= (currentByte & 0b01111111) << (7 * numRead);
      numRead++;
      if (numRead > 5) throw new Error('VarInt is too big');
    } while ((currentByte & 0b10000000) !== 0);
    return { value: result, length: numRead, incomplete: false };
  }

  /**
   * Recursively extract clean human-readable text from Minecraft MOTD object / string
   */
  extractMotdText(desc) {
    const extractRaw = (node) => {
      if (!node) return '';
      if (typeof node === 'string') {
        return node.replace(/§[0-9a-fk-or]/gi, '');
      }
      let result = '';
      if (node.text) {
        result += String(node.text).replace(/§[0-9a-fk-or]/gi, '');
      }
      if (Array.isArray(node.extra)) {
        for (const child of node.extra) {
          result += extractRaw(child);
        }
      }
      return result;
    };

    return extractRaw(desc).replace(/\s+/g, ' ').trim();
  }

  /**
   * Native TCP Minecraft Server List Ping (SLP)
   */
  pingServer(host = this.defaultHost, port = this.defaultPort, timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const client = new net.Socket();
      let dataBuffer = Buffer.alloc(0);
      let expectedLength = -1;
      let isResolved = false;

      client.setTimeout(timeoutMs);

      const cleanup = () => {
        try {
          client.removeAllListeners();
          client.destroy();
        } catch (e) {}
      };

      client.connect(port, host, () => {
        try {
          // Handshake Packet (ID 0x00)
          const hostBuf = Buffer.from(host, 'utf8');
          const hostLen = this.writeVarInt(hostBuf.length);
          const proto = this.writeVarInt(765); // Modern 1.20.4+ / Velocity / Bungee protocol version
          const portBuf = Buffer.alloc(2);
          portBuf.writeUInt16BE(port, 0);
          const nextState = this.writeVarInt(1); // 1 = status state

          const packetData = Buffer.concat([
            this.writeVarInt(0x00),
            proto,
            hostLen,
            hostBuf,
            portBuf,
            nextState
          ]);
          const handshakePacket = Buffer.concat([
            this.writeVarInt(packetData.length),
            packetData
          ]);

          // Status Request Packet (ID 0x00, empty body)
          const requestPacket = Buffer.from([0x01, 0x00]);

          client.write(Buffer.concat([handshakePacket, requestPacket]));
        } catch (err) {
          cleanup();
          if (!isResolved) {
            isResolved = true;
            reject(err);
          }
        }
      });

      client.on('data', (chunk) => {
        dataBuffer = Buffer.concat([dataBuffer, chunk]);
        try {
          if (expectedLength === -1 && dataBuffer.length > 0) {
            const varIntRes = this.readVarInt(dataBuffer, 0);
            if (!varIntRes.incomplete) {
              expectedLength = varIntRes.value + varIntRes.length;
            }
          }

          if (expectedLength !== -1 && dataBuffer.length >= expectedLength) {
            const latency = Date.now() - start;
            cleanup();

            let offset = 0;
            const lenRes = this.readVarInt(dataBuffer, offset);
            offset += lenRes.length;

            const idRes = this.readVarInt(dataBuffer, offset);
            offset += idRes.length;

            const strLenRes = this.readVarInt(dataBuffer, offset);
            offset += strLenRes.length;

            const jsonStr = dataBuffer.slice(offset, offset + strLenRes.value).toString('utf8');
            const parsed = JSON.parse(jsonStr);

            const motdClean = this.extractMotdText(parsed.description);

            const result = {
              online: true,
              host,
              port,
              players: {
                online: parsed.players && typeof parsed.players.online === 'number' ? parsed.players.online : 0,
                max: parsed.players && typeof parsed.players.max === 'number' ? parsed.players.max : 2026
              },
              version: parsed.version && parsed.version.name ? parsed.version.name : '1.21.11',
              motd: motdClean || 'TR atlasoyuncu.com 1.21.11 | GERÇEK KALİTE',
              latency,
              favicon: parsed.favicon || null,
              lastChecked: new Date().toISOString()
            };

            if (!isResolved) {
              isResolved = true;
              resolve(result);
            }
          }
        } catch (err) {
          // Incomplete buffer; keep listening
        }
      });

      client.on('timeout', () => {
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`Connection to ${host}:${port} timed out after ${timeoutMs}ms`));
        }
      });

      client.on('error', (err) => {
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(err);
        }
      });
    });
  }

  /**
   * Asynchronously fetch server status with caching and fallback.
   * Debounces multiple simultaneous calls into a single in-flight promise.
   */
  async fetchStatus(force = false) {
    const now = Date.now();
    if (!force && this.lastStatus && (now - this.lastFetchTime < this.cacheTtlMs)) {
      return { ...this.lastStatus, cached: true };
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const status = await this.pingServer(this.defaultHost, this.defaultPort, 4000);
        this.lastStatus = status;
        this.lastFetchTime = Date.now();
        return { ...status, cached: false };
      } catch (err) {
        const fallback = {
          online: false,
          host: this.defaultHost,
          port: this.defaultPort,
          players: this.lastStatus?.players || { online: 0, max: 2026 },
          version: this.lastStatus?.version || '1.21.11',
          motd: this.lastStatus?.motd || 'TR atlasoyuncu.com 1.21.11 | GERÇEK KALİTE',
          latency: null,
          favicon: this.lastStatus?.favicon || null,
          error: err.message,
          lastChecked: new Date().toISOString(),
          cached: false
        };
        this.lastFetchTime = Date.now();
        return fallback;
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Synchronous getter for current cached status (non-blocking)
   */
  getStatusSync() {
    return this.lastStatus || {
      online: true,
      host: this.defaultHost,
      port: this.defaultPort,
      players: { online: 500, max: 2026 },
      version: '1.21.11',
      motd: 'TR atlasoyuncu.com 1.21.11 | GERÇEK KALİTE',
      latency: 120,
      favicon: null,
      lastChecked: new Date().toISOString()
    };
  }
}

module.exports = new ServerStatusTracker();
