/* ================================
   PWS Welding Job Pricing Calculator
   app.js (No frameworks)
   Assumed element IDs in index.html:

   Inputs:
   - rate, materials, markupPct, taxPct
   - rushOn (checkbox), rushPct
   - includeWeld (checkbox)
   - fitMin, fitMax
   - prepMin, prepMax
   - cleanMin, cleanMax
   - weldMin, weldMax
   - notes (textarea)

   Buttons:
   - btnReset, btnExample, btnCopy

   Output spans/divs:
   - outHoursMin, outHoursMax
   - outLaborMin, outLaborMax
   - outMarkupMin, outMarkupMax
   - outRushMin, outRushMax
   - outSubtotalMin, outSubtotalMax
   - outTaxMin, outTaxMax
   - outTotalMin, outTotalMax
   - warnings (container for inline messages)
   - copyStatus (small status text; optional)

   ================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const el = {
    // Inputs
    rate: $("rate"),
    materials: $("materials"),
    markupPct: $("markupPct"),
    taxPct: $("taxPct"),
    rushOn: $("rushOn"),
    rushPct: $("rushPct"),
    includeWeld: $("includeWeld"),

    fitMin: $("fitMin"),
    fitMax: $("fitMax"),
    prepMin: $("prepMin"),
    prepMax: $("prepMax"),
    cleanMin: $("cleanMin"),
    cleanMax: $("cleanMax"),
    weldMin: $("weldMin"),
    weldMax: $("weldMax"),

    notes: $("notes"),

    // Buttons
    btnReset: $("btnReset"),
    btnExample: $("btnExample"),
    btnCopy: $("btnCopy"),

    // Outputs
    outHoursMin: $("outHoursMin"),
    outHoursMax: $("outHoursMax"),
    outLaborMin: $("outLaborMin"),
    outLaborMax: $("outLaborMax"),
    outMarkupMin: $("outMarkupMin"),
    outMarkupMax: $("outMarkupMax"),
    outRushMin: $("outRushMin"),
    outRushMax: $("outRushMax"),
    outSubtotalMin: $("outSubtotalMin"),
    outSubtotalMax: $("outSubtotalMax"),
    outTaxMin: $("outTaxMin"),
    outTaxMax: $("outTaxMax"),
    outTotalMin: $("outTotalMin"),
    outTotalMax: $("outTotalMax"),

    warnings: $("warnings"),
    copyStatus: $("copyStatus"), // optional
  };

  // ---- Helpers ----
  const num = (v) => {
    const n = parseFloat(String(v ?? "").trim());
    return Number.isFinite(n) ? n : 0;
  };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const pctToRate = (p) => clamp(num(p), 0, 100) / 100;

  const money = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);

  const hoursFmt = (n) => {
    const v = Number.isFinite(n) ? n : 0;
    return v.toFixed(2);
  };

  const setText = (node, value) => {
    if (node) node.textContent = value;
  };

  const setDisabled = (node, disabled) => {
    if (!node) return;
    node.disabled = !!disabled;
    node.setAttribute("aria-disabled", disabled ? "true" : "false");
  };

  const clearWarnings = () => {
    if (el.warnings) el.warnings.innerHTML = "";
  };

  const addWarning = (msg) => {
    if (!el.warnings) return;
    const p = document.createElement("p");
    p.className = "warning";
    p.textContent = msg;
    el.warnings.appendChild(p);
  };

  const dashOutputs = () => {
    const d = "—";
    [
      el.outHoursMin,
      el.outHoursMax,
      el.outLaborMin,
      el.outLaborMax,
      el.outMarkupMin,
      el.outMarkupMax,
      el.outRushMin,
      el.outRushMax,
      el.outSubtotalMin,
      el.outSubtotalMax,
      el.outTaxMin,
      el.outTaxMax,
      el.outTotalMin,
      el.outTotalMax,
    ].forEach((n) => setText(n, d));
  };

  const validateMinMax = (label, minEl, maxEl) => {
    const minV = num(minEl?.value);
    const maxV = num(maxEl?.value);

    // empty fields treated as 0; still validate numeric relationship
    if (minV > maxV) {
      addWarning(`${label}: MIN hours cannot be greater than MAX hours.`);
      if (minEl) minEl.setAttribute("aria-invalid", "true");
      if (maxEl) maxEl.setAttribute("aria-invalid", "true");
      return false;
    }
    if (minEl) minEl.removeAttribute("aria-invalid");
    if (maxEl) maxEl.removeAttribute("aria-invalid");
    return true;
  };

  const normalizePercentInput = (inputEl) => {
    if (!inputEl) return;
    const v = clamp(num(inputEl.value), 0, 100);
    // keep user-friendly; don’t force trailing decimals
    inputEl.value = String(v);
  };

  // ---- Core calculation ----
  const readState = () => {
    // normalize percent fields so the UI remains sane
    normalizePercentInput(el.markupPct);
    normalizePercentInput(el.taxPct);
    normalizePercentInput(el.rushPct);

    const includeWeld = !!el.includeWeld?.checked;
    const rushOn = !!el.rushOn?.checked;

    const rate = Math.max(0, num(el.rate?.value));
    const materials = Math.max(0, num(el.materials?.value));

    const markupRate = pctToRate(el.markupPct?.value);
    const taxRate = pctToRate(el.taxPct?.value);
    const rushRate = rushOn ? pctToRate(el.rushPct?.value) : 0;

    const fitMin = Math.max(0, num(el.fitMin?.value));
    const fitMax = Math.max(0, num(el.fitMax?.value));

    const prepMin = Math.max(0, num(el.prepMin?.value));
    const prepMax = Math.max(0, num(el.prepMax?.value));

    const cleanMin = Math.max(0, num(el.cleanMin?.value));
    const cleanMax = Math.max(0, num(el.cleanMax?.value));

    const weldMin = includeWeld ? Math.max(0, num(el.weldMin?.value)) : 0;
    const weldMax = includeWeld ? Math.max(0, num(el.weldMax?.value)) : 0;

    const notes = (el.notes?.value ?? "").trim();

    return {
      includeWeld,
      rushOn,
      rate,
      materials,
      markupRate,
      taxRate,
      rushRate,
      fitMin,
      fitMax,
      prepMin,
      prepMax,
      cleanMin,
      cleanMax,
      weldMin,
      weldMax,
      notes,
    };
  };

  const compute = (s) => {
    const hoursMin = s.fitMin + s.prepMin + s.cleanMin + s.weldMin;
    const hoursMax = s.fitMax + s.prepMax + s.cleanMax + s.weldMax;

    const laborMin = hoursMin * s.rate;
    const laborMax = hoursMax * s.rate;

    // IMPORTANT: Markup applies to LABOR ONLY
    const markupMin = laborMin * s.markupRate;
    const markupMax = laborMax * s.markupRate;

    // IMPORTANT: Rush applies to LABOR ONLY (when enabled)
    const rushMin = laborMin * s.rushRate;
    const rushMax = laborMax * s.rushRate;

    const subtotalMin = laborMin + markupMin + rushMin + s.materials;
    const subtotalMax = laborMax + markupMax + rushMax + s.materials;

    // IMPORTANT: Tax applies to FINAL TOTAL (subtotal)
    const taxMin = subtotalMin * s.taxRate;
    const taxMax = subtotalMax * s.taxRate;

    const totalMin = subtotalMin + taxMin;
    const totalMax = subtotalMax + taxMax;

    return {
      hoursMin,
      hoursMax,
      laborMin,
      laborMax,
      markupMin,
      markupMax,
      rushMin,
      rushMax,
      subtotalMin,
      subtotalMax,
      taxMin,
      taxMax,
      totalMin,
      totalMax,
    };
  };

  const render = (s, r) => {
    setText(el.outHoursMin, hoursFmt(r.hoursMin));
    setText(el.outHoursMax, hoursFmt(r.hoursMax));

    setText(el.outLaborMin, money(r.laborMin));
    setText(el.outLaborMax, money(r.laborMax));

    setText(el.outMarkupMin, money(r.markupMin));
    setText(el.outMarkupMax, money(r.markupMax));

    setText(el.outRushMin, money(r.rushMin));
    setText(el.outRushMax, money(r.rushMax));

    setText(el.outSubtotalMin, money(r.subtotalMin));
    setText(el.outSubtotalMax, money(r.subtotalMax));

    setText(el.outTaxMin, money(r.taxMin));
    setText(el.outTaxMax, money(r.taxMax));

    setText(el.outTotalMin, money(r.totalMin));
    setText(el.outTotalMax, money(r.totalMax));
  };

  const updateWeldInputs = () => {
    const off = !el.includeWeld?.checked;
    setDisabled(el.weldMin, off);
    setDisabled(el.weldMax, off);
  };

  const updateRushInputs = () => {
    const off = !el.rushOn?.checked;
    setDisabled(el.rushPct, off);
  };

  const validateAll = () => {
    clearWarnings();

    const ok1 = validateMinMax("Fit-up / assembly", el.fitMin, el.fitMax);
    const ok2 = validateMinMax("Joint prep", el.prepMin, el.prepMax);
    const ok3 = validateMinMax("Weld area cleaning", el.cleanMin, el.cleanMax);

    let ok4 = true;
    if (el.includeWeld?.checked) {
      ok4 = validateMinMax("Welding time", el.weldMin, el.weldMax);
    } else {
      // clear invalid state when excluded
      el.weldMin?.removeAttribute("aria-invalid");
      el.weldMax?.removeAttribute("aria-invalid");
    }

    return ok1 && ok2 && ok3 && ok4;
  };

  const update = () => {
    updateWeldInputs();
    updateRushInputs();

    const valid = validateAll();
    if (!valid) {
      dashOutputs();
      return;
    }

    const s = readState();
    const r = compute(s);
    render(s, r);
  };

  // ---- Copy Summary ----
  const buildSummaryText = () => {
    const valid = validateAll();
    if (!valid) return null;

    const s = readState();
    const r = compute(s);

    const stamp = new Date().toLocaleString();

    const lines = [];
    lines.push("PWS | Welding Job Pricing Estimate");
    lines.push(`Date/Time: ${stamp}`);
    lines.push("");
    lines.push(`Hourly Rate: ${money(s.rate)}/hr`);
    lines.push(`Welding Time Included: ${s.includeWeld ? "Yes" : "No"}`);
    lines.push(`Rush Job: ${s.rushOn ? `Yes (${(s.rushRate * 100).toFixed(0)}%)` : "No"}`);
    lines.push(`Markup (Labor Only): ${(s.markupRate * 100).toFixed(0)}%`);
    lines.push(`Sales Tax: ${(s.taxRate * 100).toFixed(0)}%`);
    lines.push("");

    lines.push("Hours (MIN–MAX):");
    lines.push(`- Fit-up / assembly: ${hoursFmt(s.fitMin)} – ${hoursFmt(s.fitMax)}`);
    lines.push(`- Joint prep: ${hoursFmt(s.prepMin)} – ${hoursFmt(s.prepMax)}`);
    lines.push(`- Weld area cleaning: ${hoursFmt(s.cleanMin)} – ${hoursFmt(s.cleanMax)}`);
    if (s.includeWeld) lines.push(`- Welding time: ${hoursFmt(s.weldMin)} – ${hoursFmt(s.weldMax)}`);
    lines.push(`TOTAL HOURS: ${hoursFmt(r.hoursMin)} – ${hoursFmt(r.hoursMax)}`);
    lines.push("");

    lines.push("Costs (MIN–MAX):");
    lines.push(`- Labor: ${money(r.laborMin)} – ${money(r.laborMax)}`);
    lines.push(`- Labor markup: ${money(r.markupMin)} – ${money(r.markupMax)}`);
    lines.push(`- Rush surcharge (labor): ${money(r.rushMin)} – ${money(r.rushMax)}`);
    lines.push(`- Materials & consumables: ${money(s.materials)}`);
    lines.push(`SUBTOTAL: ${money(r.subtotalMin)} – ${money(r.subtotalMax)}`);
    lines.push(`Tax: ${money(r.taxMin)} – ${money(r.taxMax)}`);
    lines.push(`TOTAL ESTIMATE: ${money(r.totalMin)} – ${money(r.totalMax)}`);
    lines.push("");

    if (s.notes) {
      lines.push("Job Notes:");
      lines.push(s.notes);
      lines.push("");
    }

    lines.push("Disclaimer: Educational estimate only. Verify scope, site conditions, and local tax rules.");
    return lines.join("\n");
  };

  const setCopyStatus = (msg) => {
    if (!el.copyStatus) return;
    el.copyStatus.textContent = msg;
    window.clearTimeout(setCopyStatus._t);
    setCopyStatus._t = window.setTimeout(() => {
      el.copyStatus.textContent = "";
    }, 2500);
  };

  const copySummary = async () => {
    const text = buildSummaryText();
    if (!text) {
      setCopyStatus("Fix MIN/MAX warnings before copying.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Summary copied.");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopyStatus("Summary copied.");
      } catch {
        setCopyStatus("Copy failed. Try again.");
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  // ---- Reset / Example ----
  const setDefaults = () => {
    if (el.rate) el.rate.value = "95";
    if (el.materials) el.materials.value = "0";
    if (el.markupPct) el.markupPct.value = "0";
    if (el.taxPct) el.taxPct.value = "10";

    if (el.rushOn) el.rushOn.checked = false;
    if (el.rushPct) el.rushPct.value = "15";

    if (el.includeWeld) el.includeWeld.checked = true;

    if (el.fitMin) el.fitMin.value = "0";
    if (el.fitMax) el.fitMax.value = "0";
    if (el.prepMi
