/**
 * Atlas AC - Server Policy & Rules Configuration
 * Allows server administrators to customize anti-cheat detection policies
 * according to server-specific rules (e.g. allowing AutoClickers or Freecam).
 */

class ServerPolicy {
  constructor() {
    // Default server rules: AutoClicker and Freecam are allowed on this server
    this.allowAutoClickers = true;
    this.allowFreecam = true;
  }

  isAutoClickerAllowed() {
    return this.allowAutoClickers === true;
  }

  isFreecamAllowed() {
    return this.allowFreecam === true;
  }

  setAutoClickerAllowed(allowed) {
    this.allowAutoClickers = Boolean(allowed);
  }

  setFreecamAllowed(allowed) {
    this.allowFreecam = Boolean(allowed);
  }
}

module.exports = new ServerPolicy();
