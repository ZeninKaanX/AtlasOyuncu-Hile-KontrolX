/**
 * Farben AC - Dynamic Signature Auto-Updater Engine
 * Fetches latest cheat definitions, hashes, and bytecode patterns from remote repository,
 * ensuring zero-day cheat versions are automatically recognized without reinstalling the app.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const sigDb = require('./signatureDb');

class SignatureUpdater {
  constructor() {
    this.remoteManifestUrl = 'https://raw.githubusercontent.com/FarbenAC/signatures/main/signatures.json';
    const dataRoot = process.platform === 'win32'
      ? (process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'))
      : (process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'));
    this.customSignaturesPath = path.join(dataRoot, 'AtlasAC', 'signatures', 'customSignatures.json');
    this.maxManifestBytes = 5 * 1024 * 1024;
  }

  /**
   * Checks for updates and downloads new signatures if available.
   */
  async checkForUpdates() {
    return new Promise((resolve) => {
      const currentVersion = sigDb.getVersion();
      const publicKey = process.env.ATLAS_SIGNATURE_PUBLIC_KEY_PEM;
      if (!publicKey) {
        return resolve({
          updated: false,
          currentVersion,
          message: 'Güvenli güncelleme anahtarı yapılandırılmamış. Yerel imza veritabanı kullanılıyor.'
        });
      }

      https.get(this.remoteManifestUrl, { timeout: 5000 }, (res) => {
        if (res.statusCode !== 200) {
          return resolve({
            updated: false,
            currentVersion,
            message: `Remote signature server unavailable (HTTP ${res.statusCode}). Local signature database (${currentVersion}) active.`
          });
        }

        let rawData = '';
        let received = 0;
        res.on('error', (err) => resolve({
          updated: false,
          currentVersion,
          message: `Güncelleme aktarımı reddedildi: ${err.message}. Yerel veritabanı kullanılıyor.`
        }));
        res.on('data', (chunk) => {
          received += chunk.length;
          if (received > this.maxManifestBytes) {
            res.destroy(new Error('Signature manifest exceeds size limit'));
            return;
          }
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const envelope = JSON.parse(rawData);
            if (!envelope || !envelope.payload || typeof envelope.signature !== 'string') {
              throw new Error('Unsigned signature manifest');
            }
            const canonicalPayload = JSON.stringify(envelope.payload);
            const valid = crypto.verify(null, Buffer.from(canonicalPayload), publicKey, Buffer.from(envelope.signature, 'base64'));
            if (!valid) throw new Error('Signature manifest verification failed');
            const remoteSignatures = envelope.payload;
            if (!Array.isArray(remoteSignatures.clientRules) || typeof remoteSignatures.version !== 'string') {
              throw new Error('Invalid signature manifest schema');
            }
            if (remoteSignatures.version && remoteSignatures.version !== currentVersion) {
              fs.mkdirSync(path.dirname(this.customSignaturesPath), { recursive: true, mode: 0o700 });
              const tempPath = `${this.customSignaturesPath}.${process.pid}.tmp`;
              fs.writeFileSync(tempPath, JSON.stringify(remoteSignatures, null, 2), { encoding: 'utf8', mode: 0o600 });
              fs.renameSync(tempPath, this.customSignaturesPath);
              sigDb.load(); // Hot-reload signatures in memory
              return resolve({
                updated: true,
                oldVersion: currentVersion,
                newVersion: remoteSignatures.version,
                message: `Signatures updated successfully! Version: ${remoteSignatures.version}`
              });
            } else {
              return resolve({
                updated: false,
                currentVersion,
                message: `Signature database is up to date (${currentVersion}).`
              });
            }
          } catch (e) {
            return resolve({
              updated: false,
              currentVersion,
              message: `İmza güncellemesi reddedildi: ${e.message}. Yerel veritabanı kullanılıyor.`
            });
          }
        });
      }).on('error', (err) => {
        resolve({
          updated: false,
          currentVersion,
          message: `Offline mode: Active local signature database (${currentVersion}) loaded.`
        });
      });
    });
  }
}

module.exports = new SignatureUpdater();
