/**
 * Atlas AC - Guaranteed-Settlement Command Executor
 *
 * Wraps child_process.exec so the returned Promise ALWAYS settles, even on
 * Windows where PowerShell/CMD can spawn descendants that keep the stdout pipe
 * open after the direct child is killed. With a plain promisified exec() plus
 * the `timeout` option, the callback is never invoked in that scenario (the
 * child may also ignore the default SIGTERM), so the awaiting engine - and
 * therefore the whole scan - hangs forever with no error and no progress.
 *
 * Here we keep the ChildProcess handle, apply the native `timeout` kill, and
 * add a short settlement guard that force-kills the child tree and rejects
 * with err.code 'SCAN_EXEC_TIMEOUT'. Engines treat that code as an honest
 * "data source could not be read" signal instead of a clean result.
 */

'use strict';

const { exec, spawn } = require('child_process');

const KILL_GRACE_MS = 2500;

function forceKillTree(child) {
  if (!child || !child.pid) return;
  try { child.kill('SIGKILL'); } catch (_) {}
  if (process.platform !== 'win32') return;
  try {
    const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore'
    });
    if (typeof killer.unref === 'function') killer.unref();
  } catch (_) {}
}

function execGuarded(command, options = {}) {
  const {
    timeout = 15000,
    maxBuffer = 4 * 1024 * 1024,
    ...rest
  } = options;

  let child = null;
  let settled = false;
  let guard = null;

  return new Promise((resolve, reject) => {
    guard = setTimeout(() => {
      if (settled) return;
      settled = true;
      forceKillTree(child);
      const err = new Error(`Komut zaman aşımı (${timeout} ms): ${String(command).length > 160 ? String(command).slice(0, 160) : command}`);
      err.code = 'SCAN_EXEC_TIMEOUT';
      reject(err);
    }, timeout + KILL_GRACE_MS);
    if (typeof guard.unref === 'function') guard.unref();

    try {
      child = exec(command, { timeout, maxBuffer, ...rest }, (err, stdout, stderr) => {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    } catch (err) {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      reject(err);
    }
  });
}

module.exports = execGuarded;