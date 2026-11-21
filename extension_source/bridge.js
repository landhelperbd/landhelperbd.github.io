// Land Helper BD Pro - Isolated World Bridge (Manifest V3)
// Securely bridges chrome.storage & background network messaging to MAIN world

(function() {
    'use strict';
    if (window.top !== window.self) return;

    function syncLicenseData() {
        try {
            chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_device_fp'], function(res) {
                const key = (res && res.lh_license_key) || '';
                const isActive = Boolean(res && res.lh_is_active);
                const fp = (res && res.lh_device_fp) || '';

                try {
                    sessionStorage.setItem('__lh_k', key);
                    sessionStorage.setItem('__lh_act', isActive ? '1' : '0');
                    sessionStorage.setItem('__lh_fp', fp);
                } catch(e) {}

                window.postMessage({
                    type: 'LH_SYNC_LICENSE_RES',
                    key: key,
                    isActive: isActive,
                    fp: fp
                }, '*');
            });
        } catch(e) {}
    }

    // Initial broadcast
    syncLicenseData();

    // Ensure MAIN world payload is active
    try {
        chrome.runtime.sendMessage({ action: "ENSURE_INJECTED" }, function() {
            if (chrome.runtime.lastError) {}
        });
    } catch(e) {}

    // Listen to messages from server-injected script (MAIN world)
    window.addEventListener('message', function(e) {
        if (e.source !== window || !e.data) return;

        // Sync request
        if (e.data.type === 'LH_SYNC_LICENSE_REQ') {
            syncLicenseData();
            return;
        }

        // Action hit consumption request
        if (e.data.type === 'LH_CONSUME_ACTION_REQ' || e.data.type === 'LH_CONSUME_HIT_REQ') {
            const reqId = e.data.reqId;
            const actionType = e.data.action || e.data.actionType || 'action';
            const actionLabel = e.data.actionLabel || 'অ্যাকশন';
            const licenseKey = e.data.key || e.data.licenseKey;

            chrome.runtime.sendMessage({
                action: "CONSUME_ACTION_HIT",
                actionType: actionType,
                actionLabel: actionLabel,
                licenseKey: licenseKey
            }, function(res) {
                const lastErr = chrome.runtime.lastError;
                const payload = {
                    reqId: reqId,
                    success: Boolean(res && res.success && !lastErr),
                    remaining: res ? res.remaining : undefined,
                    usage_count: res ? res.usage_count : undefined,
                    max_hits: res ? res.max_hits : undefined,
                    message: (res && res.message) || (lastErr ? lastErr.message : '')
                };
                window.postMessage({ type: 'LH_CONSUME_ACTION_RES', ...payload }, '*');
                window.postMessage({ type: 'LH_CONSUME_HIT_RES', ...payload }, '*');
            });
        }
    });

    // Re-sync if storage changes
    try {
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if (namespace === 'local' && (changes.lh_license_key || changes.lh_is_active)) {
                syncLicenseData();
            }
        });
    } catch(e) {}
})();
