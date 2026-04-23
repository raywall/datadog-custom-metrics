# 🐶 Datadog Metric Simulator

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

Simulador interativo de cardinalidade e custo de métricas customizadas no Datadog. Desenvolvido para auxiliar times de engenharia e FinOps a antecipar o impacto financeiro de decisões de instrumentação — antes que o excedente apareça na fatura.

---

## Finalidade

O modelo de cobrança do Datadog para métricas customizadas é baseado em **cardinalidade** — o número de séries temporais únicas geradas — e não no volume bruto de requisições ou eventos. Essa distinção é frequentemente ignorada durante o processo de instrumentação, resultando no fenômeno conhecido como *"The Custom Metric Tax"*: custos não orçados decorrentes da explosão cartesiana de combinações de tags.

Este simulador traduz as regras formais de billing do Datadog em uma interface visual e interativa, permitindo modelar cenários antes de qualquer deploy.

---

## Como as métricas customizadas funcionam

### Definição de uma série temporal cobrável

No Datadog, uma métrica customizada não é identificada apenas pelo seu nome. Uma **série temporal única e cobrável** é definida pela combinação de:

> `nome da métrica` + `combinação única de valores de todas as tags` + `host de origem`

Formalmente, a cardinalidade máxima de uma métrica **M** é calculada como:

```
C(M) = H × ∏ V(tᵢ) × M_tipo
```

Onde `H` é o número de hosts, `V(tᵢ)` é o número de variações de cada tag `tᵢ`, e `M_tipo` é o multiplicador derivado do tipo da métrica. [[Documentação oficial]](https://docs.datadoghq.com/metrics/custom_metrics/)

### Tipos de métricas e multiplicadores

O tipo de submissão de uma métrica determina quantas séries temporais ela gera por combinação de tags. [[Referência completa de tipos]](https://docs.datadoghq.com/metrics/types/)

| Tipo | Multiplicador | Agregações geradas | Processamento |
|---|---|---|---|
| COUNT / RATE | **1×** | 1 série direta | Agent-side |
| GAUGE | **1×** | 1 série direta | Agent-side |
| SET | **1×** | 1 série (contagem de únicos) | Agent-side |
| HISTOGRAM | **5×** | `avg`, `count`, `median`, `max`, `95percentile` | Agent-side |
| DISTRIBUTION | **5×** | `avg`, `count`, `max`, `min`, `sum` | Server-side (DDSketch) |
| DISTRIBUTION + Percentis | **10×** | 5 básicas + `p50`, `p75`, `p90`, `p95`, `p99` | Server-side (DDSketch) |

**HISTOGRAM** e **DISTRIBUTION** merecem atenção especial: uma única métrica conceitual gera automaticamente **5 séries temporais distintas e cobráveis** por combinação de tags — ou **10** quando percentis estão habilitados na DISTRIBUTION.

#### Por que DISTRIBUTION é diferente de HISTOGRAM?

O HISTOGRAM realiza toda a agregação estatística **localmente no Datadog Agent**, dentro de cada intervalo de flush (padrão: 10 segundos). Isso significa que os percentis calculados são locais por host — ao consolidar múltiplos agentes, a média de medianas não equivale à mediana global real da população de dados. [[Detalhes sobre Distributions]](https://docs.datadoghq.com/metrics/distributions/)

A DISTRIBUTION resolve esse problema transmitindo estruturas matemáticas compactas chamadas **DDSketch** diretamente para os servidores do Datadog, onde a agregação ocorre globalmente. Isso garante percentis matematicamente precisos para qualquer combinação de tags em toda a infraestrutura distribuída — sem distorções geográficas.

Uma vantagem exclusiva da DISTRIBUTION via **Metrics without Limits™**: é o único tipo de métrica que permite remover o `host` do allowlist de indexação, reduzindo substancialmente a cardinalidade em ambientes com alto número de hosts.

### O paradoxo entre volume e custo

Um equívoco comum é assumir que maior volume de requisições implica maior custo de métricas. **Isso é incorreto.**

O Datadog cobra pela **diversidade de combinações de tags**, não pelo tráfego. Se um cluster processar 10 milhões de requisições idênticas com a mesma combinação de tags, apenas **1 série temporal** será registrada e cobrada. [[Billing de métricas customizadas]](https://docs.datadoghq.com/account_management/billing/custom_metrics/)

O colapso financeiro ocorre com o anti-padrão da **Cardinalidade Infinita**: uso de tags com identificadores efêmeros e únicos por requisição, como `request_id`, `session_id` ou timestamps em milissegundos. Nesses casos, cada transação força a criação de uma nova série temporal, igualando matematicamente a cardinalidade ao volume bruto de tráfego.

### Franquias por plano

O Datadog inclui uma cota de métricas indexadas por host monitorado, operando em regime de **pool solidário** — o consumo não precisa ser simétrico entre hosts. [[Detalhes de billing]](https://docs.datadoghq.com/account_management/billing/custom_metrics/)

| Plano | Franquia indexada | Custo base / host |
|---|---|---|
| Free | 100 métricas (total fixo) | — |
| Pro | 100 métricas / host | ~$15/host/mês |
| Enterprise | 200 métricas / host | ~$23/host/mês |

### Custo de excedente (Overage)

Ao ultrapassar a franquia do plano, as métricas excedentes são cobradas em blocos de 100: [[Referência de preços]](https://docs.datadoghq.com/account_management/billing/custom_metrics/)

| Modalidade | Custo por bloco de 100 |
|---|---|
| Indexação (padrão) | **$5,00 / mês** |
| Ingestão via Metrics without Limits™ | **$0,10 / mês** |

### Metrics without Limits™

O **Metrics without Limits™** (MwL) desacopla ingestão de indexação. Tags de alta cardinalidade podem ser bloqueadas da indexação diretamente na interface do Datadog — sem necessidade de alterar código ou fazer deploy — reduzindo o custo de overage em **até 98%** enquanto os dados continuam sendo ingeridos para análise macro. [[Documentação MwL]](https://docs.datadoghq.com/metrics/metrics-without-limits/)

O simulador calcula e exibe automaticamente a economia potencial com MwL para cada cenário modelado.

---

## Funcionalidades

- Cálculo de cardinalidade com produto cartesiano de tags configuradas
- Suporte a valores explícitos por tag (lista separada por vírgula) com contagem automática
- Seleção de plano (Free, Pro, Enterprise) com cálculo de franquia e overage
- Detecção de cardinalidade infinita com alerta contextual
- Estimativa de economia com Metrics without Limits™
- Regras específicas por tipo de métrica, incluindo notas exclusivas para DISTRIBUTION
- Geração de código de instrumentação para **Python, Go, Java, C# .NET, Rust e Kotlin**
- Divisor de painéis arrastável para ajuste da proporção da interface
- Tema claro e escuro com preferência persistida

---

## Acesso via GitHub Pages

O simulador está publicado e pode ser acessado diretamente pelo navegador, sem instalação:

**👉 [https://seu-usuario.github.io/nome-do-repositorio](https://seu-usuario.github.io/nome-do-repositorio)**

> Substitua `seu-usuario` e `nome-do-repositorio` pelos valores do repositório.

---

## Execução local

O projeto é composto inteiramente por HTML, CSS e JavaScript — sem dependências externas ou etapa de build. Basta servir a pasta `app/`:

```bash
# Python 3
python3 -m http.server --directory ./app

# Node.js
npx serve ./app
```

Acesse em `http://localhost:8000`.

---

## Estrutura do repositório

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml      # Deploy automático para GitHub Pages via GitHub Actions
└── app/
    ├── index.html          # Estrutura da interface
    ├── style.css           # Estilos e temas claro/escuro
    ├── simulator.js        # Lógica de cálculo, geração de código e interações
    └── favicon.png
```

---

## Fontes e referências

| Tema | Link |
|---|---|
| Métricas Customizadas | [docs.datadoghq.com/metrics/custom_metrics](https://docs.datadoghq.com/metrics/custom_metrics/) |
| Tipos de Métricas | [docs.datadoghq.com/metrics/types](https://docs.datadoghq.com/metrics/types/) |
| Distributions e DDSketch | [docs.datadoghq.com/metrics/distributions](https://docs.datadoghq.com/metrics/distributions/) |
| Billing de Métricas Customizadas | [docs.datadoghq.com/account_management/billing/custom_metrics](https://docs.datadoghq.com/account_management/billing/custom_metrics/) |
| Metrics without Limits™ | [docs.datadoghq.com/metrics/metrics-without-limits](https://docs.datadoghq.com/metrics/metrics-without-limits/) |
| Governança de Métricas Customizadas | [docs.datadoghq.com/metrics/guide/custom_metrics_governance](https://docs.datadoghq.com/metrics/guide/custom_metrics_governance/) |

---

> Os valores de custo exibidos são estimativas baseadas na documentação pública do Datadog e destinam-se exclusivamente a fins de planejamento. Consulte o contrato vigente e a página de preços oficial para valores precisos: [datadoghq.com/pricing](https://www.datadoghq.com/pricing/).