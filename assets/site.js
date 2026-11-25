(() => {
  const params = new URLSearchParams(location.search);
  const qaMode = params.get('qa') === '1';
  const qaSection = document.querySelector('#qa');
  const logView = document.querySelector('#events');
  const form = document.querySelector('#demo-form');
  const confirmation = document.querySelector('#confirmation');
  const config = window.labAnalyticsConfig;
  const ga = /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId) ? config.ga4MeasurementId : '';
  const ymId = /^\d+$/.test(config.metricaCounterId) ? Number(config.metricaCounterId) : 0;

  const allowedCampaigns = {
    friends: ['lab3_pilot', 'test'],
    vk: ['ptcloudaf_vk', 'banner', 'carousel'],
    yandex: ['ptcloudaf_search', 'brand', 'commercial', 'comparison'],
  };
  const source = Object.hasOwn(allowedCampaigns, params.get('utm_source')) ? params.get('utm_source') : 'direct';
  const context = {};
  for (const key of ['utm_campaign', 'utm_content']) {
    const value = params.get(key);
    if (allowedCampaigns[source]?.includes(value)) context[key] = value;
  }
  context.utm_source = source;
  const sessionKey = 'pt-cloud-af:' + JSON.stringify([qaMode, context]);
  let events = [];
  try {
    events = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
  } catch {
    events = [];
  }

  const consent = document.querySelector('#consent');
  let analyticsEnabled = false;
  function loadScript(url) {
    const script = document.createElement('script');
    script.async = true;
    script.src = url;
    document.head.append(script);
  }

  function sendEvent(event) {
    const values = { ...context, ...event.details };
    if (ga && event.name !== 'page_view') window.gtag('event', event.name, values);
    if (ymId && event.name !== 'page_view') window.ym(ymId, 'reachGoal', event.name, values);
  }

  function record(name, details = {}) {
    if (events.some(event => event.name === name)) return;
    const event = { name, details, at: new Date().toISOString() };
    events.push(event);
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(events));
    } catch {
      // The demonstration still works with browser storage disabled.
    }
    if (qaMode) {
      logView.textContent = [JSON.stringify(context), ...events.map(item => item.at + '  ' + item.name)].join('\n');
    }
    if (analyticsEnabled) sendEvent(event);
  }

  if (!qaMode && (ga || ymId)) {
    consent.hidden = false;
    document.querySelector('#accept').addEventListener('click', () => {
      if (ga) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', ga, { allow_google_signals: false, allow_ad_personalization_signals: false });
        loadScript('https://www.googletagmanager.com/gtag/js?id=' + ga);
      }
      if (ymId) {
        window.ym = function () { (window.ym.a = window.ym.a || []).push(arguments); };
        window.ym.l = Date.now();
        window.ym(ymId, 'init', { clickmap: false, trackLinks: false, webvisor: false });
        loadScript('https://mc.yandex.ru/metrika/tag.js');
      }
      analyticsEnabled = true;
      events.forEach(sendEvent);
      consent.hidden = true;
    }, { once: true });
    document.querySelector('#decline').addEventListener('click', () => { consent.hidden = true; }, { once: true });
  }

  qaSection.hidden = !qaMode;
  record('page_view');
  if (qaMode) {
    logView.textContent = [JSON.stringify(context), ...events.map(item => item.at + '  ' + item.name)].join('\n');
    document.querySelector('#reset').addEventListener('click', () => {
      try { sessionStorage.removeItem(sessionKey); } catch {}
      location.reload();
    });
  }

  document.querySelectorAll('[data-cta]').forEach(link => link.addEventListener('click', () => {
    record('demo_cta_click', { placement: link.dataset.cta });
  }));
  form.querySelectorAll('select').forEach(field => field.addEventListener('change', () => {
    if (field.value) record('demo_form_start');
  }));
  if (events.some(event => event.name === 'generate_lead')) {
    confirmation.hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    record('generate_lead');
    form.querySelector('button[type="submit"]').disabled = true;
    confirmation.hidden = false;
    confirmation.focus();
  });
})();
