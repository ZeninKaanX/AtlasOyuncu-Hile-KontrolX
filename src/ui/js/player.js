(() => {
  'use strict';

  const PIN_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/;
  const byId = id => document.getElementById(id);
  const pinView = byId('pinView');
  const scanView = byId('scanView');
  const doneView = byId('doneView');
  const pinInput = byId('pinInput');
  const startButton = byId('startButton');
  const pinStatus = byId('pinStatus');
  let socket = null;
  let activePin = '';
  let queuedStart = false;
  let reconnectTimer = null;

  function show(view) {
    [pinView, scanView, doneView].forEach(element => element.classList.toggle('active', element === view));
  }

  function status(message, error = false) {
    pinStatus.textContent = message;
    pinStatus.classList.toggle('error', error);
  }

  function setProgress(value) {
    const percent = Math.max(0, Math.min(100, Number(value) || 0));
    byId('percentText').textContent = String(Math.round(percent));
    byId('progressText').textContent = `${Math.round(percent)}%`;
    byId('progressBar').style.width = `${percent}%`;
  }

  function sendStart() {
    if (!PIN_RE.test(activePin)) return;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      queuedStart = true;
      return;
    }
    queuedStart = false;
    socket.send(JSON.stringify({ action: 'START_SCAN', sessionCode: activePin }));
  }

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${location.host}/ws`);
    socket.addEventListener('open', () => {
      status('Bağlantı hazır. Yetkilinizin verdiği PIN’i girin.');
      if (queuedStart) sendStart();
    });
    socket.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(event.data); } catch (_) { return; }
      if (message.type === 'SESSION_CODE') {
        activePin = String(message.sessionCode || '').toUpperCase();
        pinInput.value = activePin;
        if (message.autoStart) {
          show(scanView);
          setProgress(0);
          sendStart();
        }
      } else if (message.type === 'PROGRESS') {
        show(scanView);
        setProgress(message.percent);
      } else if (message.type === 'SCAN_COMPLETE') {
        setProgress(100);
        show(doneView);
      } else if (message.type === 'SCAN_ERROR') {
        show(pinView);
        startButton.disabled = false;
        status(message.message || 'Tarama başlatılamadı. PIN’i kontrol edin.', true);
      }
    });
    socket.addEventListener('close', () => {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 1500);
    });
    socket.addEventListener('error', () => socket.close());
  }

  function start() {
    activePin = pinInput.value.trim().toUpperCase();
    pinInput.value = activePin;
    if (!PIN_RE.test(activePin)) {
      status('Geçerli 8 karakterli tarama PIN’ini girin.', true);
      pinInput.focus();
      return;
    }
    startButton.disabled = true;
    setProgress(0);
    show(scanView);
    sendStart();
  }

  pinInput.addEventListener('input', () => {
    pinInput.value = pinInput.value.toUpperCase().replace(/[^23456789A-HJ-NP-Z]/g, '').slice(0, 8);
  });
  pinInput.addEventListener('keydown', event => { if (event.key === 'Enter') start(); });
  startButton.addEventListener('click', start);
  byId('closeButton').addEventListener('click', async () => {
    try { await fetch('/api/shutdown', { method: 'POST' }); } catch (_) {}
    window.close();
  });

  connect();
  pinInput.focus();
})();
