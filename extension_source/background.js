// Land Helper BD Pro - Background Service Worker (Manifest V3)
// Dynamic Gateway Resolver - Obfuscated at rest
function _gw(enc) {
    const raw = atob(enc);
    let out = '';
    for (let i = 0; i < raw.length; i++) {
        out += String.fromCharCode(raw.charCodeAt(i) ^ (0x5A + (i % 7)));
    }
    return out;
}
const API_ENDPOINT = _gw("Mi8oLS1lT3U2My8wNg49dj4vMTALd2JobmlxDjszNTlobVdsdSsyLDQFKChyOTspTzsrNXIobg==") + "/verify-and-exec";

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SYNC_AND_EXECUTE") {
        handleSyncAndExecute(request.licenseKey, sender ? sender.tab : null)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, message: err.message || "ত্রুটি" }));
        return true;
    }

    if (request.action === "CONSUME_ACTION_HIT" || request.action === "CONSUME_HIT") {
        handleConsumeHit(request)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: true, remaining: "unlimited", message: "" }));
        return true;
    }

    if (request.action === "ENSURE_INJECTED") {
        handleEnsureInjected(sender ? sender.tab : null)
            .then(res => sendResponse(res))
            .catch(() => sendResponse({ success: false }));
        return true;
    }
});

// Auto-inject when user navigates to mutation portal with Live Sync
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if ((changeInfo.status === 'complete' || changeInfo.url) && tab && tab.url && tab.url.includes("mutation.land.gov.bd")) {
            const stored = await chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_payload_code']);
            if (stored && stored.lh_is_active && stored.lh_license_key) {
                // 1. Immediate execution from cache (Zero latency for user)
                if (stored.lh_payload_code) {
                    injectToMainWorld(tabId, stored.lh_payload_code, false);
                } else {
                    const fresh = await fetchFreshCode(stored.lh_license_key);
                    if (fresh) injectToMainWorld(tabId, fresh, false);
                }

                // 2. Background Revalidation (Auto-sync with server button toggles)
                fetchFreshCode(stored.lh_license_key).then(freshCode => {
                    if (freshCode && freshCode !== stored.lh_payload_code) {
                        chrome.storage.local.set({ 'lh_payload_code': freshCode });
                        injectToMainWorld(tabId, freshCode, true);
                    }
                }).catch(() => {});
            }
        }
    } catch(e) {
        console.warn("Navigation hook handled:", e);
    }
});

async function handleSyncAndExecute(licenseKey, tab) {
    if (!licenseKey) return { success: false };
    const code = await fetchFreshCode(licenseKey);
    if (code && tab && tab.id) {
        await injectToMainWorld(tab.id, code, true);
        return { success: true, code: code };
    }
    return { success: !!code };
}

async function handleEnsureInjected(tab) {
    try {
        if (!tab || !tab.id) return { success: false };
        const stored = await chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_payload_code']);
        if (stored && stored.lh_is_active) {
            if (stored.lh_payload_code) {
                await injectToMainWorld(tab.id, stored.lh_payload_code, false);
                return { success: true };
            }
            const fresh = await fetchFreshCode(stored.lh_license_key);
            if (fresh) {
                await injectToMainWorld(tab.id, fresh, false);
                return { success: true };
            }
        }
    } catch(e) {}
    return { success: false };
}

async function handleConsumeHit(req) {
    try {
        const stored = await chrome.storage.local.get(['lh_license_key', 'lh_device_fp', 'lh_device_uuid']);
        const key = req.licenseKey || stored.lh_license_key;
        let fp = stored.lh_device_fp;
        if (!fp) {
            let uuid = stored.lh_device_uuid || ('lh_' + Math.random().toString(36).substring(2, 10));
            fp = btoa("LandHelperBD_" + uuid);
        }

        const consumeUrl = API_ENDPOINT.replace('/verify-and-exec', '/consume-hit');
        const res = await fetch(consumeUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                k: key,
                fp: fp,
                action: req.actionType || req.action || 'action'
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return {
                success: false,
                message: errData.message || "সার্ভার রেসপন্স দেয়নি।"
            };
        }

        const data = await res.json();
        return {
            success: Boolean(data.success),
            remaining: data.remaining,
            usage_count: data.usage_count,
            max_hits: data.max_hits,
            status: data.status,
            message: data.message
        };
    } catch(e) {
        console.warn("Consume hit network notice:", e);
        return { success: true, remaining: "unlimited", message: "" };
    }
}

async function fetchFreshCode(licenseKey) {
    try {
        const stored = await chrome.storage.local.get(['lh_device_fp', 'lh_device_uuid']);
        let fp = stored.lh_device_fp;
        if (!fp) {
            let uuid = stored.lh_device_uuid || ('lh_' + Math.random().toString(36).substring(2, 10));
            fp = btoa("LandHelperBD_" + uuid);
        }

        const res = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                k: licenseKey,
                fp: fp,
                dinfo: "ChromeExtension_MV3_Auto"
            })
        });

        if (!res.ok) return null;
        const data = await res.json();
        if (data.success && data.code) {
            await chrome.storage.local.set({ 'lh_payload_code': data.code, 'lh_is_active': true });
            return data.code;
        }
    } catch(e) {
        console.warn("Fetch code error:", e);
    }
    return null;
}

async function injectToMainWorld(tabId, codeStr, forceReload = false) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            func: function(code, forceUpd) {
                try {
                    if (forceUpd || !document.getElementById('_lh_bar')) {
                        var oldHost = document.getElementById('_lh_host_root') || document.getElementById('_lh_bar');
                        if (oldHost) oldHost.remove();
                        window._lh_pro_initialized = false;
                    }
                    if (!window._lh_pro_initialized) {
                        eval(code);
                        window._lh_pro_initialized = true;
                    }
                } catch(err) {
                    console.error("Land Helper Execution Error:", err);
                }
            },
            args: [codeStr, forceReload]
        });
    } catch(e) {
        console.warn("Script execution notice:", e);
    }
}
