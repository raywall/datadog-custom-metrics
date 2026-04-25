# 🐶 Métricas Customizadas no Datadog — Guia Didático

Material de referência complementar ao [Datadog Metric Simulator](./README.md). Voltado a engenheiros, SREs, times de plataforma e FinOps que precisam entender — antes de instrumentar — o que estão criando e como aquilo será cobrado.

---

## Índice

1. [O que é uma métrica](#1-o-que-é-uma-métrica)
2. [O que é uma métrica customizada](#2-o-que-é-uma-métrica-customizada)
3. [Para que servem (propósito)](#3-para-que-servem-propósito)
4. [Casos de uso](#4-casos-de-uso)
5. [Benefícios](#5-benefícios)
6. [Cuidados e perigos](#6-cuidados-e-perigos)
7. [Possibilidades de registro no Datadog](#7-possibilidades-de-registro-no-datadog)
8. [Nuances e fórmula de cálculo do billing](#8-nuances-e-fórmula-de-cálculo-do-billing)

---

## 1. O que é uma métrica

Uma **métrica** é um valor numérico associado a um instante no tempo, normalmente acompanhado de um conjunto de rótulos (tags) que descrevem o contexto da medição. Em observabilidade, ela representa uma medição contínua de algum aspecto do sistema — utilização de CPU, latência de uma requisição, número de pedidos por minuto, profundidade de uma fila — e é a forma mais eficiente de armazenar séries históricas de comportamento.

Uma métrica é caracterizada por três elementos:

- **Nome**: identificador semântico (ex.: `http.requests.latency`, `cart.items.count`).
- **Valor numérico**: o ponto de dado em si.
- **Tags**: pares chave/valor que dão dimensões ao dado (ex.: `service:checkout`, `env:prod`, `status:200`).

A combinação `nome + tags` define uma **série temporal** (timeseries) — uma sequência ordenada no tempo de pontos de dado pertencentes àquela combinação específica. É essa unidade — a série temporal — que importa para custo, armazenamento e capacidade de consulta.

### Métricas vs. logs vs. traces

Os três pilares clássicos da observabilidade têm propósitos distintos e complementares:

- **Logs** são registros textuais, ricos em detalhes, ideais para investigação pontual.
- **Traces** capturam o caminho de uma requisição através de serviços distribuídos.
- **Métricas** são agregadas, numéricas, eficientes em armazenamento e ideais para detecção de tendências, alertas e dashboards de longo prazo.

Métricas são tipicamente as mais baratas de armazenar e consultar — desde que sua **cardinalidade** esteja sob controle.

---

## 2. O que é uma métrica customizada

No Datadog, métricas vêm de duas fontes:

- **Métricas integradas**: emitidas automaticamente pelas mais de 1.000 integrações oficiais do Datadog (AWS, Kubernetes, PostgreSQL, Redis, etc.). Elas são incluídas no preço base do plano.

- **Métricas customizadas**: qualquer métrica enviada por código da aplicação (via DogStatsD, custom Agent Check, API ou bibliotecas de runtime do APM) que não venha de uma integração oficial. Essas são cobradas separadamente, com base no número de séries temporais únicas geradas.

A definição formal do Datadog é direta: **uma métrica customizada é unicamente identificada pela combinação de nome + valores das tags + host**. Toda combinação distinta dessa tupla conta como uma métrica customizada faturável.

Exemplo concreto. Esta única "métrica" conceitual:

```python
statsd.distribution(
    'app.checkout.latency',
    elapsed_ms,
    tags=['env:prod', 'region:us-east', 'status:200']
)
```

…produz **uma timeseries** se as tags sempre carregarem esses valores. Mas se `region` puder ser `us-east`, `eu-west` ou `sa-east`, e `status` puder ser `200`, `400` ou `500`, então a mesma métrica produz **3 × 3 = 9 timeseries** — uma para cada combinação distinta.

---

## 3. Para que servem (propósito)

Métricas customizadas existem porque **integrações genéricas não conhecem o seu domínio**. O Datadog sabe quanta CPU sua VM está usando, mas não sabe qual o ticket médio do seu carrinho de compras, qual o tempo de aprovação de crédito do seu produto financeiro, ou qual o tamanho médio dos lotes de processamento batch que sua plataforma roda à noite.

Métricas customizadas preenchem essa lacuna — elas medem o **comportamento do seu negócio e da sua aplicação em termos próprios**, e não em termos de infraestrutura compartilhada. São o que permite que observabilidade deixe de ser apenas "as máquinas estão saudáveis?" e passe a responder "o produto está entregando o resultado esperado para o cliente?".

Em essência, métricas customizadas servem para:

- **Mensurar KPIs de negócio**: receita por minuto, conversões, churn em tempo real.
- **Mensurar KPIs de produto**: tempo de resposta do checkout, taxa de sucesso de pagamento, profundidade da fila de processamento.
- **Mensurar KPIs técnicos específicos do domínio** que não vêm de integrações: tempo de cálculo de um motor de precificação, throughput de um pipeline de ML, latência de um serviço interno.
- **Suportar SLOs e alertas baseados em comportamento real do sistema**, não em proxies infraestruturais.

---

## 4. Casos de uso

Os casos abaixo ilustram o tipo de problema que justifica criar uma métrica customizada — e quais sinais mostram que ela é a ferramenta certa, e não logs ou traces.

### Negócio em tempo quase-real

- **Receita acumulada por hora**, segmentada por produto e canal de venda, para detectar quedas anormais que indiquem problemas de funil ou de gateway.
- **Taxa de conversão** de uma jornada multi-etapa (cadastro → ativação → primeira transação), para correlacionar regressões com deploys.
- **Churn rate em janela móvel** para alertar antes que um problema de UX vire perda de receita.

### Operação de produto

- **Latência de um motor de cálculo** (precificação, cotação, recomendação) para correlacionar com mudanças de algoritmo ou de dataset.
- **Tempo de aprovação** de uma solicitação que envolve múltiplos sistemas downstream — útil para identificar gargalos sem precisar instrumentar trace completo.
- **Tamanho de fila** de processamento assíncrono, para alertar antes que ela transborde os SLAs do produto.

### KPIs técnicos de domínio

- **Hit rate de cache** específico da aplicação (não o do Redis, que vem da integração).
- **Eficiência de batch jobs** medida em registros processados por segundo, com tags por job/região/tier.
- **Taxa de erro de regras de negócio** versus erros técnicos — diferenciar `business_error` de `system_error` é frequentemente impossível só com logs.

### Padrões para evitar

Há casos em que métrica customizada **não é a ferramenta certa**, e usá-la cria custo sem valor:

- Quando você quer **investigar uma requisição específica**: isso é trace.
- Quando você quer **mensagens de erro detalhadas com stack trace**: isso é log.
- Quando o que você quer medir é **debug efêmero** — você só vai olhar uma vez, não há valor histórico: é log com facet, não métrica.
- Quando a tag que você quer adicionar é o próprio identificador do evento (`request_id`, `trace_id`, `correlation_id`, `session_id`, `user_id`): aí sua métrica vira um log glorificado, infinitamente mais caro. Se você precisa de granularidade individual, **logs e traces** são as ferramentas — eles têm modelos de custo apropriados para cardinalidade alta.

---

## 5. Benefícios

### Eficiência de armazenamento e consulta

Uma métrica é dezenas a centenas de vezes mais barata que um log equivalente em armazenamento e consulta. Para qualquer pergunta que possa ser respondida com agregação numérica ao longo do tempo, métricas vencem em performance e custo.

### Retenção longa

A retenção padrão de métricas no Datadog é de 15 meses, com rollups automáticos para horizontes longos. Logs típicos têm retenção indexada de 15 dias. Para análise de tendência ano-contra-ano, sazonalidade, planejamento de capacidade, métricas são insubstituíveis.

### Suporte a SLO e alertas precisos

Monitores baseados em métricas têm avaliação contínua, baixa latência de detecção, e suportam funções estatísticas avançadas (anomaly detection, forecast, outliers). Alertas baseados em logs têm latência maior e tendem a ser mais ruidosos.

### Visualização sem custo extra

Métricas alimentam dashboards e gráficos sem cobrança adicional por consulta. Cada query em log indexado tem custo computacional não-desprezível. Em times com muitos dashboards e muitos consumidores, isso faz diferença material na fatura.

### Correlação cross-pilar

Métricas customizadas em Datadog correlacionam nativamente com APM, logs, RUM e infraestrutura via tags compartilhadas. Uma alta latência em `app.pricing.elapsed_ms{env:prod}` pode ser pivotada com um clique para os traces e logs que estavam ativos naquele intervalo.

---

## 6. Cuidados e perigos

Esta seção é a mais importante do documento, e onde a maior parte dos custos não-orçados vai parar.

### O perigo principal: cardinalidade descontrolada

A cobrança não escala com o número de pontos de dado nem com a frequência de submissão — escala com o **número de séries temporais únicas**. Cada combinação distinta de tags cria uma nova série, e cada série tem um custo associado. Esse modelo recompensa instrumentação consciente e pune instrumentação ingênua.

Os anti-padrões clássicos são:

#### Tags identificadoras de evento

Adicionar `request_id`, `correlation_id`, `trace_id`, `session_id` ou qualquer UUID gerado por requisição como tag em uma métrica é o erro mais comum e o mais caro. Cada requisição cria uma nova combinação única, e a métrica perde toda a propriedade de agregação que justificaria existir como métrica em primeiro lugar.

Há uma sutileza importante: graças à janela horária do billing (ver [seção 8](#8-nuances-e-fórmula-de-cálculo-do-billing)), tags efêmeras que aparecem uma única vez não inflam o custo no acumulado mensal — só na taxa por hora. Isso significa que o custo é menor do que parece, mas continua sendo desperdício: a métrica não está sendo agregada.

#### Tags com cardinalidade unbounded em ambientes dinâmicos

`pod_name` em Kubernetes com auto-scaling agressivo, `container_id`, `host` em ambiente serverless onde cada execução cria um novo identificador. Aparentemente inócuo, esses identificadores podem trazer milhares de combinações por dia. Em geral, prefira `kube_deployment` em vez de `pod_name`, `function_name` em vez de `container_id`.

#### Tags com cardinalidade matemática alta

`user_id`, `customer_id`, `email_hash`. Mesmo que esses valores sejam reutilizados (um cliente recorrente gera o mesmo `user_id`), populações grandes (milhões de clientes) explodem a cardinalidade. Use sampling, *top-k* tagging, ou agrupe em coortes (`user_tier`, `cohort_month`).

#### Combinações cartesianas inadvertidas

Múltiplas tags bounded mas com valores possíveis altos: `endpoint × status_code × http_method × region × env × service`. Cada uma sozinha é razoável; o produto cartesiano pode ser enorme. Antes de adicionar uma tag, calcule o impacto multiplicativo no produto.

### Outros cuidados importantes

#### HISTOGRAM e DISTRIBUTION têm multiplicadores

Por default, cada combinação de tags em uma métrica HISTOGRAM ou DISTRIBUTION gera **5 timeseries** (avg, count, max, min/median, sum/percentile). Habilitando percentis em DISTRIBUTION, vira **10**. Esse multiplicador é frequentemente esquecido nos cálculos de capacidade.

#### Métricas geram cobrança mesmo sem queries

A presença das séries é o que custa, não o uso. Métricas que ninguém consulta continuam pesando na fatura até serem removidas (ou bloqueadas via Metrics without Limits™).

#### Tags inerentes da infraestrutura

O Agent Datadog adiciona tags automáticas (`host`, `env`, `service`, `version`, `kube_*`, `image_tag`, etc.). Em ambientes containerizados isso pode acrescentar cardinalidade que você não escreveu no código. Em K8s, controle isso via `DD_DOGSTATSD_TAG_CARDINALITY` (`low` por default, evitando `pod_name` em métricas DogStatsD).

### Boas práticas para evitar problemas

- **Estimar a cardinalidade antes de instrumentar**: o produto cartesiano de todas as tags planejadas, multiplicado pelo multiplicador do tipo da métrica, multiplicado pelo número de hosts.
- **Documentar cada métrica**: nome, propósito, tags esperadas, regime de variação por tag.
- **Code review específico para mudanças em tags**: adicionar uma tag em uma métrica core nunca é "cosmético" — é mudança de billing.
- **Configurar Metrics without Limits™ (MwL) em métricas com risco**: especialmente DISTRIBUTION, mantenha um allowlist enxuto de tags queryáveis.
- **Monitorar a sua própria volumetria**: o Datadog expõe métricas como `datadog.estimated_usage.metrics.custom` que você pode (e deve) alertar quando ultrapassar limites contratuais.

---

## 7. Possibilidades de registro no Datadog

O Datadog suporta múltiplas formas de submeter métricas customizadas, com características diferentes de operação. A escolha não é trivial — afeta latência, granularidade, possibilidades de agregação e custo.

### DogStatsD

Padrão UDP/UDS estendido do StatsD, é o método mais usado para instrumentação inline. O Agent Datadog roda um servidor DogStatsD na porta 8125 (default) e a aplicação envia datagramas com a métrica.

```python
from datadog import initialize, statsd
initialize(statsd_host='127.0.0.1', statsd_port=8125)
statsd.distribution('app.pricing.elapsed_ms', elapsed, tags=['env:prod'])
```

Características:
- Latência muito baixa (UDP sem ack — fire-and-forget).
- Agregação de pontos no Agent durante o flush interval (default 10s).
- Suporta os 6 tipos: COUNT, GAUGE, SET, HISTOGRAM, DISTRIBUTION, mais o TIMER (subset de HISTOGRAM).
- Bibliotecas oficiais para Python, Go, Java, .NET, Rust, Ruby, PHP, Node, Kotlin, etc.

### Custom Agent Check

Plugin Python que roda dentro do próprio Agent, executando uma rotina customizada em intervalos definidos (default 15s).

```python
from datadog_checks.base import AgentCheck

class MyCheck(AgentCheck):
    def check(self, instance):
        value = fetch_my_thing()
        self.gauge('my.custom.metric', value, tags=['env:prod'])
```

Características:
- Ideal para métricas que precisam consultar APIs/bases externas em polling.
- Acesso completo ao framework de checks (service checks, eventos, configuração via YAML).
- Roda no contexto do Agent — boa para métricas de infraestrutura customizada.

### API HTTP

Submissão direta via HTTP POST para os endpoints `/api/v1/series` ou `/api/v2/series`. Útil quando não há Agent disponível no caminho (ex.: serverless puro, dispositivos IoT, jobs externos).

```bash
curl -X POST "https://api.datadoghq.com/api/v2/series" \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"series": [{"metric": "my.metric", "type": 3, "points": [...], "tags": [...]}]}'
```

Características:
- Não depende de Agent.
- Tem maior latência e overhead que DogStatsD.
- Não suporta DISTRIBUTION nativamente (é necessário usar a API específica de distribution points).

### OpenTelemetry (OTLP)

O Datadog aceita métricas via OTLP, com mapeamento automático: OpenTelemetry Histogram → Datadog Distribution, OpenTelemetry Counter → Datadog Count, etc. Útil quando você já tem instrumentação OTel padronizada e não quer dual-instrumentar.

```python
from opentelemetry import metrics
meter = metrics.get_meter(__name__)
hist = meter.create_histogram("app.pricing.elapsed_ms")
hist.record(elapsed, attributes={"env": "prod"})
```

### APM / RUM / Logs → Métricas

O Datadog também permite **gerar métricas customizadas a partir de outras telemetrias**:

- **APM-generated metrics**: criar uma métrica a partir de uma facet de spans (ex.: contar spans com `error:true`).
- **Log-based metrics**: criar uma métrica a partir de uma query de logs (ex.: contar logs com `level:error` por serviço).
- **RUM-based metrics**: criar métrica a partir de eventos de Real User Monitoring.

⚠️ **Cuidado especial aqui**: esse atalho é poderoso, mas é onde muitos times criam cardinalidade catastrófica sem perceber. Adicionar `@user_id` ou `@request_id` como dimensão em uma log-based metric é o caminho mais rápido para uma fatura cara — porque o que era um atributo de log (que cardinalidade não custa caro) vira uma timeseries indexada (que custa muito).

### Comparação rápida

| Método | Latência | Tipos suportados | Quando usar |
|---|---|---|---|
| DogStatsD | Muito baixa | Todos | Instrumentação inline em código de produção |
| Custom Agent Check | Média (polling) | Todos | Métricas de polling de fontes externas |
| API HTTP | Mais alta | Todos exceto DISTRIBUTION nativo | Sem Agent (serverless, IoT, jobs) |
| OTLP | Baixa | Mapeados conforme spec OTel | Padronização OTel pré-existente |
| Logs/Traces/RUM → Métricas | Medida em pipeline | Count, Distribution | Quando a fonte da verdade já é log/trace |

---

## 8. Nuances e fórmula de cálculo do billing

Esta seção formaliza o que está implementado no [simulador](./README.md). É a parte mais densa, mas é o que separa estimativas confiáveis de chutes.

### Definição de uma série temporal cobrável

Uma série temporal cobrável é a tupla:

```
(nome_da_métrica, valores_das_tags, host)
```

Toda combinação distinta dessa tupla, ativa em uma hora qualquer, conta como **uma** custom metric naquela hora.

### A janela horária do billing

> O Datadog calcula o billing como a **média mensal de séries temporais distintas ativas por hora**. Para cada hora do mês, conta-se quantas timeseries reportaram pelo menos um ponto naquela hora; ao final do mês, tira-se a média desses valores horários.

Essa definição traz uma consequência **central**: uma série temporal só contribui para o custo na hora em que reporta. Se um `correlation_id` único aparece uma única vez às 14:23 do dia 5 e nunca mais, ele soma 1 à contagem da hora `14:00–15:00` do dia 5, e zero a todas as outras 719 horas do mês. Sua contribuição para a média mensal por hora é `1/720`.

Isso significa que **tags efêmeras não escalam linearmente com o volume mensal acumulado** — elas escalam com a **taxa por hora**.

#### Exemplo numérico

Uma aplicação que processa 500.000 requisições/dia, cada uma com `correlation_id` único:

| Métrica | Valor |
|---|---|
| Total de UUIDs únicos por mês | 500k × 30 = 15.000.000 |
| Soma de hora-timeseries no mês | 15M × 1 hora = 15.000.000 hora-timeseries |
| Horas no mês | 720 |
| **Média mensal por hora** | **15M / 720 ≈ 20.833** |

A intuição comum diria que 15M custaria muito; a matemática real diz que é equivalente a ~20k timeseries — isto é, **a taxa de UUIDs por hora**.

### Tipos de tag e regimes de variação

Para cálculos corretos, é útil classificar cada tag de uma métrica em um dos três regimes:

#### Tag bounded (fixa)

Conjunto fechado e pequeno de valores possíveis. Cada valor aparece múltiplas vezes ao longo do tempo. Exemplos: `env` (3 valores), `region` (5 valores), `status_code` (10 valores).

**Contribuição ao produto**: `V(t)`, o número de valores possíveis.

#### Tag per-request (co-variante)

Tag efêmera que muda **junto com a requisição/evento**. Cada valor aparece uma única vez. Múltiplas tags neste regime co-variam — todas mudam juntas a cada evento. Exemplos típicos: `correlation_id`, `trace_id`, `request_id`, e mesmo valores numéricos por requisição como `price`, `amount`, `latency_bucket`.

**Contribuição ao produto**: o **grupo inteiro** de tags per-request contribui com `1× rph` (eventos/hora), independentemente de quantas tags estejam no grupo.

A intuição matemática: se três tags variam juntas, cada evento gera **uma** tupla nova `(correlation_id_X, trace_id_X, price_X)` — não três tuplas separadas. A cardinalidade do grupo é igual à cardinalidade de qualquer uma das tags (que é a taxa de eventos).

#### Tag independent unbounded (independente alta-cardinalidade)

Tag efêmera, mas com ritmo de variação **distinto da requisição**. Casos: `pod_name` em K8s muito dinâmico (pods reiniciam o tempo todo, mas cada pod emite a métrica várias vezes por requisição), `user_id` em métrica que **não** é por-request mas roda em loop de batch.

**Contribuição ao produto**: cada uma multiplica como `rph` independente.

### Multiplicadores por tipo de métrica

| Tipo | Multiplicador | Agregações | Onde acontece a agregação |
|---|---|---|---|
| COUNT | 1× | 1 série | Agent |
| RATE | 1× | 1 série | Agent |
| GAUGE | 1× | 1 série | Agent |
| SET | 1× | 1 série (cardinalidade do set) | Agent |
| HISTOGRAM | 5× | avg, count, median, max, 95p | Agent (percentis locais por host) |
| DISTRIBUTION (default) | 5× | avg, count, max, min, sum | Servidor (DDSketch — percentis globais) |
| DISTRIBUTION + percentis | 10× | + p50, p75, p90, p95, p99 | Servidor |

A diferença HISTOGRAM × DISTRIBUTION é semântica e financeira:

- HISTOGRAM agrega no Agent, então percentis são por-host. Quando você visualiza no Datadog, o "p95" de um cluster é a média do p95 de cada host — o que é matematicamente impreciso.
- DISTRIBUTION transmite os pontos brutos via DDSketch e agrega no servidor, então percentis são globais e precisos.
- Mais importante: **DISTRIBUTION é o único tipo que permite remover o `host` do allowlist via Metrics without Limits™**, o que oferece um vetor adicional de redução de cardinalidade que HISTOGRAM não tem.

### A fórmula completa

```
C(M) = H × ∏ V(tᵢ_fixa) × ∏ rph(tᵢ_indep) × rph(grupo_per_req?) × M_tipo
```

Onde:
- `H` = número de hosts
- `∏ V(tᵢ_fixa)` = produto dos valores possíveis de cada tag bounded
- `∏ rph(tᵢ_indep)` = produto de `rph` para cada tag independente unbounded
- `rph(grupo_per_req?)` = um único `rph`, presente apenas se houver pelo menos uma tag per_request no conjunto
- `M_tipo` = multiplicador do tipo (1× / 5× / 10×)

#### Exemplos de aplicação

**Caso A — métrica simples bounded:**
```
hosts=5, env=3, region=4, status=10, métrica=COUNT
C = 5 × 3 × 4 × 10 × 1 = 600 séries/hora
```

**Caso B — caso real de banco (microsserviço de precificação):**
```
hosts=5, rph=20.833 (500k/dia)
tags: correlation_id, trace_id, price [todas per_request]
      env=2, status=4 [bounded]
métrica=DISTRIBUTION (5×)

Grupo per_request contribui: 1× rph = 20.833
C = 5 × 2 × 4 × 20.833 × 5 = 4.166.600 séries/hora
```

Comparado ao cálculo errado (tratando as três per_request como independentes):
```
C_errado = 5 × 2 × 4 × 20.833³ × 5 ≈ 1,8 × 10¹⁴ séries/hora
```

A correção do regime per_request reduz a estimativa em **~43 milhões de vezes** nesse caso. Esta é a diferença entre um cálculo realista e um pânico falso.

### Allotments e overage

Cada plano oferece uma franquia inclusa, em pool solidário:

| Plano | Franquia indexed | Custo base/host |
|---|---|---|
| Free | 100 (total fixo) | — |
| Pro | 100 / host | ~$15/host/mês |
| Enterprise | 200 / host | ~$23/host/mês |

Acima do allotment, blocos de 100 métricas são cobrados:

| Modalidade | Preço por 100 |
|---|---|
| Indexed (default) | $5,00 |
| Ingested via MwL | $0,10 |

### Metrics without Limits™ (MwL)

MwL desacopla **ingestão** de **indexação**. Você continua enviando todos os tags ao Datadog (ingested), mas configura na UI um **allowlist** de tags que ficam queryáveis (indexed). Tags fora do allowlist deixam de gerar timeseries faturáveis no plano indexed.

No exemplo do banco acima:
- Sem MwL: ~4,2M séries indexadas → overage massivo no plano indexed.
- Com MwL excluindo `correlation_id`, `trace_id`, `price`: indexed cai para `5 × 2 × 4 × 5 = 200` séries; ingested permanece refletindo o volume real, mas ao preço de $0,10/100 (não $5,00/100).

A redução típica de custo é de **até 98%** quando MwL é configurado corretamente em métricas com tags de alta cardinalidade. É o mecanismo recomendado pelo próprio Datadog para situações onde você quer manter a riqueza de instrumentação sem pagar preço de indexação.

### Onde verificar volumetria real

- **Metrics Summary page** → clique no nome da métrica → sidepanel mostra ingested vs indexed atual.
- **Usage page** → ranking das métricas customizadas por consumo, com quebra por tag se Usage Attribution estiver configurado.
- **datadog.estimated_usage.metrics.custom** → métrica meta que você pode dashboardar e alertar para detectar crescimento anômalo.

---

## Recapitulando

Métricas customizadas são, no Datadog, a melhor ferramenta para mensurar comportamento de negócio e produto — desde que seu modelo de cardinalidade seja desenhado com intenção. O custo escala com a **diversidade de combinações de tags ativas por hora**, com multiplicadores adicionais para HISTOGRAM e DISTRIBUTION. A janela horária do billing protege contra explosões aparentes de tags efêmeras (UUIDs, request_ids), mas não protege contra:

1. Adicionar tags de alta cardinalidade independentes ao mesmo tempo.
2. Esquecer o multiplicador 5× ou 10× de DISTRIBUTION/HISTOGRAM.
3. Combinações cartesianas inadvertidas de múltiplas tags bounded com valores possíveis altos.
4. Confundir métrica com log (querer guardar contexto de evento individual em uma timeseries).

Use o [simulador](./README.md) para modelar cenários antes do deploy. Use Metrics without Limits™ como rede de segurança em métricas com risco. E lembre-se que toda tag adicionada é uma decisão de billing.

---

## Referências oficiais

| Tema | Link |
|---|---|
| Métricas Customizadas — Visão Geral | [docs.datadoghq.com/metrics/custom_metrics](https://docs.datadoghq.com/metrics/custom_metrics/) |
| Tipos de Métricas | [docs.datadoghq.com/metrics/types](https://docs.datadoghq.com/metrics/types/) |
| Distributions e DDSketch | [docs.datadoghq.com/metrics/distributions](https://docs.datadoghq.com/metrics/distributions/) |
| Billing de Métricas Customizadas | [docs.datadoghq.com/account_management/billing/custom_metrics](https://docs.datadoghq.com/account_management/billing/custom_metrics/) |
| Metrics without Limits™ | [docs.datadoghq.com/metrics/metrics-without-limits](https://docs.datadoghq.com/metrics/metrics-without-limits/) |
| Governança de Métricas Customizadas | [docs.datadoghq.com/metrics/guide/custom_metrics_governance](https://docs.datadoghq.com/metrics/guide/custom_metrics_governance/) |
| DogStatsD | [docs.datadoghq.com/developers/dogstatsd](https://docs.datadoghq.com/developers/dogstatsd/) |
| Custom Agent Check | [docs.datadoghq.com/metrics/custom_metrics/agent_metrics_submission](https://docs.datadoghq.com/metrics/custom_metrics/agent_metrics_submission/) |
| API HTTP | [docs.datadoghq.com/api/latest/metrics](https://docs.datadoghq.com/api/latest/metrics/#submit-metrics) |
| OpenTelemetry → Datadog | [docs.datadoghq.com/opentelemetry](https://docs.datadoghq.com/opentelemetry/) |
| Tag Cardinality em Kubernetes | [docs.datadoghq.com/getting_started/tagging/assigning_tags](https://docs.datadoghq.com/getting_started/tagging/assigning_tags/) |
| Historical Metrics Ingestion | [docs.datadoghq.com/metrics/custom_metrics/historical_metrics](https://docs.datadoghq.com/metrics/custom_metrics/historical_metrics/) |