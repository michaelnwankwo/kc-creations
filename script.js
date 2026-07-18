/* Kreation booking UI: independent service selection and live total calculation. */
(() => {
  "use strict";

  const cards = [...document.querySelectorAll(".card")];
  const totalDisplay = document.getElementById("total");
  const bookButton = document.querySelector(".cta");
  const bookingForm = document.getElementById("booking-form");
  const toast = document.getElementById("toast");

  const money = (amount) => `$${amount.toFixed(2)}`;
  const priceOf = (element, attribute) =>
    Number.parseFloat(element.dataset[attribute]) || 0;
  const selectedCards = () =>
    cards.filter((card) => card.classList.contains("selected"));

  function updateCardControl(card) {
    const button = card.querySelector(".pick");
    if (!button) return;
    const selected = card.classList.contains("selected");
    button.textContent = selected ? "Selected" : "Select";
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute(
      "aria-label",
      `${selected ? "Remove" : "Select"} ${card.querySelector("h3").textContent.trim()}`,
    );
  }

  function setCardSelected(card, selected, clearAddons = false) {
    card.classList.toggle("selected", selected);
    if (!selected && clearAddons) {
      card.querySelectorAll(".addon-check").forEach((addon) => {
        addon.checked = false;
      });
    }
    updateCardControl(card);
  }

  function recalculate() {
    const chosen = selectedCards();
    const total = chosen.reduce((sum, card) => {
      const base = priceOf(card, "base");
      const addons = [...card.querySelectorAll(".addon-check:checked")].reduce(
        (addonSum, addon) => addonSum + priceOf(addon, "price"),
        0,
      );
      return sum + base + addons;
    }, 0);

    if (totalDisplay) {
      totalDisplay.textContent = money(total);
      totalDisplay.classList.remove("pulse");
      void totalDisplay.offsetWidth;
      totalDisplay.classList.add("pulse");
    }
    if (bookButton) bookButton.disabled = chosen.length === 0;
  }

  function refreshOpenAccordion(card) {
    const trigger = card.querySelector(".accordion-header.active");
    const panel = trigger && trigger.nextElementSibling;
    if (panel && panel.classList.contains("accordion-panel"))
      panel.style.maxHeight = `${panel.scrollHeight}px`;
  }

  document.querySelectorAll(".accordion-header").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panel = trigger.nextElementSibling;
      if (!panel || !panel.classList.contains("accordion-panel")) return;
      const opening = !trigger.classList.contains("active");
      trigger.classList.toggle("active", opening);
      trigger.setAttribute("aria-expanded", String(opening));
      panel.style.maxHeight = opening ? `${panel.scrollHeight}px` : "0px";
    });
  });

  // Each card toggles independently: no card is deselected when another is selected.
  cards.forEach((card) => {
    const button = card.querySelector(".pick");
    if (button) {
      button.addEventListener("click", () => {
        const selecting = !card.classList.contains("selected");
        setCardSelected(card, selecting, !selecting);
        recalculate();
      });
    }
  });

  // An add-on belongs to its own card. Checking it selects only that card, never clears others.
  document.querySelectorAll(".addon-check").forEach((addon) => {
    addon.addEventListener("change", () => {
      const card = addon.closest(".card");
      if (!card) return;
      if (addon.checked && !card.classList.contains("selected"))
        setCardSelected(card, true);
      recalculate();
      refreshOpenAccordion(card);
    });
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(
      () => toast.classList.remove("show"),
      4200,
    );
  }

  function addonName(addon) {
    const label = document.querySelector(
      `label[for="${CSS.escape(addon.id)}"]`,
    );
    return label ? label.childNodes[0].textContent.trim() : "Add-on";
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const fields = new FormData(bookingForm);
      const required = ["name", "email", "phone", "date"];
      if (required.some((field) => !String(fields.get(field) || "").trim())) {
        showToast("Please fill in every booking field.");
        return;
      }
      const chosen = selectedCards();
      if (!chosen.length) {
        showToast("Please select at least one service before booking.");
        return;
      }
      const services = chosen.map((card) =>
        card.querySelector("h3").textContent.trim(),
      );
      const addOns = chosen.flatMap((card) =>
        [...card.querySelectorAll(".addon-check:checked")].map(addonName),
      );
      const name = String(fields.get("name")).trim();
      showToast(
        `Thanks ${name}! Your request for ${services.join(", ")}${addOns.length ? ` plus ${addOns.length} add-on${addOns.length === 1 ? "" : "s"}` : ""} has been received.`,
      );

      chosen.forEach((card) => setCardSelected(card, false, true));
      bookingForm.reset();
      syncDateLabel();
      recalculate();
    });
  }

  const dateButton = document.getElementById("b-date-btn");
  const dateInput = document.getElementById("b-date");
  const dateLabel = document.getElementById("b-date-label");
  function syncDateLabel() {
    if (!dateButton || !dateInput || !dateLabel) return;
    if (dateInput.value) {
      const [year, month, day] = dateInput.value.split("-");
      dateLabel.textContent = `${month}/${day}/${year}`;
      dateButton.classList.add("has-value");
    } else {
      dateLabel.textContent = "Event Date [mm/dd/yyyy]";
      dateButton.classList.remove("has-value");
    }
  }
  if (dateInput)
    ["change", "input", "blur"].forEach((event) =>
      dateInput.addEventListener(event, syncDateLabel),
    );

  cards.forEach(updateCardControl);
  syncDateLabel();
  recalculate();
})();
