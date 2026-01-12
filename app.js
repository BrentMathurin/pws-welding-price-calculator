(() => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

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

  // new onsite & travel inputs
  const onSite = $('#onSite');
  const shopRate = $('#shopRate');
  const siteRate = $('#siteRate');
  const shopMin = $('#shopMin');
  const shopMax = $('#shopMax');
  const siteMin = $('#siteMin');
  const siteMax = $('#siteMax');

  const travelOn = $('#travelOn');
  const calloutFee = $('#calloutFee');
  const miles = $('#miles');
  const mileageRate = $('#mileageRate');
  const tolls = $('#tolls');

  // outputs (existing + new)
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

  // new outputs
  const shopLaborMinOut = $('#shopLaborMin');
  const shopLaborMaxOut = $('#shopLaborMax');
  const siteLaborMinOut = $('#siteLaborMin');
  const siteLaborMaxOut = $('#siteLaborMax');
  const travelOut = $('#travelOut');

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

  function setText(el, txt) { el.textContent = txt; }

  function showValidation(msg) {
    validation.textContent = msg || '';
  }

  function markInvalid(el, yes) {
    if (!el) return;
    if (yes) el.classList.add('invalid');
    else el.classList.remove('invalid');
  }

  function toggleOnSiteUI(enabled) {
    const fieldset = document.querySelector('.onsite-travel');
    // disable/enable shop/site inputs when off
    [shopRate, siteRate, shopMin, shopMax, siteMin, siteMax].forEach(inp => {
      inp.disabled = !enabled;
    });
    // visually dim shop/site groups when disabled
    const shopTasks = Array.from(document.querySelectorAll('.onsite-task'));
    shopTasks.forEach(n => {
      if (!enabled) n.classList.add('disabled'); else n.classList.remove('disabled');
    });
  }

  function toggleTravelUI(enabled) {
    [calloutFee, miles, mileageRate, tolls].forEach(inp => inp.disabled = !enabled);
    const travelRow = travelOut ? travelOut.parentElement.parentElement : null;
    if (travelRow) {
      // no-op; travelOut always visible but value will be 0 when disabled
    }
  }

  function compute() {
    // clamp percents
    const mk = clampPctInput(markup);
    const tx = clampPctInput(taxPct);
    const rPct = clampPctInput(rushPct);
    // disable rush pct when off visually
    rushPct.disabled = !rushOn.checked;
    rushPct.style.opacity = rushOn.checked ? '1' : '0.5';

    // read tasks
    const tasks = readTasks();

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

    // validate shop/site pairs if onsite enabled
    const onSiteEnabled = onSite.checked;
    // ensure non-negative and clamp
    const shopMinVal = Math.max(0, parseFloat(shopMin.value) || 0);
    const shopMaxVal = Math.max(0, parseFloat(shopMax.value) || 0);
    shopMin.value = shopMinVal;
    shopMax.value = shopMaxVal;
    const siteMinVal = Math.max(0, parseFloat(siteMin.value) || 0);
    const siteMaxVal = Math.max(0, parseFloat(siteMax.value) || 0);
    siteMin.value = siteMinVal;
    siteMax.value = siteMaxVal;

    if (onSiteEnabled) {
      if (shopMinVal > shopMaxVal) {
        $('#shopWarn').textContent = 'Min cannot be greater than Max';
        markInvalid($('#shopWarn').parentElement, true);
        invalid = true;
      } else {
        $('#shopWarn').textContent = '';
        markInvalid($('#shopWarn').parentElement, false);
      }
      if (siteMinVal > siteMaxVal) {
        $('#siteWarn').textContent = 'Min cannot be greater than Max';
        markInvalid($('#siteWarn').parentElement, true);
        invalid = true;
      } else {
        $('#siteWarn').textContent = '';
        markInvalid($('#siteWarn').parentElement, false);
      }
    } else {
      // clear warnings
      $('#shopWarn').textContent = '';
      $('#siteWarn').textContent = '';
      markInvalid($('#shopWarn').parentElement, false);
      markInvalid($('#siteWarn').parentElement, false);
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
      // clear outputs
      const outs = [totalMinOut,totalMaxOut,laborMinOut,laborMaxOut,markupMinOut,markupMaxOut,rushMinOut,rushMaxOut,materialsOut,subMinOut,subMaxOut,taxMinOut,taxMaxOut,totalRangeOut,shopLaborMinOut,shopLaborMaxOut,siteLaborMinOut,siteLaborMaxOut,travelOut];
      outs.forEach(o => setText(o,'—'));
      return;
    } else {
      showValidation('');
    }

    // Compute totals
    const weldingIncluded = includeWelding.checked;
    const agg = tasks.reduce((acc,t)=>{
      const mult = (t.key === 'welding' && !weldingIncluded) ? 0 : 1;
      acc.min += t.min * mult;
      acc.max += t.max * mult;
      return acc;
    }, {min:0,max:0});

    let laborMin = 0, laborMax = 0;
    let shopLaborMin = 0, shopLaborMax = 0;
    let onSiteLaborMin = 0, onSiteLaborMax = 0;

    if (!onSiteEnabled) {
      // legacy mode: single hourly rate
      const hr = Math.max(0, parseFloat(hourlyRate.value) || 0);
      shopLaborMin = agg.min * hr;
      shopLaborMax = agg.max * hr;
      laborMin = shopLaborMin;
      laborMax = shopLaborMax;
      onSiteLaborMin = 0;
      onSiteLaborMax = 0;
    } else {
      // on-site enabled: shop tasks use shopRate, site uses siteMin/siteMax
      const sRate = Math.max(0, parseFloat(shopRate.value) || 0);
      const siteR = Math.max(0, parseFloat(siteRate.value) || 0);

      // The existing tasks become shop tasks; but also there are explicit shopMin/shopMax inputs that allow overrides.
      // Requirement: Compute "Shop task hours" from the existing tasks as before.
      // We'll ignore the shopMin/shopMax inputs for hours calculation origin (but keep validation). To respect the requirement we will still let shopMin/shopMax be editable and included as additional shop hours if provided (they were requested). However the user asked: "Compute 'Shop task hours' from the existing tasks as before" — so we will use existing tasks' agg for shop tasks, and the shopMin/shopMax fields will act as overrides only when non-zero. To follow instructions strictly, use existing agg; but shopMin/shopMax were required to exist. To keep behavior predictable we'll sum them: shop hours = agg + shopMin/shopMax. This allows users to add extra shop-only hours if needed.
      // Use shopMin/shopMax as additional shop-only hours (default 0).
      const extraShopMin = shopMinVal || 0;
      const extraShopMax = shopMaxVal || 0;

      const totalShopMinHrs = agg.min + extraShopMin;
      const totalShopMaxHrs = agg.max + extraShopMax;

      shopLaborMin = totalShopMinHrs * sRate;
      shopLaborMax = totalShopMaxHrs * sRate;

      onSiteLaborMin = siteMinVal * siteR;
      onSiteLaborMax = siteMaxVal * siteR;

      laborMin = shopLaborMin + onSiteLaborMin;
      laborMax = shopLaborMax + onSiteLaborMax;
    }

    // Markup and Rush apply to labor only (total labor)
    const mkMin = laborMin * mk;
    const mkMax = laborMax * mk;

    const rushEnabled = rushOn.checked;
    const rushMinVal = rushEnabled ? laborMin * rPct : 0;
    const rushMaxVal = rushEnabled ? laborMax * rPct : 0;

    // Materials
    const mats = Math.max(0, parseFloat(materials.value) || 0);

    // Travel
    const travelEnabled = travelOn.checked;
    const travelTotal = travelEnabled ? (callout + (milesVal * mileage) + tollsVal) : 0;

    // Subtotals include travel (taxable) and materials (not marked up)
    const subMin = laborMin + mkMin + rushMinVal + mats + travelTotal;
    const subMax = laborMax + mkMax + rushMaxVal + mats + travelTotal;

    const taxMin = subMin * tx;
    const taxMax = subMax * tx;

    const totalMin = subMin + taxMin;
    const totalMax = subMax + taxMax;

    // populate outputs
    // total hours = shop tasks hours + site hours
    const totalHrsMin = (onSite.checked ? ((agg.min + (shopMinVal || 0)) + (siteMinVal || 0)) : agg.min);
    const totalHrsMax = (onSite.checked ? ((agg.max + (shopMaxVal || 0)) + (siteMaxVal || 0)) : agg.max);

    setText(totalMinOut, (totalHrsMin).toFixed(2));
    setText(totalMaxOut, (totalHrsMax).toFixed(2));

    setText(shopLaborMinOut, shopLaborMin ? currency(shopLaborMin) : currency(0));
    setText(shopLaborMaxOut, shopLaborMax ? currency(shopLaborMax) : currency(0));
    setText(siteLaborMinOut, onSite.checked ? currency(onSiteLaborMin) : currency(0));
    setText(siteLaborMaxOut, onSite.checked ? currency(onSiteLaborMax) : currency(0));

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

    // Toggle visibility of shop/site outputs based on onSite checkbox
    // (we always show them in UI but it's okay to dim if not enabled)
    const shopLines = [shopLaborMinOut, shopLaborMaxOut];
    const siteLines = [siteLaborMinOut, siteLaborMaxOut];
    if (!onSite.checked) {
      shopLines.forEach(el => el.parentElement.classList.add('hidden'));
      siteLines.forEach(el => el.parentElement.classList.add('hidden'));
    } else {
      shopLines.forEach(el => el.parentElement.classList.remove('hidden'));
      siteLines.forEach(el => el.parentElement.classList.remove('hidden'));
    }
    // Travel line visibility
    if (!travelEnabled) {
      travelOut.parentElement.classList.add('hidden');
    } else {
      travelOut.parentElement.classList.remove('hidden');
    }
  }

  // events and wiring
  function attach() {
    // inputs that affect calc
    const inputs = [hourlyRate,materials,includeWelding,markup,rushOn,rushPct,taxPct,notes,onSite,shopRate,siteRate,shopMin,shopMax,siteMin,siteMax,travelOn,calloutFee,miles,mileageRate,tolls];
    inputs.forEach(i => {
      i.addEventListener('input', compute);
      i.addEventListener('change', compute);
    });

    // task inputs
    taskEls.forEach(t => {
      t.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', compute);
        inp.addEventListener('change', compute);
      });
    });

    // toggle UI behavior
    onSite.addEventListener('change', () => {
      toggleOnSiteUI(onSite.checked);
      compute();
    });
    travelOn.addEventListener('change', () => {
      toggleTravelUI(travelOn.checked);
      compute();
    });

    exampleBtn.addEventListener('click', () => {
      // existing example values
      hourlyRate.value = '95';
      const map = {
        fitup: [1,2],
        jointprep: [0.5,1.5],
        cleaning: [0.25,0.5],
        welding: [1.5,3]
      };
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

      // enable onsite and travel with sensible defaults
      onSite.checked = true;
      shopRate.value = '95';
      siteRate.value = '115';
      // shopMin/shopMax will be additional shop hours (0 by default)
      shopMin.value = '0';
      shopMax.value = '0';
      // site hours typical
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
      // restore defaults
      hourlyRate.value = '95';
      taskEls.forEach(el => { el.querySelector('.min').value = '0'; el.querySelector('.max').value = '0'; });
      includeWelding.checked = true;
      materials.value = '0';
      markup.value = '0';
      rushOn.checked = false;
      rushPct.value = '15';
      taxPct.value = '10';
      notes.value = '';

      // onsite defaults: disabled
      onSite.checked = false;
      shopRate.value = '95';
      siteRate.value = '115';
      shopMin.value = '0';
      shopMax.value = '0';
      siteMin.value = '0';
      siteMax.value = '0';

      // travel defaults: disabled
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
      // build summary text
      const tasks = readTasks();
      const weldingIncluded = includeWelding.checked;
      const hr = Math.max(0, parseFloat(hourlyRate.value) || 0);
      const mats = Math.max(0, parseFloat(materials.value) || 0);
      const mkPct = (Math.max(0, parseFloat(markup.value) || 0));
      const rushEnabled = rushOn.checked;
      const rushP = (Math.max(0, parseFloat(rushPct.value) || 0));
      const txP = (Math.max(0, parseFloat(taxPct.value) || 0));

      // validation
      const invalidTasks = tasks.filter(t => t.min > t.max);
      if (invalidTasks.length) {
        alert('Please fix min/max values before copying the summary.');
        return;
      }
      if (onSite.checked && (parseFloat(shopMin.value) > parseFloat(shopMax.value) || parseFloat(siteMin.value) > parseFloat(siteMax.value))) {
        alert('Please fix shop/site min/max values before copying the summary.');
        return;
      }

      // recompute numeric values
      const agg = tasks.reduce((acc,t)=>{
        const mult = (t.key === 'welding' && !weldingIncluded) ? 0 : 1;
        acc.min += t.min * mult;
        acc.max += t.max * mult;
        return acc;
      }, {min:0,max:0});

      const onSiteEnabled = onSite.checked;
      // shop extra inputs
      const extraShopMin = Math.max(0, parseFloat(shopMin.value) || 0);
      const extraShopMax = Math.max(0, parseFloat(shopMax.value) || 0);
      const totalShopMinHrs = agg.min + extraShopMin;
      const totalShopMaxHrs = agg.max + extraShopMax;

      const travelEnabled = travelOn.checked;
      const callout = Math.max(0, parseFloat(calloutFee.value) || 0);
      const milesVal = Math.max(0, parseFloat(miles.value) || 0);
      const mileage = Math.max(0, parseFloat(mileageRate.value) || 0);
      const tollsVal = Math.max(0, parseFloat(tolls.value) || 0);
      const travelTotal = travelEnabled ? (callout + (milesVal * mileage) + tollsVal) : 0;

      let shopLaborMin = 0, shopLaborMax = 0, siteLaborMin = 0, siteLaborMax = 0;
      let laborMin = 0, laborMax = 0;
      if (!onSiteEnabled) {
        shopLaborMin = agg.min * hr;
        shopLaborMax = agg.max * hr;
        laborMin = shopLaborMin;
        laborMax = shopLaborMax;
      } else {
        const sRate = Math.max(0, parseFloat(shopRate.value) || 0);
        const siteR = Math.max(0, parseFloat(siteRate.value) || 0);
        shopLaborMin = totalShopMinHrs * sRate;
        shopLaborMax = totalShopMaxHrs * sRate;
        siteLaborMin = (Math.max(0, parseFloat(siteMin.value)||0)) * siteR;
        siteLaborMax = (Math.max(0, parseFloat(siteMax.value)||0)) * siteR;
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

      const now = new Date();
      const stamp = now.toLocaleString();

      const taskLines = tasks.map(t => {
        const includeNote = (t.key === 'welding' && !weldingIncluded) ? ' (excluded)' : '';
        return `- ${t.key.replace(/([a-z])([A-Z])/g,'$1 $2')}: ${t.min} – ${t.max} hrs${includeNote}`;
      }).join('\n');

      const shopHoursLine = onSite.checked
        ? `Shop tasks total hours: ${totalShopMinHrs.toFixed(2)} – ${totalShopMaxHrs.toFixed(2)} hrs (from task buckets + any extra shop hours)`
        : `Shop tasks total hours: ${agg.min.toFixed(2)} – ${agg.max.toFixed(2)} hrs`;

      const siteHoursLine = onSite.checked
        ? `On-site hours: ${Math.max(0, parseFloat(siteMin.value)||0).toFixed(2)} – ${Math.max(0, parseFloat(siteMax.value)||0).toFixed(2)} hrs`
        : `On-site: not used`;

      const travelSection = travelEnabled ? [
        `Travel / Mobilization:`,
        `- Call-out fee: ${currency(callout)}`,
        `- Round-trip miles: ${milesVal} @ ${currency(mileage)} / mi => ${currency(milesVal * mileage)}`,
        `- Tolls / parking: ${currency(tollsVal)}`,
        `- Travel total: ${currency(travelTotal)}`
      ].join('\n') : 'Travel / Mobilization: not used';

      const summary = [
        `Progressive Welding Solutions — Quote Summary`,
        `Date: ${stamp}`,
        ``,
        `Rates:`,
        `- Shop hourly rate: ${currency(Math.max(0, parseFloat(shopRate.value)||0))}`,
        `- On-site hourly rate: ${currency(Math.max(0, parseFloat(siteRate.value)||0))}`,
        `- Hourly rate (legacy): ${currency(hr)}`,
        ``,
        `Time estimates (by task):`,
        taskLines,
        ``,
        shopHoursLine,
        siteHoursLine,
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
        `This is an educational estimate only. Verify local tax rules.`
      ].join('\n');

      try {
        await navigator.clipboard.writeText(summary);
        copyBtn.textContent = 'Copied ✓';
        setTimeout(()=>copyBtn.textContent = 'Copy Summary', 1200);
      } catch (err) {
        alert('Copy failed. You can manually select the summary on the page to copy.');
      }
    });

    // initial UI state
    toggleOnSiteUI(onSite.checked);
    toggleTravelUI(travelOn.checked);

    // initial compute
    compute();
  }

  // initialize
  window.addEventListener('load', attach);
})();
