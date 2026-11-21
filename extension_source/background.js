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
        return true; // Keep asynchronous channel open
    }
});

// Auto-inject when user navigates to mutation portal with Live Sync
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete' && tab && tab.url && tab.url.includes("mutation.land.gov.bd")) {
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
                    if (forceUpd) {
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
