#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { canonicalPayload, PRODUCT } = require('../src/engine/licenseManager');

function arg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const customer = arg('customer');
const machineId = arg('machine');
const days = Number.parseInt(arg('days', '30'), 10);
const output = arg('out', path.resolve(process.cwd(), `atlas-license-${Date.now()}.json`));
const privateKeyPath = path.resolve(process.env.ATLAS_LICENSE_PRIVATE_KEY_PATH || path.join(__dirname, '..', 'secrets', 'atlas-license-private.pem'));

if (!customer || !machineId || !/^[A-Fa-f0-9]{64}$/.test(machineId) || !Number.isInteger(days) || days < 1 || days > 3660) {
  console.error('Kullanım: node scripts/issue_license.js --customer "Ad" --machine <64-hex> [--days 30] [--out license.json]');
  process.exit(1);
}

const issued = new Date();
const payload = {
  version: 1,
  product: PRODUCT,
  licenseId: crypto.randomUUID(),
  customer: customer.slice(0, 160),
  issuedAt: issued.toISOString(),
  expiresAt: new Date(issued.getTime() + days * 86400000).toISOString(),
  machineId: machineId.toUpperCase(),
  features: ['scan']
};
const privateKey = fs.readFileSync(privateKeyPath);
const signature = crypto.sign(null, Buffer.from(canonicalPayload(payload)), privateKey).toString('base64');
fs.writeFileSync(output, `${JSON.stringify({ payload, signature }, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
console.log(`Lisans oluşturuldu: ${output}`);
console.log(`Lisans ID: ${payload.licenseId}`);
console.log(`Bitiş: ${payload.expiresAt}`);
