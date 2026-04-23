// ════════════════════════════════════════════════════════════
// simulator.js
// ════════════════════════════════════════════════════════════

// ─── State ──────────────────────────────────────────────────
let tagSeq = 0;
// Tag shape: { id, name, count, values: string[] }
const tags = [];

const PLANS = {
    free: { label: 'Free', allotPerHost: 0, fixedAllot: 100, hostCost: 0 },
    pro: { label: 'Pro', allotPerHost: 100, fixedAllot: 0, hostCost: 15 },
    enterprise: { label: 'Enterprise', allotPerHost: 200, fixedAllot: 0, hostCost: 23 },
};
const OVR_IDX = 5.00;
const OVR_ING = 0.10;

// ─── Utilities ──────────────────────────────────────────────
const fmt = n => Number(n).toLocaleString('pt-BR');
const money = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── Theme ──────────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('dd-sim-theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    syncThemeBtn(saved);
}

function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('dd-sim-theme', next);
    syncThemeBtn(next);
}

function syncThemeBtn(theme) {
    const btn = document.getElementById('btnTheme');
    if (!btn) return;
    btn.innerHTML = theme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    btn.title = theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro';
}

// ─── Draggable panel divider ─────────────────────────────────
function initDivider() {
    const divider = document.getElementById('panelDivider');
    const panelLeft = document.getElementById('panelLeft');
    const main = document.querySelector('main');
    if (!divider || !panelLeft || !main) return;

    let dragging = false;
    let startX = 0;
    let startWidth = 0;

    function startDrag(clientX) {
        dragging = true;
        startX = clientX;
        startWidth = panelLeft.offsetWidth;
        divider.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        // disable transitions during drag for instant feedback
        panelLeft.style.transition = 'none';
    }

    function onDrag(clientX) {
        if (!dragging) return;
        const mainW = main.offsetWidth - 5; // subtract divider width
        const newW = startWidth + (clientX - startX);
        const pct = Math.min(Math.max((newW / mainW) * 100, 15), 72);
        panelLeft.style.flex = `0 0 ${pct}%`;
    }

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        divider.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        panelLeft.style.transition = '';
    }

    // Mouse
    divider.addEventListener('mousedown', e => { startDrag(e.clientX); e.preventDefault(); });
    document.addEventListener('mousemove', e => onDrag(e.clientX));
    document.addEventListener('mouseup', endDrag);

    // Touch
    divider.addEventListener('touchstart', e => {
        startDrag(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', e => {
        onDrag(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', endDrag);
}

// ─── Metric type ────────────────────────────────────────────
function onMetricTypeChange() {
    const isDist = getIsDistribution();
    const el = document.getElementById('distInfo');
    if (el) el.style.display = isDist ? 'block' : 'none';
}

function getIsDistribution() {
    const sel = document.getElementById('metricType');
    return sel && sel.options[sel.selectedIndex].dataset.m === 'distribution';
}

function getMetricMult() {
    return parseInt(document.getElementById('metricType')?.value || '1');
}

// ─── Tags ───────────────────────────────────────────────────
function addTag(name = '', count = 4, values = []) {
    tags.push({ id: ++tagSeq, name, count, values });
    renderTags();
}

function removeTag(id) {
    const i = tags.findIndex(t => t.id === id);
    if (i !== -1) tags.splice(i, 1);
    renderTags();
}

function onTagNameChange(id, val) {
    const t = tags.find(t => t.id === id);
    if (t) t.name = val.trim();
}

function onTagCountChange(id, val) {
    const t = tags.find(t => t.id === id);
    if (!t) return;
    t.count = parseInt(val) || 0;
    checkUnbounded();
}

/**
 * When the values field changes:
 * - Parse the CSV list
 * - Auto-update the count field to reflect the number of items
 * - Store values for code generation
 */
function onTagValuesChange(id, raw) {
    const t = tags.find(t => t.id === id);
    if (!t) return;

    const values = raw.split(',').map(v => v.trim()).filter(Boolean);
    t.values = values;

    if (values.length > 0) {
        t.count = values.length;
        // Mirror count into the number input
        const row = document.querySelector(`.tag-card[data-id="${id}"]`);
        const countInput = row?.querySelector('.tag-count-input');
        if (countInput) countInput.value = values.length;
    }
    checkUnbounded();
}

function renderTags() {
    const list = document.getElementById('tagsList');
    if (!list) return;
    list.innerHTML = '';

    tags.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'tag-card';
        card.dataset.id = t.id;
        card.innerHTML = `
      <!-- row 1: name + count + delete -->
      <div class="tag-card-main">
        <div class="field tag-name-f">
          <label>Tag ${i + 1} — nome</label>
          <input class="tag-name-input" type="text"
            placeholder="region, env, status_code…"
            value="${esc(t.name)}"
            oninput="onTagNameChange(${t.id}, this.value)" />
        </div>
        <div class="field tag-count-f">
          <label title="0 = cardinalidade infinita (usa eventos/hora)">Qtd</label>
          <input class="tag-count-input" type="number" min="0"
            value="${t.count}"
            oninput="onTagCountChange(${t.id}, this.value)" />
        </div>
        <button class="btn-del" onclick="removeTag(${t.id})" title="Remover tag">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <!-- row 2: optional values list -->
      <div class="tag-values-row">
        <div class="field">
          <label>Valores possíveis <span style="font-weight:400;opacity:.65">(opcional — auto-calcula Qtd)</span></label>
          <input class="tag-values-input" type="text"
            placeholder="us-east, eu-west, sa-east, ap-south"
            value="${esc(t.values.join(', '))}"
            oninput="onTagValuesChange(${t.id}, this.value)" />
        </div>
      </div>`;
        list.appendChild(card);
    });

    document.getElementById('tagCount').textContent = tags.length;
    checkUnbounded();
}

function checkUnbounded() {
    const hasUnbounded = tags.some(t => t.values.length === 0 && t.count === 0);
    document.getElementById('unboundedHint')?.classList.toggle('show', hasUnbounded);
}

/**
 * Snapshot the live DOM state into a clean array for calculation / code gen.
 * Sync values back to the tags state array as a side-effect.
 */
function snapshotTags() {
    const rph = parseInt(document.getElementById('reqPerHour')?.value) || 50000;

    return tags.map(t => {
        // Read live DOM values for this tag
        const card = document.querySelector(`.tag-card[data-id="${t.id}"]`);
        const name = card?.querySelector('.tag-name-input')?.value.trim() || t.name || 'tag';
        const rawCount = card?.querySelector('.tag-count-input')?.value || String(t.count);
        const rawValues = card?.querySelector('.tag-values-input')?.value.trim() || '';

        const values = rawValues ? rawValues.split(',').map(v => v.trim()).filter(Boolean) : t.values;
        const count = values.length > 0 ? values.length : (parseInt(rawCount) || 0);
        const unbounded = values.length === 0 && count === 0;
        const effectiveCount = unbounded ? rph : count;

        // Sync back
        t.name = name;
        t.count = count;
        t.values = values;

        return { id: t.id, name, count: effectiveCount, values, unbounded };
    });
}

// ─── Calculation ────────────────────────────────────────────
function calcular() {
    const mName = document.getElementById('metricName').value.trim() || 'my.metric';
    const sel = document.getElementById('metricType');
    const mMult = parseInt(sel.value);
    const mMeth = sel.options[sel.selectedIndex].dataset.m || 'count';
    const isDist = mMeth === 'distribution';
    const hosts = Math.max(1, parseInt(document.getElementById('hosts').value) || 1);
    const rph = Math.max(1, parseInt(document.getElementById('reqPerHour').value) || 50000);
    const pKey = document.querySelector('input[name=plan]:checked')?.value || 'pro';
    const plan = PLANS[pKey];

    const snap = snapshotTags(rph);
    const hasInf = snap.some(t => t.unbounded);

    let combos = hosts;
    snap.forEach(t => combos *= t.count);

    const totalSeries = combos * mMult;
    const allot = pKey === 'free' ? plan.fixedAllot : plan.allotPerHost * hosts;
    const over = Math.max(0, totalSeries - allot);
    const overB = Math.ceil(over / 100);
    const cIdx = overB * OVR_IDX;
    const cIng = overB * OVR_ING;
    const cInfra = hosts * plan.hostCost;
    const total = cInfra + cIdx;
    const totalMwL = cInfra + cIng;

    let h = '';

    // Header
    const multLabel = mMult === 10 ? '10× dist.+percentis'
        : mMult === 5 ? '5× hist./dist.'
            : '1× simples';
    h += `<div class="r-header">
    <code>${esc(mName)}</code>
    <span class="r-sep">·</span><span>${plan.label}</span>
    <span class="r-sep">·</span><span>${hosts} host${hosts > 1 ? 's' : ''}</span>
    <span class="r-sep">·</span><span>${multLabel}</span>
  </div>`;

    // Distribution billing note
    if (isDist) {
        h += `<div class="alert alert-info">
      <i class="fa-solid fa-circle-info fa-xs"></i>
      <span>
        <strong>DISTRIBUTION — regra de billing:</strong>
        ${mMult === 10
                ? '10 agregações por combinação: <em>avg, count, max, min, sum</em> + <em>p50, p75, p90, p95, p99</em>. Os percentis aplicam-se a <strong>todas</strong> as tags indexadas.'
                : '5 agregações por combinação: <em>avg, count, max, min, sum</em>.'}
        Via MwL, distributions permitem remover inclusive o <code>host</code> do allowlist de indexação.
      </span>
    </div>`;
    }

    // Main alert
    if (hasInf) {
        h += mkAlert('red', 'fa-skull-crossbones',
            `<strong>Cardinalidade Infinita.</strong> Tags com Qtd = 0 geram ${fmt(rph)} séries/hora. Aplique Metrics without Limits™ para barrar a indexação.`);
    } else if (over > 0) {
        const pct = Math.round(over / totalSeries * 100);
        h += mkAlert('amber', 'fa-triangle-exclamation',
            `<strong>${pct}% das séries excedem a franquia.</strong> Franquia: ${fmt(allot)} — gerado: ${fmt(totalSeries)}. Use MwL para reduzir overage em 98%.`);
    } else {
        h += mkAlert('green', 'fa-circle-check',
            `<strong>Dentro da franquia.</strong> ${fmt(totalSeries)} séries contidas nos ${fmt(allot)} inclusos no plano ${plan.label}.`);
    }

    // Stats
    h += `<div class="stat-grid">
    <div class="sbox"><div class="sl">Combinações</div><div class="sv sv-purple">${fmt(combos)}</div></div>
    <div class="sbox"><div class="sl">Séries Temporais</div><div class="sv sv-teal">${fmt(totalSeries)}</div></div>
    <div class="sbox"><div class="sl">Franquia</div><div class="sv sv-muted">${fmt(allot)}</div></div>
    <div class="sbox"><div class="sl">Excedente</div><div class="sv ${over > 0 ? 'sv-red' : 'sv-green'}">${fmt(over)}</div></div>
    <div class="sbox"><div class="sl">Blocos 100</div><div class="sv sv-amber">${fmt(overB)}</div></div>
    <div class="sbox"><div class="sl">Custo / mês</div><div class="sv ${total > 0 ? 'sv-red' : 'sv-green'}">$${money(total)}</div></div>
  </div>`;

    // Formula
    let chips = `<div class="chip"><span class="cn">hosts</span><span class="cv">${hosts}</span></div>`;
    if (snap.length === 0) {
        chips += `<span class="fop">×</span><div class="chip"><span class="cn">sem tags</span><span class="cv">1</span></div>`;
    } else {
        snap.forEach(t => {
            chips += `<span class="fop">×</span>
        <div class="chip ${t.unbounded ? 'chip-inf' : ''}">
          <span class="cn">${esc(t.name)}${t.unbounded ? ' ⚠' : ''}</span>
          <span class="cv">${fmt(t.count)}</span>
        </div>`;
        });
    }
    chips += `<span class="fop">×</span>
    <div class="chip chip-type"><span class="cn">tipo</span><span class="cv">${mMult}×</span></div>
    <span class="fop">=</span>
    <div class="fresult">${fmt(totalSeries)}</div>`;

    h += `<div class="formula-box">
    <div class="formula-label">C(M) = H × ∏ V(tᵢ) × M_tipo</div>
    <div class="formula-row">${chips}</div>
  </div>`;

    // Cost table
    h += `<table class="cost-table">
    <thead><tr>
      <th>Item</th><th>Detalhe</th><th style="text-align:right">USD/mês</th>
    </tr></thead>
    <tbody>
      <tr>
        <td class="td-muted">Infraestrutura (${plan.label})</td>
        <td>${hosts} hosts × $${plan.hostCost}</td>
        <td class="td-r">$${money(cInfra)}</td>
      </tr>
      <tr>
        <td class="td-muted">Overage — Indexação</td>
        <td>${fmt(overB)} blocos × $${OVR_IDX.toFixed(2)}/100</td>
        <td class="td-r ${over > 0 ? 'td-red' : ''}">$${money(cIdx)}</td>
      </tr>
      <tr class="td-total">
        <td colspan="2"><strong>Total (sem otimização)</strong></td>
        <td class="td-r"><strong>$${money(total)}</strong></td>
      </tr>
    </tbody>
  </table>`;

    // MwL
    if (over > 0) {
        h += `<div class="mwl-box">
      <div class="mwl-title"><i class="fa-solid fa-bolt fa-xs"></i> Metrics without Limits™ — Economia</div>
      <div class="mwl-amount">$${money(totalMwL)} / mês com MwL ativo</div>
      <div class="mwl-desc">
        Excluindo tags de alto custo do allowlist de indexação, overage cai de
        <strong style="color:var(--red)">$${money(cIdx)}</strong>
        para <strong style="color:var(--teal)">$${money(cIng)}</strong> — redução de 98%.
        ${isDist ? 'Distributions permitem também remover o <code style="background:rgba(0,217,184,.1);padding:0 4px;border-radius:3px;font-family:var(--mono)">host</code> do allowlist.' : ''}
        Economia: <strong style="color:var(--teal)">$${money(cIdx - cIng)}/mês</strong>.
      </div>
    </div>`;
    }

    document.getElementById('placeholder').style.display = 'none';
    const res = document.getElementById('results');
    res.style.display = 'flex';
    res.innerHTML = h;
}

function mkAlert(type, icon, msg) {
    return `<div class="alert alert-${type}"><i class="fa-solid ${icon} fa-xs"></i><span>${msg}</span></div>`;
}

// ─── Code Modal ─────────────────────────────────────────────
let currentLang = 'python';

function openCodeModal() {
    document.getElementById('codeModal').classList.add('open');
    generateCode();
    document.getElementById('modalSub').textContent =
        document.getElementById('metricName').value.trim() || 'my.metric';
}

function closeCodeModal() {
    document.getElementById('codeModal').classList.remove('open');
}

function handleOverlayClick(e) {
    if (e.target.id === 'codeModal') closeCodeModal();
}

function switchLang(btn) {
    document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentLang = btn.dataset.lang;
    generateCode();
    resetCopyBtn();
}

function resetCopyBtn() {
    const b = document.getElementById('btnCopy');
    if (b) { b.classList.remove('copied'); b.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar'; }
}

function getCodeCtx() {
    const mName = document.getElementById('metricName').value.trim() || 'my.metric';
    const sel = document.getElementById('metricType');
    const mMeth = sel.options[sel.selectedIndex].dataset.m || 'count';
    const snap = snapshotTags();
    const tagList = snap.map(t => ({ name: t.name, values: t.values }));
    return { mName, mMeth, tagList };
}

function buildTagExamples(tagList) {
    return tagList.map(t => `${t.name}:${t.values.length > 0 ? t.values[0] : 'value'}`);
}

const GENERATORS = {
    python({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `statsd.increment("${mName}", tags=tags)`, gauge: `statsd.gauge("${mName}", 42.0, tags=tags)`, set: `statsd.set("${mName}", "unique_id", tags=tags)`, histogram: `statsd.histogram("${mName}", 250.5, tags=tags)`, distribution: `statsd.distribution("${mName}", 250.5, tags=tags)` }[mMeth] || `statsd.increment("${mName}", tags=tags)`;
        return `# pip install datadog\nfrom datadog import initialize, statsd\n\ninitialize(**{\n    "statsd_host": "127.0.0.1",\n    "statsd_port": 8125,\n})\n\ntags = [${ex}]\n\n# Submissão da métrica customizada\n${call}\n`;
    },
    go({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `client.Incr("${mName}", tags, 1)`, gauge: `client.Gauge("${mName}", 42.0, tags, 1)`, set: `client.Set("${mName}", "unique_id", tags, 1)`, histogram: `client.Histogram("${mName}", 250.5, tags, 1)`, distribution: `client.Distribution("${mName}", 250.5, tags, 1)` }[mMeth] || `client.Incr("${mName}", tags, 1)`;
        return `// go get github.com/DataDog/datadog-go/v5/statsd\npackage main\n\nimport (\n\t"log"\n\t"github.com/DataDog/datadog-go/v5/statsd"\n)\n\nfunc main() {\n\tclient, err := statsd.New("127.0.0.1:8125")\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tdefer client.Close()\n\n\ttags := []string{${ex}}\n\n\t// Submissão da métrica customizada\n\t${call}\n}\n`;
    },
    java({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `statsd.incrementCounter("${mName}", ${ex});`, gauge: `statsd.recordGaugeValue("${mName}", 42.0, ${ex});`, set: `statsd.recordSetValue("${mName}", "unique_id", ${ex});`, histogram: `statsd.recordHistogramValue("${mName}", 250.5, ${ex});`, distribution: `statsd.recordDistributionValue("${mName}", 250.5, ${ex});` }[mMeth] || `statsd.incrementCounter("${mName}", ${ex});`;
        return `// Maven: com.datadoghq:java-dogstatsd-client:4.4.3\nimport com.timgroup.statsd.NonBlockingStatsDClientBuilder;\nimport com.timgroup.statsd.StatsDClient;\n\npublic class MetricExample {\n\n    private static final StatsDClient statsd =\n        new NonBlockingStatsDClientBuilder()\n            .hostname("127.0.0.1")\n            .port(8125)\n            .build();\n\n    public static void main(String[] args) {\n        // Submissão da métrica customizada\n        ${call}\n        statsd.stop();\n    }\n}\n`;
    },
    csharp({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `DogStatsd.Increment("${mName}", tags: new[] { ${ex} });`, gauge: `DogStatsd.Gauge("${mName}", 42.0, tags: new[] { ${ex} });`, set: `DogStatsd.Set("${mName}", "unique_id", tags: new[] { ${ex} });`, histogram: `DogStatsd.Histogram("${mName}", 250.5, tags: new[] { ${ex} });`, distribution: `DogStatsd.Distribution("${mName}", 250.5, tags: new[] { ${ex} });` }[mMeth] || `DogStatsd.Increment("${mName}", tags: new[] { ${ex} });`;
        return `// NuGet: DogStatsD-CSharp-Client\nusing StatsdClient;\n\nclass Program\n{\n    static void Main()\n    {\n        var config = new StatsdConfig\n        {\n            StatsdServerName = "127.0.0.1",\n            StatsdPort = 8125,\n        };\n        DogStatsd.Configure(config);\n\n        // Submissão da métrica customizada\n        ${call}\n    }\n}\n`;
    },
    rust({ mName, mMeth, tagList }) {
        const exArr = buildTagExamples(tagList);
        const exStr = exArr.length > 0 ? exArr.map(t => `        "${t}"`).join(',\n') : '        "env:production"';
        const call = { count: `client.incr("${mName}", tags.clone()).unwrap();`, gauge: `client.gauge("${mName}", "42.0", tags.clone()).unwrap();`, set: `client.set("${mName}", "unique_id", tags.clone()).unwrap();`, histogram: `client.histogram("${mName}", "250.5", tags.clone()).unwrap();`, distribution: `client.distribution("${mName}", "250.5", tags.clone()).unwrap();` }[mMeth] || `client.incr("${mName}", tags.clone()).unwrap();`;
        return `// Cargo.toml: dogstatsd = "0.11"\nuse dogstatsd::{Client, Options};\n\nfn main() {\n    let client = Client::new(Options::default()).unwrap();\n\n    let tags = vec![\n${exStr},\n    ];\n\n    // Submissão da métrica customizada\n    ${call}\n}\n`;
    },
    kotlin({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `statsd.incrementCounter("${mName}", ${ex})`, gauge: `statsd.recordGaugeValue("${mName}", 42.0, ${ex})`, set: `statsd.recordSetValue("${mName}", "unique_id", ${ex})`, histogram: `statsd.recordHistogramValue("${mName}", 250.5, ${ex})`, distribution: `statsd.recordDistributionValue("${mName}", 250.5, ${ex})` }[mMeth] || `statsd.incrementCounter("${mName}", ${ex})`;
        return `// Gradle: implementation("com.datadoghq:java-dogstatsd-client:4.4.3")\nimport com.timgroup.statsd.NonBlockingStatsDClientBuilder\n\nfun main() {\n    val statsd = NonBlockingStatsDClientBuilder()\n        .hostname("127.0.0.1")\n        .port(8125)\n        .build()\n\n    // Submissão da métrica customizada\n    ${call}\n\n    statsd.stop()\n}\n`;
    },
};

function generateCode() {
    const ctx = getCodeCtx();
    const gen = GENERATORS[currentLang];
    if (gen) document.getElementById('codeBlock').textContent = gen(ctx);
}

async function copyCode() {
    const code = document.getElementById('codeBlock').textContent;
    try { await navigator.clipboard.writeText(code); }
    catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    const b = document.getElementById('btnCopy');
    b.classList.add('copied');
    b.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
    setTimeout(() => { b.classList.remove('copied'); b.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar'; }, 2200);
}

// ─── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDivider();

    // Seed default tags
    addTag('region', 4, ['us-east', 'eu-west', 'sa-east', 'ap-south']);
    addTag('endpoint', 10, []);
    addTag('env', 3, ['prod', 'staging', 'dev']);
});