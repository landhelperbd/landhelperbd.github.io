// Land Helper BD Pro - Main World Controller (mutation.land.gov.bd)
// 100% Isolated, Modular Button Execution with Zero Latency & Clean Disarm
// Built: 2026-11-25

(function() {
    'use strict';
    if (window._lh_main_controller_loaded) return;
    window._lh_main_controller_loaded = true;

    // =========================================================================
    // SECTION 0: State & Non-Blocking Hit Logger
    // =========================================================================
    var _lh_k = '';
    var _lh_act = true;

    function readLocalLicense() {
        try {
            _lh_k = sessionStorage.getItem('__lh_k') || _lh_k || '';
            var act = sessionStorage.getItem('__lh_act');
            if (act !== null) _lh_act = (act === '1');
        } catch(e) {}
    }
    readLocalLicense();

    window.addEventListener('message', function(e) {
        if (e.source !== window || !e.data) return;
        if (e.data.type === 'LH_SYNC_LICENSE_RES') {
            _lh_k = e.data.key || _lh_k;
            _lh_act = Boolean(e.data.isActive);
            readLocalLicense();
            injectToolbar();
        }
        if (e.data.type === 'LH_CONSUME_HIT_RES' || e.data.type === 'LH_CONSUME_ACTION_RES') {
            if (e.data.remaining !== undefined) {
                var rStr = (e.data.remaining === 'unlimited') ? 'আনলিমিটেড' : (e.data.remaining + 'টি');
                var badge = document.getElementById('_lh_hit_badge');
                if (badge) {
                    badge.innerText = '⚡ ' + rStr;
                    badge.style.display = 'inline-block';
                }
            }
        }
    });

    // Request license from bridge
    window.postMessage({ type: 'LH_SYNC_LICENSE_REQ' }, '*');

    // Fire-and-forget background hit recorder (NEVER blocks button click)
    function recordHitAsync(actionType, actionLabel) {
        try {
            readLocalLicense();
            if (_lh_k) {
                window.postMessage({
                    type: 'LH_CONSUME_HIT_REQ',
                    actionType: actionType,
                    actionLabel: actionLabel,
                    key: _lh_k
                }, '*');
            }
        } catch(e) {}
    }

    // =========================================================================
    // SECTION 1: Universal Disarm (Strict Isolation Guarantee)
    // Ensures NO listener or timer from one button interferes with another
    // =========================================================================
    function disarmAllInterceptors() {
        // 1. Remove document-level click interceptor (from Reset mode)
        if (window._lhSaveClickInterceptor) {
            try {
                document.removeEventListener('click', window._lhSaveClickInterceptor, true);
            } catch(e) {}
            window._lhSaveClickInterceptor = null;
        }

        // 2. Clear interval timer (from Reset mode)
        if (window._lhProtinidhiTimer) {
            try {
                clearInterval(window._lhProtinidhiTimer);
            } catch(e) {}
            window._lhProtinidhiTimer = null;
        }

        // 3. Clear interval timer (from Offline mode)
        if (window._lhOfflineWatcher) {
            try {
                clearInterval(window._lhOfflineWatcher);
            } catch(e) {}
            window._lhOfflineWatcher = null;
        }

        // 4. Remove button-level interceptors & flags from recipient_save_btn
        var saveBtn = document.getElementById('recipient_save_btn');
        if (saveBtn) {
            if (saveBtn._lhRepHandler) {
                try {
                    saveBtn.removeEventListener('click', saveBtn._lhRepHandler, true);
                } catch(e) {}
                delete saveBtn._lhRepHandler;
            }
            delete saveBtn._hasCustomIntercept;
        }
    }
    window._lhDisarmAll = disarmAllInterceptors;

    // Toast Notification Utility
    function showToast(msg, bg) {
        var old = document.getElementById('_lh_toast');
        if (old) old.remove();
        var t = document.createElement('div');
        t.id = '_lh_toast';
        t.innerHTML = "<b>Land Helper:</b> " + msg;
        t.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;background:" + (bg || "#059669") + ";color:#fff;padding:10px 18px;border-radius:10px;font-family:sans-serif;box-shadow:0 8px 20px rgba(0,0,0,0.3);font-size:13px;pointer-events:none;transition:opacity 0.3s ease;";
        (document.body || document.documentElement).appendChild(t);
        setTimeout(function() {
            if (t && t.parentNode) {
                t.style.opacity = '0';
                setTimeout(function() { if (t && t.parentNode) t.remove(); }, 300);
            }
        }, 3000);
    }

    // =========================================================================
    // SECTION 2: MODULE - 🔄 রিসেট বাটন (Reset & SSO Unlock)
    // 100% Isolated Execution of User's Exact Tested Reset Code
    // =========================================================================
    window._slRst = window._lhDoReset = function() {
        disarmAllInterceptors();
        recordHitAsync('reset', 'প্রোফাইল রিসেট');

        try {
            /* --- BEGIN USER EXACT RESET CODE --- */
(() => {
  // ==========================================================================
  // ই-নামজারি প্রতিনিধি আবেদন: ১-ক্লিক সম্পূর্ণ অটোমেশন (All-in-One Button Script)
  // - প্রতিনিধির লগইনকৃত তথ্য রিসেট ও ফিল্ড আনলক
  // - টেম্পারিং ও লক ওয়ার্নিং সম্পূর্ণ নিষ্ক্রিয়
  // - "সার্ভার থেকে এনআইডিটি যাচাই হয়নি" এরর সম্পূর্ণ বাইপাস
  // - পেজের নিজস্ব 'সংরক্ষণ' বাটনে ক্লিকেই সরাসরি টেবিলে সেভ ও মডাল ক্লোজ
  // - কোনো বাড়তি পপআপ আটকে থাকবে না (৩ সেকেন্ডে স্বয়ংক্রিয়ভাবে রিমুভ)
  // ==========================================================================
  try {
    // পূর্বের কোনো নোটিফিকেশন বা টাইমার থাকলে পরিষ্কার করা
    if (window._lhProtinidhiTimer) {
      clearInterval(window._lhProtinidhiTimer);
      window._lhProtinidhiTimer = null;
    }
    document.querySelectorAll('#_lh_protinidhi_badge, #_lh_reset_badge').forEach(el => el.remove());

    // ১. ওপেন থাকা মডাল কম্পোনেন্ট খুঁজে বের করা
    function findModalComponent() {
      const root = document.getElementById("app")?._vnode?.component;
      if (!root) return null;
      const queue = [root];
      const seen = new Set();
      while (queue.length > 0) {
        const comp = queue.shift();
        if (!comp || seen.has(comp)) continue;
        seen.add(comp);
        if (comp.proxy && comp.proxy.recipientInformation) {
          return comp.proxy;
        }
        if (comp.subTree) walk(comp.subTree);
      }
      function walk(vnode) {
        if (!vnode) return;
        if (vnode.component) queue.push(vnode.component);
        if (Array.isArray(vnode.children)) {
          for (let c of vnode.children) if (c && typeof c === 'object') walk(c);
        }
        if (Array.isArray(vnode.dynamicChildren)) {
          for (let c of vnode.dynamicChildren) if (c && typeof c === 'object') walk(c);
        }
      }
      return null;
    }

    const modal = findModalComponent();
    if (!modal) {
      alert("⚠️ অনুগ্রহ করে প্রথমে 'আবেদনকারী / গ্রহীতা' তথ্য ফরমের পপআপটি ওপেন রাখুন, এরপর বাটনে ক্লিক করুন।");
      return;
    }

    // বাংলা সংখ্যা থেকে ইংরেজি সংখ্যায় রূপান্তর ফাংশন
    function toEnglishDigits(str) {
      if (!str) return '';
      const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
      return String(str).replace(/[০-৯]/g, d => bn.indexOf(d));
    }

    // DOM ইনপুট থেকে ভ্যালু নেওয়ার হেল্পার
    function getVal(idOrSel) {
      const el = (idOrSel.startsWith('#') || idOrSel.startsWith('.') || idOrSel.startsWith('input'))
        ? document.querySelector(idOrSel)
        : document.getElementById(idOrSel);
      return el ? (el.value || '').trim() : '';
    }

    // ২. পোর্টালের অ্যান্টি-টেম্পারিং ও লক সম্পূর্ণ নিষ্ক্রিয় করা
    modal.ssoLockActive = false;
    modal.readonlyOnLoad = false;
    modal.originalLoggedInMobileNo = null;

    modal.checkLoggedInIdentityTampering = () => true;
    modal.checkMobileNoTampering = () => true;
    modal.isSsoLocked = () => false;
    modal.isValidateFields = () => true;

    // ৩. DOM আনলক করা (disabled/readonly তুলে দেওয়া)
    function unlockDOM() {
      document.querySelectorAll('input, select, textarea').forEach(el => {
        el.disabled = false;
        el.readOnly = false;
        el.removeAttribute('disabled');
        el.removeAttribute('readonly');
        el.style.pointerEvents = 'auto';
        el.style.opacity = '1';
        el.style.cursor = 'text';
      });

      document.querySelectorAll('.dp__cell_disabled, .dp--disabled, [aria-disabled="true"]').forEach(el => {
        el.classList.remove('dp__cell_disabled', 'dp--disabled');
        el.setAttribute('aria-disabled', 'false');
        el.removeAttribute('disabled');
        el.style.pointerEvents = 'auto';
        el.style.opacity = '1';
        el.style.cursor = 'pointer';
      });

      document.querySelectorAll('.swal2-container, .error_message_required, .is-invalid').forEach(el => {
        if (el.classList.contains('swal2-container')) {
          el.remove();
        } else {
          el.classList.remove('error_message_required', 'is-invalid');
          if (el.style.borderColor === 'red' || el.style.borderColor.includes('rgb(255')) {
            el.style.borderColor = '';
          }
        }
      });
    }

    unlockDOM();

    // ৪. DOM থেকে তথ্য নিয়ে Vue স্টেট সিঙ্ক করার ফাংশন
    function syncDOMToModal() {
      const r = modal.recipientInformation;
      if (!r) return;

      const nid = getVal('#nid') || getVal('.nid') || getVal('input[placeholder*="জাতীয় পরিচয়পত্র"]');
      const dob = getVal('#input_bangla_date_pick') || getVal('input[placeholder*="তারিখ"]');
      const name = getVal('#recipientInformation_name') || getVal('input[placeholder*="আবেদনকারীর নাম"]');
      const fatherName = getVal('#recipientInformation_fatherName') || getVal('input[placeholder*="পিতার নাম"]');
      const motherName = getVal('#recipientInformation_motherName') || getVal('input[placeholder*="মাতার নাম"]');
      const mobileNo = getVal('#recipientInformation_mobileNo') || getVal('input[placeholder*="মোবাইল নম্বর"]');
      const email = getVal('input[placeholder*="মেইল"]') || getVal('#email');
      const houseHolding = getVal('#recipientInformation_houseHolding') || getVal('input[placeholder*="বাসা/হোল্ডিং"]');
      const villageRoad = getVal('#recipientInformation_villageRoad') || getVal('input[placeholder*="গ্রাম/রাস্তা"]');
      const postOffice = getVal('#recipientInformation_postOffice') || getVal('input[placeholder*="ডাকঘর"]');
      const cityCorporation = getVal('#recipientInformation_cityCorporation') || getVal('input[placeholder*="সিটি-কর্পোরেশন"]');

      const genderEl = document.querySelector('#recipientInformation_gender, select[name*="gender"]');
      let gender = genderEl ? genderEl.value : '';
      if (gender === 'পুরুষ') gender = 'male';
      if (gender === 'মহিলা') gender = 'female';

      if (nid) r.nid = toEnglishDigits(nid);
      if (dob) r.dob = toEnglishDigits(dob);
      if (name) r.name = name;
      if (fatherName) r.fatherName = fatherName;
      if (motherName) r.motherName = motherName;
      if (mobileNo) r.mobileNo = toEnglishDigits(mobileNo);
      if (email) r.email = email;
      if (gender) r.gender = gender;
      if (houseHolding) r.houseHolding = houseHolding;
      if (villageRoad) r.villageRoad = villageRoad;
      if (postOffice) r.postOffice = postOffice;
      if (cityCorporation) r.cityCorporation = cityCorporation;
    }

    // ৫. সরাসরি সংরক্ষণ (Direct Save) ফাংশন: সার্ভার কল বাইপাস ও ক্লিনআপ
    function executeDirectSave() {
      syncDOMToModal();
      const r = modal.recipientInformation;
      if (!r) {
        alert("⚠️ ত্রুটি: আবেদনকারীর তথ্য পাওয়া যায়নি!");
        return false;
      }

      if (!r.name || !r.name.trim()) {
        alert("⚠️ অনুগ্রহ করে আবেদনকারীর নাম পূরণ করুন।");
        const nameInp = document.querySelector('#recipientInformation_name, input[placeholder*="আবেদনকারীর নাম"]');
        if (nameInp) nameInp.focus();
        return false;
      }

      if (!r.mobileNo || !r.mobileNo.trim()) {
        alert("⚠️ অনুগ্রহ করে আবেদনকারীর মোবাইল নম্বর পূরণ করুন।");
        const mobInp = document.querySelector('#recipientInformation_mobileNo, input[placeholder*="মোবাইল নম্বর"]');
        if (mobInp) mobInp.focus();
        return false;
      }

      // ঠিকানা ফরম্যাট
      if (modal.recipientType === 'grohita') {
        r.address = `বাসা/হোল্ডিং: ${r.houseHolding || '-'}, গ্রাম/রাস্তা: ${r.villageRoad || '-'}, ডাকঘর: ${r.postOffice || '-'}`;
        if (r.cityCorporation) {
          r.address += `, সিটি কর্পোরেশন/পৌরসভা: ${r.cityCorporation}`;
        }
      }

      // জন্মতারিখ ফরম্যাট
      if (typeof modal.setFormattedDOB === 'function') {
        try { modal.setFormattedDOB(); } catch(e) {}
      }

      // ছবি না থাকলে স্ট্যান্ডার্ড প্লেসহোল্ডার
      if (!r.photo) {
        r.photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      }

      // সার্ভার ভেরিফিকেশন ফ্ল্যাগ সত্য করা
      r.is_nid_verified = true;
      if (modal.nidDataVerification) {
        modal.nidDataVerification.isNameCorrect = true;
        modal.nidDataVerification.isFatherNameCorrect = true;
        modal.nidDataVerification.isMotherNameCorrect = true;
        modal.nidDataVerification.isGenderCorrect = true;
        modal.nidDataVerification.nidVerifyProcess = 1;
        modal.nidDataVerification.isNidVerificationErrorShow = false;
      }

      // মূল টেবিলে ডাটা পুশ ও মডাল ক্লোজ
      modal.emitSavedEvent();

      // বুটস্ট্র্যাপ মডাল ও ব্যাকড্রপ সম্পূর্ণ মুছে ফেলা
      try {
        const idx = modal.recipientIndex ?? 0;
        if (window.$) {
          $(`#single_grohita_${idx}`).modal('hide');
          $('.modal-backdrop').remove();
          $('body').removeClass('modal-open').css('overflow', '');
        }
      } catch(e) {}

      // কোনো নোটিফিকেশন বার বা টাইমার থাকলে তাৎক্ষণিক মুছে ফেলা
      document.querySelectorAll('#_lh_protinidhi_badge, #_lh_reset_badge').forEach(el => el.remove());
      if (window._lhProtinidhiTimer) {
        clearInterval(window._lhProtinidhiTimer);
        window._lhProtinidhiTimer = null;
      }

      // সফলতার সংক্ষিপ্ত টোস্ট
      if (window.Swal) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'আবেদনকারী সফলভাবে সংরক্ষিত হয়েছে!',
          showConfirmButton: false,
          timer: 2000,
          toast: true
        });
      }

      console.log("🎉 [Land Helper BD] আবেদনকারী সফলভাবে টেবিলে সংরক্ষিত হয়েছে:", r);
      return true;
    }

    // গ্লোবাল এক্সেস
    window.directSaveApplicant = executeDirectSave;

    // ৬. মডালের ইন্টারনাল ভেরিফাই ফাংশনগুলোকে ডিরেক্ট সেভ দিয়ে ওভাররাইড করা
    modal.verifyRecipientInformationWithNID = function() { return executeDirectSave(); };
    modal.verifyRecipientInformationWithBirthRegistration = function() { return executeDirectSave(); };

    // ৭. পেজের নিজস্ব 'সংরক্ষণ' বাটনে ক্লিক ইন্টারসেপ্টর
    if (window._lhSaveClickInterceptor) {
      document.removeEventListener('click', window._lhSaveClickInterceptor, true);
    }
    window._lhSaveClickInterceptor = function(e) {
      const btn = e.target.closest('#recipient_save_btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        executeDirectSave();
      }
    };
    document.addEventListener('click', window._lhSaveClickInterceptor, true);

    // ৮. যদি বর্তমানে লগইনকৃত প্রতিনিধির ডাটাই ফিল্ডে থাকে, তাহলে ক্লিয়ার করে নতুন লেখার সুযোগ দেওয়া
    const currentNid = getVal('#nid') || getVal('.nid') || getVal('input[placeholder*="জাতীয় পরিচয়পত্র"]');
    const ssoNid = modal.loggedInUserInfo?.nid;
    if (ssoNid && currentNid && (currentNid === ssoNid || currentNid === toEnglishDigits(ssoNid))) {
      const inputsToClear = [
        'input[placeholder*="জাতীয় পরিচয়পত্র"], #nid, input[name*="nid"]',
        'input[placeholder*="তারিখ"], #input_bangla_date_pick, input[id*="dob"]',
        'input[placeholder*="আবেদনকারীর নাম"], #name, #recipientInformation_name',
        'input[placeholder*="পিতার নাম"], #father_name, #recipientInformation_fatherName',
        'input[placeholder*="মাতার নাম"], #mother_name, #recipientInformation_motherName',
        'input[placeholder*="মোবাইল নম্বর"], #mobile, #recipientInformation_mobileNo'
      ];
      inputsToClear.forEach(sel => {
        const inp = document.querySelector(sel);
        if (inp) {
          inp.value = '';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      const nidInp = document.querySelector('input[placeholder*="জাতীয় পরিচয়পত্র"], #nid');
      if (nidInp) nidInp.focus();
    }

    // ৯. ব্যাকগ্রাউন্ড গার্ড: রি-রেন্ডার হলে লক প্রতিরোধ (সেভ হওয়া পর্যন্ত চলবে)
    window._lhProtinidhiTimer = setInterval(() => {
      modal.ssoLockActive = false;
      modal.originalLoggedInMobileNo = null;
      modal.checkLoggedInIdentityTampering = () => true;
      modal.checkMobileNoTampering = () => true;
      modal.isSsoLocked = () => false;
      modal.isValidateFields = () => true;
      unlockDOM();
    }, 500);

    // ১০. স্বয়ংক্রিয়ভাবে মিলিয়ে যাওয়া সংক্ষিপ্ত নোটিফিকেশন (৩ সেকেন্ড পর নিজে থেকেই অদৃশ্য হবে)
    const badge = document.createElement("div");
    badge.id = "_lh_protinidhi_badge";
    badge.innerHTML = "🔓 <b>Land Helper BD:</b> প্রতিনিধি মোড সক্রিয়! তথ্য লিখে পেজের <b>'সংরক্ষণ'</b> বাটনে ক্লিক করুন।";
    badge.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999999;background:#059669;color:#fff;padding:10px 18px;border-radius:10px;font-family:sans-serif;box-shadow:0 8px 20px rgba(0,0,0,0.3);font-size:13px;border:1px solid #34d399;pointer-events:none;transition:opacity 0.4s ease;";
    document.body.appendChild(badge);

    setTimeout(() => {
      const b = document.getElementById('_lh_protinidhi_badge');
      if (b) {
        b.style.opacity = '0';
        setTimeout(() => b.remove(), 400);
      }
    }, 3000);

    console.log("✅ [Land Helper BD] ১-ক্লিক প্রতিনিধি মোড সক্রিয়। পেজের 'সংরক্ষণ' বাটনে ক্লিক করলেই সেভ হবে।");
  } catch (err) {
    alert("❌ ত্রুটি: " + err.message);
  }
})();
            /* --- END USER EXACT RESET CODE --- */
        } catch(err) {
            alert("❌ রিসেট ত্রুটি: " + err.message);
        }
    };

    // =========================================================================
    // SECTION 3: MODULE - 🔞 ১৮+ মোড (Pure Calendar Unlocker)
    // Fully independent, does not touch save interceptors
    // =========================================================================
    window._sl18 = window._lhDo18 = function() {
        recordHitAsync('dob_18', '১৮+ মোড');
        try {
            document.querySelectorAll('input[type="date"], input[name*="dob"], input[id*="dob"], #input_bangla_date_pick').forEach(function(input) {
                input.disabled = false;
                input.readOnly = false;
                input.removeAttribute('disabled');
                input.removeAttribute('readonly');
            });
            document.querySelectorAll('.dp__cell_disabled, .dp--disabled, [aria-disabled="true"]').forEach(function(el) {
                el.classList.remove('dp__cell_disabled', 'dp--disabled');
                el.setAttribute('aria-disabled', 'false');
                el.removeAttribute('disabled');
                el.style.pointerEvents = 'auto';
                el.style.opacity = '1';
                el.style.cursor = 'pointer';
            });

            try {
                var inp = document.querySelector('#recipient-information input, .modal input, input[placeholder*="জাতীয় পরিচয়পত্র"], .nid, input[placeholder*="জন্ম নিবন্ধন নম্বর"], #brn');
                var p = inp ? inp.__vueParentComponent : null;
                while (p) {
                    if (p.proxy && p.proxy.recipientInformation) {
                        p.proxy.recipientInformation.group = "non-resident";
                        p.proxy.calculateAge = function() { return 10; };
                        try {
                            Object.defineProperty(p.proxy, 'minorDobMinDate', { get: function() { return null; }, configurable: true });
                        } catch(e) {}
                        break;
                    }
                    p = p.parent;
                }
            } catch(e) {}

            showToast("🔞 ১৮+ জন্মতারিখ ও বয়স সফলভাবে আনলক করা হয়েছে!", "#059669");
        } catch(e) {
            console.error("18+ error:", e);
        }
    };

    // =========================================================================
    // SECTION 4: MODULE - 👥 অফলাইন আবেদন (Offline Representative Mode)
    // 100% Isolated Execution of User's Exact Tested Offline Code
    // =========================================================================
    window._slRep = window._lhDoRep = function() {
        disarmAllInterceptors();
        recordHitAsync('rep_apply', 'অফলাইন আবেদন');

        try {
            /* --- BEGIN USER EXACT OFFLINE CODE --- */
(() => {
  // ==========================================================================
  // ই-নামজারি পারফেক্ট ওয়ান-শট স্ক্রিপ্ট (১০০% অল-ইন-ওয়ান ফিক্সড কোড)
  // ১. 'স্থানীয় প্রতিনিধি' নিশ্চিতকরণ (DOM লেবেল ও ডেটায় কখনোই অভিভাবক থাকবে না)
  // ২. ইউনিভার্সাল ঠিকানা ফিক্স (একক ঠিকানা বক্স অথবা ৪টি আলাদা ফিল্ড - উভয়ই সফলভাবে সেভ হবে)
  // ৩. ১৮+ বয়স ও ১৭ ডিজিট জন্মনিবন্ধন শতভাগ নির্ভুল ভ্যালিডেশন
  // ৪. ১ বার 'সংরক্ষণ' হওয়ামাত্র কোড নিষ্ক্রিয় ও মেমরি ক্লিন
  // ==========================================================================

  function bnToEn(str) {
    if (!str) return '';
    return String(str).replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
  }

  // ১. মডাল কম্পোনেন্ট বের করা
  function findModalComponent() {
    const root = document.getElementById("app")?._vnode?.component;
    if (!root) return null;
    const queue = [root];
    const seen = new Set();
    while (queue.length > 0) {
      const comp = queue.shift();
      if (!comp || seen.has(comp)) continue;
      seen.add(comp);
      if (comp.proxy && comp.proxy.recipientInformation) {
        return comp.proxy;
      }
      if (comp.subTree) walk(comp.subTree);
    }
    function walk(vnode) {
      if (!vnode) return;
      if (vnode.component) queue.push(vnode.component);
      if (Array.isArray(vnode.children)) {
        for (let c of vnode.children) if (c && typeof c === 'object') walk(c);
      }
      if (Array.isArray(vnode.dynamicChildren)) {
        for (let c of vnode.dynamicChildren) if (c && typeof c === 'object') walk(c);
      }
    }
    return null;
  }

  let watcher = null;

  // ২. সেভ বাটন হ্যান্ডলার (ইউনিভার্সাল স্মার্ট সেভ)
  function handleDirectSave(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    const modal = findModalComponent();
    if (!modal || !modal.recipientInformation) {
      console.warn("⚠️ মডাল পাওয়া যায়নি");
      return;
    }

    const r = modal.recipientInformation;
    const val = (sel) => (document.querySelector(sel)?.value || '').trim();

    // জন্ম নিবন্ধন নম্বর ১৭ ডিজিট বাধ্যতামূলক যাচাই
    const rawBrn = val('input[placeholder*="জন্ম নিবন্ধন নম্বর"], #brn') || r.birthRegistrationNo || '';
    const cleanBrn = bnToEn(rawBrn).replace(/[^0-9]/g, '');

    if (!cleanBrn || cleanBrn.length !== 17) {
      const brnInp = document.querySelector('input[placeholder*="জন্ম নিবন্ধন নম্বর"], #brn');
      if (brnInp) {
        brnInp.focus();
        brnInp.style.borderColor = '#dc3545';
        brnInp.style.boxShadow = '0 0 8px rgba(220, 53, 69, 0.6)';
      }
      alert(`⚠️ সতর্কবার্তা:\n\nজন্ম নিবন্ধন নম্বর অবশ্যই ১৭ ডিজিটের হতে হবে!\n\nবর্তমানে দিয়েছেন: ${cleanBrn.length} ডিজিট (${cleanBrn || 'খালি'})\nঅনুগ্রহ করে ১৭ ডিজিটের সঠিক নম্বর লিখুন।`);
      return;
    }

    // নাম, পিতা, মাতা, মোবাইল নম্বর সংগ্রহ
    const nameInp = val('input[placeholder*="আবেদনকারীর নাম"], #name');
    if (nameInp) r.name = nameInp;

    const fnameInp = val('input[placeholder*="পিতার নাম"], #father_name');
    if (fnameInp) r.fatherName = fnameInp;

    const mnameInp = val('input[placeholder*="মাতার নাম"], #mother_name');
    if (mnameInp) r.motherName = mnameInp;

    const mobInp = val('input[placeholder*="মোবাইল নম্বর"], #mobile');
    if (mobInp) r.mobileNo = mobInp;

    r.birthRegistrationNo = cleanBrn;

    const nidInp = val('input[placeholder*="জাতীয় পরিচয়পত্র"], #nid');
    if (nidInp) r.nid = nidInp;

    const emailInp = val('input[placeholder*="মেইল"], input[type="email"]');
    if (emailInp) r.email = emailInp;

    const dobInp = document.querySelector('input[placeholder*="তারিখ"], #input_bangla_date_pick, input[id*="dob"]');
    if (dobInp && dobInp.value) {
      r.dob = bnToEn(dobInp.value);
    }

    // লিঙ্গ সিঙ্ক
    const genderSelect = document.querySelector('select[name*="gender"], #gender');
    if (genderSelect && genderSelect.value) {
      r.gender = genderSelect.value;
    }

    // =========================================================================
    // ১. 'স্থানীয় প্রতিনিধি' নিশ্চিতকরণ (অভিভাবক নয়)
    // =========================================================================
    r.group = "non-resident"; // নিশ্চিতভাবে স্থানীয় প্রতিনিধি মোড
    const repName = val('#recipientInformation_guardianName, input[placeholder*="স্থানীয় প্রতিনিধি"], input[placeholder*="প্রতিনিধি"], input[placeholder*="অভিভাবক"]') || r.guardianName || '';
    r.guardianName = repName;

    // =========================================================================
    // ২. ইউনিভার্সাল ঠিকানা হ্যান্ডলার (একক ঠিকানা বা ৪ ফিল্ড - কোনোটিই বাদ যাবে না)
    // =========================================================================
    const singleAddress = val('input[placeholder*="ঠিকানা"], textarea[placeholder*="ঠিকানা"], #recipientInformation_address') || r.address || '';
    const houseHolding = val('input[placeholder*="বাসা/হোল্ডিং"], input[name*="houseHolding"]') || r.houseHolding || '';
    const villageRoad = val('input[placeholder*="গ্রাম/রাস্তা"], input[name*="villageRoad"]') || r.villageRoad || '';
    const postOffice = val('input[placeholder*="ডাকঘর"], input[name*="postOffice"]') || r.postOffice || '';
    const cityCorporation = val('input[placeholder*="সিটি-কর্পোরেশন"], input[name*="cityCorporation"]') || r.cityCorporation || '';

    if (villageRoad || houseHolding || postOffice) {
      // পৃথক ৪টি ফিল্ড থাকলে
      r.houseHolding = houseHolding;
      r.villageRoad = villageRoad;
      r.postOffice = postOffice;
      r.cityCorporation = cityCorporation;

      let parts = [];
      if (houseHolding) parts.push(`বাসা/হোল্ডিং: ${houseHolding}`);
      if (villageRoad) parts.push(`গ্রাম/রাস্তা: ${villageRoad}`);
      if (postOffice) parts.push(`ডাকঘর: ${postOffice}`);
      if (cityCorporation) parts.push(`সিটি-কর্পোরেশন: ${cityCorporation}`);
      r.address = parts.join(', ');
    } else if (singleAddress) {
      // একক ঠিকানা বক্স থাকলে (যেমন আপনার বর্তমান ফর্মে)
      r.address = singleAddress;
      r.villageRoad = singleAddress; // ব্যাকএন্ড ও ভিউ মডালের জন্য
      r.houseHolding = r.houseHolding || '-';
      r.postOffice = r.postOffice || '-';
      r.cityCorporation = r.cityCorporation || '';
    }

    // মৃত ব্যক্তির সাথে সম্পর্ক (ওয়ারিশ সূত্রে থাকলে)
    const relInp = val('input[placeholder*="সম্পর্ক"], #recipientInformation_relationShip, select[name*="relationShip"]');
    if (relInp) {
      r.relationShip = relInp;
    }

    r.verifyType = "birth-registration";
    r.is_nid_verified = true;

    if (!r.photo) {
      r.photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    if (modal.nidDataVerification) {
      modal.nidDataVerification.isNameCorrect = true;
      modal.nidDataVerification.isFatherNameCorrect = true;
      modal.nidDataVerification.isMotherNameCorrect = true;
      modal.nidDataVerification.isGenderCorrect = true;
      modal.nidDataVerification.isNidVerificationErrorShow = false;
      modal.nidDataVerification.nidVerifyProcess = 1;
    }

    console.log("💾 সম্পূর্ণ ডেটাসহ সফলভাবে সংরক্ষণ হচ্ছে:", r);
    modal.emitSavedEvent();

    // =========================================================================
    // ওয়ান-শট সমাপ্তি: ১ বার সেভ হওয়ামাত্র কোড ও ইন্টারসেপ্ট বন্ধ (মেমরি ক্লিন)
    // =========================================================================
    if (watcher) clearInterval(watcher);
    const saveBtn = document.getElementById('recipient_save_btn');
    if (saveBtn) {
      saveBtn.removeEventListener('click', handleDirectSave, true);
      delete saveBtn._hasCustomIntercept;
    }
    console.log("🔒 [Land Helper BD] ১ বার ব্যবহার সম্পন্ন: সেভ করা হয়েছে এবং কোডটি সফলভাবে মেমরি থেকে নিষ্ক্রিয় হয়েছে।");
  }

  // ৩. নিয়মিত গার্ড ও আনলকার
  function applyBypass() {
    const modal = findModalComponent();
    if (!modal) return;

    // ১. ব্যাকএন্ড ও স্টেট লেভেলে গ্রুপ 'non-resident' রাখা
    if (modal.recipientInformation) {
      modal.recipientInformation.group = "non-resident";
    }

    modal.calculateAge = function() { return 10; };
    modal.isValidateFields = function() { return true; };
    modal.recipientFileValidation = function() { return true; };
    modal.checkMobileNoTampering = function() { return true; };

    try {
      Object.defineProperty(modal, 'minorDobMinDate', {
        get: () => null,
        configurable: true
      });
    } catch(e) {}

    // ২. ভিজুয়াল ইন্টারফেস ফিক্স: 'অভিভাবকের নাম' পরিবর্তন করে 'স্থানীয় প্রতিনিধি' করা
    const gInput = document.getElementById('recipientInformation_guardianName') ||
                   document.querySelector('input[placeholder*="অভিভাবক"], input[placeholder*="প্রতিনিধি"]');
    if (gInput) {
      gInput.placeholder = 'স্থানীয় প্রতিনিধির নাম';
      const gLabel = gInput.closest('.form-group, .col-md-6, div')?.querySelector('label') ||
                     document.querySelector('label[for="recipientInformation_guardianName"]');
      if (gLabel && !gLabel.innerHTML.includes('স্থানীয় প্রতিনিধি')) {
        gLabel.innerHTML = 'স্থানীয় প্রতিনিধি <span class="text-danger">*</span>';
      }
    }

    // ৩. সেভ বাটন ইন্টারসেপ্ট
    const saveBtn = document.getElementById('recipient_save_btn');
    if (saveBtn && !saveBtn._hasCustomIntercept) {
      saveBtn._hasCustomIntercept = true;
      saveBtn.addEventListener('click', handleDirectSave, true);
    }

    // ৪. ইনপুট ও ক্যালেন্ডার আনলক
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.disabled) { el.disabled = false; el.removeAttribute('disabled'); }
      el.style.pointerEvents = 'auto';
    });

    const dobInput = document.querySelector('#input_bangla_date_pick, input[placeholder*="তারিখ"]');
    if (dobInput) {
      dobInput.readOnly = false;
      dobInput.removeAttribute('readonly');
    }

    document.querySelectorAll('.dp__cell_disabled, .dp--disabled, [aria-disabled="true"]').forEach(el => {
      el.classList.remove('dp__cell_disabled', 'dp--disabled');
      el.setAttribute('aria-disabled', 'false');
      el.removeAttribute('disabled');
      el.style.pointerEvents = 'auto';
      el.style.opacity = '1';
      el.style.cursor = 'pointer';
    });

    // ৫. এরর পপআপ ও লাল দাগ মুছে দেওয়া
    document.querySelectorAll('.swal2-container, .error_message_required, .is-invalid').forEach(el => {
      if (el.classList.contains('swal2-container')) {
        const text = el.innerText || '';
        if (text.includes('১৮ বছরের কম') || text.includes('বয়স')) el.remove();
      } else {
        el.classList.remove('error_message_required', 'is-invalid');
        if (el.style.borderColor === 'red' || el.style.borderColor.includes('rgb(255')) el.style.borderColor = '';
      }
    });
  }

  applyBypass();

  // ব্যাকগ্রাউন্ড গার্ড চালু রাখা (যতক্ষণ না সেভ বাটনে ক্লিক হচ্ছে)
  watcher = setInterval(applyBypass, 300); window._lhOfflineWatcher = watcher;
  console.log("⚡ [Land Helper BD] সেশন সক্রিয়। 'স্থানীয় প্রতিনিধি' নিশ্চিত করা হয়েছে। ঠিকানা ও বয়স আনলক করা হয়েছে।");
})();
            /* --- END USER EXACT OFFLINE CODE --- */
        } catch(err) {
            alert("❌ অফলাইন আবেদন ত্রুটি: " + err.message);
        }
    };

    // =========================================================================
    // SECTION 5: Floating Toolbar DOM Builder
    // =========================================================================
    function injectToolbar() {
        readLocalLicense();
        if (document.getElementById('_lh_bar')) return;

        var bar = document.createElement('div');
        bar.id = '_lh_bar';
        bar.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:2147483647;display:flex;align-items:center;gap:4px;background:#090d16;padding:3px 6px;border-radius:20px;box-shadow:0 8px 25px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);font-family:sans-serif;';
        bar.innerHTML = '<span style="font-size:11px;font-weight:700;color:#10b981;padding-left:3px;margin-right:2px;">🛡️ Land Helper:</span>' +
            '<span id="_lh_hit_badge" style="display:none;font-size:10px;font-weight:700;color:#fde047;background:rgba(234,179,8,0.2);padding:2px 5px;border-radius:8px;border:1px solid rgba(234,179,8,0.4);"></span>' +
            '<button type="button" onclick="window._slRst()" style="background:#ea580c;color:#fff;border:none;padding:4px 9px;font-size:11px;font-weight:700;border-radius:18px;cursor:pointer;box-shadow:0 2px 6px rgba(234,88,12,0.3);display:flex;align-items:center;gap:3px;" title="প্রোফাইল রিসেট">🔄 রিসেট</button>' +
            '<button type="button" onclick="window._sl18()" style="background:#059669;color:#fff;border:none;padding:4px 9px;font-size:11px;font-weight:700;border-radius:18px;cursor:pointer;box-shadow:0 2px 6px rgba(5,150,105,0.3);display:flex;align-items:center;gap:3px;" title="১৮+ মোড">🔞 ১৮+</button>' +
            '<button type="button" onclick="window._slRep()" style="background:#2563eb;color:#fff;border:none;padding:4px 9px;font-size:11px;font-weight:700;border-radius:18px;cursor:pointer;box-shadow:0 2px 6px rgba(37,99,235,0.3);display:flex;align-items:center;gap:3px;" title="অফলাইন আবেদন">👥 অফলাইন</button>' +
            '<button type="button" onclick="var b=document.getElementById(\'_lh_bar\');if(b)b.remove();" style="background:transparent;border:none;color:#94a3b8;font-size:14px;cursor:pointer;padding:0 3px;" title="বন্ধ করুন">✕</button>';

        (document.documentElement || document.body).appendChild(bar);
    }

    // Auto-inject on load & monitor SPA route transitions
    injectToolbar();
    setInterval(function() {
        if (!document.getElementById('_lh_bar')) injectToolbar();
    }, 1000);

    // Dynamic config sync (GitHub Pages)
    async function syncRemotePortalConfig() {
        try {
            const res = await fetch("https://landhelperbd.github.io/config.json?_t=" + Date.now(), { cache: "no-store" });
            if (!res.ok) return;
            const cfg = await res.json();
            if (cfg.portal_notice && cfg.portal_notice.enabled && cfg.portal_notice.text) {
                showToast(cfg.portal_notice.text, cfg.portal_notice.bgColor || "#0f172a");
            }
        } catch(e) {}
    }
    setTimeout(syncRemotePortalConfig, 1500);

})();
