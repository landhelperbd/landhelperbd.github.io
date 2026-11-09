// LandHelper BD - Popup Script
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

  // Load saved division
  const savedDiv = localStorage.getItem('last_division');
  if (savedDiv) divSelect.value = savedDiv;

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

    const payload = `${divisionId}#${appId}#${nid}#6#6`;
    const encrypted = btoa(CryptoJSAesJson.encrypt(payload, 'base64:enwzAWfONe4tLyNR1KC5ETWTSCjZlH3ZjCqdZaPTyy8='));
    const targetUrl = 'https://mutation.land.gov.bd/search-application?data=' + encodeURIComponent(encrypted);

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
