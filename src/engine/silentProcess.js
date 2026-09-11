/**
 * Atlas AC - Global Silent Child Process Manager
 * 
 * Intercepts all Node.js child_process executions (exec, execSync, spawn, execFile)
 * across the entire application and all forensic engines.
 * 
 * On Windows:
 * 1. Automatically enforces `windowsHide: true` on ALL executions, passing
 *    STARTF_USESHOWWINDOW + SW_HIDE to CreateProcessW.
 * 2. Automatically injects `-WindowStyle Hidden` into all PowerShell invocations.
 * 
 * This guarantees that during background and live scans, ZERO black CMD or PowerShell
 * console windows ever flash or appear on the user's screen.
 */

const cp = require('child_process');
const util = require('util');

if (!global.__ATLAS_SILENT_PROCESS_INITIALIZED__) {
  global.__ATLAS_SILENT_PROCESS_INITIALIZED__ = true;

  function sanitizeCommand(command) {
    if (process.platform === 'win32' && typeof command === 'string') {
      if (/\bpowershell(?:\.exe)?\b/i.test(command) && !/-windowstyle\s+hidden/i.test(command)) {
        command = command.replace(/\b(powershell(?:\.exe)?)\b/gi, '$1 -WindowStyle Hidden');
      }
    }
    return command;
  }

  // 1. Patch cp.exec
  const origExec = cp.exec;
  const newExec = function(command, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    command = sanitizeCommand(command);
    options = Object.assign({}, options);
    options.windowsHide = true;
    return origExec.call(this, command, options, callback);
  };

  Object.defineProperty(newExec, util.promisify.custom, {
    value: function(command, options) {
      command = sanitizeCommand(command);
      options = Object.assign({}, options);
      options.windowsHide = true;
      return new Promise((resolve, reject) => {
        newExec(command, options, (err, stdout, stderr) => {
          if (err) {
            err.stdout = stdout;
            err.stderr = stderr;
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
    },
    writable: false,
    configurable: true,
    enumerable: false
  });

  cp.exec = newExec;

  // 2. Patch cp.execSync
  const origExecSync = cp.execSync;
  cp.execSync = function(command, options) {
    command = sanitizeCommand(command);
    options = Object.assign({}, options);
    options.windowsHide = true;
    return origExecSync.call(this, command, options);
  };

  // 3. Patch cp.spawn
  const origSpawn = cp.spawn;
  cp.spawn = function(command, args, options) {
    if (Array.isArray(args)) {
      if (process.platform === 'win32' && /\bpowershell(?:\.exe)?\b/i.test(command)) {
        if (!args.some(a => /-windowstyle/i.test(a))) {
          args = ['-WindowStyle', 'Hidden', ...args];
        }
      }
      options = Object.assign({}, options);
      options.windowsHide = true;
      return origSpawn.call(this, command, args, options);
    } else {
      options = Object.assign({}, args);
      options.windowsHide = true;
      return origSpawn.call(this, command, options);
    }
  };

  // 4. Patch cp.execFile
  const origExecFile = cp.execFile;
  const newExecFile = function(file, args, options, callback) {
    let finalArgs = [];
    let finalOptions = {};
    let finalCallback;

    if (Array.isArray(args)) {
      finalArgs = args;
      if (typeof options === 'function') {
        finalCallback = options;
      } else if (typeof options === 'object' && options !== null) {
        finalOptions = options;
        finalCallback = callback;
      }
    } else if (typeof args === 'function') {
      finalCallback = args;
    } else if (typeof args === 'object' && args !== null) {
      finalOptions = args;
      finalCallback = options;
    }

    if (typeof callback === 'function') {
      finalCallback = callback;
    }

    finalOptions = Object.assign({}, finalOptions);
    finalOptions.windowsHide = true;

    if (finalArgs.length > 0) {
      return origExecFile.call(this, file, finalArgs, finalOptions, finalCallback);
    } else {
      return origExecFile.call(this, file, finalOptions, finalCallback);
    }
  };

  Object.defineProperty(newExecFile, util.promisify.custom, {
    value: function(file, args, options) {
      let finalArgs = [];
      let finalOptions = {};

      if (Array.isArray(args)) {
        finalArgs = args;
        if (typeof options === 'object' && options !== null) {
          finalOptions = options;
        }
      } else if (typeof args === 'object' && args !== null) {
        finalOptions = args;
      }

      finalOptions = Object.assign({}, finalOptions);
      finalOptions.windowsHide = true;

      return new Promise((resolve, reject) => {
        newExecFile(file, finalArgs, finalOptions, (err, stdout, stderr) => {
          if (err) {
            err.stdout = stdout;
            err.stderr = stderr;
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
    },
    writable: false,
    configurable: true,
    enumerable: false
  });

  cp.execFile = newExecFile;
}

module.exports = true;
