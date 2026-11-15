// Land Helper BD Pro - Background Service Worker (Manifest V3)
// Dynamic Gateway Resolver - Obfuscated at rest (Zero plain-text server IP or domain)
function _gw(enc) {
    const raw = atob(enc);
    let out = '';
    for (let i = 0; i < raw.length; i++) {
        out += String.fromCharCode(raw.charCodeAt(i) ^ (0x5A + (i % 7)));
    }
    return out;
}
const BASE_ENDPOINT = _gw("Mi8oLS1lT3U3PTM6LAU4OnI+MTJPOys1cihu");
const API_VERIFY_ENDPOINT = BASE_ENDPOINT + "/verify-and-exec";
const API_CONSUME_ENDPOINT = BASE_ENDPOINT + "/consume-hit";

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // A. Metered Button Click Action
    if (request.action === "CONSUME_ACTION_HIT") {
        handleConsumeHit(request.actionType, request.actionLabel, request.licenseKey)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, message: err.message || "হিট যাচাই ব্যর্থ হয়েছে" }));
        return true;
    }

    // B. Page Load Toolbar Sync & Auto-Update
    if (request.action === "SYNC_AND_EXECUTE") {
        handleSyncAndExecute(request.licenseKey, sender ? sender.tab : null)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, message: err.message || "ত্রুটি" }));
        return true;
    }
});

// Auto-inject when user navigates to mutation portal
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete' && tab && tab.url && tab.url.includes("mutation.land.gov.bd")) {
            const stored = await chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_payload_code']);
            if (stored && stored.lh_is_active && stored.lh_license_key) {
                // Fetch fresh code from server on navigation for instant seamless auto-updates
                const freshCode = await fetchFreshCode(stored.lh_license_key);
                const codeToRun = freshCode || stored.lh_payload_code;
                if (codeToRun) {
                    injectToMainWorld(tabId, codeToRun);
                }
            }
        }
    } catch(e) {
        console.warn("Navigation hook notice:", e);
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

// Consumes exactly 1 hit when user clicks an action button
async function handleConsumeHit(actionType, actionLabel, licenseKey) {
    try {
        const stored = await chrome.storage.local.get(['lh_license_key', 'lh_device_fp', 'lh_device_uuid']);
        const key = licenseKey || stored.lh_license_key;
        let fp = stored.lh_device_fp;
        if (!fp) {
            let uuid = stored.lh_device_uuid || ('lh_' + Math.random().toString(36).substring(2, 10));
            fp = btoa("LandHelperBD_" + uuid);
        }

        const res = await fetch(API_CONSUME_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                k: key,
                fp: fp,
                action: actionType,
                actionLabel: actionLabel
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return { success: false, message: errData.message || "হিট যাচাই ব্যর্থ হয়েছে" };
        }
        return await res.json();
    } catch(err) {
        return { success: false, message: "সার্ভারে কানেক্ট করা যায়নি: " + err.message };
    }
}

// Fetches server-compiled payload (0 hits consumed on reload / navigation)
async function fetchFreshCode(licenseKey) {
    try {
        const stored = await chrome.storage.local.get(['lh_device_fp', 'lh_device_uuid']);
        let fp = stored.lh_device_fp;
        if (!fp) {
            let uuid = stored.lh_device_uuid || ('lh_' + Math.random().toString(36).substring(2, 10));
            fp = btoa("LandHelperBD_" + uuid);
        }

        const res = await fetch(API_VERIFY_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                k: licenseKey,
                fp: fp,
                is_init: true,
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
        console.warn("Fetch code notice:", e);
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
                    // Update or replace existing bar with fresh updated code
                    var oldBar = document.getElementById('_lh_bar');
                    if (oldBar) oldBar.remove();
                    eval(code);
                    window._lh_pro_initialized = true;
                } catch(err) {
                    console.error("Land Helper Execution Notice:", err);
                }
            },
            args: [codeStr]
        });
    } catch(e) {
        console.warn("Script execution notice:", e);
    }
}
