/* ============================================================
   Kreation — Interactive behaviors
   - Accordions for per-card add-ons
   - Single-card selection with add-on pricing
   - Total calculator (uses data-price attributes)
   - Book Now form handler (simple client-side validation + toast)
   ============================================================ */
(function () {
  "use strict";

  // ---------- 1. Accordions ----------
  var accordions = document.querySelectorAll(".accordion-header");
  accordions.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = btn.nextElementSibling;
      if (!panel || !panel.classList.contains("accordion-panel")) return;

      var isOpen = btn.classList.toggle("active");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");

      if (isOpen) {
        // Open: set to scrollHeight so the CSS transition animates
        panel.style.maxHeight = panel.scrollHeight + "px";
      } else {
        // Close: set to current height first to enable transition, then 0
        panel.style.maxHeight = panel.scrollHeight + "px";
        // force reflow so the browser registers the current value
        // eslint-disable-next-line no-unused-expressions
        panel.offsetHeight;
        panel.style.maxHeight = "0px";
      }
    });
  });

  // ---------- 2. Price display ----------
  var priceDisplay = document.getElementById("total");
  var bookBtn = document.querySelector(".cta");

  function formatPrice(n) {
    return "$" + n.toFixed(2);
  }

  function recalculate() {
    var selected = document.querySelector(".card.selected");
    if (!selected) {
      if (priceDisplay) priceDisplay.textContent = "$0.00";
      if (bookBtn) bookBtn.disabled = true;
      return;
    }
    var base = parseFloat(selected.getAttribute("data-base")) || 0;
    var addons = 0;
    selected.querySelectorAll(".addon-check:checked").forEach(function (cb) {
      addons += parseFloat(cb.getAttribute("data-price")) || 0;
    });
    var total = base + addons;
    if (priceDisplay) {
      priceDisplay.textContent = formatPrice(total);
      // little pulse
      priceDisplay.classList.remove("pulse");
      // reflow to restart animation
      // eslint-disable-next-line no-unused-expressions
      priceDisplay.offsetWidth;
      priceDisplay.classList.add("pulse");
      setTimeout(function () {
        priceDisplay.classList.remove("pulse");
      }, 280);
    }
    if (bookBtn) bookBtn.disabled = false;
  }

  // ---------- 3. Card selection ----------
  function deselectAll(except) {
    document.querySelectorAll(".card").forEach(function (card) {
      if (card === except) return;
      card.classList.remove("selected");
      card.querySelectorAll(".addon-check").forEach(function (cb) {
        cb.checked = false;
      });
      var pb = card.querySelector(".pick");
      if (pb) pb.textContent = "Select";
      // close any open accordion on a deselected card so the panel collapses cleanly
      var ah = card.querySelector(".accordion-header.active");
      if (ah) {
        ah.classList.remove("active");
        ah.setAttribute("aria-expanded", "false");
        var p = ah.nextElementSibling;
        if (p) p.style.maxHeight = "0px";
      }
    });
  }

  document.querySelectorAll(".pick").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".card");
      if (!card) return;

      if (card.classList.contains("selected")) {
        // deselect
        card.classList.remove("selected");
        btn.textContent = "Select";
        card.querySelectorAll(".addon-check:checked").forEach(function (cb) {
          cb.checked = false;
        });
      } else {
        deselectAll(card);
        card.classList.add("selected");
        btn.textContent = "Selected";
      }
      recalculate();
    });
  });

  // ---------- 4. Add-on checkboxes ----------
  function refreshOpenAccordion(card) {
    // If the card's accordion panel is open, re-sync its max-height to the new scrollHeight
    // so expanding/collapsing add-on labels doesn't get clipped.
    if (!card) return;
    var btn = card.querySelector(".accordion-header.active");
    if (!btn) return;
    var panel = btn.nextElementSibling;
    if (panel && panel.classList.contains("accordion-panel")) {
      panel.style.maxHeight = "none";
      var h = panel.scrollHeight;
      panel.style.maxHeight = h + "px";
    }
  }

  document.querySelectorAll(".addon-check").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var card = cb.closest(".card");
      if (!card) return;
      if (!card.classList.contains("selected")) {
        deselectAll(card);
        card.classList.add("selected");
        var pb = card.querySelector(".pick");
        if (pb) pb.textContent = "Selected";
      }
      recalculate();
      refreshOpenAccordion(card);
    });
  });

  // ---------- 5. Book Now ----------
  var toast = document.getElementById("toast");
  var bookingForm = document.getElementById("booking-form");

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("show");
    }, 3200);
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var selected = document.querySelector(".card.selected");
      var fd = new FormData(bookingForm);
      var name = (fd.get("name") || "").toString().trim();
      var email = (fd.get("email") || "").toString().trim();
      var phone = (fd.get("phone") || "").toString().trim();
      var date = (fd.get("date") || "").toString().trim();

      if (!name || !email || !phone || !date) {
        showToast("Please fill in every booking field.");
        return;
      }
      if (!selected) {
        showToast("Please select a service package before booking.");
        return;
      }
      // Collect chosen add-on labels for confirmation message
      var addonNames = [];
      selected.querySelectorAll(".addon-check:checked").forEach(function (cb) {
        var lbl = document.querySelector('label[for="' + cb.id + '"]');
        if (lbl) {
          // Take only the leading text node (before the .price <span>)
          var txt = "";
          for (var i = 0; i < lbl.childNodes.length; i++) {
            if (lbl.childNodes[i].nodeType === 3) {
              // text node
              txt += lbl.childNodes[i].textContent;
            } else if (
              lbl.childNodes[i].classList &&
              lbl.childNodes[i].classList.contains("price")
            ) {
              break;
            }
          }
          txt = txt.trim();
          if (txt) addonNames.push(txt);
        }
      });
      var pkg = selected.querySelector("h3").textContent;
      var msg =
        "Thanks " +
        name +
        "! Request received for " +
        pkg +
        (addonNames.length ? " + " + addonNames.length + " add-on(s)" : "") +
        " on " +
        date +
        ". We\u2019ll be in touch at " +
        email +
        ".";
      showToast(msg);

      // Reset selections after a successful "booking"
      document.querySelectorAll(".card.selected").forEach(function (card) {
        card.classList.remove("selected");
        card.querySelectorAll(".addon-check").forEach(function (cb) {
          cb.checked = false;
        });
        var pb = card.querySelector(".pick");
        if (pb) pb.textContent = "Select";
      });
      bookingForm.reset();
      syncDateLabel();
      recalculate();
    });
  }

  // ---------- 6. Date picker ----------
  // The native <input type="date"> covers the entire container, and its
  // ::-webkit-calendar-picker-indicator is stretched to fill it, so clicking
  // ANYWHERE on the field triggers the picker natively (works reliably in
  // iOS Safari, Chrome, Firefox, Edge). We just sync the custom label text.
  var dateBtn = document.getElementById("b-date-btn");
  var dateInput = document.getElementById("b-date");
  var dateLabel = document.getElementById("b-date-label");

  function formatDateForDisplay(iso) {
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[1] + "/" + parts[2] + "/" + parts[0];
  }

  function syncDateLabel() {
    if (!dateInput || !dateLabel || !dateBtn) return;
    if (dateInput.value) {
      dateLabel.textContent = formatDateForDisplay(dateInput.value);
      dateBtn.classList.add("has-value");
    } else {
      dateLabel.textContent = "Event Date [mm/dd/yyyy]";
      dateBtn.classList.remove("has-value");
    }
  }

  if (dateInput) {
    dateInput.addEventListener("change", syncDateLabel);
    dateInput.addEventListener("input", syncDateLabel);
    dateInput.addEventListener("blur", syncDateLabel);
    syncDateLabel();
  }

  // ---------- init ----------
  recalculate();
})();
