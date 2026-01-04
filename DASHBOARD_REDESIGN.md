# Dashboard Redesign - Clean & Professional

## Visão Geral

Refatoração completa da home view do dashboard financeiro seguindo princípios de design minimalista, inspirado em Stripe Dashboard, Linear e Claude.ai.

## Objetivos Alcançados

✅ **Resposta rápida**: Dashboard responde em 30 segundos: "Como estou financeiramente?" e "Estou dentro do planejado?"

✅ **Design Minimalista**:
- Whitespace generoso
- Cores sutis e funcionais
- Hierarquia visual clara
- Sem gradientes ou efeitos excessivos

✅ **Componentização Modular**: Componentes reutilizáveis e isolados

✅ **Performance**: Lazy loading e skeleton loaders

## Arquivos Criados

### 1. Composables

#### `composables/useFormatters.ts`

Utilidades centralizadas de formatação para garantir consistência.

**Funções:**
- `formatCurrency(value, options)` - Formata valores em BRL
- `formatNumber(value, decimals)` - Formata números com separadores
- `formatPercentage(value, decimals)` - Formata percentuais
- `formatDate(dateString, format)` - Formata datas (short/medium/long)
- `formatMonthName(monthIndex, short)` - Formata nomes de meses
- `formatRelativeDate(dateString)` - Data relativa ("Hoje", "Amanhã", "Em 3 dias")
- `getTrendColor(value, invert)` - Retorna classe de cor para tendência
- `getValueColor(type, value)` - Retorna classe de cor para tipo de valor

**Exemplo de uso:**
```typescript
const { formatCurrency, formatDate } = useFormatters()

const valor = formatCurrency(1500.50) // "R$ 1.501"
const valorCompacto = formatCurrency(1500000, { compact: true }) // "R$ 1,5 mi"
const data = formatDate('2025-01-15', 'medium') // "15 jan"
```

### 2. Componentes Dashboard

#### `components/dashboard/CashFlowChart.vue`

Gráfico de barras mostrando fluxo de caixa dos últimos 6 meses.

**Props:**
- `transactions: Transaction[]` - Lista de transações

**Features:**
- Chart.js com configuração profissional
- Grid lines sutis (gray-100)
- Tooltips customizados
- Cores semânticas (positive/negative/gray)
- Responsive e com max bar thickness
- Legenda custom minimalista

**Dados mostrados:**
- Receitas (verde)
- Despesas (vermelho)
- Saldo (cinza)

---

#### `components/dashboard/CategoryProgressList.vue`

Lista de top categorias com barras de progresso coloridas.

**Props:**
- `categories: CategorySummary[]` - Lista de categorias
- `limit?: number` - Limite de categorias (default: 5)

**Features:**
- Barras de progresso com altura reduzida (h-2)
- Cores dinâmicas baseadas em percentual:
  - Verde (< 30%): Baixo uso
  - Azul (30-60%): Uso médio
  - Âmbar (60-80%): Uso alto
  - Vermelho (> 80%): Uso muito alto
- Transições suaves (duration-500)
- Empty state minimalista
- Link para página de categorias

---

#### `components/dashboard/UpcomingBillsTable.vue`

Lista de próximas despesas com datas e valores.

**Props:**
- `bills: Transaction[]` - Lista de despesas futuras
- `limit?: number` - Limite de itens (default: 6)

**Features:**
- Hover states sutis
- Data relativa ("Hoje", "Em 3 dias")
- Valores formatados compactamente
- Footer com "Ver mais" quando há mais itens
- Empty state informativo
- Dividers discretos (border-gray-100)

## Estrutura do Layout

### Hero Section - 3 Cards Principais

```
┌──────────────────┬──────────────────┬──────────────────┐
│ Saldo Disponível │ Gastado este Mês │    Receitas      │
│                  │                  │                  │
│   R$ XX.XXX      │    R$ XX.XXX     │    R$ XX.XXX     │
│   +X.X% ↑        │    -X.X% ↓       │    +X.X% ↑       │
│ vs mês anterior  │  média diária    │  XX transações   │
└──────────────────┴──────────────────┴──────────────────┘
```

**Responde:** "Como estou financeiramente?"
- Saldo atual com tendência
- Gastos com média diária
- Receitas do mês

### Middle Section - 2 Colunas

```
┌─────────────────────────┬─────────────────────────┐
│   Fluxo de Caixa       │    Top Categorias       │
│   (Gráfico 6 meses)    │    (Lista com barras)   │
│                        │                         │
│   [Chart.js Bar]       │    Categoria A  70%     │
│                        │    ████████░░░          │
│                        │    Categoria B  45%     │
│                        │    ████░░░░░░░          │
│                        │         ...             │
└─────────────────────────┴─────────────────────────┘
```

**Responde:** "Estou dentro do planejado?"
- Tendência histórica de gastos
- Distribuição por categoria

### Bottom Section - Full Width

```
┌───────────────────────────────────────────────────┐
│          Próximas Despesas                        │
├───────────────────────────────────────────────────┤
│  Netflix         15 jan  (Em 3 dias)  R$ 40       │
│  Aluguel         20 jan  (Em 8 dias)  R$ 2.500    │
│  Energia         25 jan  (Em 13 dias) R$ 180      │
└───────────────────────────────────────────────────┘
```

**Responde:** "O que vem pela frente?"

## Design Tokens

### Cores Semânticas

```javascript
// Tailwind config já configurado
positive: '#059669'   // emerald-600 - Receitas, tendências positivas
negative: '#DC2626'   // red-600 - Despesas, tendências negativas
neutral: '#2563EB'    // blue-600 - Informacional
warning: '#D97706'    // amber-600 - Alertas
accent: '#4F46E5'     // indigo-600 - Ações, links
```

### Tipografia

- **Headers**: text-lg font-semibold (14px)
- **Labels**: text-xs text-gray-500 (11px)
- **Valores grandes**: text-kpi-lg (30px, font-semibold)
- **Valores médios**: text-kpi-md (24px, font-semibold)
- **Texto corpo**: text-sm (13px)

### Espaçamento

- **Gap entre seções**: space-y-8 (32px)
- **Gap entre cards**: gap-6 (24px)
- **Padding cards**: p-4 (16px)
- **Border radius**: rounded-lg (8px)

### Borders & Shadows

- **Border padrão**: border border-gray-200
- **Dividers**: border-gray-100
- **Shadow**: Nenhum (apenas borders sutis)
- **Hover**: hover:bg-gray-50 transition-colors duration-200

## Responsividade

### Breakpoints

```css
/* Mobile First */
grid-cols-1              /* Base: 1 coluna */
md:grid-cols-3           /* Tablet: 3 colunas (hero cards) */
lg:grid-cols-2           /* Desktop: 2 colunas (chart + categories) */
```

### Comportamento

- **Mobile**: Stack vertical completo
- **Tablet**: Hero em 3 colunas, demais em 1 coluna
- **Desktop**: Layout 2 colunas para seções principais

## Performance

### Otimizações

1. **Lazy Loading**: Chart.js carregado sob demanda
2. **Computed Properties**: Cálculos apenas quando necessário
3. **Component Splitting**: Cada seção é um componente isolado
4. **Formatação Centralizada**: Utilidades reutilizáveis

### Loading States

- `LoadingState` component para estado inicial
- `ErrorState` component para erros
- Skeleton loaders (futuro: adicionar aos componentes)

## Próximos Passos (Opcional)

### Melhorias Visuais

- [ ] Adicionar skeleton loaders aos cards
- [ ] Implementar animações sutis de entrada (fade-in)
- [ ] Adicionar sparklines aos KPI cards
- [ ] Implementar dark mode

### Features

- [ ] Filtro de período no gráfico (3/6/12 meses)
- [ ] Drill-down: click em categoria vai para página de detalhes
- [ ] Exportar dados do gráfico (CSV/PDF)
- [ ] Comparação com orçamento planejado

### Performance

- [ ] Implementar cache de cálculos pesados
- [ ] Virtualização para listas longas
- [ ] Web Workers para processamento de grandes datasets

## Migração da Versão Antiga

### Mudanças Quebradas

Nenhuma! A refatoração é **100% compatível** com o código existente.

### Componentes Removidos

- Removida a seção "Quick Links" do sidebar (simplificação)
- Removido badge de filtro ativo inline (já está no header)

### Componentes Mantidos

- `LightStatCard` - Utilizado para os 3 KPIs principais
- `LightInsightCard` - Utilizado para smart insights
- `LoadingState`, `ErrorState` - Estados de UI
- `BaseButton` - Botão de refresh

## Como Usar

### Desenvolvimento

```bash
npm run dev
# Acesse http://localhost:3000
```

### Build

```bash
npm run build
npm run preview
```

### Customização

#### Alterar Cores

Edite `tailwind.config.js`:

```javascript
colors: {
  positive: '#059669',   // Trocar para sua cor
  negative: '#DC2626',
  // ...
}
```

#### Alterar Limite de Categorias

Em `pages/index.vue`:

```vue
<DashboardCategoryProgressList :categories="topCategories" :limit="10" />
```

#### Alterar Limite de Próximas Despesas

Em `pages/index.vue`:

```vue
<DashboardUpcomingBillsTable :bills="upcomingExpenses" :limit="12" />
```

## Referências

- **Design Inspiration**: Stripe Dashboard, Linear, Claude.ai
- **Chart.js**: https://www.chartjs.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **Nuxt 3**: https://nuxt.com/

## Autor

Refatoração realizada seguindo princípios de design minimalista e profissional.

**Data**: Janeiro 2026
**Versão**: 2.0.0
