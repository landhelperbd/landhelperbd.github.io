// LandHelper BD - Popup Script v2.1.0
const CURRENT_VERSION = '2.1.0';
const DEFAULT_KEY = 'base64:enwzAWfONe4tLyNR1KC5ETWTSCjZlH3ZjCqdZaPTyy8=';
const DEFAULT_SEARCH_URL = 'https://mutation.land.gov.bd/search-application';
const CONFIG_URL = 'https://landhelperbd.github.io/config.json';

const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
function toEnglish(s) {
  if (!s) return '';
  return s.toString().replace(/[০-৯]/g, d => bnDigits.indexOf(d)).trim();
}

document.addEventListener('DOMContentLoaded', () => {
  const divSelect = document.getElementById('division');
  const appIdInput = document.getElementById('appId');
  const nidInput = document.getElementById('nid');
  const btnSearch = document.getElementById('btnSearch');
  const noticeBox = document.getElementById('noticeBox');

  // Load saved division
  const savedDiv = localStorage.getItem('last_division');
  if (savedDiv) divSelect.value = savedDiv;

  // Cloud Remote Config & Auto-Update Engine
  async function syncRemoteConfig() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(CONFIG_URL + '?t=' + Date.now(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const config = await res.json();
        if (config.aes_key) localStorage.setItem('cached_aes_key', config.aes_key);
        if (config.search_url) localStorage.setItem('cached_search_url', config.search_url);

        // Check for new version announcement
        if (config.version && config.version !== CURRENT_VERSION && noticeBox) {
          noticeBox.style.display = 'block';
          noticeBox.innerHTML = `📢 নতুন আপডেট এসেছে (v${config.version})! <a href="${config.update_url || 'https://landhelperbd.github.io/extensions/namjari-helper.html'}" target="_blank">ডাউনলোড করুন</a>`;
        } else if (config.notice && noticeBox && config.notice.trim() !== '') {
          noticeBox.style.display = 'block';
          noticeBox.innerHTML = `📢 ${config.notice}`;
        }
      }
    } catch (e) {
      // Offline or network timeout - use cached/fallback
    }
  }

  syncRemoteConfig();

  function doSearch() {
    const rawApp = appIdInput.value.trim();
    if (!rawApp) {
      appIdInput.focus();
      return;
    }

    const divisionId = divSelect.value;
    localStorage.setItem('last_division', divisionId);

    const appId = toEnglish(rawApp);
    let nid = toEnglish(nidInput.value.trim());
    if (!nid || nid === '0') {
      nid = '1234567890';
    }

    const aesKey = localStorage.getItem('cached_aes_key') || DEFAULT_KEY;
    const searchUrl = localStorage.getItem('cached_search_url') || DEFAULT_SEARCH_URL;

    const payload = `${divisionId}#${appId}#${nid}#6#6`;
    const encrypted = btoa(CryptoJSAesJson.encrypt(payload, aesKey));
    const targetUrl = searchUrl + '?data=' + encodeURIComponent(encrypted);

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, '_blank');
    }
  }

  btnSearch.addEventListener('click', doSearch);

  appIdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  nidInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
});
