/* TAXI BLUES: Яндекс Метрика подключается только с разрешения посетителя.
   До указания metrika_counter_id в content/site-settings.json запросов к Метрике нет. */
(async function () {
  'use strict';
  let config;
  try {
    const response = await fetch('content/site-settings.json', { cache: 'no-store' });
    if (!response.ok) return;
    config = await response.json();
  } catch (e) { return; }

  const counterId = Number(config && config.metrika_counter_id);
  if (!Number.isSafeInteger(counterId) || counterId <= 0) return;

  const consentKey = 'taxi_blues_metrika_consent_v1';
  const getChoice = () => {
    try { return window.localStorage.getItem(consentKey); } catch (e) { return null; }
  };
  const remember = choice => {
    try { window.localStorage.setItem(consentKey, choice); } catch (e) { /* storage may be disabled */ }
  };

  let loaded = false;
  const track = (goal, details) => {
    if (!loaded || getChoice() !== 'yes' || typeof window.ym !== 'function') return;
    try { window.ym(counterId, 'reachGoal', goal, details || {}); } catch (e) {}
  };
  window.taxiBluesTrack = track;

  function startMetrika() {
    if (loaded) return;
    loaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(counterId, 'init', {
      clickmap: false,
      trackLinks: false,
      accurateTrackBounce: true,
      webvisor: false,
      trackHash: true
    });
  }

  const style = document.createElement('style');
  style.textContent = `
  .tb-privacy{position:fixed;z-index:120;bottom:16px;left:16px;width:min(540px,calc(100vw - 32px));background:#102824;color:#f1e7d4;border:1px solid #856148;border-radius:8px;box-shadow:0 10px 38px #000a;padding:18px 20px;font:14px/1.55 Arial,sans-serif}
  .tb-privacy[hidden]{display:none!important}
  .tb-privacy p{margin:0 0 13px;color:#e4d9c9}
  .tb-privacy strong{font-size:16px;display:block;margin:0 0 7px}
  .tb-privacy a{color:#f5c3a7;text-decoration:underline}
  .tb-privacy-actions{display:flex;flex-wrap:wrap;gap:8px}
  .tb-privacy button{cursor:pointer;padding:10px 13px;border-radius:4px;font:600 13px Arial,sans-serif}
  .tb-privacy .tb-allow{background:#b44530;border:1px solid #b44530;color:white}
  .tb-privacy .tb-decline{background:transparent;border:1px solid #a99680;color:#f3e6d1}
  .tb-privacy button:focus-visible{outline:3px solid #f3c5a9;outline-offset:2px}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.className = 'tb-privacy';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Настройки аналитики');
  panel.hidden = true;
  panel.innerHTML = '<strong>Статистика TAXI BLUES</strong><p>Можно разрешить Яндекс Метрике собирать сведения о посещении и действиях на сайте, чтобы мы понимали, какие песни и разделы интересны слушателям. <a href="privacy/">Подробнее</a>.</p><div class="tb-privacy-actions"><button type="button" class="tb-allow">Разрешить аналитику</button><button type="button" class="tb-decline">Не разрешать</button></div>';
  document.body.appendChild(panel);

  const show = () => { panel.hidden = false; };
  const hide = () => { panel.hidden = true; };
  panel.querySelector('.tb-allow').addEventListener('click', () => {
    remember('yes'); hide(); startMetrika();
  });
  panel.querySelector('.tb-decline').addEventListener('click', () => {
    remember('no'); hide();
    // A previously loaded tag cannot be unloaded safely; refresh to cease tracking.
    if (loaded) window.location.reload();
  });

  const settingLink = document.getElementById('analyticsSettingsLink');
  if (settingLink) {
    settingLink.hidden = false;
    settingLink.addEventListener('click', e => {
      e.preventDefault(); show();
    });
  }

  if (getChoice() === 'yes') startMetrika();
  else if (getChoice() !== 'no') show();

  document.addEventListener('click', e => {
    const videoButton = e.target.closest('[data-play-video]');
    if (videoButton) track('video_open', { title: 'Овцы Христа', type: 'embedded' });
    const photo = e.target.closest('[data-photo]');
    if (photo) track('photo_open', { title: photo.dataset.caption || '' });
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.href;
    if (/^(https:\/\/)(?:www\.)?youtube\.com\/watch/.test(href) || /^https:\/\/youtu\.be\//.test(href)) {
      track('video_open', { title: link.textContent.trim().slice(0, 80), type: 'youtube' });
    }
    if (/^https:\/\/band\.link\//.test(href)) track('music_platform', { service: 'band.link' });
    if (/^https:\/\/(?:www\.)?youtube\.com\/@/.test(href) || /^https:\/\/vk\.ru\//.test(href)) {
      track('social_open', { service: href.includes('vk.ru') ? 'vk' : 'youtube' });
    }
  });

  const audio = document.getElementById('musicAudio');
  if (audio) {
    audio.addEventListener('play', () => {
      track('audio_play', { track: audio.dataset.track || 'Песня TAXI BLUES' });
    });
    audio.addEventListener('ended', () => {
      track('audio_complete', { track: audio.dataset.track || 'Песня TAXI BLUES' });
    });
  }
})();
