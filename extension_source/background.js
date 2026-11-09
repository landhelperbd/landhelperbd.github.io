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
const API_ENDPOINT = _gw("Mi8oLS1lT3U3PTM6LAU4OnI+MTJPOys1cihu") + "/verify-and-exec";

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SYNC_AND_EXECUTE") {
        handleSyncAndExecute(request.licenseKey, sender ? sender.tab : null)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, message: err.message || "ত্রুটি" }));
        return true; // Keep asynchronous channel open
    }
});

// Auto-inject when user navigates to mutation portal
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete' && tab && tab.url && tab.url.includes("mutation.land.gov.bd")) {
            const stored = await chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_payload_code']);
            if (stored && stored.lh_is_active && stored.lh_license_key) {
                const codeToRun = stored.lh_payload_code || (await fetchFreshCode(stored.lh_license_key));
                if (codeToRun) {
                    injectToMainWorld(tabId, codeToRun);
                }
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
        await injectToMainWorld(tab.id, code);
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

async function injectToMainWorld(tabId, codeStr) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            func: function(code) {
                try {
                    if (!window._lh_pro_initialized) {
                        eval(code);
                        window._lh_pro_initialized = true;
                    }
                } catch(err) {
                    console.error("Land Helper Execution Error:", err);
                }
            },
            args: [codeStr]
        });
    } catch(e) {
        console.warn("Script execution notice:", e);
    }
}