// Land Helper BD Pro - Main World Controller (mutation.land.gov.bd)
// 100% Pure Client-Side Execution (Bypasses Portal CSP & Service Worker latency)

(function() {
    'use strict';
    if (window._lh_main_loaded) return;
    window._lh_main_loaded = true;

    // 1. Vue 3 Modal & Component Finder
    function findModalComponent() {
        // Strategy A: Root vnode traversal (Standard Vue 3)
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

        // Strategy B: TreeWalker fallback (DOM instance inspection)
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

    // 3. Action 1: 🔄 রিসেট বাটন (Reset Profile / NID Lock)
    window._slRst = window._lhDoReset = function() {
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

        showToast("🔄 প্রোফাইল ও এনআইডি তথ্য রিসেট সম্পন্ন হয়েছে!", "#ea580c");
        alert("✅ তথ্য রিসেট করা হয়েছে, এখন নতুন তথ্য দিন।");
    };

    // 4. Action 2: 🔞 ১৮+ মোড (Age / DOB Lock Bypass)
    window._sl18 = window._lhDo18 = function() {
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

            showToast("👶 ১৮+ মোড সক্রিয়! ক্যালেন্ডার আনলক হয়েছে।", "#059669");
            alert("👶 ১৮+ মোড সক্রিয় হয়েছে! ক্যালেন্ডার আনলক করা হয়েছে।\n\n👉 আপনি চাইলে এখন ক্যালেন্ডারে যেকোনো সাল সিলেক্ট করতে পারেন।\n👉 অথবা কনসোলে লিখতে পারেন: setDob(১৯৯১, ১০, ২৫)");
        } else {
            alert("ℹ️ সতর্কতা:\nঅনুগ্রহ করে প্রথমে 'আবেদনকারী / গ্রহীতা' ফরমটি স্ক্রিনে ওপেন করুন, তারপর ১৮+ বাটনে চাপ দিন।");
        }
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
            '<button type="button" onclick="window._slRst()" style="background:#ea580c;color:#fff;border:none;padding:9px 16px;font-size:13px;font-weight:700;border-radius:25px;cursor:pointer;box-shadow:0 4px 12px rgba(234,88,12,0.35);display:flex;align-items:center;gap:5px;">🔄 রিসেট বাটন</button>' +
            '<button type="button" onclick="window._sl18()" style="background:#059669;color:#fff;border:none;padding:9px 16px;font-size:13px;font-weight:700;border-radius:25px;cursor:pointer;box-shadow:0 4px 12px rgba(5,150,105,0.35);display:flex;align-items:center;gap:5px;">🔞 ১৮+ মোড</button>' +
            '<button type="button" onclick="var b=document.getElementById(\'_lh_bar\');if(b)b.remove();" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 5px;" title="বন্ধ করুন">✕</button>';

        (document.documentElement || document.body).appendChild(bar);
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

})();
