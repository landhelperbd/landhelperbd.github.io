// Land Helper BD Pro - Main World Controller (mutation.land.gov.bd)
// 100% Reliable Client-Side Rendering with Strict Server-Side Hit Metering

(function() {
    'use strict';
    if (window._lh_main_loaded) return;
    window._lh_main_loaded = true;

    // 0. License State & Hit Metering Bridge
    var _lh_k = '';
    var _lh_act = false;
    var _lh_fp = '';
    var _lh_badge_text = '';
    var _lh_is_busy = false;

    function readLocalLicense() {
        try {
            _lh_k = sessionStorage.getItem('__lh_k') || _lh_k || '';
            _lh_act = (sessionStorage.getItem('__lh_act') === '1') || _lh_act;
            _lh_fp = sessionStorage.getItem('__lh_fp') || _lh_fp || '';
        } catch(e) {}
    }
    readLocalLicense();

    window.addEventListener('message', function(e) {
        if (e.source !== window || !e.data) return;
        if (e.data.type === 'LH_SYNC_LICENSE_RES') {
            _lh_k = e.data.key || _lh_k;
            _lh_act = Boolean(e.data.isActive);
            _lh_fp = e.data.fp || _lh_fp;
            readLocalLicense();
            updateHitBadgeUI();
        }
    });

    // Request license from bridge
    window.postMessage({ type: 'LH_SYNC_LICENSE_REQ' }, '*');

    function updateHitBadgeUI() {
        var badge = document.getElementById('_lh_hit_badge');
        if (badge) {
            if (_lh_badge_text) {
                badge.innerText = _lh_badge_text;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Strict Hit Metering: Validates with server and deducts exactly 1 hit before execution
    function consumeHitAndRun(actionType, actionLabel, runnerFunc) {
        readLocalLicense();

        if (!_lh_k || !_lh_act) {
            alert("⚠️ সতর্কতা:\nআপনার লাইসেন্স কি পাওয়া যায়নি বা সক্রিয় নয়!\nঅনুগ্রহ করে এক্সটেনশন আইকনে ক্লিক করে আপনার লাইসেন্স কি প্রবেশ করান ও সক্রিয় করুন।");
            return;
        }

        if (_lh_is_busy) {
            showToast("⏳ পূর্ববর্তী অ্যাকশন সম্পন্ন হচ্ছে, অপেক্ষা করুন...", "#f59e0b");
            return;
        }
        _lh_is_busy = true;

        var reqId = 'req_' + Math.random().toString(36).substring(2, 9);
        var toastTimer = setTimeout(function() {
            showToast("⏳ সার্ভারে অ্যাকশন ভেরিফাই হচ্ছে...", "#0284c7");
        }, 300);

        var hasFinished = false;

        function finish(success, message, remaining) {
            if (hasFinished) return;
            hasFinished = true;
            clearTimeout(toastTimer);
            _lh_is_busy = false;
            window.removeEventListener('message', onRes);

            if (success) {
                if (remaining !== undefined) {
                    var rStr = (remaining === 'unlimited') ? 'আনলিমিটেড' : (remaining + 'টি');
                    _lh_badge_text = '⚡ হিট: ' + rStr;
                    updateHitBadgeUI();
                }
                runnerFunc(remaining);
            } else {
                alert(message || "⚠️ ব্যবহারের সীমা শেষ হয়েছে! অটোমেশন চালু রাখতে অনুগ্রহ করে সাবস্ক্রিপশন নবায়ন করুন।");
            }
        }

        function onRes(e) {
            if (e.source !== window || !e.data || e.data.type !== 'LH_CONSUME_HIT_RES' || e.data.reqId !== reqId) return;
            finish(e.data.success, e.data.message, e.data.remaining);
        }

        window.addEventListener('message', onRes);

        // 1. Primary path: Bridge to background service worker
        window.postMessage({
            type: 'LH_CONSUME_HIT_REQ',
            reqId: reqId,
            actionType: actionType,
            actionLabel: actionLabel,
            key: _lh_k
        }, '*');

        // 2. Fallback path: If bridge does not respond within 3.5s, direct fetch (CORS is enabled on server)
        setTimeout(async function() {
            if (hasFinished) return;
            try {
                var res = await fetch("https://landseba.com/api/v1/consume-hit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({ k: _lh_k, fp: _lh_fp || "DIRECT_WEB", action: actionType, actionLabel: actionLabel })
                });
                var data = await res.json();
                finish(Boolean(data && data.success), data.message, data.remaining);
            } catch(err) {
                finish(false, "সার্ভারের সাথে সংযোগ পাওয়া যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।");
            }
        }, 3500);
    }

    // 1. Vue 3 Modal & Component Finder
    function findModalComponent() {
        try {
            const root = document.getElementById("app")?._vnode?.component;
            if (root) {
                const queue = [root];
                const seen = new Set();
                while (queue.length > 0) {
                    const comp = queue.shift();
                    if (!comp || seen.has(comp)) continue;
                    seen.add(comp);
                    if (comp.proxy && comp.proxy.recipientInformation) {
                        return comp.proxy;
                    }
                    if (comp.subTree) walkVNode(comp.subTree, queue);
                }
            }
        } catch(e) {}

        try {
            const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT);
            let node;
            while ((node = walker.nextNode())) {
                const comp = node.__vueParentComponent;
                if (comp) {
                    const ctx = comp.proxy || comp.ctx || comp.setupState || comp.data;
                    if (ctx && ctx.recipientInformation) {
                        return ctx;
                    }
                }
            }
        } catch(e) {}

        return null;
    }

    function walkVNode(vnode, queue) {
        if (!vnode) return;
        if (vnode.component) queue.push(vnode.component);
        if (Array.isArray(vnode.children)) {
            for (let i = 0; i < vnode.children.length; i++) {
                const c = vnode.children[i];
                if (c && typeof c === 'object') walkVNode(c, queue);
            }
        }
        if (Array.isArray(vnode.dynamicChildren)) {
            for (let i = 0; i < vnode.dynamicChildren.length; i++) {
                const c = vnode.dynamicChildren[i];
                if (c && typeof c === 'object') walkVNode(c, queue);
            }
        }
    }

    // 2. Continuous Input Unlocker (unlocks disabled & readonly inputs)
    function unlockAllInputs() {
        document.querySelectorAll('input, select, textarea').forEach(function(i) {
            if (i.disabled) { i.disabled = false; i.removeAttribute('disabled'); }
            if (i.readOnly) { i.readOnly = false; i.removeAttribute('readonly'); }
            i.style.pointerEvents = 'auto';
        });
        document.querySelectorAll('button, a').forEach(function(b) {
            var t = (b.innerText || b.value || '').trim();
            if (t.indexOf('রিসেট') !== -1 || t.indexOf('Reset') !== -1) {
                b.disabled = false;
                b.removeAttribute('disabled');
                b.style.setProperty('display', 'inline-flex', 'important');
                b.style.setProperty('visibility', 'visible', 'important');
            }
        });
    }
    unlockAllInputs();
    if (!window._lhUnlockWatcher) {
        window._lhUnlockWatcher = setInterval(unlockAllInputs, 800);
    }

    // 3. Action 1: 🔄 রিসেট বাটন (Reset Profile / NID Lock - Metered)
    window._slRst = window._lhDoReset = function() {
        consumeHitAndRun('reset', 'প্রোফাইল রিসেট', function(remainingHits) {
            var modal = findModalComponent();
            if (modal && modal.recipientInformation) {
                try {
                    var r = modal.recipientInformation;
                    r.nid = '';
                    r.dob = '';
                    r.name = '';
                    r.father_name = '';
                    r.mother_name = '';
                    r.mobile = '';
                    r.gender = '';
                    r.photo = null;
                    r.photoUrl = '';
                    modal.isVerified = false;
                    modal.isNidVerified = false;
                } catch(e) {}
            }

            // Clear locked inputs in DOM
            document.querySelectorAll('input').forEach(function(i) {
                var n = (i.name || i.id || i.placeholder || '').toLowerCase();
                if (n.indexOf('nid') !== -1 || n.indexOf('এনআইডি') !== -1 || n.indexOf('মাতার') !== -1 || n.indexOf('dob') !== -1 || n.indexOf('জন্ম') !== -1) {
                    i.value = '';
                    i.disabled = false;
                    i.readOnly = false;
                }
            });

            // Trigger native reset button on the form if exists
            var nb = Array.from(document.querySelectorAll('button, a')).find(function(b) {
                var t = (b.innerText || b.value || '').trim();
                return (t.indexOf('রিসেট') !== -1 || t.indexOf('Reset') !== -1) && !b.id.startsWith('_sl') && !b.id.startsWith('_lh');
            });
            if (nb) {
                try { nb.click(); } catch(e) {}
            }

            var nidInput = document.querySelector('input[placeholder*="জাতীয় পরিচয়পত্র"], input[placeholder*="NID"], input[name*="nid"]');
            if (nidInput) { nidInput.focus(); }

            var remMsg = (remainingHits !== undefined && remainingHits !== 'unlimited') ? " (অবশিষ্ট হিট: " + remainingHits + "টি)" : "";
            showToast("🔄 প্রোফাইল ও এনআইডি তথ্য রিসেট সম্পন্ন!" + remMsg, "#ea580c");
            alert("✅ তথ্য রিসেট করা হয়েছে, এখন নতুন তথ্য দিন।" + remMsg);
        });
    };

    // 4. Action 2: 🔞 ১৮+ মোড (Age / DOB Lock Bypass - Metered)
    window._sl18 = window._lhDo18 = function() {
        consumeHitAndRun('dob_18', '১৮+ মোড', function(remainingHits) {
            var modal = findModalComponent();
            if (modal && modal.recipientInformation) {
                modal.recipientInformation.group = 'non-resident';
                modal.calculateAge = function() { return 10; };
                window.setDob = function(year, month, day) {
                    modal.recipientInformation.dob = new Date(year, month - 1, day);
                    showToast("✅ জন্মতারিখ সেট হয়েছে: " + year + "-" + month + "-" + day, "#059669");
                    alert("✅ জন্মতারিখ: " + year + "-" + month + "-" + day);
                };

                // DOM Fallback: Remove max date constraint
                var today = new Date().toISOString().split('T')[0];
                document.querySelectorAll('input[type="date"], input[name*="dob"], input[id*="dob"]').forEach(function(input) {
                    input.setAttribute('max', today);
                    input.removeAttribute('disabled');
                    input.removeAttribute('readonly');
                });

                var remMsg = (remainingHits !== undefined && remainingHits !== 'unlimited') ? " (অবশিষ্ট হিট: " + remainingHits + "টি)" : "";
                showToast("👶 ১৮+ মোড সক্রিয়! ক্যালেন্ডার আনলক হয়েছে।" + remMsg, "#059669");
                alert("👶 ১৮+ মোড সক্রিয় হয়েছে! ক্যালেন্ডার আনলক করা হয়েছে।" + remMsg + "\n\n👉 আপনি চাইলে এখন ক্যালেন্ডারে যেকোনো সাল সিলেক্ট করতে পারেন।\n👉 অথবা কনসোলে লিখতে পারেন: setDob(১৯৯১, ১০, ২৫)");
            } else {
                alert("ℹ️ সতর্কতা:\nঅনুগ্রহ করে প্রথমে 'আবেদনকারী / গ্রহীতা' ফরমটি স্ক্রিনে ওপেন করুন, তারপর ১৮+ বাটনে চাপ দিন।");
            }
        });
    };

    // 5. Toast Notification
    function showToast(msg, bg) {
        var old = document.getElementById('_lh_toast');
        if (old) old.remove();
        var t = document.createElement('div');
        t.id = '_lh_toast';
        t.innerHTML = "<b>Land Helper:</b> " + msg;
        t.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;background:" + (bg || "#059669") + ";color:#fff;padding:12px 20px;border-radius:12px;font-family:sans-serif;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-size:14px;pointer-events:none;";
        (document.documentElement || document.body).appendChild(t);
        setTimeout(function() { if (t) t.remove(); }, 4000);
    }

    // 6. Floating Action Toolbar Injection
    function injectToolbar() {
        if (document.getElementById('_lh_bar')) return;

        var bar = document.createElement('div');
        bar.id = '_lh_bar';
        bar.style.cssText = 'position:fixed;bottom:25px;right:25px;z-index:2147483647;display:flex;align-items:center;gap:10px;background:#090d16;padding:8px 14px;border-radius:35px;box-shadow:0 10px 30px rgba(0,0,0,0.45);border:1.5px solid rgba(255,255,255,0.18);font-family:sans-serif;';
        bar.innerHTML = '<span style="font-size:13px;font-weight:700;color:#10b981;padding-left:4px;">🛡️ Land Helper:</span>' +
            '<span id="_lh_hit_badge" style="display:none;font-size:11px;font-weight:700;color:#fde047;background:rgba(234,179,8,0.2);padding:3px 8px;border-radius:12px;border:1px solid rgba(234,179,8,0.4);"></span>' +
            '<button type="button" onclick="window._slRst()" style="background:#ea580c;color:#fff;border:none;padding:9px 16px;font-size:13px;font-weight:700;border-radius:25px;cursor:pointer;box-shadow:0 4px 12px rgba(234,88,12,0.35);display:flex;align-items:center;gap:5px;">🔄 রিসেট বাটন</button>' +
            '<button type="button" onclick="window._sl18()" style="background:#059669;color:#fff;border:none;padding:9px 16px;font-size:13px;font-weight:700;border-radius:25px;cursor:pointer;box-shadow:0 4px 12px rgba(5,150,105,0.35);display:flex;align-items:center;gap:5px;">🔞 ১৮+ মোড</button>' +
            '<button type="button" onclick="var b=document.getElementById(\'_lh_bar\');if(b)b.remove();" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 5px;" title="বন্ধ করুন">✕</button>';

        (document.documentElement || document.body).appendChild(bar);
        updateHitBadgeUI();
    }

    // Initial injection
    injectToolbar();

    // Route / SPA Watcher: Guarantee bar stays on screen across Vue route & modal changes
    setInterval(function() {
        if (!document.getElementById('_lh_bar')) {
            injectToolbar();
        }
    }, 1000);

    // MutationObserver to instantly restore if removed by DOM changes
    var observer = new MutationObserver(function() {
        if (!document.getElementById('_lh_bar')) {
            injectToolbar();
        }
    });
    observer.observe(document.documentElement, { childList: true });

    // Remote Dynamic Config & Portal Notice Auto-Sync (100% Free via GitHub Pages)
    async function syncRemotePortalConfig() {
        try {
            const res = await fetch("https://landhelperbd.github.io/config.json?_t=" + Date.now(), { cache: "no-store" });
            if (!res.ok) return;
            const cfg = await res.json();

            // 1. If portal notice/alert is enabled in config.json, display clean toast
            if (cfg.portal_notice && cfg.portal_notice.enabled && cfg.portal_notice.text) {
                showToast(cfg.portal_notice.text, cfg.portal_notice.bgColor || "#0f172a");
            }

            // 2. Dynamic button labels if customized
            if (cfg.buttons) {
                var resetBtn = document.querySelector('#_lh_bar button:nth-child(3)');
                if (resetBtn && cfg.buttons.reset_label) {
                    resetBtn.innerHTML = cfg.buttons.reset_label;
                }
                var ageBtn = document.querySelector('#_lh_bar button:nth-child(4)');
                if (ageBtn && cfg.buttons.age_label) {
                    ageBtn.innerHTML = cfg.buttons.age_label;
                }
            }
        } catch(e) {}
    }

    setTimeout(syncRemotePortalConfig, 1200);

})();
