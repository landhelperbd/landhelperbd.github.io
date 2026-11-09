// Land Helper BD Pro - Content Script (mutation.land.gov.bd)
// Automatically activates toolbar when visiting the mutation portal

(function() {
    // Only execute in top window (ignore iframes)
    if (window.top !== window.self) return;
    if (window._lh_content_ready) return;
    window._lh_content_ready = true;

    function injectScriptDirect(codeString) {
        if (!codeString || window._lh_injected) return;
        try {
            const script = document.createElement('script');
            script.textContent = codeString;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
            window._lh_injected = true;
        } catch(e) {
            console.warn("Direct DOM script injection failed (CSP), relying on background scripting:", e);
        }
    }

    // Check if license is active in storage
    chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_payload_code'], function(res) {
        if (res && res.lh_is_active && res.lh_license_key) {
            // 1. If payload is already cached locally, inject immediately for zero-delay UX
            if (res.lh_payload_code) {
                injectScriptDirect(res.lh_payload_code);
            }

            // 2. Request background service worker to sync/inject via chrome.scripting (guaranteed CSP bypass)
            try {
                chrome.runtime.sendMessage({
                    action: "SYNC_AND_EXECUTE",
                    licenseKey: res.lh_license_key
                }, function(response) {
                    if (response && response.success && response.code && !window._lh_injected) {
                        injectScriptDirect(response.code);
                    }
                });
            } catch(e) {
                console.warn("Background messaging error:", e);
            }
        }
    });
})();
