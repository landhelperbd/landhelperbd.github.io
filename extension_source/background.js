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

// Clean stale code cache on extension startup or update to guarantee instant sync
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.remove(['lh_payload_code']);
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // A. Metered Button Click Action (Background hit recorder)
    if (request.action === "CONSUME_ACTION_HIT") {
        handleConsumeHit(request.actionType, request.actionLabel, request.licenseKey)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, message: err.message || "হিট যাচাই ব্যর্থ হয়েছে" }));
        return true;
    }

    // B. Page Load Toolbar Sync
    if (request.action === "SYNC_AND_EXECUTE") {
        sendResponse({ success: true });
        return true;
    }
});

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
