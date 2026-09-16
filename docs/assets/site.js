'use strict';
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('licenseForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const customer = document.getElementById('customer').value.trim();
  const machine = document.getElementById('machine').value.trim().toUpperCase();
  const contact = document.getElementById('contact').value.trim();
  if (!/^[A-F0-9]{64}$/.test(machine)) return;
  const title = `[Lisans Talebi] ${customer}`;
  const body = `## Atlas AC lisans talebi\n\n- **Sunucu / Yetkili:** ${customer}\n- **Makine Kimliği:** \`${machine}\`\n- **İletişim:** ${contact}\n\n> Not: Bu talep özel anahtar veya parola içermez.`;
  const url = new URL('https://github.com/ZeninKaanX/AtlasOyuncu-Hile-KontrolX/issues/new');
  url.searchParams.set('title', title);
  url.searchParams.set('body', body);
  url.searchParams.set('labels', 'license-request');
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
});
