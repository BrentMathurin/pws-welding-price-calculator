/* =========================================
   PWS Welding Job Pricing Calculator
   app.js — matched to provided HTML
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ---- Inputs ----
  const hourlyRate = $("#hourlyRate");
  const materialsInput = $("#materials");
  const markupInput = $("#markup");
  const rushOn = $("#rushOn");
  const rushPct = $("#rushPct");
  const taxPct = $("#taxPct");
  const includeWelding = $("#includeWelding");
  const notes = $("#notes");

  // ---- Buttons ----
  const btnExample = $("#exampleBtn");
  const btnReset = $("#resetBtn");
  const btnCopy = $("#copyBtn");

  // ---- Outputs ----
  const out = {
    totalMin: $("#totalMin"),
    totalMax: $("#totalMax"),
    laborMin: $("#laborMin"),
    laborMax: $("#laborMax"),
    markupMin: $("#markupMin"),
    markupMax: $("#markupMax"),
    rushMin: $("#rushMin"),
    rushMax: $("#rushMax"),
    materials: $("#materialsOut"),
    subMin: $("#subMin"),
    subMax: $("#subMax"),
    taxMin: $("#taxMin"),
    taxMax: $("#taxMax"),
    totalRange: $("#totalRange"),
  };

  const validationBox = $("#validation");

  // ---- Helpers ----
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const money = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);

  const clampPct = (v) => Math.min(100, Math.max(0, num(v))) / 100;

  // ---- Read task hours ----
  function readTasks() {
    let min = 0;
    let max = 0;
    let valid = true;

    $$(".task").forEach((task) => {
      const key = task.dataset.key;
      const minInput = $(".min", task);
      const maxInput = $(".max", task);
      const warn = $(".warn", task);

      const minVal = num(minInput.value);
      const maxVal = num(maxInput.value);

      warn.textContent = "";

      if (key === "welding" && !includeWelding.checked) {
        minInput.disabled = true;
        maxInput.disabled = true;
        return;
      } else {
        minInput.disabled = false;
        maxInput.disabled = false;
      }

      if (minVal > maxVal) {
        warn.textContent = "Min cannot be greater than Max";
        valid = false;
        return;
      }

      min += minVal;
      max += maxVal;
    });

    return { min, max, valid };
  }

  // ---- Main calculation ----
  function calculate() {
    validationBox.textContent = "";

    const rate = num(hourlyRate.value);
    const materials = num(materialsInput.value);
    const markupRate = clampPct(markupInput.value);
    const rushRate = rushOn.checked ? clampPct(rushPct.value) : 0;
    const taxRate = clampPct(taxPct.value);

    const hours = readTasks();
    if (!hours.valid) {
      validationBox.textContent = "Fix MIN / MAX errors to continue.";
      clearOutputs();
      return;
    }

    const laborMin = hours.min * rate;
    const laborMax = hours.max * rate;

    const markupMin = laborMin * markupRate;
    const markupMax = laborMax * markupRate;

    const rushMin = laborMin * rushRate;
    const rushMax = laborMax * rushRate;

    const subMin = laborMin + markupMin + rushMin + materials;
    const subMax = laborMax + markupMax + rushMax + materials;

    const taxMin = subMin * taxRate;
    const taxMax = subMax * taxRate;

    const totalMin = subMin + taxMin;
    const totalMax = subMax + taxMax;

    // ---- Render ----
    out.totalMin.textContent = hours.min.toFixed(2);
    out.totalMax.textContent = hours.max.toFixed(2);

    out.laborMin.textContent = money(laborMin);
    out.laborMax.textContent = money(laborMax);

    out.markupMin.textContent = money(markupMin);
    out.markupMax.textContent = money(markupMax);

    out.rushMin.textContent = money(rushMin);
    out.rushMax.textContent = money(rushMax);

    out.materials.textContent = money(materials);

    out.subMin.textContent = money(subMin);
    out.subMax.textContent = money(subMax);

    out.taxMin.textContent = money(taxMin);
    out.taxMax.textContent = money(taxMax);

    out.totalRange.textContent =
      `${money(totalMin)} – ${money(totalMax)}`;
  }

  function clearOutputs() {
    Object.values(out).forEach((el) => (el.textContent = "—"));
  }

  // ---- Copy summary ----
  btnCopy.addEventListener("click", () => {
    const text = `
PWS Welding Job Pricing Estimate
--------------------------------
Hourly rate: $${hourlyRate.value}/hr
Welding included: ${includeWelding.checked ? "Yes" : "No"}
Markup (labor): ${markupInput.value}%
Rush: ${rushOn.checked ? rushPct.value + "%" : "No"}
Tax: ${taxPct.value}%

Total hours: ${out.totalMin.textContent} – ${out.totalMax.textContent}
Total price: ${out.totalRange.textContent}

Notes:
${notes.value || "—"}

(Estimate only)
    `.trim();

    navigator.clipboard.writeText(text);
    validationBox.textContent = "Quote summary copied.";
  });

  // ---- Example values ----
  btnExample.addEventListener("click", () => {
    hourlyRate.value = 95;
    materialsInput.value = 180;
    markupInput.value = 12;
    rushOn.checked = true;
    rushPct.value = 15;
    taxPct.value = 10;
    includeWelding.checked = true;

    const example = {
      fitup: [1.5, 2.5],
      jointprep: [0.75, 1.25],
      cleaning: [0.5, 1.0],
      welding: [2.0, 3.5],
    };

    $$(".task").forEach((task) => {
      const key = task.dataset.key;
      if (example[key]) {
        $(".min", task).value = example[key][0];
        $(".max", task).value = example[key][1];
      }
    });

    notes.value = "Example: small fabrication repair job.";
    calculate();
  });

  // ---- Reset ----
  btnReset.addEventListener("click", () => {
    document.querySelector("form")?.reset();
    includeWelding.checked = true;
    rushOn.checked = false;
    clearOutputs();
    calculate();
  });

  // ---- Bind all inputs ----
  $$("input, textarea").forEach((el) => {
    el.addEventListener("input", calculate);
    el.addEventListener("change", calculate);
  });

  calculate();
});
