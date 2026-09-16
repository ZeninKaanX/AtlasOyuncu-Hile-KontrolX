'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Year stamp in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --------------------------------------------------------------------------
  // 1. DEMO SCAN INTERACTION IN REPORT MOCKUP
  // --------------------------------------------------------------------------
  const btnRunDemoScan = document.getElementById('btnRunDemoScan');
  const demoPinCode = document.getElementById('demoPinCode');
  const demoPinBadge = document.getElementById('demoPinBadge');
  const demoVerdictBadge = document.getElementById('demoVerdictBadge');
  const demoDetectionPill = document.getElementById('demoDetectionPill');
  const demoDetectionsCount = document.getElementById('demoDetectionsCount');
  const demoWarningsCount = document.getElementById('demoWarningsCount');
  const demoLogList = document.getElementById('demoLogList');

  if (btnRunDemoScan) {
    btnRunDemoScan.addEventListener('click', () => {
      btnRunDemoScan.disabled = true;
      btnRunDemoScan.innerHTML = '⏳ Taranıyor... (%0)';

      // Generate random demo PIN
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let rndPin = '';
      for (let i = 0; i < 8; i++) rndPin += chars[Math.floor(Math.random() * chars.length)];

      if (demoPinCode) demoPinCode.textContent = rndPin;
      if (demoPinBadge) demoPinBadge.textContent = rndPin;

      let pct = 0;
      const interval = setInterval(() => {
        pct += 15;
        if (pct >= 100) {
          pct = 100;
          clearInterval(interval);
          btnRunDemoScan.disabled = false;
          btnRunDemoScan.innerHTML = '✓ Demo Tarama Tamamlandı!';
          setTimeout(() => {
            btnRunDemoScan.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon> Demo Taramayı Başlat';
          }, 2500);

          // Update Mock Results
          if (demoVerdictBadge) {
            demoVerdictBadge.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              CHEATING
            `;
          }
          if (demoDetectionPill) demoDetectionPill.textContent = '8 Tespit';
          if (demoDetectionsCount) demoDetectionsCount.textContent = '8';
          if (demoWarningsCount) demoWarningsCount.textContent = '14';
        } else {
          btnRunDemoScan.innerHTML = `⏳ Taranıyor... (%${pct})`;
        }
      }, 150);
    });
  }

  // --------------------------------------------------------------------------
  // 2. CATEGORY TABS IN SAMPLE REPORT
  // --------------------------------------------------------------------------
  const catButtons = document.querySelectorAll('.results-cat-btn');
  const catFindings = {
    overview: [
      { tag: 'Süreç İçi', title: 'Tanınmayan Modül Enjeksiyonu', code: 'Süreç: javaw.exe · Modül: vape_loader_v4.dll (Reflective DLL Injection)' },
      { tag: 'Uyarı', title: 'Çalıştırma İzi Tespit Edildi', code: 'Kaynak: Prefetch (NTFS) · Dosya: clicker-v3.exe (Silinmiş)' },
      { tag: 'Boot', title: 'Değiştirilmiş Dosya İmzası', code: 'Kaynak: Amcache / USN Journal · İmzası bozulmuş loader kalıntısı' }
    ],
    integrity: [
      { tag: 'Bütünlük', title: 'USN Journal Silinme Olayı', code: 'Olay: DELETE_RECORD · Dosya: C:\\Users\\...\\AppData\\Local\\Temp\\reach.jar' },
      { tag: 'Bütünlük', title: 'Prefetch Girişi Uyumsuzluğu', code: 'Zaman Damgası Uyuşmazlığı · 12 dosya geçmişi silindi' }
    ],
    suspicious: [
      { tag: 'Hafıza', title: 'JVM Bellek Dizgisi Eşleşti', code: 'Pattern: "net.kura.client.combat.Reach" · javaw.exe PID 8412' },
      { tag: 'Hafıza', title: 'Gizlenmiş Bytecode Yükleyici', code: 'Entropy: 7.84 · AES-256 Şifrelenmiş Modül' }
    ]
  };

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat') || 'overview';
      const list = catFindings[cat] || catFindings.overview;

      if (demoLogList) {
        demoLogList.innerHTML = list.map(item => `
          <div class="log-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
            <div>
              <strong>${item.title} <span class="tag">${item.tag}</span></strong>
              <code>${item.code}</code>
            </div>
          </div>
        `).join('');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. WORKFLOW STEPS HIGHLIGHT
  // --------------------------------------------------------------------------
  const workflowSteps = document.querySelectorAll('.workflow-step');
  workflowSteps.forEach(step => {
    step.addEventListener('click', () => {
      workflowSteps.forEach(s => s.classList.remove('is-active'));
      step.classList.add('is-active');
    });
  });

  // --------------------------------------------------------------------------
  // 4. CONNECTIONS: DISCORD VS REST API TAB TOGGLE
  // --------------------------------------------------------------------------
  const tabBtnDiscord = document.getElementById('tabBtnDiscord');
  const tabBtnApi = document.getElementById('tabBtnApi');
  const panelDiscord = document.getElementById('panelDiscord');
  const panelApi = document.getElementById('panelApi');

  if (tabBtnDiscord && tabBtnApi && panelDiscord && panelApi) {
    tabBtnDiscord.addEventListener('click', () => {
      tabBtnDiscord.classList.add('active');
      tabBtnApi.classList.remove('active');
      panelDiscord.classList.remove('hidden');
      panelApi.classList.add('hidden');
    });

    tabBtnApi.addEventListener('click', () => {
      tabBtnApi.classList.add('active');
      tabBtnDiscord.classList.remove('active');
      panelApi.classList.remove('hidden');
      panelDiscord.classList.add('hidden');
    });
  }

  // --------------------------------------------------------------------------
  // 5. FAQ ACCORDION
  // --------------------------------------------------------------------------
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        accordionItems.forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });
});
