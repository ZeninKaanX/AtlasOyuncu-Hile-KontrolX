/**
 * Farben AC - Dynamic Signature Auto-Updater Engine
 * Fetches latest cheat definitions, hashes, and bytecode patterns from remote repository,
 * ensuring zero-day cheat versions are automatically recognized without reinstalling the app.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const sigDb = require('./signatureDb');

class SignatureUpdater {
  constructor() {
    this.remoteManifestUrl = 'https://raw.githubusercontent.com/FarbenAC/signatures/main/signatures.json';
    this.customSignaturesPath = path.join(__dirname, '../signatures/customSignatures.json');
  }

  /**
   * Checks for updates and downloads new signatures if available.
   */
  async checkForUpdates() {
    return new Promise((resolve) => {
      const currentVersion = sigDb.getVersion();

      https.get(this.remoteManifestUrl, { timeout: 5000 }, (res) => {
        if (res.statusCode !== 200) {
          return resolve({
            updated: false,
            currentVersion,
            message: `Remote signature server unavailable (HTTP ${res.statusCode}). Local signature database (${currentVersion}) active.`
          });
        }

        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const remoteSignatures = JSON.parse(rawData);
            if (remoteSignatures.version && remoteSignatures.version !== currentVersion) {
              // Save update
              fs.writeFileSync(this.customSignaturesPath, JSON.stringify(remoteSignatures, null, 2), 'utf8');
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
              message: 'Failed to parse remote signature payload. Using local signatures.'
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
