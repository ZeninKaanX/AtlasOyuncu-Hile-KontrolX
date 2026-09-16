'use strict';

const assert = require('assert');
const crypto = require('crypto');
const licenseManager = require('../src/engine/licenseManager');

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const now = new Date('2030-01-01T00:00:00.000Z');
const payload = {
  version: 1,
  product: 'atlas-ac',
  licenseId: 'test-license-id',
  customer: 'Atlas Test',
  issuedAt: '2029-12-31T00:00:00.000Z',
  expiresAt: '2030-02-01T00:00:00.000Z',
  machineId: '*',
  features: ['scan']
};
const signature = crypto.sign(null, Buffer.from(licenseManager.canonicalPayload(payload)), privateKey).toString('base64');
const license = { payload, signature };

assert.strictEqual(licenseManager.verifyLicense(license, now, publicKey).valid, true, 'Valid signed license must pass');
const compact = `ATLAS1.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${Buffer.from(signature, 'base64').toString('base64url')}`;
assert.strictEqual(licenseManager.verifyLicense(compact, now, publicKey).valid, true, 'Compact website key must pass');
assert.strictEqual(licenseManager.verifyLicense({ payload: { ...payload, customer: 'Changed' }, signature }, now, publicKey).valid, false, 'Tampering must invalidate signature');
assert.strictEqual(licenseManager.verifyLicense(license, new Date('2031-01-01T00:00:00.000Z'), publicKey).valid, false, 'Expired license must fail');
assert.strictEqual(licenseManager.verifyLicense({ payload: { ...payload, features: [] }, signature }, now, publicKey).valid, false, 'Unsigned feature change must fail');

console.log('[PASS] Signed license verification suite');
