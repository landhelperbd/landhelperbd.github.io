// Land Helper BD Pro - Content Script (mutation.land.gov.bd)
// Automatically activates toolbar & bridges secure click-based hit metering

(function() {
    // Only execute in top window (ignore iframes)
    if (window.top !== window.self) return;
    if (window._lh_content_ready) return;
    window._lh_content_ready = true;

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

    // Check if license is active and ask background worker to inject into MAIN world (CSP-safe)
    function requestToolbarInjection() {
        try {
            chrome.storage.local.get(['lh_license_key', 'lh_is_active'], function(res) {
                if (res && res.lh_is_active && res.lh_license_key) {
                    chrome.runtime.sendMessage({
                        action: "SYNC_AND_EXECUTE",
                        licenseKey: res.lh_license_key
                    });
                }
            });
        } catch(e) {
            // Extension context invalidated / updated
        }
    }

    // Initial injection
    requestToolbarInjection();

    // Route / SPA Watcher: If _lh_bar is ever removed by Vue Router navigation or modal transition, restore it!
    setInterval(function() {
        if (!document.getElementById('_lh_bar')) {
            requestToolbarInjection();
        }
    }, 1500);
})();
