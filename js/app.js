/* ============================================================
   VELOCITY SYSTEMS — Front-end Application Logic
   Handles: theme, mobile menu, scroll UI, reveal animations,
   order/payment modal, Paystack checkout, success flow,
   form validation, contact form.
   ============================================================ */
(function () {
  "use strict";

  /* -----------------------------------------------------------
     CONFIG  —  Replace with your LIVE values before going live.
     The Paystack PUBLIC key is safe to expose in the browser.
     (The SECRET key lives only in server.js / .env — never here.)
  ----------------------------------------------------------- */
  var CONFIG = {
    PAYSTACK_PUBLIC_KEY: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    CURRENCY: "NGN",
    BUSINESS_EMAIL: "sunusinasir@gmail.com"
  };

  /* -------------------- Helpers -------------------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function formatNaira(amount) {
    return "₦" + Number(amount).toLocaleString("en-NG");
  }

  function genRef() {
    return "VS-" + Date.now().toString(36).toUpperCase() + "-" +
           Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  var toastTimer;
  function toast(message, isError) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", !!isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3600);
  }

  /* ==========================================================
     THEME TOGGLE  (persisted, respects system preference)
  ========================================================== */
  var root = document.documentElement;
  var themeToggle = $("#themeToggle");
  var LOGO_LIGHT = "assets/logo.svg";
  var LOGO_DARK = "assets/logo-white.svg";

  function applyLogoForTheme(theme) {
    var src = theme === "dark" ? LOGO_DARK : LOGO_LIGHT;
    $$(".brand-logo, .mobile-logo").forEach(function (img) { img.setAttribute("src", src); });
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("vs-theme", theme); } catch (e) {}
    applyLogoForTheme(theme);
  }

  (function initTheme() {
    var saved;
    try { saved = localStorage.getItem("vs-theme"); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(saved || (prefersDark ? "dark" : "light"));
  })();

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ==========================================================
     MOBILE MENU
  ========================================================== */
  var burger = $("#burger");
  var mobileMenu = $("#mobileMenu");
  var overlay = $("#overlay");

  function openMenu() {
    mobileMenu.classList.add("open");
    burger.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    mobileMenu.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  if (burger) {
    burger.addEventListener("click", function () {
      mobileMenu.classList.contains("open") ? closeMenu() : openMenu();
    });
    $$(".mobile-link, .mobile-menu .btn").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }
  if (overlay) overlay.addEventListener("click", closeMenu);

  /* ==========================================================
     HEADER SHADOW + ACTIVE NAV LINK ON SCROLL
  ========================================================== */
  var header = $("#siteHeader");
  var sections = $$("main section[id]");
  var navLinks = $$(".nav-link");

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);

    var pos = window.scrollY + (window.innerHeight * 0.3);
    var currentId = "";
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) currentId = sec.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ==========================================================
     REVEAL ON SCROLL (IntersectionObserver)
  ========================================================== */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 0.08) + "s";
      io.observe(el);
    });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ==========================================================
     FOOTER YEAR
  ========================================================== */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ==========================================================
     FORM VALIDATION UTILITIES
  ========================================================== */
  function setError(input, message) {
    input.classList.toggle("invalid", !!message);
    var small = document.querySelector('.err[data-for="' + input.id + '"]');
    if (small) small.textContent = message || "";
    return !message;
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

  function validateField(input) {
    var v = input.value.trim();
    if (!v) return setError(input, "This field is required.");
    if (input.type === "email" && !EMAIL_RE.test(v)) return setError(input, "Enter a valid email address.");
    if (input.type === "tel" && !PHONE_RE.test(v)) return setError(input, "Enter a valid phone number.");
    return setError(input, "");
  }

  function validateForm(form) {
    var ok = true;
    $$("input[required], textarea[required]", form).forEach(function (input) {
      if (!validateField(input)) ok = false;
    });
    return ok;
  }

  // Live validation feedback
  $$("#orderForm input, #contactForm input, #contactForm textarea").forEach(function (input) {
    input.addEventListener("blur", function () { validateField(input); });
    input.addEventListener("input", function () {
      if (input.classList.contains("invalid")) validateField(input);
    });
  });

  /* ==========================================================
     ORDER / PAYMENT MODAL
  ========================================================== */
  var orderModal = $("#orderModal");
  var orderForm = $("#orderForm");
  var summaryService = $("#summaryService");
  var summaryAmount = $("#summaryAmount");
  var payAmount = $("#payAmount");
  var payBtn = $("#payBtn");

  var currentOrder = { service: "", amount: 0 };
  var lastFocused = null;

  function openOrderModal(service, amount) {
    currentOrder.service = service;
    currentOrder.amount = Number(amount);
    summaryService.textContent = service;
    summaryAmount.textContent = formatNaira(amount);
    payAmount.textContent = formatNaira(amount);
    lastFocused = document.activeElement;
    orderModal.classList.add("open");
    orderModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(function () { $("#oName").focus(); }, 60);
  }

  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  // Wire every "Order Now" button
  $$(".order-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openOrderModal(btn.dataset.service, btn.dataset.amount);
    });
  });

  // Close controls
  $("#orderClose").addEventListener("click", function () { closeModal(orderModal); });
  orderModal.addEventListener("click", function (e) { if (e.target === orderModal) closeModal(orderModal); });

  /* ==========================================================
     PAYSTACK CHECKOUT
  ========================================================== */
  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm(orderForm)) return;

    var customer = {
      name: $("#oName").value.trim(),
      email: $("#oEmail").value.trim(),
      phone: $("#oPhone").value.trim()
    };

    // DEV MODE: while the public key is still the placeholder, run a safe
    // simulated success so you can preview the full flow without charging anyone.
    if (CONFIG.PAYSTACK_PUBLIC_KEY.indexOf("xxxx") !== -1 || /^pk_(test|live)_x+$/.test(CONFIG.PAYSTACK_PUBLIC_KEY)) {
      toast("Demo mode — set your Paystack public key in js/app.js to accept real payments.");
      return simulateSuccess();
    }

    if (!window.PaystackPop) {
      toast("Payment library failed to load. Check your connection.", true);
      return;
    }

    payBtn.disabled = true;
    payBtn.querySelector(".pay-label").textContent = "Processing…";

    var reference = genRef();

    var handler = window.PaystackPop.setup({
      key: CONFIG.PAYSTACK_PUBLIC_KEY,
      email: customer.email,
      amount: currentOrder.amount * 100,        // Naira -> kobo
      currency: CONFIG.CURRENCY,
      ref: reference,
      firstname: customer.name,
      phone: customer.phone,
      label: currentOrder.service,
      metadata: {
        custom_fields: [
          { display_name: "Full Name", variable_name: "full_name", value: customer.name },
          { display_name: "Phone Number", variable_name: "phone", value: customer.phone },
          { display_name: "Service Package", variable_name: "service", value: currentOrder.service }
        ]
      },
      callback: function (response) {
        resetPayBtn();
        showSuccess(response.reference || reference);
      },
      onClose: function () {
        resetPayBtn();
        toast("Payment window closed before completing.", true);
      }
    });

    handler.openIframe();
  });

  function resetPayBtn() {
    payBtn.disabled = false;
    payBtn.querySelector(".pay-label").textContent = "Pay";
  }

  // Dev-mode simulation (used only while the key is a placeholder)
  function simulateSuccess() {
    payBtn.disabled = true;
    payBtn.querySelector(".pay-label").textContent = "Simulating…";
    setTimeout(function () {
      resetPayBtn();
      showSuccess(genRef());
    }, 1100);
  }

  /* ==========================================================
     SUCCESS MODAL
  ========================================================== */
  var successModal = $("#successModal");
  function showSuccess(reference) {
    closeModal(orderModal);
    $("#successService").textContent = currentOrder.service;
    $("#successRef").textContent = reference;
    successModal.classList.add("open");
    successModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    orderForm.reset();
  }
  $("#successClose").addEventListener("click", function () { closeModal(successModal); });
  $("#successDone").addEventListener("click", function () { closeModal(successModal); });
  successModal.addEventListener("click", function (e) { if (e.target === successModal) closeModal(successModal); });

  // ESC closes any open modal / menu
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (orderModal.classList.contains("open")) closeModal(orderModal);
    if (successModal.classList.contains("open")) closeModal(successModal);
    if (mobileMenu.classList.contains("open")) closeMenu();
  });

  /* ==========================================================
     CONTACT FORM  (opens pre-filled email client)
  ========================================================== */
  var contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(contactForm)) return;
      var name = $("#cName").value.trim();
      var email = $("#cEmail").value.trim();
      var phone = $("#cPhone").value.trim();
      var msg = $("#cMsg").value.trim();

      var subject = encodeURIComponent("New enquiry from " + name + " — Velocity Systems");
      var body = encodeURIComponent(
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Phone: " + phone + "\n\n" +
        "Message:\n" + msg
      );
      window.location.href = "mailto:" + CONFIG.BUSINESS_EMAIL + "?subject=" + subject + "&body=" + body;
      toast("Opening your email app…");
      contactForm.reset();
    });
  }
})();
