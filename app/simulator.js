// ════════════════════════════════════════════════════════════
// simulator.js
// ════════════════════════════════════════════════════════════

// ─── i18n ───────────────────────────────────────────────────
const STRINGS = {
    'pt-BR': {
        document_title: 'Datadog · Simulador de Métricas',
        'header.title': 'Datadog Metric Simulator',
        'header.sub': 'Cardinalidade · FinOps · Governança',
        'header.theme_tooltip': 'Alternar tema',
        'header.btn_code': 'Gerar Código',
        'header.btn_share': 'Compartilhar',
        'header.share_tooltip': 'Compartilhar simulador',
        'header.share_copied': 'Link copiado!',
        'header.lang_tooltip': 'Idioma da interface',
        'form.section_metric': 'Métrica',
        'form.label_name': 'Nome',
        'form.label_name_hint': '— governança: <code>custom.</code> prefixo · tipo como sufixo',
        'form.name_placeholder': 'service.operation.metric',
        'form.label_type': 'Tipo',
        'form.type_count': 'COUNT / RATE — 1×',
        'form.type_gauge': 'GAUGE — 1×',
        'form.type_set': 'SET — 1×',
        'form.type_histogram': 'HISTOGRAM — 5×',
        'form.type_distribution': 'DISTRIBUTION — 5×',
        'form.type_distribution_pct': 'DISTRIBUTION + Percentis — 10×',
        'form.dist_info': '<strong>Distributions:</strong> permitem remover o <code>host</code> do allowlist de indexação via MwL — exclusivo deste tipo. Percentis (10×) aplicam-se a <strong>todas</strong> as tags indexadas.',
        'form.section_plan': 'Plano & Infra',
        'form.plan_free_name': 'Free',
        'form.plan_free_desc': '100 fixas sem/host',
        'form.plan_pro_name': 'Pro',
        'form.plan_pro_desc': '100/host ~$15/host',
        'form.plan_ent_name': 'Enterprise',
        'form.plan_ent_desc': '200/host ~$23/host',
        'form.label_hosts': 'Hosts / Containers',
        'form.label_rph': 'Emissões/hora · host',
        'form.label_rph_tooltip': 'Emissões da métrica por hora, por host. Para sistema total, divida pelo número de hosts. Esse valor define o teto de cardinalidade — você não pode ter mais timeseries únicas/hora do que emissões/hora.',
        'form.tags_title': 'Tags',
        'form.btn_add_tag': 'Adicionar',
        'form.unbounded_hint': '<strong>Cardinalidade independente alta:</strong> tags marcadas como <code>Independente</code> multiplicam o produto por <code>rph</code> cada — risco real de explosão. Tags <code>Por requisição</code> co-variam e são agrupadas (1× rph para todas), padrão seguro para <code>correlation_id</code>, <code>trace_id</code>, etc.',
        'form.btn_calc': 'Calcular Projeção',
        'form.tag_n_label': 'Tag {n} — nome',
        'form.tag_name_placeholder': 'region, env, status_code…',
        'form.tag_qtd': 'Qtd',
        'form.tag_qtd_tooltip': '0 = cardinalidade não-bounded (efêmera)',
        'form.tag_remove_tooltip': 'Remover tag',
        'form.tag_values_label': 'Valores possíveis',
        'form.tag_values_hint': '(opcional — auto-calcula Qtd)',
        'form.tag_values_placeholder': 'us-east, eu-west, sa-east, ap-south',
        'form.regime_label': 'Regime de variação',
        'form.regime_per_req_name': 'Por requisição',
        'form.regime_per_req_desc': 'co-variante (correlation_id, trace_id…)',
        'form.regime_per_req_tooltip': 'Co-varia com a requisição/evento. Várias tags neste regime são agrupadas e contribuem com 1× rph.',
        'form.regime_indep_name': 'Independente',
        'form.regime_indep_desc': 'alta cardinalidade (pod_name, user_id…)',
        'form.regime_indep_tooltip': 'Efêmera mas com ritmo próprio. Multiplica como rph (alta cardinalidade).',
        'placeholder.title': 'Aguardando simulação',
        'placeholder.desc': 'Configure as tags e clique em "Calcular Projeção"',
        'results.host_singular': 'host',
        'results.host_plural': 'hosts',
        'results.mult_simple': '1× simples',
        'results.mult_5x': '5× hist./dist.',
        'results.mult_10x': '10× dist.+percentis',
        'results.dist_billing_title': 'DISTRIBUTION — regra de billing:',
        'results.dist_billing_5x': '5 agregações por combinação: <em>avg, count, max, min, sum</em>.',
        'results.dist_billing_10x': '10 agregações por combinação: <em>avg, count, max, min, sum</em> + <em>p50, p75, p90, p95, p99</em>. Os percentis aplicam-se a <strong>todas</strong> as tags indexadas.',
        'results.dist_billing_mwl': 'Via MwL, distributions permitem remover inclusive o <code>host</code> do allowlist de indexação.',
        'results.cogroup_title': 'Tags co-variantes agrupadas:',
        'results.cogroup_desc': '{names} variam juntas por requisição e contribuem com <strong>1× {rph}</strong> ao produto (não <code>{rph}<sup>{n}</sup></code>). Cada evento gera uma única tupla nova, não um produto cartesiano.',
        'results.alert_indep_singular': '<strong>Cardinalidade independente alta:</strong> {names} multiplica com {rph} séries/hora. Risco real de explosão. Aplique Metrics without Limits™ para barrar a indexação.',
        'results.alert_indep_plural': '<strong>Cardinalidade independente alta:</strong> {names} multiplicam com {rph} séries/hora cada. Risco real de explosão. Aplique Metrics without Limits™ para barrar a indexação.',
        'results.alert_over': '<strong>{pct}% das séries excedem a franquia.</strong> Franquia: {allot} — gerado: {series}. Use MwL para reduzir overage em 98%.',
        'results.alert_ok': '<strong>Dentro da franquia.</strong> {series} séries contidas nos {allot} inclusos no plano {plan}.',
        'results.stat_combos': 'Combinações',
        'results.stat_combos_sub': 'por hora',
        'results.stat_series': 'Séries Temporais',
        'results.stat_series_sub': 'média ativa/hora',
        'results.stat_alot': 'Franquia',
        'results.stat_over': 'Excedente',
        'results.stat_blocks': 'Blocos 100',
        'results.stat_cost': 'Custo / mês',
        'results.formula_label': 'C(M) = H × min(rph, ∏V(t)) × M_tipo',
        'results.formula_sub': '— rph: emissões/hora por host',
        'results.fresult_theoretical_tooltip': 'Teórico — não realizável: excede a taxa de eventos',
        'results.cap_title': 'Limitado pela taxa de eventos',
        'results.cap_explain': 'Você só tem <strong>{rph} emissões/hora por host</strong>; cada emissão produz <em>uma</em> timeseries. Independente do produto teórico ({theoretical}), o máximo real é <code>hosts × rph × M_tipo</code>.',
        'results.chip_no_tags': 'sem tags',
        'results.chip_pergroup_tooltip': 'Tags co-variantes — todas contribuem com 1× rph para o grupo',
        'results.chip_hosts': 'hosts',
        'results.chip_type': 'tipo',
        'results.cost_table_item': 'Item',
        'results.cost_table_detail': 'Detalhe',
        'results.cost_table_value': 'USD/mês',
        'results.cost_infra': 'Infraestrutura ({plan})',
        'results.cost_infra_detail': '{hosts} hosts × ${cost}',
        'results.cost_overage': 'Overage — Indexação',
        'results.cost_overage_detail': '{blocks} blocos × ${price}/100',
        'results.cost_total': 'Total (sem otimização)',
        'results.mwl_title': 'Metrics without Limits™ — Economia',
        'results.mwl_amount': '${amount} / mês com MwL ativo',
        'results.mwl_desc': 'Excluindo tags de alto custo do allowlist de indexação, overage cai de <strong style="color:var(--red)">${idx}</strong> para <strong style="color:var(--teal)">${ing}</strong> — redução de 98%.',
        'results.mwl_dist_extra': 'Distributions permitem também remover o <code style="background:rgba(0,217,184,.1);padding:0 4px;border-radius:3px;font-family:var(--mono)">host</code> do allowlist.',
        'results.mwl_savings': 'Economia: <strong style="color:var(--teal)">${savings}/mês</strong>.',
        'results.hour_note': '<strong>Janela horária:</strong> séries temporais só são contadas na hora em que reportam ao menos um ponto. Tags efêmeras como <code>correlation_id</code> que aparecem uma única vez "expiram" no mesmo hour-bucket — por isso o billing escala com a <strong>taxa por hora</strong>, não com o volume mensal acumulado.',
        'modal.title': 'Código de Instrumentação',
        'modal.btn_copy': 'Copiar',
        'modal.btn_copied': 'Copiado!',
        'modal.btn_close': 'Fechar',
        'modal.btn_download': 'Baixar',
        'modal.note': 'Código gerado a partir das tags e configuração do simulador — adapte host do Agent DogStatsD ao seu ambiente.',
        'gen.comment_submit': 'Submissão da métrica customizada',
        'share.title': 'Datadog Metric Simulator',
        'share.text': 'Simule cardinalidade e custo de métricas customizadas no Datadog antes do deploy.',
    },
    'en-US': {
        document_title: 'Datadog · Metric Simulator',
        'header.title': 'Datadog Metric Simulator',
        'header.sub': 'Cardinality · FinOps · Governance',
        'header.theme_tooltip': 'Toggle theme',
        'header.btn_code': 'Generate Code',
        'header.btn_share': 'Share',
        'header.share_tooltip': 'Share this simulator',
        'header.share_copied': 'Link copied!',
        'header.lang_tooltip': 'Interface language',
        'form.section_metric': 'Metric',
        'form.label_name': 'Name',
        'form.label_name_hint': '— governance: <code>custom.</code> prefix · type as suffix',
        'form.name_placeholder': 'service.operation.metric',
        'form.label_type': 'Type',
        'form.type_count': 'COUNT / RATE — 1×',
        'form.type_gauge': 'GAUGE — 1×',
        'form.type_set': 'SET — 1×',
        'form.type_histogram': 'HISTOGRAM — 5×',
        'form.type_distribution': 'DISTRIBUTION — 5×',
        'form.type_distribution_pct': 'DISTRIBUTION + Percentiles — 10×',
        'form.dist_info': '<strong>Distributions:</strong> allow removing <code>host</code> from the indexing allowlist via MwL — unique to this type. Percentiles (10×) apply to <strong>all</strong> indexed tags.',
        'form.section_plan': 'Plan & Infra',
        'form.plan_free_name': 'Free',
        'form.plan_free_desc': '100 fixed total',
        'form.plan_pro_name': 'Pro',
        'form.plan_pro_desc': '100/host ~$15/host',
        'form.plan_ent_name': 'Enterprise',
        'form.plan_ent_desc': '200/host ~$23/host',
        'form.label_hosts': 'Hosts / Containers',
        'form.label_rph': 'Emissions/hour · host',
        'form.label_rph_tooltip': 'Metric emissions per hour, per host. For total system, divide by number of hosts. This value caps cardinality — you cannot have more unique timeseries/hour than emissions/hour.',
        'form.tags_title': 'Tags',
        'form.btn_add_tag': 'Add',
        'form.unbounded_hint': '<strong>High independent cardinality:</strong> tags marked as <code>Independent</code> multiply the product by <code>rph</code> each — real explosion risk. <code>Per-request</code> tags co-vary and are grouped (1× rph for all), safe pattern for <code>correlation_id</code>, <code>trace_id</code>, etc.',
        'form.btn_calc': 'Calculate Projection',
        'form.tag_n_label': 'Tag {n} — name',
        'form.tag_name_placeholder': 'region, env, status_code…',
        'form.tag_qtd': 'Qty',
        'form.tag_qtd_tooltip': '0 = unbounded cardinality (ephemeral)',
        'form.tag_remove_tooltip': 'Remove tag',
        'form.tag_values_label': 'Possible values',
        'form.tag_values_hint': '(optional — auto-computes Qty)',
        'form.tag_values_placeholder': 'us-east, eu-west, sa-east, ap-south',
        'form.regime_label': 'Variation regime',
        'form.regime_per_req_name': 'Per-request',
        'form.regime_per_req_desc': 'co-variant (correlation_id, trace_id…)',
        'form.regime_per_req_tooltip': 'Co-varies with request/event. Multiple tags in this regime are grouped and contribute 1× rph total.',
        'form.regime_indep_name': 'Independent',
        'form.regime_indep_desc': 'high cardinality (pod_name, user_id…)',
        'form.regime_indep_tooltip': 'Ephemeral but with own rhythm. Multiplies as rph (high cardinality).',
        'placeholder.title': 'Awaiting simulation',
        'placeholder.desc': 'Configure tags and click "Calculate Projection"',
        'results.host_singular': 'host',
        'results.host_plural': 'hosts',
        'results.mult_simple': '1× simple',
        'results.mult_5x': '5× hist./dist.',
        'results.mult_10x': '10× dist.+percentiles',
        'results.dist_billing_title': 'DISTRIBUTION — billing rule:',
        'results.dist_billing_5x': '5 aggregations per combination: <em>avg, count, max, min, sum</em>.',
        'results.dist_billing_10x': '10 aggregations per combination: <em>avg, count, max, min, sum</em> + <em>p50, p75, p90, p95, p99</em>. Percentiles apply to <strong>all</strong> indexed tags.',
        'results.dist_billing_mwl': 'Via MwL, distributions allow removing even <code>host</code> from the indexing allowlist.',
        'results.cogroup_title': 'Co-variant grouped tags:',
        'results.cogroup_desc': '{names} vary together per request and contribute <strong>1× {rph}</strong> to the product (not <code>{rph}<sup>{n}</sup></code>). Each event creates a single new tuple, not a Cartesian product.',
        'results.alert_indep_singular': '<strong>High independent cardinality:</strong> {names} multiplies by {rph} series/hour. Real explosion risk. Apply Metrics without Limits™ to block indexing.',
        'results.alert_indep_plural': '<strong>High independent cardinality:</strong> {names} each multiply by {rph} series/hour. Real explosion risk. Apply Metrics without Limits™ to block indexing.',
        'results.alert_over': '<strong>{pct}% of series exceed allotment.</strong> Allotment: {allot} — generated: {series}. Use MwL to reduce overage by 98%.',
        'results.alert_ok': '<strong>Within allotment.</strong> {series} series fit within {allot} included in the {plan} plan.',
        'results.stat_combos': 'Combinations',
        'results.stat_combos_sub': 'per hour',
        'results.stat_series': 'Timeseries',
        'results.stat_series_sub': 'avg active/hour',
        'results.stat_alot': 'Allotment',
        'results.stat_over': 'Overage',
        'results.stat_blocks': '100-blocks',
        'results.stat_cost': 'Cost / mo',
        'results.formula_label': 'C(M) = H × min(rph, ∏V(t)) × M_type',
        'results.formula_sub': '— rph: emissions/hour per host',
        'results.fresult_theoretical_tooltip': 'Theoretical — unrealizable: exceeds event rate',
        'results.cap_title': 'Capped by event rate',
        'results.cap_explain': 'You only have <strong>{rph} emissions/hour per host</strong>; each emission produces <em>one</em> timeseries. Regardless of theoretical product ({theoretical}), real maximum is <code>hosts × rph × M_type</code>.',
        'results.chip_no_tags': 'no tags',
        'results.chip_pergroup_tooltip': 'Co-variant tags — all contribute 1× rph to the group',
        'results.chip_hosts': 'hosts',
        'results.chip_type': 'type',
        'results.cost_table_item': 'Item',
        'results.cost_table_detail': 'Detail',
        'results.cost_table_value': 'USD/mo',
        'results.cost_infra': 'Infrastructure ({plan})',
        'results.cost_infra_detail': '{hosts} hosts × ${cost}',
        'results.cost_overage': 'Overage — Indexing',
        'results.cost_overage_detail': '{blocks} blocks × ${price}/100',
        'results.cost_total': 'Total (no optimization)',
        'results.mwl_title': 'Metrics without Limits™ — Savings',
        'results.mwl_amount': '${amount} / mo with MwL active',
        'results.mwl_desc': 'By excluding high-cost tags from the indexing allowlist, overage drops from <strong style="color:var(--red)">${idx}</strong> to <strong style="color:var(--teal)">${ing}</strong> — 98% reduction.',
        'results.mwl_dist_extra': 'Distributions also allow removing <code style="background:rgba(0,217,184,.1);padding:0 4px;border-radius:3px;font-family:var(--mono)">host</code> from the allowlist.',
        'results.mwl_savings': 'Savings: <strong style="color:var(--teal)">${savings}/mo</strong>.',
        'results.hour_note': '<strong>Hourly window:</strong> timeseries only count in the hour they report at least one point. Ephemeral tags like <code>correlation_id</code> that appear once "expire" in the same hour-bucket — that\'s why billing scales with the <strong>per-hour rate</strong>, not the accumulated monthly volume.',
        'modal.title': 'Instrumentation Code',
        'modal.btn_copy': 'Copy',
        'modal.btn_copied': 'Copied!',
        'modal.btn_close': 'Close',
        'modal.btn_download': 'Download',
        'modal.note': 'Code generated from simulator tags and configuration — adapt the DogStatsD Agent host to your environment.',
        'gen.comment_submit': 'Submit custom metric',
        'share.title': 'Datadog Metric Simulator',
        'share.text': 'Simulate cardinality and cost of Datadog custom metrics before deploying.',
    },
    'es-ES': {
        document_title: 'Datadog · Simulador de Métricas',
        'header.title': 'Datadog Metric Simulator',
        'header.sub': 'Cardinalidad · FinOps · Gobernanza',
        'header.theme_tooltip': 'Cambiar tema',
        'header.btn_code': 'Generar Código',
        'header.btn_share': 'Compartir',
        'header.share_tooltip': 'Compartir este simulador',
        'header.share_copied': '¡Enlace copiado!',
        'header.lang_tooltip': 'Idioma de la interfaz',
        'form.section_metric': 'Métrica',
        'form.label_name': 'Nombre',
        'form.label_name_hint': '— gobernanza: prefijo <code>custom.</code> · tipo como sufijo',
        'form.name_placeholder': 'service.operation.metric',
        'form.label_type': 'Tipo',
        'form.type_count': 'COUNT / RATE — 1×',
        'form.type_gauge': 'GAUGE — 1×',
        'form.type_set': 'SET — 1×',
        'form.type_histogram': 'HISTOGRAM — 5×',
        'form.type_distribution': 'DISTRIBUTION — 5×',
        'form.type_distribution_pct': 'DISTRIBUTION + Percentiles — 10×',
        'form.dist_info': '<strong>Distributions:</strong> permiten quitar <code>host</code> del allowlist de indexación vía MwL — exclusivo de este tipo. Los percentiles (10×) aplican a <strong>todas</strong> las tags indexadas.',
        'form.section_plan': 'Plan & Infra',
        'form.plan_free_name': 'Free',
        'form.plan_free_desc': '100 fijas s/host',
        'form.plan_pro_name': 'Pro',
        'form.plan_pro_desc': '100/host ~$15/host',
        'form.plan_ent_name': 'Enterprise',
        'form.plan_ent_desc': '200/host ~$23/host',
        'form.label_hosts': 'Hosts / Contenedores',
        'form.label_rph': 'Emisiones/hora · host',
        'form.label_rph_tooltip': 'Emisiones de la métrica por hora, por host. Para sistema total, divide por la cantidad de hosts. Este valor define el techo de cardinalidad — no puedes tener más timeseries únicas/hora que emisiones/hora.',
        'form.tags_title': 'Tags',
        'form.btn_add_tag': 'Agregar',
        'form.unbounded_hint': '<strong>Cardinalidad independiente alta:</strong> las tags marcadas como <code>Independiente</code> multiplican el producto por <code>rph</code> cada una — riesgo real de explosión. Las tags <code>Por petición</code> co-varían y se agrupan (1× rph para todas), patrón seguro para <code>correlation_id</code>, <code>trace_id</code>, etc.',
        'form.btn_calc': 'Calcular Proyección',
        'form.tag_n_label': 'Tag {n} — nombre',
        'form.tag_name_placeholder': 'region, env, status_code…',
        'form.tag_qtd': 'Cant',
        'form.tag_qtd_tooltip': '0 = cardinalidad no acotada (efímera)',
        'form.tag_remove_tooltip': 'Eliminar tag',
        'form.tag_values_label': 'Valores posibles',
        'form.tag_values_hint': '(opcional — auto-calcula Cant)',
        'form.tag_values_placeholder': 'us-east, eu-west, sa-east, ap-south',
        'form.regime_label': 'Régimen de variación',
        'form.regime_per_req_name': 'Por petición',
        'form.regime_per_req_desc': 'co-variante (correlation_id, trace_id…)',
        'form.regime_per_req_tooltip': 'Co-varía con la petición/evento. Varias tags en este régimen se agrupan y contribuyen con 1× rph en total.',
        'form.regime_indep_name': 'Independiente',
        'form.regime_indep_desc': 'alta cardinalidad (pod_name, user_id…)',
        'form.regime_indep_tooltip': 'Efímera pero con ritmo propio. Multiplica como rph (alta cardinalidad).',
        'placeholder.title': 'Esperando simulación',
        'placeholder.desc': 'Configura las tags y haz clic en "Calcular Proyección"',
        'results.host_singular': 'host',
        'results.host_plural': 'hosts',
        'results.mult_simple': '1× simple',
        'results.mult_5x': '5× hist./dist.',
        'results.mult_10x': '10× dist.+percentiles',
        'results.dist_billing_title': 'DISTRIBUTION — regla de billing:',
        'results.dist_billing_5x': '5 agregaciones por combinación: <em>avg, count, max, min, sum</em>.',
        'results.dist_billing_10x': '10 agregaciones por combinación: <em>avg, count, max, min, sum</em> + <em>p50, p75, p90, p95, p99</em>. Los percentiles aplican a <strong>todas</strong> las tags indexadas.',
        'results.dist_billing_mwl': 'Vía MwL, las distributions permiten quitar incluso <code>host</code> del allowlist de indexación.',
        'results.cogroup_title': 'Tags co-variantes agrupadas:',
        'results.cogroup_desc': '{names} varían juntas por petición y contribuyen <strong>1× {rph}</strong> al producto (no <code>{rph}<sup>{n}</sup></code>). Cada evento genera una única tupla nueva, no un producto cartesiano.',
        'results.alert_indep_singular': '<strong>Cardinalidad independiente alta:</strong> {names} multiplica con {rph} series/hora. Riesgo real de explosión. Aplica Metrics without Limits™ para bloquear la indexación.',
        'results.alert_indep_plural': '<strong>Cardinalidad independiente alta:</strong> {names} multiplican con {rph} series/hora cada una. Riesgo real de explosión. Aplica Metrics without Limits™ para bloquear la indexación.',
        'results.alert_over': '<strong>{pct}% de las series exceden la franquicia.</strong> Franquicia: {allot} — generado: {series}. Usa MwL para reducir overage en 98%.',
        'results.alert_ok': '<strong>Dentro de la franquicia.</strong> {series} series contenidas en {allot} incluidas en el plan {plan}.',
        'results.stat_combos': 'Combinaciones',
        'results.stat_combos_sub': 'por hora',
        'results.stat_series': 'Series Temporales',
        'results.stat_series_sub': 'media activa/hora',
        'results.stat_alot': 'Franquicia',
        'results.stat_over': 'Overage',
        'results.stat_blocks': 'Bloques 100',
        'results.stat_cost': 'Costo / mes',
        'results.formula_label': 'C(M) = H × min(rph, ∏V(t)) × M_tipo',
        'results.formula_sub': '— rph: emisiones/hora por host',
        'results.fresult_theoretical_tooltip': 'Teórico — no realizable: excede la tasa de eventos',
        'results.cap_title': 'Limitado por la tasa de eventos',
        'results.cap_explain': 'Solo tienes <strong>{rph} emisiones/hora por host</strong>; cada emisión produce <em>una</em> timeseries. Independiente del producto teórico ({theoretical}), el máximo real es <code>hosts × rph × M_tipo</code>.',
        'results.chip_no_tags': 'sin tags',
        'results.chip_pergroup_tooltip': 'Tags co-variantes — todas contribuyen 1× rph al grupo',
        'results.chip_hosts': 'hosts',
        'results.chip_type': 'tipo',
        'results.cost_table_item': 'Concepto',
        'results.cost_table_detail': 'Detalle',
        'results.cost_table_value': 'USD/mes',
        'results.cost_infra': 'Infraestructura ({plan})',
        'results.cost_infra_detail': '{hosts} hosts × ${cost}',
        'results.cost_overage': 'Overage — Indexación',
        'results.cost_overage_detail': '{blocks} bloques × ${price}/100',
        'results.cost_total': 'Total (sin optimización)',
        'results.mwl_title': 'Metrics without Limits™ — Ahorro',
        'results.mwl_amount': '${amount} / mes con MwL activo',
        'results.mwl_desc': 'Excluyendo tags de alto costo del allowlist de indexación, overage cae de <strong style="color:var(--red)">${idx}</strong> a <strong style="color:var(--teal)">${ing}</strong> — reducción de 98%.',
        'results.mwl_dist_extra': 'Las distributions también permiten quitar <code style="background:rgba(0,217,184,.1);padding:0 4px;border-radius:3px;font-family:var(--mono)">host</code> del allowlist.',
        'results.mwl_savings': 'Ahorro: <strong style="color:var(--teal)">${savings}/mes</strong>.',
        'results.hour_note': '<strong>Ventana horaria:</strong> las series temporales solo cuentan en la hora en que reportan al menos un punto. Tags efímeras como <code>correlation_id</code> que aparecen una sola vez "expiran" en el mismo hour-bucket — por eso el billing escala con la <strong>tasa por hora</strong>, no con el volumen mensual acumulado.',
        'modal.title': 'Código de Instrumentación',
        'modal.btn_copy': 'Copiar',
        'modal.btn_copied': '¡Copiado!',
        'modal.btn_close': 'Cerrar',
        'modal.btn_download': 'Descargar',
        'modal.note': 'Código generado a partir de las tags y configuración del simulador — adapta el host del Agent DogStatsD a tu entorno.',
        'gen.comment_submit': 'Envío de la métrica customizada',
        'share.title': 'Datadog Metric Simulator',
        'share.text': 'Simula cardinalidad y costo de métricas customizadas en Datadog antes de desplegar.',
    },
};

let currentLang = (() => {
    const saved = localStorage.getItem('dd-sim-lang');
    if (saved && STRINGS[saved]) return saved;
    const b = (navigator.language || 'pt-BR').toLowerCase();
    if (b.startsWith('en')) return 'en-US';
    if (b.startsWith('es')) return 'es-ES';
    return 'pt-BR';
})();

const LOCALE_OF = { 'pt-BR': 'pt-BR', 'en-US': 'en-US', 'es-ES': 'es-ES' };

function t(key, vars) {
    const dict = STRINGS[currentLang] || STRINGS['pt-BR'];
    let s = dict[key] ?? STRINGS['pt-BR'][key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
    }
    return s;
}

function setLanguage(lang) {
    if (!STRINGS[lang]) return;
    currentLang = lang;
    localStorage.setItem('dd-sim-lang', lang);
    applyI18n();
    renderTags();
    // Re-render results if visible
    const res = document.getElementById('results');
    if (res && res.style.display !== 'none' && res.innerHTML.trim()) calcular();
    // Re-generate code if modal open
    if (document.getElementById('codeModal')?.classList.contains('open')) generateCode();
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.title = t('document_title');
    const sel = document.getElementById('langSelect');
    if (sel) sel.value = currentLang;
    // Update metric type select labels
    const typeSel = document.getElementById('metricType');
    if (typeSel) {
        const keys = ['form.type_count', 'form.type_gauge', 'form.type_set', 'form.type_histogram', 'form.type_distribution', 'form.type_distribution_pct'];
        Array.from(typeSel.options).forEach((opt, i) => {
            if (keys[i]) opt.textContent = t(keys[i]);
        });
    }
}

// ─── State ──────────────────────────────────────────────────
let tagSeq = 0;
// Tag shape:
//   { id, name, count, values: string[], regime }
// regime applies only when count === 0 (cardinalidade não-bounded):
//   'per_request'           — varia junto com a requisição/evento (correlation_id,
//                             trace_id, request_id). Múltiplas tags com este regime
//                             co-variam e contribuem com 1× rph para o cálculo.
//   'independent_unbounded' — efêmera mas com ritmo próprio (pod_name muito dinâmico,
//                             user_id em métrica não-por-request). Multiplica como rph.
const tags = [];

const PLANS = {
    free: { label: 'Free', allotPerHost: 0, fixedAllot: 100, hostCost: 0 },
    pro: { label: 'Pro', allotPerHost: 100, fixedAllot: 0, hostCost: 15 },
    enterprise: { label: 'Enterprise', allotPerHost: 200, fixedAllot: 0, hostCost: 23 },
};
const OVR_IDX = 5.00;
const OVR_ING = 0.10;

// ─── Utilities ──────────────────────────────────────────────
const fmt = n => Number(n).toLocaleString(LOCALE_OF[currentLang] || 'pt-BR');
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
    updateMetricSuffix();
}

function getIsDistribution() {
    const sel = document.getElementById('metricType');
    return sel && sel.options[sel.selectedIndex].dataset.m === 'distribution';
}

function getMetricMult() {
    return parseInt(document.getElementById('metricType')?.value || '1');
}

// ─── Metric name composition (governance) ───────────────────
// Convention: custom.{user-input}.{type}
//   custom.   → fixed prefix (governance)
//   user      → editable midname
//   .{type}   → suffix derived from selected type's data-m
//
// Examples:
//   user types "app.checkout.latency" + DISTRIBUTION
//     → custom.app.checkout.latency.distribution
//   user types ""                    + COUNT
//     → custom.my.metric.count   (placeholder fallback)

function getMetricMidName() {
    const raw = (document.getElementById('metricName')?.value || '').trim();
    // Strip any leading 'custom.' or trailing '.{type}' the user might paste in
    let mid = raw.replace(/^custom\./i, '');
    const suffix = getTypeSuffix();
    if (suffix && mid.toLowerCase().endsWith('.' + suffix)) {
        mid = mid.slice(0, -suffix.length - 1);
    }
    return mid || 'my.metric';
}

function getTypeSuffix() {
    const sel = document.getElementById('metricType');
    return sel?.options[sel.selectedIndex]?.dataset.m || 'count';
}

function getFullMetricName() {
    return `custom.${getMetricMidName()}.${getTypeSuffix()}`;
}

function updateMetricSuffix() {
    const el = document.getElementById('metricNameSuffix');
    if (el) el.textContent = '.' + getTypeSuffix();
}

// ─── Tags ───────────────────────────────────────────────────
function addTag(name = '', count = 4, values = [], regime = 'per_request') {
    tags.push({ id: ++tagSeq, name, count, values, regime });
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
    renderTags(); // re-render to show/hide regime pills
    checkUnbounded();
}

function onTagRegimeChange(id, regime) {
    const t = tags.find(t => t.id === id);
    if (!t) return;
    t.regime = regime;
    renderTags();
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

    tags.forEach((tg, i) => {
        const card = document.createElement('div');
        card.className = 'tag-card';
        card.dataset.id = tg.id;

        const showRegime = tg.count === 0 && tg.values.length === 0;
        const regime = tg.regime || 'per_request';

        const regimePills = showRegime ? `
      <div class="tag-regime-row">
        <div class="regime-label">
          <i class="fa-solid fa-shuffle fa-xs"></i> ${t('form.regime_label')}
        </div>
        <div class="regime-pills">
          <label class="regime-pill ${regime === 'per_request' ? 'active' : ''}"
                 title="${esc(t('form.regime_per_req_tooltip'))}">
            <input type="radio" name="regime-${tg.id}" value="per_request"
                   ${regime === 'per_request' ? 'checked' : ''}
                   onchange="onTagRegimeChange(${tg.id}, 'per_request')" />
            <span class="rn"><i class="fa-solid fa-link fa-xs"></i> ${t('form.regime_per_req_name')}</span>
            <span class="rd">${t('form.regime_per_req_desc')}</span>
          </label>
          <label class="regime-pill ${regime === 'independent_unbounded' ? 'active' : ''}"
                 title="${esc(t('form.regime_indep_tooltip'))}">
            <input type="radio" name="regime-${tg.id}" value="independent_unbounded"
                   ${regime === 'independent_unbounded' ? 'checked' : ''}
                   onchange="onTagRegimeChange(${tg.id}, 'independent_unbounded')" />
            <span class="rn"><i class="fa-solid fa-burst fa-xs"></i> ${t('form.regime_indep_name')}</span>
            <span class="rd">${t('form.regime_indep_desc')}</span>
          </label>
        </div>
      </div>` : '';

        card.innerHTML = `
      <!-- row 1: name + count + delete -->
      <div class="tag-card-main">
        <div class="field tag-name-f">
          <label>${t('form.tag_n_label', { n: i + 1 })}</label>
          <input class="tag-name-input" type="text"
            placeholder="${esc(t('form.tag_name_placeholder'))}"
            value="${esc(tg.name)}"
            oninput="onTagNameChange(${tg.id}, this.value)" />
        </div>
        <div class="field tag-count-f">
          <label title="${esc(t('form.tag_qtd_tooltip'))}">${t('form.tag_qtd')}</label>
          <input class="tag-count-input" type="number" min="0"
            value="${tg.count}"
            oninput="onTagCountChange(${tg.id}, this.value)" />
        </div>
        <button class="btn-del" onclick="removeTag(${tg.id})" title="${esc(t('form.tag_remove_tooltip'))}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <!-- row 2: optional values list -->
      <div class="tag-values-row">
        <div class="field">
          <label>${t('form.tag_values_label')} <span style="font-weight:400;opacity:.65">${t('form.tag_values_hint')}</span></label>
          <input class="tag-values-input" type="text"
            placeholder="${esc(t('form.tag_values_placeholder'))}"
            value="${esc(tg.values.join(', '))}"
            oninput="onTagValuesChange(${tg.id}, this.value)" />
        </div>
      </div>
      ${regimePills}`;
        list.appendChild(card);
    });

    document.getElementById('tagCount').textContent = tags.length;
    checkUnbounded();
}

function checkUnbounded() {
    const indepCount = tags.filter(t =>
        t.count === 0 && t.values.length === 0 && t.regime === 'independent_unbounded'
    ).length;
    const hint = document.getElementById('unboundedHint');
    if (hint) hint.classList.toggle('show', indepCount > 0);
}

/**
 * Snapshot the live DOM state into a clean array for calculation / code gen.
 * Sync values back to the tags state array as a side-effect.
 *
 * Each entry returns:
 *   { id, name, count, values, kind, effectiveCount }
 * where:
 *   kind = 'fixed'                 — bounded, multiplica como sempre
 *   kind = 'per_request'           — co-variante por evento, agrupa com outras per_request
 *   kind = 'independent_unbounded' — efêmera independente, multiplica com rph
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

        // Sync back
        t.name = name;
        t.count = count;
        t.values = values;

        // Classify regime
        let kind, effectiveCount;
        if (count > 0) {
            kind = 'fixed';
            effectiveCount = count;
        } else {
            kind = t.regime === 'independent_unbounded' ? 'independent_unbounded' : 'per_request';
            effectiveCount = rph;
        }

        return { id: t.id, name, count, values, kind, effectiveCount };
    });
}

// ─── Calculation ────────────────────────────────────────────
function calcular() {
    const mName = getFullMetricName();
    const sel = document.getElementById('metricType');
    const mMult = parseInt(sel.value);
    const mMeth = sel.options[sel.selectedIndex].dataset.m || 'count';
    const isDist = mMeth === 'distribution';
    const hosts = Math.max(1, parseInt(document.getElementById('hosts').value) || 1);
    const rph = Math.max(1, parseInt(document.getElementById('reqPerHour').value) || 50000);
    const pKey = document.querySelector('input[name=plan]:checked')?.value || 'pro';
    const plan = PLANS[pKey];

    const snap = snapshotTags();

    // ── Combos: regime-aware product, capped by event rate ─────────
    //
    // KEY PRINCIPLE: cardinality/hour ≤ emissions/hour. You cannot
    // produce more unique timeseries than you have metric emissions —
    // each emission feeds exactly ONE timeseries.
    //
    // Per host: cardinality ≤ rph (events/h on that host).
    // Total: cardinality = hosts × min(rph, ∏tag_dimensions_per_host).
    //
    // - 'fixed' tags contribute V values
    // - 'independent_unbounded' tags contribute rph each (high cardinality)
    // - 'per_request' group contributes rph once (correlation_id forces uniqueness)
    //
    // When any per-event-varying tag exists, the product ≥ rph,
    // so cap kicks in and per-host cardinality = rph.
    const fixedTags = snap.filter(t => t.kind === 'fixed');
    const indepTags = snap.filter(t => t.kind === 'independent_unbounded');
    const perReqTags = snap.filter(t => t.kind === 'per_request');
    const fixedProduct = fixedTags.reduce((a, t) => a * t.effectiveCount, 1);

    // Theoretical (uncapped) — kept for didactic display when cap kicks in
    let theoreticalPerHost = fixedProduct;
    indepTags.forEach(t => theoreticalPerHost *= rph);
    if (perReqTags.length > 0) theoreticalPerHost *= rph;

    // Capped per-host cardinality
    const cardinalityPerHost = Math.min(rph, theoreticalPerHost);
    const combos = hosts * cardinalityPerHost;
    const theoreticalCombos = hosts * theoreticalPerHost;
    const wasCapped = theoreticalCombos > combos;

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
    const multLabel = mMult === 10 ? t('results.mult_10x')
        : mMult === 5 ? t('results.mult_5x')
            : t('results.mult_simple');
    const hostLabel = hosts > 1 ? t('results.host_plural') : t('results.host_singular');
    h += `<div class="r-header">
    <code>${esc(mName)}</code>
    <span class="r-sep">·</span><span>${plan.label}</span>
    <span class="r-sep">·</span><span>${hosts} ${hostLabel}</span>
    <span class="r-sep">·</span><span>${multLabel}</span>
  </div>`;

    // Distribution billing note
    if (isDist) {
        h += `<div class="alert alert-info">
      <i class="fa-solid fa-circle-info fa-xs"></i>
      <span>
        <strong>${t('results.dist_billing_title')}</strong>
        ${mMult === 10 ? t('results.dist_billing_10x') : t('results.dist_billing_5x')}
        ${t('results.dist_billing_mwl')}
      </span>
    </div>`;
    }

    // Per-request grouping note (didactic) — only shown when cap doesn't already
    // tell the full story. With cap active, cap-row explains the bound directly.
    if (perReqTags.length >= 2 && !wasCapped) {
        const names = perReqTags.map(tg => `<code>${esc(tg.name || 'tag')}</code>`).join(', ');
        h += `<div class="alert alert-info">
      <i class="fa-solid fa-link fa-xs"></i>
      <span>
        <strong>${t('results.cogroup_title')}</strong>
        ${t('results.cogroup_desc', { names, rph: fmt(rph), n: perReqTags.length })}
      </span>
    </div>`;
    }

    // Main alert
    if (indepTags.length > 0) {
        const names = indepTags.map(tg => `<code>${esc(tg.name || 'tag')}</code>`).join(', ');
        const key = indepTags.length > 1 ? 'results.alert_indep_plural' : 'results.alert_indep_singular';
        h += mkAlert('red', 'fa-skull-crossbones', t(key, { names, rph: fmt(rph) }));
    } else if (over > 0) {
        const pct = Math.round(over / totalSeries * 100);
        h += mkAlert('amber', 'fa-triangle-exclamation',
            t('results.alert_over', { pct, allot: fmt(allot), series: fmt(totalSeries) }));
    } else {
        h += mkAlert('green', 'fa-circle-check',
            t('results.alert_ok', { series: fmt(totalSeries), allot: fmt(allot), plan: plan.label }));
    }

    // Stats
    h += `<div class="stat-grid">
    <div class="sbox"><div class="sl">${t('results.stat_combos')} <span class="ssub">${t('results.stat_combos_sub')}</span></div><div class="sv sv-purple">${fmt(combos)}</div></div>
    <div class="sbox"><div class="sl">${t('results.stat_series')} <span class="ssub">${t('results.stat_series_sub')}</span></div><div class="sv sv-teal">${fmt(totalSeries)}</div></div>
    <div class="sbox"><div class="sl">${t('results.stat_alot')}</div><div class="sv sv-muted">${fmt(allot)}</div></div>
    <div class="sbox"><div class="sl">${t('results.stat_over')}</div><div class="sv ${over > 0 ? 'sv-red' : 'sv-green'}">${fmt(over)}</div></div>
    <div class="sbox"><div class="sl">${t('results.stat_blocks')}</div><div class="sv sv-amber">${fmt(overB)}</div></div>
    <div class="sbox"><div class="sl">${t('results.stat_cost')}</div><div class="sv ${total > 0 ? 'sv-red' : 'sv-green'}">$${money(total)}</div></div>
  </div>`;

    // Formula — chips reflect the theoretical product; cap shown separately if applies
    let chips = `<div class="chip"><span class="cn">${t('results.chip_hosts')}</span><span class="cv">${hosts}</span></div>`;

    // 1. Fixed tags individually
    fixedTags.forEach(tg => {
        chips += `<span class="fop">×</span>
      <div class="chip">
        <span class="cn">${esc(tg.name)}</span>
        <span class="cv">${fmt(tg.effectiveCount)}</span>
      </div>`;
    });

    // 2. Independent unbounded tags individually
    indepTags.forEach(tg => {
        chips += `<span class="fop">×</span>
      <div class="chip chip-inf">
        <span class="cn">${esc(tg.name)} ⚠</span>
        <span class="cv">${fmt(tg.effectiveCount)}</span>
      </div>`;
    });

    // 3. Per-request group as a single chip
    if (perReqTags.length > 0) {
        const groupName = perReqTags.length === 1
            ? esc(perReqTags[0].name || 'per-request')
            : '⟨' + perReqTags.map(tg => esc(tg.name || 'tag')).join(', ') + '⟩';
        chips += `<span class="fop">×</span>
      <div class="chip chip-group" title="${esc(t('results.chip_pergroup_tooltip'))}">
        <span class="cn">${groupName}</span>
        <span class="cv">${fmt(rph)}</span>
      </div>`;
    }

    if (snap.length === 0) {
        chips += `<span class="fop">×</span><div class="chip"><span class="cn">${t('results.chip_no_tags')}</span><span class="cv">1</span></div>`;
    }

    chips += `<span class="fop">×</span>
    <div class="chip chip-type"><span class="cn">${t('results.chip_type')}</span><span class="cv">${mMult}×</span></div>`;

    // When NOT capped, the chips' product equals the actual result
    // When capped, show theoretical result inline and the actual below
    const theoreticalSeries = theoreticalCombos * mMult;

    if (!wasCapped) {
        chips += `<span class="fop">=</span><div class="fresult">${fmt(totalSeries)}</div>`;
    } else {
        chips += `<span class="fop">=</span>
      <div class="fresult fresult-theoretical" title="${esc(t('results.fresult_theoretical_tooltip'))}">${fmt(theoreticalSeries)}</div>`;
    }

    h += `<div class="formula-box">
    <div class="formula-label">${t('results.formula_label')}  <span class="formula-sub">${t('results.formula_sub')}</span></div>
    <div class="formula-row">${chips}</div>`;

    if (wasCapped) {
        h += `<div class="formula-cap-row">
      <div class="cap-arrow">↘</div>
      <div class="cap-content">
        <div class="cap-title">${t('results.cap_title')}</div>
        <div class="cap-explain">
          ${t('results.cap_explain', { rph: fmt(rph), theoretical: fmt(theoreticalSeries) })}
        </div>
        <div class="cap-formula">
          ${hosts} × ${fmt(rph)} × ${mMult}× <span class="fop">=</span>
          <span class="fresult">${fmt(totalSeries)}</span>
        </div>
      </div>
    </div>`;
    }

    h += `</div>`;

    // Cost table
    h += `<table class="cost-table">
    <thead><tr>
      <th>${t('results.cost_table_item')}</th><th>${t('results.cost_table_detail')}</th><th style="text-align:right">${t('results.cost_table_value')}</th>
    </tr></thead>
    <tbody>
      <tr>
        <td class="td-muted">${t('results.cost_infra', { plan: plan.label })}</td>
        <td>${t('results.cost_infra_detail', { hosts, cost: plan.hostCost })}</td>
        <td class="td-r">$${money(cInfra)}</td>
      </tr>
      <tr>
        <td class="td-muted">${t('results.cost_overage')}</td>
        <td>${t('results.cost_overage_detail', { blocks: fmt(overB), price: OVR_IDX.toFixed(2) })}</td>
        <td class="td-r ${over > 0 ? 'td-red' : ''}">$${money(cIdx)}</td>
      </tr>
      <tr class="td-total">
        <td colspan="2"><strong>${t('results.cost_total')}</strong></td>
        <td class="td-r"><strong>$${money(total)}</strong></td>
      </tr>
    </tbody>
  </table>`;

    // MwL
    if (over > 0) {
        h += `<div class="mwl-box">
      <div class="mwl-title"><i class="fa-solid fa-bolt fa-xs"></i> ${t('results.mwl_title')}</div>
      <div class="mwl-amount">${t('results.mwl_amount', { amount: money(totalMwL) })}</div>
      <div class="mwl-desc">
        ${t('results.mwl_desc', { idx: money(cIdx), ing: money(cIng) })}
        ${isDist ? t('results.mwl_dist_extra') : ''}
        ${t('results.mwl_savings', { savings: money(cIdx - cIng) })}
      </div>
    </div>`;
    }

    // Hourly-window note (didactic)
    if (perReqTags.length > 0 || indepTags.length > 0) {
        h += `<div class="hour-note">
      <i class="fa-solid fa-clock fa-xs"></i>
      <span>${t('results.hour_note')}</span>
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
let codeLang = 'python';

function openCodeModal() {
    document.getElementById('codeModal').classList.add('open');
    generateCode();
    document.getElementById('modalSub').textContent = getFullMetricName();
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
    codeLang = btn.dataset.lang;
    generateCode();
    resetCopyBtn();
}

function resetCopyBtn() {
    const b = document.getElementById('btnCopy');
    if (b) { b.classList.remove('copied'); b.innerHTML = `<i class="fa-solid fa-copy"></i> ${t('modal.btn_copy')}`; }
}

function getCodeCtx() {
    const mName = getFullMetricName();
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
        return `# pip install datadog\nfrom datadog import initialize, statsd\n\ninitialize(**{\n    "statsd_host": "127.0.0.1",\n    "statsd_port": 8125,\n})\n\ntags = [${ex}]\n\n# ${t('gen.comment_submit')}\n${call}\n`;
    },
    go({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `client.Incr("${mName}", tags, 1)`, gauge: `client.Gauge("${mName}", 42.0, tags, 1)`, set: `client.Set("${mName}", "unique_id", tags, 1)`, histogram: `client.Histogram("${mName}", 250.5, tags, 1)`, distribution: `client.Distribution("${mName}", 250.5, tags, 1)` }[mMeth] || `client.Incr("${mName}", tags, 1)`;
        return `// go get github.com/DataDog/datadog-go/v5/statsd\npackage main\n\nimport (\n\t"log"\n\t"github.com/DataDog/datadog-go/v5/statsd"\n)\n\nfunc main() {\n\tclient, err := statsd.New("127.0.0.1:8125")\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tdefer client.Close()\n\n\ttags := []string{${ex}}\n\n\t// ${t('gen.comment_submit')}\n\t${call}\n}\n`;
    },
    java({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `statsd.incrementCounter("${mName}", ${ex});`, gauge: `statsd.recordGaugeValue("${mName}", 42.0, ${ex});`, set: `statsd.recordSetValue("${mName}", "unique_id", ${ex});`, histogram: `statsd.recordHistogramValue("${mName}", 250.5, ${ex});`, distribution: `statsd.recordDistributionValue("${mName}", 250.5, ${ex});` }[mMeth] || `statsd.incrementCounter("${mName}", ${ex});`;
        return `// Maven: com.datadoghq:java-dogstatsd-client:4.4.3\nimport com.timgroup.statsd.NonBlockingStatsDClientBuilder;\nimport com.timgroup.statsd.StatsDClient;\n\npublic class MetricExample {\n\n    private static final StatsDClient statsd =\n        new NonBlockingStatsDClientBuilder()\n            .hostname("127.0.0.1")\n            .port(8125)\n            .build();\n\n    public static void main(String[] args) {\n        // ${t('gen.comment_submit')}\n        ${call}\n        statsd.stop();\n    }\n}\n`;
    },
    csharp({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `DogStatsd.Increment("${mName}", tags: new[] { ${ex} });`, gauge: `DogStatsd.Gauge("${mName}", 42.0, tags: new[] { ${ex} });`, set: `DogStatsd.Set("${mName}", "unique_id", tags: new[] { ${ex} });`, histogram: `DogStatsd.Histogram("${mName}", 250.5, tags: new[] { ${ex} });`, distribution: `DogStatsd.Distribution("${mName}", 250.5, tags: new[] { ${ex} });` }[mMeth] || `DogStatsd.Increment("${mName}", tags: new[] { ${ex} });`;
        return `// NuGet: DogStatsD-CSharp-Client\nusing StatsdClient;\n\nclass Program\n{\n    static void Main()\n    {\n        var config = new StatsdConfig\n        {\n            StatsdServerName = "127.0.0.1",\n            StatsdPort = 8125,\n        };\n        DogStatsd.Configure(config);\n\n        // ${t('gen.comment_submit')}\n        ${call}\n    }\n}\n`;
    },
    rust({ mName, mMeth, tagList }) {
        const exArr = buildTagExamples(tagList);
        const exStr = exArr.length > 0 ? exArr.map(t => `        "${t}"`).join(',\n') : '        "env:production"';
        const call = { count: `client.incr("${mName}", tags.clone()).unwrap();`, gauge: `client.gauge("${mName}", "42.0", tags.clone()).unwrap();`, set: `client.set("${mName}", "unique_id", tags.clone()).unwrap();`, histogram: `client.histogram("${mName}", "250.5", tags.clone()).unwrap();`, distribution: `client.distribution("${mName}", "250.5", tags.clone()).unwrap();` }[mMeth] || `client.incr("${mName}", tags.clone()).unwrap();`;
        return `// Cargo.toml: dogstatsd = "0.11"\nuse dogstatsd::{Client, Options};\n\nfn main() {\n    let client = Client::new(Options::default()).unwrap();\n\n    let tags = vec![\n${exStr},\n    ];\n\n    // ${t('gen.comment_submit')}\n    ${call}\n}\n`;
    },
    kotlin({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `"${t}"`).join(', ');
        const call = { count: `statsd.incrementCounter("${mName}", ${ex})`, gauge: `statsd.recordGaugeValue("${mName}", 42.0, ${ex})`, set: `statsd.recordSetValue("${mName}", "unique_id", ${ex})`, histogram: `statsd.recordHistogramValue("${mName}", 250.5, ${ex})`, distribution: `statsd.recordDistributionValue("${mName}", 250.5, ${ex})` }[mMeth] || `statsd.incrementCounter("${mName}", ${ex})`;
        return `// Gradle: implementation("com.datadoghq:java-dogstatsd-client:4.4.3")\nimport com.timgroup.statsd.NonBlockingStatsDClientBuilder\n\nfun main() {\n    val statsd = NonBlockingStatsDClientBuilder()\n        .hostname("127.0.0.1")\n        .port(8125)\n        .build()\n\n    // ${t('gen.comment_submit')}\n    ${call}\n\n    statsd.stop()\n}\n`;
    },
    ruby({ mName, mMeth, tagList }) {
        const ex = buildTagExamples(tagList).map(t => `'${t}'`).join(', ');
        const call = { count: `statsd.count('${mName}', 1, tags: tags)`, gauge: `statsd.gauge('${mName}', 42.0, tags: tags)`, set: `statsd.set('${mName}', 'unique_id', tags: tags)`, histogram: `statsd.histogram('${mName}', 250.5, tags: tags)`, distribution: `statsd.distribution('${mName}', 250.5, tags: tags)` }[mMeth] || `statsd.count('${mName}', 1, tags: tags)`;
        return `# Gemfile: gem 'dogstatsd-ruby'\nrequire 'datadog/statsd'\n\nstatsd = Datadog::Statsd.new('127.0.0.1', 8125)\n\ntags = [${ex}]\n\n# ${t('gen.comment_submit')}\n${call}\n\nstatsd.close\n`;
    },
};

function generateCode() {
    const ctx = getCodeCtx();
    const gen = GENERATORS[codeLang];
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
    b.innerHTML = `<i class="fa-solid fa-check"></i> ${t('modal.btn_copied')}`;
    setTimeout(() => {
        b.classList.remove('copied');
        b.innerHTML = `<i class="fa-solid fa-copy"></i> ${t('modal.btn_copy')}`;
    }, 2200);
}

const CODE_EXT = {
    python: 'py', go: 'go', java: 'java',
    csharp: 'cs', rust: 'rs', kotlin: 'kt', ruby: 'rb',
};

function downloadCode() {
    const code = document.getElementById('codeBlock').textContent;
    const ext = CODE_EXT[codeLang] || 'txt';
    const safeName = getFullMetricName().replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${safeName}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Visual feedback
    const b = document.getElementById('btnDownload');
    if (b) {
        const original = b.innerHTML;
        b.innerHTML = `<i class="fa-solid fa-check"></i> ${t('modal.btn_copied').replace('!','')}`;
        b.classList.add('copied');
        setTimeout(() => { b.innerHTML = original; b.classList.remove('copied'); }, 1800);
    }
}

async function sharePage() {
    const url = window.location.href;
    const data = {
        title: t('share.title'),
        text: t('share.text'),
        url,
    };
    const btn = document.getElementById('btnShare');
    const showCopied = () => {
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>${t('header.share_copied')}</span>`;
        btn.classList.add('shared');
        setTimeout(() => { btn.innerHTML = original; btn.classList.remove('shared'); }, 2200);
    };
    try {
        if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
            await navigator.share(data);
        } else {
            await navigator.clipboard.writeText(url);
            showCopied();
        }
    } catch (err) {
        // User cancelled native share — silent
        if (err && err.name !== 'AbortError') {
            try { await navigator.clipboard.writeText(url); showCopied(); } catch (_) { }
        }
    }
}

// ─── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDivider();
    applyI18n();
    updateMetricSuffix();

    // Seed default tags — mistura representativa
    addTag('region', 4, ['us-east', 'eu-west', 'sa-east', 'ap-south'], 'per_request');
    addTag('endpoint', 10, [], 'per_request');
    addTag('env', 3, ['prod', 'staging', 'dev'], 'per_request');
});