/**
 * Atlas AC - Inter-Agent Real-Time Intercom
 * Connects Linux (Architect/Developer) and Windows (Testing/Forensic Node)
 * Antigravity instances without requiring GitHub push credentials or manual user typing.
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const TOPIC_LIN2WIN = 'atlas_ac_zenin_lin2win';
const TOPIC_WIN2LIN = 'atlas_ac_zenin_win2lin';

/**
 * Sends a message to the target topic
 */
function sendMessage(topic, messageText) {
  return new Promise((resolve, reject) => {
    const postData = Buffer.from(typeof messageText === 'object' ? JSON.stringify(messageText) : messageText, 'utf8');
    const req = https.request({
      hostname: 'ntfy.sh',
      port: 443,
      path: `/${topic}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': postData.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Reads recent messages from the incoming topic since last check (poll=1 ensures instant exit)
 */
function fetchMessages(topic, sinceSeconds = 600) {
  return new Promise((resolve, reject) => {
    const sinceParam = Math.floor(Date.now() / 1000) - sinceSeconds;
    const req = https.get({
      hostname: 'ntfy.sh',
      port: 443,
      path: `/${topic}/json?poll=1&since=${sinceParam}`,
      headers: { 'Accept': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const lines = data.trim().split('\n').filter(Boolean);
        const messages = [];
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.event === 'message') {
              messages.push(parsed);
            }
          } catch (e) {}
        }
        resolve(messages);
      });
    });

    req.on('error', reject);
  });
}

// CLI handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0]; // 'send-to-win', 'send-to-lin', 'poll-lin', 'poll-win'
  const payload = args.slice(1).join(' ');

  (async () => {
    try {
      if (action === 'send-to-win') {
        const res = await sendMessage(TOPIC_LIN2WIN, payload || 'Ping to Windows');
        console.log('[INTERCOM] Mesaj Windows ajanına iletildi:', res);
      } else if (action === 'send-to-lin') {
        const res = await sendMessage(TOPIC_WIN2LIN, payload || 'Ping to Linux');
        console.log('[INTERCOM] Mesaj Linux ajanına iletildi:', res);
      } else if (action === 'poll-lin') {
        // Linux reads messages sent by Windows
        const msgs = await fetchMessages(TOPIC_WIN2LIN, 300);
        console.log(JSON.stringify(msgs, null, 2));
      } else if (action === 'poll-win') {
        // Windows reads messages sent by Linux
        const msgs = await fetchMessages(TOPIC_LIN2WIN, 300);
        console.log(JSON.stringify(msgs, null, 2));
      } else {
        console.log('Kullanım: node intercom.js [send-to-win|send-to-lin|poll-lin|poll-win] [mesaj]');
      }
    } catch (err) {
      console.error('[INTERCOM ERROR]:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { sendMessage, fetchMessages, TOPIC_LIN2WIN, TOPIC_WIN2LIN };
