'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const PUBLIC_KEY = require('../config/licensePublicKey');

const PRODUCT = 'atlas-ac';
const MAX_LICENSE_BYTES = 16 * 1024;

function appDataDir() {
  if (process.env.ATLAS_LICENSE_DIR) return path.resolve(process.env.ATLAS_LICENSE_DIR);
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || os.homedir(), 'AtlasAC');
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'atlas-ac');
}

function licensePath() {
  return process.env.ATLAS_LICENSE_PATH
    ? path.resolve(process.env.ATLAS_LICENSE_PATH)
    : path.join(appDataDir(), 'license.json');
}

function machineSeed() {
  if (process.env.ATLAS_MACHINE_SEED) return process.env.ATLAS_MACHINE_SEED;
  try {
    if (process.platform === 'win32') {
      const result = execFileSync('reg.exe', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], {
        encoding: 'utf8', windowsHide: true, timeout: 2500
      });
      const match = result.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
      if (match) return `win:${match[1].trim()}`;
    } else {
      for (const candidate of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
        if (fs.existsSync(candidate)) return `${process.platform}:${fs.readFileSync(candidate, 'utf8').trim()}`;
      }
    }
  } catch (_) {}
  return `${process.platform}:${os.hostname()}:${os.arch()}`;
}

function getMachineId() {
  return crypto.createHash('sha256').update(`atlas-ac/v1/${machineSeed()}`).digest('hex').toUpperCase();
}

function canonicalPayload(payload) {
  const normalized = {
    version: 1,
    product: String(payload.product || ''),
    licenseId: String(payload.licenseId || ''),
    customer: String(payload.customer || ''),
    issuedAt: String(payload.issuedAt || ''),
    expiresAt: String(payload.expiresAt || ''),
    machineId: String(payload.machineId || '*').toUpperCase(),
    features: Array.isArray(payload.features) ? [...new Set(payload.features.map(String))].sort() : ['scan']
  };
  return JSON.stringify(normalized);
}

function parseLicense(input) {
  const raw = Buffer.isBuffer(input) ? input.toString('utf8') : String(input || '');
  if (!raw || Buffer.byteLength(raw) > MAX_LICENSE_BYTES) throw new Error('Lisans verisi geçersiz veya çok büyük.');
  const license = JSON.parse(raw);
  if (!license || typeof license !== 'object' || !license.payload || typeof license.signature !== 'string') {
    throw new Error('Lisans biçimi geçersiz.');
  }
  return license;
}

function verifyLicense(input, now = new Date(), publicKey = PUBLIC_KEY) {
  try {
    const license = typeof input === 'string' || Buffer.isBuffer(input) ? parseLicense(input) : input;
    const payload = license && license.payload;
    if (!payload || payload.version !== 1 || payload.product !== PRODUCT) throw new Error('Lisans bu ürün için geçerli değil.');
    if (!payload.licenseId || !payload.customer || !payload.issuedAt || !payload.expiresAt) throw new Error('Lisans alanları eksik.');
    const signature = Buffer.from(String(license.signature), 'base64');
    if (signature.length !== 64 || !crypto.verify(null, Buffer.from(canonicalPayload(payload)), publicKey, signature)) {
      throw new Error('Lisans imzası doğrulanamadı.');
    }
    const issued = Date.parse(payload.issuedAt);
    const expires = Date.parse(payload.expiresAt);
    if (!Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued) throw new Error('Lisans tarihleri geçersiz.');
    if (issued > now.getTime() + 5 * 60 * 1000) throw new Error('Lisans henüz geçerli değil.');
    if (expires <= now.getTime()) throw new Error('Lisansın süresi dolmuş.');
    const localMachine = getMachineId();
    if (String(payload.machineId).toUpperCase() !== '*' && String(payload.machineId).toUpperCase() !== localMachine) {
      throw new Error('Lisans bu bilgisayara ait değil.');
    }
    if (!Array.isArray(payload.features) || !payload.features.includes('scan')) throw new Error('Tarama yetkisi lisansa dahil değil.');
    return { valid: true, payload, machineId: localMachine };
  } catch (error) {
    return { valid: false, error: error.message || 'Lisans doğrulanamadı.', machineId: getMachineId() };
  }
}

function getStatus() {
  const file = licensePath();
  try {
    const status = verifyLicense(fs.readFileSync(file));
    return { ...status, path: file };
  } catch (_) {
    return { valid: false, error: 'Etkin lisans bulunamadı.', machineId: getMachineId(), path: file };
  }
}

function activate(input) {
  const license = typeof input === 'object' ? input : parseLicense(input);
  const status = verifyLicense(license);
  if (!status.valid) return status;
  const file = licensePath();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(license, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
  return { ...status, path: file };
}

module.exports = { PRODUCT, canonicalPayload, getMachineId, getStatus, verifyLicense, activate, licensePath };
