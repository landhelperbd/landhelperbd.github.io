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
        const tab = sender ? sender.tab : null;
        handleSyncAndExecute(request.licenseKey, tab)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, message: err.message || "ত্রুটি" }));
        return true;
    }
});

// Auto-inject when user navigates or refreshes tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (tab && tab.url && tab.url.includes("mutation.land.gov.bd")) {
            if (changeInfo.status === 'complete' || changeInfo.url) {
                const stored = await chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_payload_code']);
                if (stored && stored.lh_is_active && stored.lh_license_key) {
                    if (stored.lh_payload_code) {
                        await injectToMainWorld(tabId, stored.lh_payload_code);
                    }
                    const now = Date.now();
                    if (!stored.lh_payload_code || (now - _lastFetchTime > 5 * 60 * 1000)) {
                        _lastFetchTime = now;
                        const freshCode = await fetchFreshCode(stored.lh_license_key);
                        if (freshCode && freshCode !== stored.lh_payload_code) {
                            await injectToMainWorld(tabId, freshCode);
                        }
                    }
                }
            }
        }
    } catch(e) {
        console.warn("Navigation hook notice:", e);
    }
});

let _lastFetchTime = 0;

async function handleSyncAndExecute(licenseKey, tab) {
    if (!licenseKey) return { success: false };
    const stored = await chrome.storage.local.get(['lh_payload_code']);
    let tabId = tab ? tab.id : null;
    if (!tabId) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0]) tabId = tabs[0].id;
    }

    // 1. If payload already cached, inject immediately for instant zero-delay render
    if (stored && stored.lh_payload_code && tabId) {
        await injectToMainWorld(tabId, stored.lh_payload_code);
    }

    // 2. Fetch fresh code from server (throttled to at most once per 5 minutes unless cache is empty)
    const now = Date.now();
    if (!stored || !stored.lh_payload_code || (now - _lastFetchTime > 5 * 60 * 1000)) {
        _lastFetchTime = now;
        const freshCode = await fetchFreshCode(licenseKey);
        if (freshCode && tabId && freshCode !== (stored && stored.lh_payload_code)) {
            await injectToMainWorld(tabId, freshCode);
        }
    }
    return { success: true };
}

// Consumes exactly 1 hit when user clicks an action button
async function handleConsumeHit(actionType, actionLabel, licenseKey) {
    try {
        const stored = await chrome.storage.local.get(['lh_license_key', 'lh_device_fp']);
        const key = licenseKey || stored.lh_license_key;
        let fp = stored.lh_device_fp || "PC-DEFAULT";

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

// Fetches server-compiled payload
async function fetchFreshCode(licenseKey) {
    try {
        const stored = await chrome.storage.local.get(['lh_device_fp']);
        let fp = stored.lh_device_fp || "PC-DEFAULT";

        const res = await fetch(API_VERIFY_ENDPOINT, {
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
        console.warn("Fetch code notice:", e);
    }
    return null;
}

async function injectToMainWorld(tabId, codeStr) {
    if (!tabId || !codeStr) return;
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
