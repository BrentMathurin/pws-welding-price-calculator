(() => {
  const $ = sel => document.querySelector(sel);

  // existing inputs
  const hourlyRate = $('#hourlyRate');
  const materials = $('#materials');
  const includeWelding = $('#includeWelding');
  const markup = $('#markup');
  const rushOn = $('#rushOn');
  const rushPct = $('#rushPct');
  const taxPct = $('#taxPct');
  const notes = $('#notes');

  const exampleBtn = $('#exampleBtn');
  const resetBtn = $('#resetBtn');
  const copyBtn = $('#copyBtn');

  const validation = $('#validation');

  // onsite & travel inputs
  const onSite = $('#onSite');
  const shopRate = $('#shopRate');
  const siteRate = $('#siteRate');

  // shopMin/shopMax are DISPLAY ONLY (readonly)
  const shopMin = $('#shopMin');
  const shopMax = $('#shopMax');

  // on-site hours are user inputs
  const siteMin = $('#siteMin');
  const siteMax = $('#siteMax');
  const siteWarn = $('#siteWarn');
  const shopWarn = $('#shopWarn'); // kept for layout consistency; not used for validation

  const travelOn = $('#travelOn');
  const calloutFee = $('#calloutFee');
  const miles = $('#miles');
  const mileageRate = $('#mileageRate');
  const tolls = $('#tolls');

  // outputs
  const totalMinOut = $('#totalMin');
  const totalMaxOut = $('#totalMax');
  const laborMinOut = $('#laborMin');
  const laborMaxOut = $('#laborMax');
  const markupMinOut = $('#markupMin');
  const markupMaxOut = $('#markupMax');
  const rushMinOut = $('#rushMin');
  const rushMaxOut = $('#rushMax');
  const materialsOut = $('#materialsOut');
  const subMinOut = $('#subMin');
  const subMaxOut = $('#subMax');
  const taxMinOut = $('#taxMin');
  const taxMaxOut = $('#taxMax');
  const totalRangeOut = $('#totalRange');

  const shopLaborMinOut = $('#shopLaborMin');
  const shopLaborMaxOut = $('#shopLaborMax');
  const siteLaborMinOut = $('#siteLaborMin');
  const siteLaborMaxOut = $('#siteLaborMax');
  const travelOut = $('#travelOut');

  // summary row wrappers (robust hide/show)
  const shopLaborMinLine = $('#shopLaborMinLine');
  const shopLaborMaxLine = $('#shopLaborMaxLine');
  const siteLaborMinLine = $('#siteLaborMinLine');
  const siteLaborMaxLine = $('#siteLaborMaxLine');
  const travelLine = $('#travelLine');

  const taskEls = Array.from(document.querySelectorAll('.task'));

  function readTasks() {
    return taskEls.map(el => {
      const key = el.dataset.key;
      const min = Math.max(0, parseFloat(el.querySelector('.min').value) || 0);
      const max = Math.max(0, parseFloat(el.querySelector('.max').value) || 0);
      return { key, min, max, el };
    });
  }

  function clampPctInput(input) {
    let v = parseFloat(input.value);
    if (isNaN(v)) v = 0;
    v = Math.max(0, Math.min(100, v));
    input.value = (Math.round(v * 10) / 10).toString();
    return v / 100;
  }

  function currency(n) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function setText(el, txt) { if (el) el.textContent = txt; }
  function showValidation(msg) { validation.textContent = msg || ''; }

  function markInvalid(el, yes) {
    if (!el) return;
    if (yes) el.classList.add('invalid');
    else el.classList.remove('invalid');
  }

  function setRowHidden(rowEl, hide) {
    if (!rowEl) return;
    rowEl.classList.toggle('hidden', !!hide);
  }

  function toggleOnSiteUI(enabled) {
    [shopRate, siteRate, siteMin, siteMax].forEach(inp => inp.disabled = !enabled);

    const groups = Array.from(document.querySelectorAll('.onsite-task'));
    groups.forEach(n => enabled ? n.classList.remove('disabled') : n.classList.add('disabled'));

    // clear shopWarn because shop hours are derived, not validated
    if (shopWarn) shopWarn.textContent = '';
  }

  function toggleTravelUI(enabled) {
    [calloutFee, miles, mileageRate, tolls].forEach(inp => inp.disabled = !enabled);
  }

  function clearOutputs() {
    const outs = [
      totalMinOut,totalMaxOut,laborMinOut,laborMaxOut,markupMinOut,markupMaxOut,
      rushMinOut,rushMaxOut,materialsOut,subMinOut,subMaxOut,taxMinOut,taxMaxOut,
      totalRangeOut,shopLaborMinOut,shopLaborMaxOut,siteLaborMinOut,siteLaborMaxOut,travelOut
    ];
    outs.forEach(o => setText(o, '—'));
    if (shopMin) shopMin.value = '—';
    if (shopMax) shopMax.value = '—';
  }

  function compute() {
    const mk = clampPctInput(markup);
    const tx = clampPctInput(taxPct);
    const rPct = clampPctInput(rushPct);

    rushPct.disabled = !rushOn.checked;
    rushPct.style.opacity = rushOn.checked ? '1' : '0.5';

    const tasks = readTasks();

    // validate task min/max
    let invalid = false;
    tasks.forEach(t => {
      const warn = t.el.querySelector('.warn');
      if (t.min > t.max) {
        warn.textContent = 'Min cannot be greater than Max';
        markInvalid(t.el, true);
        invalid = true;
      } else {
        warn.textContent = '';
        markInvalid(t.el, false);
      }
    });

    // validate on-site min/max only when enabled
    const onSiteEnabled = onSite.checked;

    const siteMinVal = Math.max(0, parseFloat(siteMin.value) || 0);
    const siteMaxVal = Math.max(0, parseFloat(siteMax.value) || 0);
    siteMin.value = siteMinVal;
    siteMax.value = siteMaxVal;

    if (onSiteEnabled) {
      if (siteMinVal > siteMaxVal) {
        siteWarn.textContent = 'Min cannot be greater than Max';
        markInvalid(siteWarn.parentElement, true);
        invalid = true;
      } else {
        siteWarn.textContent = '';
        markInvalid(siteWarn.parentElement, false);
      }
    } else {
      siteWarn.textContent = '';
      markInvalid(siteWarn.parentElement, false);
    }

    // clamp travel inputs
    const callout = Math.max(0, parseFloat(calloutFee.value) || 0);
    const milesVal = Math.max(0, parseFloat(miles.value) || 0);
    const mileage = Math.max(0, parseFloat(mileageRate.value) || 0);
    const tollsVal = Math.max(0, parseFloat(tolls.value) || 0);

    calloutFee.value = callout;
    miles.value = milesVal;
    mileageRate.value = mileage;
    tolls.value = tollsVal;

    if (invalid) {
      showValidation('Please correct fields marked in red. Min must be ≤ Max.');
      clearOutputs();
      return;
    } else {
      showValidation('');
    }

    // aggregate task hours (respect welding toggle)
    const weldingIncluded = includeWelding.checked;
    const agg = tasks.reduce((acc, t) => {
      const mult = (t.key === 'welding' && !weldingIncluded) ? 0 : 1;
      acc.min += t.min * mult;
      acc.max += t.max * mult;
      return acc;
    }, { min: 0, max: 0 });

    // derived shop hours (readonly display)
    if (shopMin) shopMin.value = agg.min.toFixed(2);
    if (shopMax) shopMax.value = agg.max.toFixed(2);
    if (shopWarn) shopWarn.textContent = '';

    // compute labor
    let shopLaborMin = 0, shopLaborMax = 0;
    let onSiteLaborMin = 0, onSiteLaborMax = 0;
    let laborMin = 0, laborMax = 0;

    if (!onSiteEnabled) {
      // legacy: single hourly rate
      const hr = Math.max(0, parseFloat(hourlyRate.value) || 0);
      shopLaborMin = agg.min * hr;
      shopLaborMax = agg.max * hr;
      laborMin = shopLaborMin;
      laborMax = shopLaborMax;
    } else {
      const sRate = Math.max(0, parseFloat(shopRate.value) || 0);
      const siteR = Math.max(0, parseFloat(siteRate.value) || 0);

      shopLaborMin = agg.min * sRate;
      shopLaborMax = agg.max * sRate;

      onSiteLaborMin = siteMinVal * siteR;
      onSiteLaborMax = siteMaxVal * siteR;

      laborMin = shopLaborMin + onSiteLaborMin;
      laborMax = shopLaborMax + onSiteLaborMax;
    }

    // markup/rush on labor only
    const mkMin = laborMin * mk;
    const mkMax = laborMax * mk;

    const rushEnabled = rushOn.checked;
    const rushMinVal = rushEnabled ? laborMin * rPct : 0;
    const rushMaxVal = rushEnabled ? laborMax * rPct : 0;

    // materials
    const mats = Math.max(0, parseFloat(materials.value) || 0);

    // travel (taxable, not subject to markup/rush)
    const travelEnabled = travelOn.checked;
    const travelTotal = travelEnabled ? (callout + (milesVal * mileage) + tollsVal) : 0;

    // subtotal/tax/total
    const subMin = laborMin + mkMin + rushMinVal + mats + travelTotal;
    const subMax = laborMax + mkMax + rushMaxVal + mats + travelTotal;

    const taxMin = subMin * tx;
    const taxMax = subMax * tx;

    const totalMin = subMin + taxMin;
    const totalMax = subMax + taxMax;

    // hours display: shop task hours + onsite hours (only if enabled)
    const totalHrsMin = onSiteEnabled ? (agg.min + siteMinVal) : agg.min;
    const totalHrsMax = onSiteEnabled ? (agg.max + siteMaxVal) : agg.max;

    setText(totalMinOut, totalHrsMin.toFixed(2));
    setText(totalMaxOut, totalHrsMax.toFixed(2));

    setText(shopLaborMinOut, currency(shopLaborMin));
    setText(shopLaborMaxOut, currency(shopLaborMax));
    setText(siteLaborMinOut, currency(onSiteLaborMin));
    setText(siteLaborMaxOut, currency(onSiteLaborMax));

    setText(laborMinOut, currency(laborMin));
    setText(laborMaxOut, currency(laborMax));

    setText(markupMinOut, currency(mkMin));
    setText(markupMaxOut, currency(mkMax));

    setText(rushMinOut, currency(rushMinVal));
    setText(rushMaxOut, currency(rushMaxVal));

    setText(materialsOut, currency(mats));
    setText(travelOut, currency(travelTotal));

    setText(subMinOut, currency(subMin));
    setText(subMaxOut, currency(subMax));

    setText(taxMinOut, currency(taxMin));
    setText(taxMaxOut, currency(taxMax));

    setText(totalRangeOut, `${currency(totalMin)} — ${currency(totalMax)}`);

    // hide/show breakdown rows
    setRowHidden(shopLaborMinLine, !onSiteEnabled);
    setRowHidden(shopLaborMaxLine, !onSiteEnabled);
    setRowHidden(siteLaborMinLine, !onSiteEnabled);
    setRowHidden(siteLaborMaxLine, !onSiteEnabled);

    setRowHidden(travelLine, !travelEnabled);
  }

  function attach() {
    const inputs = [
      hourlyRate, materials, includeWelding, markup, rushOn, rushPct, taxPct, notes,
      onSite, shopRate, siteRate, siteMin, siteMax,
      travelOn, calloutFee, miles, mileageRate, tolls
    ];

    inputs.forEach(i => {
      i.addEventListener('input', compute);
      i.addEventListener('change', compute);
    });

    taskEls.forEach(t => {
      t.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', compute);
        inp.addEventListener('change', compute);
      });
    });

    onSite.addEventListener('change', () => {
      toggleOnSiteUI(onSite.checked);
      compute();
    });

    travelOn.addEventListener('change', () => {
      toggleTravelUI(travelOn.checked);
      compute();
    });

    exampleBtn.addEventListener('click', () => {
      hourlyRate.value = '95';

      const map = { fitup:[1,2], jointprep:[0.5,1.5], cleaning:[0.25,0.5], welding:[1.5,3] };
      taskEls.forEach(el => {
        const key = el.dataset.key;
        const arr = map[key] || [0,0];
        el.querySelector('.min').value = arr[0];
        el.querySelector('.max').value = arr[1];
      });

      includeWelding.checked = true;
      materials.value = '120';
      markup.value = '20';
      rushOn.checked = true;
      rushPct.value = '15';
      taxPct.value = '10';
      notes.value = 'Example: Fabrication for site A. Verify delivery & access.';

      onSite.checked = true;
      shopRate.value = '95';
      siteRate.value = '115';
      siteMin.value = '2';
      siteMax.value = '4';

      travelOn.checked = true;
      calloutFee.value = '85';
      miles.value = '40';
      mileageRate.value = '0.67';
      tolls.value = '10';

      toggleOnSiteUI(onSite.checked);
      toggleTravelUI(travelOn.checked);
      compute();
    });

    resetBtn.addEventListener('click', () => {
      hourlyRate.value = '95';
      taskEls.forEach(el => { el.querySelector('.min').value = '0'; el.querySelector('.max').value = '0'; });

      includeWelding.checked = true;
      materials.value = '0';
      markup.value = '0';
      rushOn.checked = false;
      rushPct.value = '15';
      taxPct.value = '10';
      notes.value = '';

      onSite.checked = false;
      shopRate.value = '95';
      siteRate.value = '115';
      siteMin.value = '0';
      siteMax.value = '0';

      travelOn.checked = false;
      calloutFee.value = '0';
      miles.value = '0';
      mileageRate.value = '0.67';
      tolls.value = '0';

      toggleOnSiteUI(onSite.checked);
      toggleTravelUI(travelOn.checked);
      compute();
    });

    copyBtn.addEventListener('click', async () => {
      compute(); // ensure UI is current

      const tasks = readTasks();
      if (tasks.some(t => t.min > t.max)) {
        alert('Please fix min/max values before copying the summary.');
        return;
      }

      const onSiteEnabled = onSite.checked;
      if (onSiteEnabled && (parseFloat(siteMin.value) > parseFloat(siteMax.value))) {
        alert('Please fix on-site min/max values before copying the summary.');
        return;
      }

      const weldingIncluded = includeWelding.checked;
      const agg = tasks.reduce((acc,t)=>{
        const mult = (t.key === 'welding' && !weldingIncluded) ? 0 : 1;
        acc.min += t.min * mult;
        acc.max += t.max * mult;
        return acc;
      }, {min:0,max:0});

      const mats = Math.max(0, parseFloat(materials.value) || 0);

      const mkPct = Math.max(0, parseFloat(markup.value) || 0);
      const rushEnabled = rushOn.checked;
      const rushP = Math.max(0, parseFloat(rushPct.value) || 0);
      const txP = Math.max(0, parseFloat(taxPct.value) || 0);

      // Travel
      const travelEnabled = travelOn.checked;
      const callout = Math.max(0, parseFloat(calloutFee.value) || 0);
      const milesVal = Math.max(0, parseFloat(miles.value) || 0);
      const mileage = Math.max(0, parseFloat(mileageRate.value) || 0);
      const tollsVal = Math.max(0, parseFloat(tolls.value) || 0);
      const travelTotal = travelEnabled ? (callout + (milesVal * mileage) + tollsVal) : 0;

      let shopLaborMin = 0, shopLaborMax = 0, siteLaborMin = 0, siteLaborMax = 0;
      let laborMin = 0, laborMax = 0;

      if (!onSiteEnabled) {
        const hr = Math.max(0, parseFloat(hourlyRate.value) || 0);
        shopLaborMin = agg.min * hr;
        shopLaborMax = agg.max * hr;
        laborMin = shopLaborMin;
        laborMax = shopLaborMax;
      } else {
        const sRate = Math.max(0, parseFloat(shopRate.value) || 0);
        const siteR = Math.max(0, parseFloat(siteRate.value) || 0);
        const siteMinVal = Math.max(0, parseFloat(siteMin.value) || 0);
        const siteMaxVal = Math.max(0, parseFloat(siteMax.value) || 0);

        shopLaborMin = agg.min * sRate;
        shopLaborMax = agg.max * sRate;
        siteLaborMin = siteMinVal * siteR;
        siteLaborMax = siteMaxVal * siteR;

        laborMin = shopLaborMin + siteLaborMin;
        laborMax = shopLaborMax + siteLaborMax;
      }

      const mkMin = laborMin * (mkPct/100);
      const mkMax = laborMax * (mkPct/100);
      const rushMin = rushEnabled ? laborMin * (rushP/100) : 0;
      const rushMax = rushEnabled ? laborMax * (rushP/100) : 0;

      const subMin = laborMin + mkMin + rushMin + mats + travelTotal;
      const subMax = laborMax + mkMax + rushMax + mats + travelTotal;

      const taxMin = subMin * (txP/100);
      const taxMax = subMax * (txP/100);

      const totalMin = subMin + taxMin;
      const totalMax = subMax + taxMax;

      const stamp = new Date().toLocaleString();

      const taskLines = tasks.map(t => {
        const excluded = (t.key === 'welding' && !weldingIncluded) ? ' (excluded)' : '';
        return `- ${t.key}: ${t.min} – ${t.max} hrs${excluded}`;
      }).join('\n');

      const travelSection = travelEnabled ? [
        `Travel / Mobilization:`,
        `- Call-out fee: ${currency(callout)}`,
        `- Miles: ${milesVal} @ ${currency(mileage)} / mi => ${currency(milesVal * mileage)}`,
        `- Tolls / parking: ${currency(tollsVal)}`,
        `- Travel total: ${currency(travelTotal)}`
      ].join('\n') : 'Travel / Mobilization: not used';

      const summary = [
        `Progressive Welding Solutions — Quote Summary`,
        `Date: ${stamp}`,
        ``,
        `Rates:`,
        `- Legacy hourly rate: ${currency(Math.max(0, parseFloat(hourlyRate.value)||0))}`,
        `- Shop hourly rate: ${currency(Math.max(0, parseFloat(shopRate.value)||0))}`,
        `- On-site hourly rate: ${currency(Math.max(0, parseFloat(siteRate.value)||0))}`,
        ``,
        `Task hours (shop):`,
        taskLines,
        ``,
        `Derived shop hours total: ${agg.min.toFixed(2)} – ${agg.max.toFixed(2)} hrs`,
        `On-site hours: ${onSiteEnabled ? `${Math.max(0, parseFloat(siteMin.value)||0).toFixed(2)} – ${Math.max(0, parseFloat(siteMax.value)||0).toFixed(2)} hrs` : 'not used'}`,
        ``,
        `Labor:`,
        `- Shop labor (MIN – MAX): ${currency(shopLaborMin)} – ${currency(shopLaborMax)}`,
        `- On-site labor (MIN – MAX): ${currency(siteLaborMin)} – ${currency(siteLaborMax)}`,
        `- Total labor (MIN – MAX): ${currency(laborMin)} – ${currency(laborMax)}`,
        ``,
        `Adjustments:`,
        `- Markup (${mkPct}% on labor): ${currency(mkMin)} – ${currency(mkMax)}`,
        `- Rush${rushEnabled ? ` (${rushP}% on labor)` : ''}: ${currency(rushMin)} – ${currency(rushMax)}`,
        ``,
        `Materials: ${currency(mats)}`,
        ``,
        travelSection,
        ``,
        `Subtotal (MIN – MAX): ${currency(subMin)} – ${currency(subMax)}`,
        `Tax (${txP}%): ${currency(taxMin)} – ${currency(taxMax)}`,
        `Total (MIN – MAX): ${currency(totalMin)} – ${currency(totalMax)}`,
        ``,
        `Notes:`,
        notes.value || '(none)',
        ``,
        `Educational estimate only. Verify local tax rules.`
      ].join('\n');

      try {
        await navigator.clipboard.writeText(summary);
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => copyBtn.textContent = 'Copy Summary', 1200);
      } catch (err) {
        alert('Copy failed. You can manually select the summary on the page to copy.');
      }
    });

    toggleOnSiteUI(onSite.checked);
    toggleTravelUI(travelOn.checked);
    compute();
  }

  window.addEventListener('load', attach);
})();
