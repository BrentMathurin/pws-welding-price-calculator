// PWS Welding Job Pricing Calculator - Refactor (Option B)
// Single-file application logic

(function () {
  // Helpers
  const el = id => document.getElementById(id);
  const toNum = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const currency = (v) => {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };
  const dash = '—';

  // Task inputs
  const fitMin = el('fitMin');
  const fitMax = el('fitMax');
  const prepMin = el('prepMin');
  const prepMax = el('prepMax');
  const cleanMin = el('cleanMin');
  const cleanMax = el('cleanMax');
  const weldingInclude = el('weldingInclude');
  const weldMin = el('weldMin');
  const weldMax = el('weldMax');

  // Warnings
  const fitWarn = el('fit-warn');
  const prepWarn = el('prep-warn');
  const cleanWarn = el('clean-warn');
  const weldWarn = el('weld-warn');
  const timeGlobalWarn = el('time-global-warning');

  // Rates & location
  const workShop = el('workShop');
  const workOnsite = el('workOnsite');
  const workMixed = el('workMixed');

  const shopRate = el('shopRate');
  const onsiteRate = el('onsiteRate');

  // Mixed inputs
  const mixedPanel = el('mixed-hours');
  const onSiteMin = el('onSiteMin');
  const onSiteMax = el('onSiteMax');
  const onsiteWarn = el('onsite-warn');
  const shopHoursMinText = el('shopHoursMinText');
  const shopHoursMaxText = el('shopHoursMaxText');

  // Pricing adjustments
  const rushToggle = el('rushToggle');
  const rushPercent = el('rushPercent');
  const markupPercent = el('markupPercent');
  const taxPercent = el('taxPercent');

  // Travel
  const travelRequired = el('travelRequired');
  const travelPanel = el('travel-panel');
  const travelCallout = el('travelCallout');
  const travelDistance = el('travelDistance');
  const travelMileageRate = el('travelMileageRate');
  const travelTolls = el('travelTolls');

  // Materials
  const materialsCost = el('materialsCost');

  // Actions
  const exampleBtn = el('exampleBtn');
  const resetBtn = el('resetBtn');
  const copyBtn = el('copyBtn');

  // Summary fields
  const sum_totalHours = el('sum_totalHours');
  const sum_shopHours = el('sum_shopHours');
  const sum_onsiteHours = el('sum_onsiteHours');
  const sum_laborCost = el('sum_laborCost');
  const sum_markup = el('sum_markup');
  const sum_rush = el('sum_rush');
  const sum_laborAfter = el('sum_laborAfter');
  const sum_materials = el('sum_materials');
  const sum_travel = el('sum_travel');
  const sum_subtotalBeforeTax = el('sum_subtotalBeforeTax');
  const sum_tax = el('sum_tax');
  const sum_total = el('sum_total');
  const totalHoursText = el('totalHoursText');

  // Defaults
  const DEFAULTS = {
    shopRate: 95,
    onsiteRate: 115,
    rushPercent: 15,
    markupPercent: 0,
    taxPercent: 10,
    travelCallout: 0,
    travelDistance: 0,
    travelMileageRate: 0.67,
    travelTolls: 0,
    materialsCost: 0,
  };

  // Initialize defaults
  function setDefaults() {
    shopRate.value = DEFAULTS.shopRate;
    onsiteRate.value = DEFAULTS.onsiteRate;
    rushPercent.value = DEFAULTS.rushPercent;
    markupPercent.value = DEFAULTS.markupPercent;
    taxPercent.value = DEFAULTS.taxPercent;
    travelCallout.value = DEFAULTS.travelCallout;
    travelDistance.value = DEFAULTS.travelDistance;
    travelMileageRate.value = DEFAULTS.travelMileageRate;
    travelTolls.value = DEFAULTS.travelTolls;
    materialsCost.value = DEFAULTS.materialsCost;

    // Clear tasks
    fitMin.value = fitMax.value = '';
    prepMin.value = prepMax.value = '';
    cleanMin.value = cleanMax.value = '';
    weldingInclude.checked = false;
    weldMin.value = weldMax.value = '';

    // Location default to shop
    workShop.checked = true;
    onSiteMin.value = onSiteMax.value = '';

    // Travel off
    travelRequired.checked = false;
    travelPanel.style.display = 'none';

    // Clear warnings
    clearAllWarnings();
    update();
  }

  // Hook up event listeners
  function bindEvents() {
    const inputs = [
      fitMin, fitMax, prepMin, prepMax, cleanMin, cleanMax, weldingInclude, weldMin, weldMax,
      shopRate, onsiteRate, onSiteMin, onSiteMax,
      rushToggle, rushPercent, markupPercent, taxPercent,
      travelRequired, travelCallout, travelDistance, travelMileageRate, travelTolls,
      materialsCost
    ];

    inputs.forEach(i => {
      if (i) i.addEventListener('input', update);
      if (i && (i.type === 'checkbox')) i.addEventListener('change', update);
    });

    // radios for location
    [workShop, workOnsite, workMixed].forEach(r => {
      r.addEventListener('change', () => {
        updateMixedVisibility();
        update();
      });
    });

    travelRequired.addEventListener('change', () => {
      travelPanel.style.display = travelRequired.checked ? 'block' : 'none';
      update();
    });

    exampleBtn.addEventListener('click', () => {
      setExampleValues();
      update();
    });

    resetBtn.addEventListener('click', () => {
      setDefaults();
      update();
    });

    copyBtn.addEventListener('click', copySummary);

    // initialize visibility
    updateMixedVisibility();
    travelPanel.style.display = travelRequired.checked ? 'block' : 'none';
  }

  function updateMixedVisibility() {
    if (workMixed.checked) {
      mixedPanel.style.display = 'block';
    } else {
      mixedPanel.style.display = 'none';
      // hide mixed warnings
      onsiteWarn.textContent = '';
    }
  }

  function clearAllWarnings() {
    fitWarn.textContent = '';
    prepWarn.textContent = '';
    cleanWarn.textContent = '';
    weldWarn.textContent = '';
    onsiteWarn.textContent = '';
    timeGlobalWarn.textContent = '';
  }

  // Validation for each task min/max
  function validateTask(minVal, maxVal, warnEl) {
    warnEl.textContent = '';
    if (minVal > maxVal) {
      warnEl.textContent = 'Min cannot be greater than Max';
      return false;
    }
    return true;
  }

  function validateAllTasks(totalMin, totalMax) {
    // read values
    const fMin = toNum(fitMin.value);
    const fMax = toNum(fitMax.value);
    const pMin = toNum(prepMin.value);
    const pMax = toNum(prepMax.value);
    const cMin = toNum(cleanMin.value);
    const cMax = toNum(cleanMax.value);
    const wMin = toNum(weldMin.value);
    const wMax = toNum(weldMax.value);

    let ok = true;
    if (!validateTask(fMin, fMax, fitWarn)) ok = false;
    if (!validateTask(pMin, pMax, prepWarn)) ok = false;
    if (!validateTask(cMin, cMax, cleanWarn)) ok = false;
    if (weldingInclude.checked) {
      if (!validateTask(wMin, wMax, weldWarn)) ok = false;
    } else {
      // clear weld warnings when not included
      weldWarn.textContent = '';
    }

    if (!ok) {
      timeGlobalWarn.textContent = 'Fix Min/Max errors to calculate totals.';
    } else {
      timeGlobalWarn.textContent = '';
    }

    return ok;
  }

  // Validate mixed on-site hours based on total hours
  function validateMixed(totalMin, totalMax) {
    onsiteWarn.textContent = '';
    if (!workMixed.checked) return true;

    const oMin = toNum(onSiteMin.value);
    const oMax = toNum(onSiteMax.value);

    if (oMin > oMax) {
      onsiteWarn.textContent = 'Min cannot be greater than Max';
      return false;
    }
    // require oMin <= totalMin and oMax <= totalMax
    if (oMin < 0 || oMax < 0) {
      onsiteWarn.textContent = 'On-site hours must be >= 0';
      return false;
    }
    if (oMin > totalMin) {
      onsiteWarn.textContent = 'On-site min cannot exceed total labor min';
      return false;
    }
    if (oMax > totalMax) {
      onsiteWarn.textContent = 'On-site max cannot exceed total labor max';
      return false;
    }
    return true;
  }

  // Main update/calculation function
  function update() {
    // Clear computed placeholders first
    totalHoursText.textContent = dash;

    // Clear derived shop hours display
    shopHoursMinText.textContent = dash;
    shopHoursMaxText.textContent = dash;

    // Reset summary
    const resetSummary = () => {
      const nodes = [sum_totalHours, sum_shopHours, sum_onsiteHours, sum_laborCost, sum_markup, sum_rush, sum_laborAfter, sum_materials, sum_travel, sum_subtotalBeforeTax, sum_tax, sum_total];
      nodes.forEach(n => { n.textContent = dash; });
      copyBtn.disabled = true;
    };

    clearAllWarnings();

    // Read task values
    const fMin = toNum(fitMin.value);
    const fMax = toNum(fitMax.value);
    const pMin = toNum(prepMin.value);
    const pMax = toNum(prepMax.value);
    const cMin = toNum(cleanMin.value);
    const cMax = toNum(cleanMax.value);
    const wMin = toNum(weldMin.value);
    const wMax = toNum(weldMax.value);

    // Validate tasks
    const tasksOk = validateAllTasks();
    if (!tasksOk) {
      resetSummary();
      totalHoursText.textContent = dash;
      return;
    }

    // Compute totals depending on welding included
    const totalMin = fMin + pMin + cMin + (weldingInclude.checked ? wMin : 0);
    const totalMax = fMax + pMax + cMax + (weldingInclude.checked ? wMax : 0);

    totalHoursText.textContent = `${totalMin.toFixed(2)} / ${totalMax.toFixed(2)}`;

    // Validate mixed/onsite input if mixed selected
    const mixedOk = validateMixed(totalMin, totalMax);
    if (!mixedOk) {
      resetSummary();
      totalHoursText.textContent = `${totalMin.toFixed(2)} / ${totalMax.toFixed(2)}`;
      copyBtn.disabled = true;
      return;
    }

    // Location and rates
    const sRate = toNum(shopRate.value);
    const oRate = toNum(onsiteRate.value);

    // Determine on-site/shop hours ranges
    let onMin = 0, onMax = 0, shopMin = 0, shopMax = 0;

    if (workShop.checked) {
      onMin = onMax = 0;
      shopMin = totalMin;
      shopMax = totalMax;
    } else if (workOnsite.checked) {
      onMin = totalMin;
      onMax = totalMax;
      shopMin = shopMax = 0;
    } else {
      // mixed
      onMin = toNum(onSiteMin.value);
      onMax = toNum(onSiteMax.value);
      // Derived shop hours: shop = total - onSite
      shopMin = +(totalMin - onMin).toFixed(6);
      shopMax = +(totalMax - onMax).toFixed(6);
      // Ensure not negative
      if (shopMin < 0) shopMin = 0;
      if (shopMax < 0) shopMax = 0;
    }

    // Show derived shop hours (read-only)
    shopHoursMinText.textContent = (Number.isFinite(shopMin) ? shopMin.toFixed(2) : dash);
    shopHoursMaxText.textContent = (Number.isFinite(shopMax) ? shopMax.toFixed(2) : dash);

    // Labor cost calculations
    // Labor cost min/max = shopHours*shopRate + onSiteHours*onSiteRate
    const laborCostMin = shopMin * sRate + onMin * oRate;
    const laborCostMax = shopMax * sRate + onMax * oRate;

    // Markup and rush (labor only)
    const markupPct = toNum(markupPercent.value) / 100;
    const rushPct = toNum(rushPercent.value) / 100;
    const rushEnabled = rushToggle.checked;

    const markupAmountMin = laborCostMin * markupPct;
    const markupAmountMax = laborCostMax * markupPct;

    const rushAmountMin = rushEnabled ? (laborCostMin * rushPct) : 0;
    const rushAmountMax = rushEnabled ? (laborCostMax * rushPct) : 0;

    const laborAfterMin = laborCostMin + markupAmountMin + rushAmountMin;
    const laborAfterMax = laborCostMax + markupAmountMax + rushAmountMax;

    // Materials
    const materials = toNum(materialsCost.value);

    // Travel subtotal
    let travelSubtotal = 0;
    if (travelRequired.checked) {
      const callout = toNum(travelCallout.value);
      const distance = toNum(travelDistance.value);
      const mileageRate = toNum(travelMileageRate.value);
      const tolls = toNum(travelTolls.value);
      travelSubtotal = callout + (distance * mileageRate) + tolls;
    } else {
      travelSubtotal = 0;
    }

    // Subtotal before tax (min/max) = laborAfter + materials + travel
    const subtotalMin = laborAfterMin + materials + travelSubtotal;
    const subtotalMax = laborAfterMax + materials + travelSubtotal;

    // Tax applies to final total (on subtotal)
    const taxPct = toNum(taxPercent.value) / 100;
    const taxAmountMin = subtotalMin * taxPct;
    const taxAmountMax = subtotalMax * taxPct;

    const totalMinVal = subtotalMin + taxAmountMin;
    const totalMaxVal = subtotalMax + taxAmountMax;

    // Update summary UI
    sum_totalHours.textContent = `${totalMin.toFixed(2)} / ${totalMax.toFixed(2)} hrs`;
    sum_shopHours.textContent = `${shopMin.toFixed(2)} / ${shopMax.toFixed(2)} hrs @ ${currency(sRate)}`;
    sum_onsiteHours.textContent = `${onMin.toFixed(2)} / ${onMax.toFixed(2)} hrs @ ${currency(oRate)}`;
    sum_laborCost.textContent = `${currency(laborCostMin)} / ${currency(laborCostMax)}`;
    sum_markup.textContent = `${currency(markupAmountMin)} / ${currency(markupAmountMax)} (${(markupPct*100).toFixed(2)}%)`;
    sum_rush.textContent = `${currency(rushAmountMin)} / ${currency(rushAmountMax)} ${rushEnabled ? '' : '(ignored)'}`;
    sum_laborAfter.textContent = `${currency(laborAfterMin)} / ${currency(laborAfterMax)}`;
    sum_materials.textContent = currency(materials);
    sum_travel.textContent = currency(travelSubtotal);
    sum_subtotalBeforeTax.textContent = `${currency(subtotalMin)} / ${currency(subtotalMax)}`;
    sum_tax.textContent = `${currency(taxAmountMin)} / ${currency(taxAmountMax)} (${(taxPct*100).toFixed(2)}%)`;
    sum_total.textContent = `${currency(totalMinVal)} / ${currency(totalMaxVal)}`;

    // Enable copy
    copyBtn.disabled = false;
  }

  // Copy summary to clipboard
  function copySummary() {
    // If copy disabled, do nothing
    if (copyBtn.disabled) return;

    // Check validation again quickly to ensure correct state
    // Read task values and validate
    const fMin = toNum(fitMin.value);
    const fMax = toNum(fitMax.value);
    const pMin = toNum(prepMin.value);
    const pMax = toNum(prepMax.value);
    const cMin = toNum(cleanMin.value);
    const cMax = toNum(cleanMax.value);
    const wMin = toNum(weldMin.value);
    const wMax = toNum(weldMax.value);
    if (!validateAllTasks()) {
      navigator.clipboard?.writeText('Fix Min/Max errors to generate summary.')?.catch(()=>{});
      return;
    }

    // Build a textual summary snapshot
    const totalHours = sum_totalHours.textContent;
    const shopRateVal = toNum(shopRate.value);
    const onsiteRateVal = toNum(onsiteRate.value);

    // Read values again for accurate numbers
    const totalRange = sum_totalHours.textContent;
    const shopHoursStr = sum_shopHours.textContent;
    const onsiteHoursStr = sum_onsiteHours.textContent;
    const laborCostStr = sum_laborCost.textContent;
    const markupStr = sum_markup.textContent;
    const rushStr = sum_rush.textContent;
    const laborAfterStr = sum_laborAfter.textContent;
    const materialsStr = sum_materials.textContent;
    const travelStr = sum_travel.textContent;
    const subtotalStr = sum_subtotalBeforeTax.textContent;
    const taxStr = sum_tax.textContent;
    const totalStr = sum_total.textContent;

    const inputsSnapshot = [
      `Work location: ${workShop.checked ? 'Shop only' : workOnsite.checked ? 'On-site only' : 'Mixed (shop+on-site)'}`,
      `Shop rate: ${currency(shopRateVal)}`,
      `On-site rate: ${currency(onsiteRateVal)}`,
      `Rush job: ${rushToggle.checked ? 'Yes' : 'No'} (Rush %: ${toNum(rushPercent.value)}%)`,
      `Markup % (labor): ${toNum(markupPercent.value)}%`,
      `Sales tax % (final total): ${toNum(taxPercent.value)}%`,
      `Materials & consumables: ${currency(toNum(materialsCost.value))}`,
      `Travel required: ${travelRequired.checked ? 'Yes' : 'No'}`,
    ];

    if (workMixed.checked) {
      inputsSnapshot.push(`On-site hours (min/max): ${onSiteMin.value || 0} / ${onSiteMax.value || 0}`);
    }

    if (travelRequired.checked) {
      inputsSnapshot.push(`Travel callout: ${currency(toNum(travelCallout.value))}`);
      inputsSnapshot.push(`Round-trip distance: ${toNum(travelDistance.value)} (units)`);
      inputsSnapshot.push(`Mileage rate: ${currency(toNum(travelMileageRate.value))} per unit`);
      inputsSnapshot.push(`Tolls/parking: ${currency(toNum(travelTolls.value))}`);
    }

    // Compose text
    const lines = [
      'PWS Welding Job Pricing Calculator - Summary',
      '',
      'INPUTS:',
      ...inputsSnapshot,
      '',
      'TIME TOTALS:',
      `Total labor hours (min/max): ${totalRange}`,
      `Shop hours & rate: ${shopHoursStr}`,
      `On-site hours & rate: ${onsiteHoursStr}`,
      '',
      'COSTS:',
      `Labor cost (min/max): ${laborCostStr}`,
      `Markup (min/max): ${markupStr}`,
      `Rush (min/max): ${rushStr}`,
      `Labor after markup + rush (min/max): ${laborAfterStr}`,
      `Materials: ${materialsStr}`,
      `Travel subtotal: ${travelStr}`,
      `Subtotal before tax (min/max): ${subtotalStr}`,
      `Sales tax (min/max): ${taxStr}`,
      `TOTAL PRICE RANGE (min/max): ${totalStr}`,
    ];

    const finalText = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(finalText).then(() => {
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => copyBtn.textContent = 'Copy Summary', 1400);
      }).catch(() => {
        alert('Unable to copy to clipboard.');
      });
    } else {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = finalText;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => copyBtn.textContent = 'Copy Summary', 1400);
      } catch (e) {
        alert('Unable to copy to clipboard.');
      }
      document.body.removeChild(ta);
    }
  }

  function setExampleValues() {
    // Example: mixed job, some task hours, travel enabled
    fitMin.value = 2;
    fitMax.value = 3;
    prepMin.value = 1;
    prepMax.value = 2;
    cleanMin.value = 0.5;
    cleanMax.value = 1;
    weldingInclude.checked = true;
    weldMin.value = 4;
    weldMax.value = 6;

    workMixed.checked = true;
    workShop.checked = false;
    workOnsite.checked = false;
    shopRate.value = 95;
    onsiteRate.value = 115;

    // total min = 2+1+0.5+4 = 7.5 ; total max = 3+2+1+6 = 12
    // set on-site hours within those ranges
    onSiteMin.value = 3;
    onSiteMax.value = 5;

    rushToggle.checked = true;
    rushPercent.value = 20;

    markupPercent.value = 10;
    taxPercent.value = 10;

    materialsCost.value = 250;

    travelRequired.checked = true;
    travelPanel.style.display = 'block';
    travelCallout.value = 150;
    travelDistance.value = 120;
    travelMileageRate.value = 0.67;
    travelTolls.value = 12;
  }

  // INITIALIZE
  bindEvents();
  setDefaults();
})();
