// Land Helper BD Pro - Content Script (mutation.land.gov.bd)
// Automatically activates toolbar & bridges secure click-based hit metering

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
            console.warn("Direct DOM script injection notice:", e);
        }
    }

    // Bridge click-based action execution between page (MAIN world) and extension background worker
    window.addEventListener('message', function(e) {
        if (e.source !== window || !e.data || e.data.type !== 'LH_CONSUME_ACTION_REQ') return;
        chrome.runtime.sendMessage({
            action: 'CONSUME_ACTION_HIT',
            actionType: e.data.action,
            actionLabel: e.data.actionLabel,
            licenseKey: e.data.key
        }, function(res) {
            window.postMessage({
                type: 'LH_CONSUME_ACTION_RES',
                reqId: e.data.reqId,
                action: e.data.action,
                success: Boolean(res && res.success),
                remaining: res ? res.remaining : undefined,
                message: res ? res.message : 'সার্ভার সংযোগ ত্রুটি'
            }, '*');
        });
    });

    // Check if license is active in storage and sync/execute
    chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_payload_code'], function(res) {
        if (res && res.lh_is_active && res.lh_license_key) {
            // 1. If payload is already cached locally, inject immediately for zero-delay UX
            if (res.lh_payload_code) {
                injectScriptDirect(res.lh_payload_code);
            }

            // 2. Request background service worker to sync/inject fresh code from server (Zero-delay Auto-Update)
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
                console.warn("Background messaging notice:", e);
            }
        }
    });
})();
