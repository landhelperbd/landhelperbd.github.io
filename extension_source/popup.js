// Land Helper BD Pro - Secure Controller (v1.2.0)
// Dynamic Gateway Resolver - Obfuscated at rest (Zero plain-text domain in source)
function _gw(enc) {
    const raw = atob(enc);
    let out = '';
    for (let i = 0; i < raw.length; i++) {
        out += String.fromCharCode(raw.charCodeAt(i) ^ (0x5A + (i % 7)));
    }
    return out;
}
const BASE_API = _gw("Mi8oLS1lT3U3PTM6LAU4OnI+MTJPOys1cihu");
const VERIFY_URL = BASE_API + "/verify-and-exec";
const REGISTER_URL = BASE_API + "/auto-register";
const PORTAL_URL = "https://mutation.land.gov.bd";

document.addEventListener('DOMContentLoaded', async () => {
    // Navigation & Cards
    const navTabs = document.getElementById('navTabs');
    const tabRegister = document.getElementById('tabRegister');
    const tabLogin = document.getElementById('tabLogin');
    const registerCard = document.getElementById('registerCard');
    const loginCard = document.getElementById('loginCard');
    const pendingCard = document.getElementById('pendingCard');
    const activeCard = document.getElementById('activeCard');

    // Registration Inputs
    const custName = document.getElementById('custName');
    const custPhone = document.getElementById('custPhone');
    const trxId = document.getElementById('trxId');
    const submitRegBtn = document.getElementById('submitRegBtn');

    // Login Inputs
    const inputKey = document.getElementById('inputKey');
    const verifyBtn = document.getElementById('verifyBtn');

    // Display & Action Elements
    const pendingKeyDisplay = document.getElementById('pendingKeyDisplay');
    const activeKeyDisplay = document.getElementById('activeKeyDisplay');
    const copyPendingKeyBtn = document.getElementById('copyPendingKeyBtn');
    const copyActiveKeyBtn = document.getElementById('copyActiveKeyBtn');
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    const openPortalBtn = document.getElementById('openPortalBtn');
    const changeKeyLink = document.getElementById('changeKeyLink');
    const backToRegLink = document.getElementById('backToRegLink');
    const statusMsg = document.getElementById('statusMessage');

    // Plan Selection Management
    let selectedPlan = '6m';
    const planOptions = [
        { el: document.getElementById('planOptDemo'), val: 'demo' },
        { el: document.getElementById('planOpt1m'), val: '1m' },
        { el: document.getElementById('planOpt6m'), val: '6m' },
        { el: document.getElementById('planOpt1y'), val: '1y' }
    ];

    planOptions.forEach(opt => {
        if (!opt.el) return;
        opt.el.addEventListener('click', () => {
            planOptions.forEach(o => o.el.classList.remove('selected'));
            opt.el.classList.add('selected');
            const radio = opt.el.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            selectedPlan = opt.val;

            if (selectedPlan === 'demo') {
                trxId.placeholder = "ডেমো ট্রায়ালের জন্য পেমেন্ট প্রয়োজন নেই (ফ্রি)";
                trxId.disabled = true;
                trxId.value = "";
            } else {
                trxId.placeholder = "বিকাশ / নগদ পেমেন্টের রেফারেন্স বা TrxID";
                trxId.disabled = false;
            }
        });
    });

    // Tab Switching
    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerCard.style.display = 'block';
        loginCard.style.display = 'none';
        pendingCard.style.display = 'none';
        hideStatus();
    });

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginCard.style.display = 'block';
        registerCard.style.display = 'none';
        pendingCard.style.display = 'none';
        hideStatus();
    });

    // 1. Permanent Hardware PC ID (Survives extension reinstall / uninstall)
    async function getHardwarePcId() {
        try {
            let parts = [];
            // Screen & Display
            parts.push(`res:${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio}`);
            parts.push(`cores:${navigator.hardwareConcurrency || 4}`);
            parts.push(`mem:${navigator.deviceMemory || 4}`);
            parts.push(`plat:${navigator.platform || 'Win'}`);
            parts.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}:${new Date().getTimezoneOffset()}`);
            
            // WebGL GPU Renderer & Vendor
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const ext = gl.getExtension('WEBGL_debug_renderer_info');
                    if (ext) {
                        parts.push(`gpu:${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}`);
                        parts.push(`vend:${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)}`);
                    }
                }
            } catch(e) {}
            
            // Canvas 2D Font Geometry
            try {
                const c2 = document.createElement('canvas');
                c2.width = 240;
                c2.height = 60;
                const ctx = c2.getContext('2d');
                if (ctx) {
                    ctx.textBaseline = 'top';
                    ctx.font = "14px 'Arial', sans-serif";
                    ctx.fillStyle = '#f60';
                    ctx.fillRect(125, 1, 62, 20);
                    ctx.fillStyle = '#069';
                    ctx.fillText("LandHelper_Secure_HWID_2026", 2, 15);
                    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
                    ctx.fillText("LandHelper_Secure_HWID_2026", 4, 17);
                    parts.push(`canv:${c2.toDataURL().slice(-40)}`);
                }
            } catch(e) {}
            
            const raw = parts.join('|');
            const enc = new TextEncoder().encode(raw);
            const digest = await crypto.subtle.digest('SHA-256', enc);
            const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
            return "PC-" + hex.substring(0, 16).toUpperCase();
        } catch(e) {
            return "PC-FALLBACK-" + Math.abs(navigator.userAgent.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(16);
        }
    }

    async function getPersistentFingerprint() {
        return getHardwarePcId();
    }

    // 2. Clipboard Copy Helper with Visual Toast
    async function copyToClipboard(text, btnElement) {
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = btnElement.innerHTML;
            btnElement.innerHTML = "<span>✓ লাইসেন্স কি কপি হয়েছে!</span>";
            btnElement.style.borderColor = "#10b981";
            btnElement.style.color = "#34d399";
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.style.borderColor = "";
                btnElement.style.color = "";
            }, 2000);
        } catch(e) {
            showStatus("কপি করতে ব্যর্থ হয়েছে। সংখ্যাগুলো ম্যানুয়ালি লিখে রাখুন।", "error");
        }
    }

    copyPendingKeyBtn.addEventListener('click', () => {
        copyToClipboard(pendingKeyDisplay.innerText.trim(), copyPendingKeyBtn);
    });

    copyActiveKeyBtn.addEventListener('click', () => {
        copyToClipboard(activeKeyDisplay.innerText.trim(), copyActiveKeyBtn);
    });

    // 3. UI Display Mode Helpers
    function showActiveScreen(key) {
        activeKeyDisplay.innerText = key;
        navTabs.style.display = 'none';
        registerCard.style.display = 'none';
        loginCard.style.display = 'none';
        pendingCard.style.display = 'none';
        activeCard.style.display = 'block';
    }

    function showPendingScreen(key) {
        pendingKeyDisplay.innerText = key;
        navTabs.style.display = 'none';
        registerCard.style.display = 'none';
        loginCard.style.display = 'none';
        activeCard.style.display = 'none';
        pendingCard.style.display = 'block';
    }

    function showRegistrationScreen() {
        navTabs.style.display = 'flex';
        tabRegister.click();
        activeCard.style.display = 'none';
        pendingCard.style.display = 'none';
        hideStatus();
    }

    changeKeyLink.addEventListener('click', showRegistrationScreen);
    backToRegLink.addEventListener('click', showRegistrationScreen);

    openPortalBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: PORTAL_URL });
    });

    // 4. Initial Check on Popup Open
    try {
        const stored = await chrome.storage.local.get(['lh_license_key', 'lh_is_active', 'lh_is_pending']);
        if (stored && stored.lh_license_key) {
            if (stored.lh_is_active) {
                showActiveScreen(stored.lh_license_key);
            } else if (stored.lh_is_pending) {
                showPendingScreen(stored.lh_license_key);
                // Background check if it has been approved
                checkKeyVerification(stored.lh_license_key, true);
            } else {
                inputKey.value = stored.lh_license_key;
            }
        }
    } catch(e) {
        console.warn("Storage check warning:", e);
    }

    // 5. Submit Registration Handler
    submitRegBtn.addEventListener('click', async () => {
        const name = custName.value.trim();
        const phone = custPhone.value.trim();
        const trx = trxId.value.trim();

        if (!name) {
            showStatus("অনুগ্রহ করে প্রতিষ্ঠানের নাম / ব্যবসার নাম প্রদান করুন।", "error");
            custName.focus();
            return;
        }
        if (!phone || phone.length < 11) {
            showStatus("অনুগ্রহ করে সঠিক সচল মোবাইল নম্বর (যেমন: 017xxxxxxxx) দিন।", "error");
            custPhone.focus();
            return;
        }

        submitRegBtn.disabled = true;
        submitRegBtn.innerHTML = "<span>⏳ অনুরোধ জমা হচ্ছে...</span>";
        hideStatus();

        try {
            const fp = await getPersistentFingerprint();
            const res = await fetch(REGISTER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    customer_name: name,
                    customer_phone: phone,
                    plan: selectedPlan,
                    trx_id: trx,
                    fp: fp,
                    dinfo: "LandHelperBD_Extension_v1.2.0"
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "সার্ভার থেকে লাইসেন্স অনুরোধ গ্রহণ করা যায়নি।");
            }

            const generatedKey = data.license_key;

            // Persist pending status (both demo and regular require admin approval)
            await chrome.storage.local.set({
                'lh_license_key': generatedKey,
                'lh_is_active': false,
                'lh_is_pending': true,
                'lh_customer_name': name
            });

            showPendingScreen(generatedKey);
            if (selectedPlan === 'demo') {
                showStatus("🎉 ডেমো টেস্ট আবেদন সফলভাবে জমা হয়েছে! অ্যাডমিন পর্যালোচনায় রয়েছে।", "pending");
            } else {
                showStatus("🎉 লাইসেন্স অনুরোধ সফলভাবে গ্রহণ করা হয়েছে! অনুমোদনের অপেক্ষা করুন।", "pending");
            }

        } catch(err) {
            showStatus(err.message || "অনুরোধ পাঠাতে ত্রুটি হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।", "error");
        } finally {
            submitRegBtn.disabled = false;
            submitRegBtn.innerHTML = "<span>🚀 অনুরোধ জমা দিন ও লাইসেন্স পান</span>";
        }
    });

    // 6. Verify Key Function
    async function checkKeyVerification(keyToVerify, silentMode = false) {
        if (!keyToVerify) return;
        if (!silentMode) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = "<span>⏳ যাচাই করা হচ্ছে...</span>";
            refreshStatusBtn.disabled = true;
            refreshStatusBtn.innerHTML = "<span>⏳ রিফ্রেশ হচ্ছে...</span>";
            hideStatus();
        }

        try {
            const fp = await getPersistentFingerprint();
            const res = await fetch(VERIFY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    k: keyToVerify,
                    fp: fp,
                    dinfo: "LandHelperBD_Extension_v1.2.0"
                })
            });

            const data = await res.json();

            if (data.success && data.code) {
                // Approved & Active!
                await chrome.storage.local.set({
                    'lh_license_key': keyToVerify,
                    'lh_device_fp': fp,
                    'lh_is_active': true,
                    'lh_is_pending': false,
                    'lh_payload_code': data.code
                });

                showActiveScreen(keyToVerify);
                showStatus("✅ আপনার লাইসেন্সটি সক্রিয় রয়েছে!", "success");

                // Injected into mutation tab if currently open
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    const currentTab = tabs && tabs[0];
                    if (currentTab && currentTab.id && currentTab.url && currentTab.url.includes("mutation.land.gov.bd")) {
                        await chrome.scripting.executeScript({
                            target: { tabId: currentTab.id },
                            world: "MAIN",
                            func: function(codeToRun) {
                                try {
                                    if (!window._lh_pro_initialized) {
                                        eval(codeToRun);
                                        window._lh_pro_initialized = true;
                                    }
                                } catch(e) {}
                            },
                            args: [data.code]
                        });
                    }
                } catch(e) {}

            } else {
                let msg = data.message || "লাইসেন্স যাচাই করা যায়নি।";
                if (msg.includes("alert('") || msg.includes('alert("')) {
                    msg = msg.replace(/alert\(['"]/, '').replace(/['"]\);?$/, '');
                }

                if (msg.includes("অনুমোদনের অপেক্ষায়") || (data.status && data.status === 'pending')) {
                    await chrome.storage.local.set({
                        'lh_license_key': keyToVerify,
                        'lh_is_active': false,
                        'lh_is_pending': true
                    });
                    showPendingScreen(keyToVerify);
                    if (!silentMode) showStatus("⏳ লাইসেন্সটি এখনো অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে।", "pending");
                } else {
                    if (!silentMode) showStatus(msg, "error");
                }
            }

        } catch(err) {
            if (!silentMode) {
                showStatus("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। ইন্টারনেট পরীক্ষা করুন।", "error");
            }
        } finally {
            if (!silentMode) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = "<span>🔓 যাচাই ও সক্রিয় করুন</span>";
                refreshStatusBtn.disabled = false;
                refreshStatusBtn.innerHTML = "<span>🔄 স্ট্যাটাস রিফ্রেশ করুন</span>";
            }
        }
    }

    // 7. Verify Button Listener (Login Tab)
    verifyBtn.addEventListener('click', () => {
        const key = inputKey.value.trim();
        if (!key) {
            showStatus("অনুগ্রহ করে আপনার ৬-ডিজিটের লাইসেন্স কি প্রবেশ করান।", "error");
            inputKey.focus();
            return;
        }
        checkKeyVerification(key, false);
    });

    // 8. Refresh Button Listener (Pending Tab)
    refreshStatusBtn.addEventListener('click', () => {
        const key = pendingKeyDisplay.innerText.trim();
        if (key && key !== '------') {
            checkKeyVerification(key, false);
        }
    });

    function showStatus(text, type) {
        statusMsg.className = '';
        statusMsg.style.display = 'block';
        if (type === 'success') statusMsg.className = 'status-success';
        else if (type === 'pending') statusMsg.className = 'status-pending';
        else statusMsg.className = 'status-error';
        statusMsg.innerHTML = text;
    }

    function hideStatus() {
        statusMsg.style.display = 'none';
        statusMsg.innerHTML = '';
    }
});