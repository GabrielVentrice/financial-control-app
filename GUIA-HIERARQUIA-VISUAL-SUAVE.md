# Guia de Hierarquia Visual Suave
## Como Criar Hierarquia SEM Peso Visual

Este guia ensina como criar hierarquia visual clara e confortável usando **tamanho, espaçamento e cor suave** ao invés de **peso (bold), bordas e sombras**.

---

## 🎯 Princípios Fundamentais

### 1. **Hierarquia por TAMANHO, não por Peso**

❌ **EVITE (Peso Visual):**
```vue
<!-- Todos os elementos com font-bold competindo por atenção -->
<h1 class="text-lg font-bold">Título</h1>
<p class="text-base font-bold">Valor: R$ 1.234</p>
<span class="text-sm font-semibold">Detalhe</span>
```

✅ **FAÇA (Hierarquia por Tamanho):**
```vue
<!-- Tamanhos crescentes com pesos leves -->
<h1 class="text-2xl font-normal">Título</h1>
<p class="text-6xl font-light">1.234</p>
<span class="text-sm font-normal text-gray-400">Detalhe</span>
```

**Por que funciona:**
- Tamanhos diferentes criam hierarquia natural
- Font-weight leve é confortável para os olhos
- Contraste entre tamanhos > contraste entre pesos

---

### 2. **Espaçamento Respirável, não Bordas**

❌ **EVITE (Bordas Pesadas):**
```vue
<!-- Bordas em todos elementos = peso visual -->
<div class="border-l-2 border-blue-500">
  <div class="border border-gray-300 mb-2">Item 1</div>
  <div class="border border-gray-300 mb-2">Item 2</div>
  <div class="border border-gray-300 mb-2">Item 3</div>
</div>
```

✅ **FAÇA (Espaçamento Generoso):**
```vue
<!-- Espaço cria separação natural -->
<div class="space-y-8">
  <div class="mb-6">Item 1</div>
  <div class="mb-6">Item 2</div>
  <div class="mb-6">Item 3</div>
</div>
```

**Regra do Espaçamento:**
- Entre seções principais: `space-y-12` (48px)
- Entre cards: `gap-8` (32px)
- Dentro de cards: `space-y-4` (16px)
- Elementos relacionados: `gap-3` (12px)

---

### 3. **Cores Suaves, não Saturadas**

❌ **EVITE (Cores Saturadas):**
```vue
<!-- Cores muito vibrantes cansam -->
<p class="text-red-600">Despesa</p>
<div class="bg-blue-600 text-white">Card</div>
<span class="text-green-600 font-bold">+15%</span>
```

✅ **FAÇA (Cores Dessaturadas):**
```vue
<!-- Cores suaves são confortáveis -->
<p class="text-rose-400">Despesa</p>
<div class="bg-blue-50 text-blue-600">Card</div>
<span class="text-emerald-500 font-normal">+15%</span>
```

**Paleta Suave Recomendada:**
```css
/* Backgrounds */
--bg-page: #FAFBFC       /* Página (não branco puro) */
--bg-card: #F7F8FA       /* Cards */
--bg-hover: #F3F4F6      /* Hover states */

/* Textos */
--text-primary: #374151   /* Gray-700 */
--text-secondary: #6B7280 /* Gray-500 */
--text-muted: #9CA3AF     /* Gray-400 */

/* Bordas (quando necessário) */
--border-subtle: #F3F4F6  /* Gray-100 */
--border-base: #E5E7EB    /* Gray-200 */

/* Acentos suaves */
--accent-blue: #60A5FA     /* Blue-400 */
--accent-green: #34D399    /* Emerald-400 */
--accent-red: #F87171      /* Rose-400 (não red!) */
--accent-yellow: #FBBF24   /* Amber-400 */
```

---

### 4. **Font Weights Suaves**

❌ **EVITE (Tudo Bold):**
```vue
<h1 class="font-bold">Título</h1>
<p class="font-semibold">Subtítulo</p>
<span class="font-bold">Valor</span>
```

✅ **FAÇA (Pesos Leves):**
```vue
<h1 class="font-normal">Título</h1>
<p class="font-normal text-gray-500">Subtítulo</p>
<span class="font-light text-6xl">Valor</span>
```

**Escala de Pesos:**
- `font-light` (300): Números grandes, valores principais
- `font-normal` (400): Textos, labels, títulos
- `font-medium` (500): Pequenos destaques (usar com moderação)
- `font-semibold` (600): Raramente usar
- `font-bold` (700+): **EVITAR** (muito pesado)

---

## 📐 Escalas Recomendadas

### Tamanhos de Fonte (Mobile → Desktop)

```vue
<!-- Valores principais (números, métricas) -->
<p class="text-4xl md:text-6xl font-light">5.234</p>

<!-- Títulos de seção -->
<h2 class="text-lg md:text-xl font-normal">Top Categorias</h2>

<!-- Subtítulos -->
<h3 class="text-base md:text-lg font-normal">Detalhe</h3>

<!-- Corpo de texto -->
<p class="text-sm md:text-base font-normal">Descrição</p>

<!-- Labels pequenos -->
<span class="text-xs font-normal text-gray-400">Label</span>

<!-- Labels minúsculos -->
<span class="text-[11px] uppercase tracking-wider text-gray-400">Categoria</span>
```

### Espaçamentos (Gap/Space)

```vue
<!-- Entre seções principais -->
<div class="space-y-12">...</div>

<!-- Entre cards/elementos -->
<div class="gap-8">...</div>

<!-- Dentro de componentes -->
<div class="space-y-4">...</div>

<!-- Padding de cards -->
<div class="px-8 py-7">...</div>
```

---

## 🎨 Componentes "Leves" - Exemplos Práticos

### Exemplo 1: Card de Estatística

❌ **ANTES (Pesado):**
```vue
<div class="bg-white border-2 border-blue-500 shadow-lg rounded p-4">
  <p class="text-xs font-bold uppercase text-gray-900">SALDO</p>
  <p class="text-2xl font-bold text-green-600">R$ 5.234</p>
  <p class="text-xs font-semibold text-gray-700">vs mês anterior</p>
</div>
```

**Problemas:**
- Borda colorida pesada
- Sombra pesada
- Font-bold em excesso
- Contraste alto

✅ **DEPOIS (Leve):**
```vue
<div class="bg-gray-50/50 rounded-2xl px-8 py-7">
  <p class="text-xs font-medium text-gray-400 mb-4 tracking-wide uppercase">
    Saldo
  </p>
  <p class="text-6xl font-light text-emerald-500 mb-3">
    5.234
  </p>
  <p class="text-sm text-gray-400">
    vs mês anterior
  </p>
</div>
```

**Mudanças que tornam leve:**
1. `bg-gray-50/50` não `bg-white` → menos contraste
2. `rounded-2xl` não `rounded` → cantos mais suaves
3. `px-8 py-7` não `p-4` → mais respiração
4. `text-6xl font-light` não `text-2xl font-bold` → hierarquia por tamanho
5. `text-gray-400` não `text-gray-900` → cores suaves
6. Sem bordas e sombras → visual limpo

---

### Exemplo 2: Lista de Categorias

❌ **ANTES (Pesado):**
```vue
<div class="border-l-4 border-blue-600 pl-3">
  <div class="border-b border-gray-300 py-2">
    <div class="flex justify-between">
      <span class="font-bold text-black">Alimentação</span>
      <span class="font-bold text-black">R$ 2.500</span>
    </div>
    <div class="bg-gray-200 h-2 rounded-full mt-1">
      <div class="bg-blue-600 h-2 rounded-full" style="width: 50%"></div>
    </div>
  </div>
</div>
```

✅ **DEPOIS (Leve):**
```vue
<div class="space-y-6">
  <div class="flex items-center gap-4">
    <div class="flex-1">
      <div class="flex items-baseline justify-between mb-2">
        <span class="text-sm font-normal text-gray-700">Alimentação</span>
        <span class="text-lg font-light text-gray-800">2.500</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex-1 bg-gray-100 rounded-full h-[3px]">
          <div class="bg-gradient-to-r from-blue-400 to-blue-500 h-[3px] rounded-full"
               style="width: 50%">
          </div>
        </div>
        <span class="text-xs text-gray-400">50%</span>
      </div>
    </div>
  </div>
</div>
```

**Mudanças:**
1. Sem borda esquerda colorida
2. `space-y-6` (24px) não `py-2` → mais respiração
3. Barra de progresso `h-[3px]` não `h-2` → mais suave
4. Gradiente suave não cor sólida
5. Font-weights leves
6. Cores dessaturadas

---

### Exemplo 3: Alerta/Insight

❌ **ANTES (Pesado):**
```vue
<div class="bg-red-100 border-2 border-red-500 rounded p-3">
  <div class="flex gap-2">
    <span class="text-red-600 text-xl font-bold">⚠</span>
    <div>
      <p class="font-bold text-red-900">ATENÇÃO</p>
      <p class="text-sm font-semibold text-red-800">Gastos 20% acima</p>
    </div>
  </div>
</div>
```

✅ **DEPOIS (Leve):**
```vue
<div class="bg-rose-50/30 rounded-xl px-5 py-4">
  <div class="flex gap-4">
    <span class="text-rose-400 text-sm opacity-70">⚠</span>
    <div>
      <p class="text-sm font-normal text-gray-700 mb-1">Gastos acima da média</p>
      <p class="text-[13px] text-gray-500">20% acima do mês anterior</p>
    </div>
  </div>
</div>
```

**Mudanças:**
1. `bg-rose-50/30` não `bg-red-100` → muito mais suave
2. Sem bordas
3. Ícone menor e com opacidade
4. Font-weights normais
5. `rose-400` não `red-600` → cor dessaturada
6. Padding maior → mais conforto

---

## 🔧 Receitas de Estilo (Copy-Paste)

### Card Base Leve
```vue
<div class="bg-gray-50/50 rounded-2xl px-8 py-7 hover:bg-gray-50 transition-colors">
  <!-- Conteúdo -->
</div>
```

### Título de Seção
```vue
<h2 class="text-lg font-normal text-gray-700 mb-5">Título</h2>
```

### Label Pequeno
```vue
<p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Label</p>
```

### Valor Grande
```vue
<p class="text-6xl font-light text-gray-800">5.234</p>
```

### Valor Médio
```vue
<p class="text-3xl font-light text-gray-700">1.234</p>
```

### Link Suave
```vue
<a href="#" class="text-sm text-blue-500 hover:text-blue-600 transition-colors">
  Ver mais →
</a>
```

### Barra de Progresso Suave
```vue
<div class="bg-gray-100 rounded-full h-[3px] overflow-hidden">
  <div class="bg-gradient-to-r from-blue-400 to-blue-500 h-[3px] rounded-full transition-all"
       :style="{ width: percentage + '%' }">
  </div>
</div>
```

### Divider Suave (quando necessário)
```vue
<div class="border-t border-gray-100 my-6"></div>
```

---

## ✅ Checklist de "Design Leve"

Ao criar um novo componente, verifique:

**Espaçamento:**
- [ ] Padding de cards: mínimo `px-6 py-5`, ideal `px-8 py-7`
- [ ] Gap entre cards: mínimo `gap-6`, ideal `gap-8`
- [ ] Espaço entre seções: mínimo `space-y-8`, ideal `space-y-12`

**Tipografia:**
- [ ] Valores grandes: `text-5xl` ou `text-6xl` com `font-light`
- [ ] Títulos: `text-lg` ou `text-xl` com `font-normal`
- [ ] Corpo: `text-sm` ou `text-base` com `font-normal`
- [ ] Nunca usar `font-bold` (700+)

**Cores:**
- [ ] Background de página: `#FAFBFC` ou `gray-50`, não `#FFFFFF`
- [ ] Textos: `gray-700` principal, `gray-500` secundário, `gray-400` muted
- [ ] Vermelho: `rose-400` não `red-600`
- [ ] Verde: `emerald-500` não `green-600`
- [ ] Azul: `blue-500` não `blue-600`

**Bordas e Sombras:**
- [ ] Preferir `border-0` (sem bordas)
- [ ] Se necessário: `border border-gray-100` (1px suave)
- [ ] Evitar `border-2` ou mais
- [ ] Sombras: apenas `shadow-sm` ou nenhuma
- [ ] Nunca usar `shadow-lg` ou `shadow-xl`

**Hierarquia:**
- [ ] Hierarquia criada por TAMANHO, não peso
- [ ] Espaço entre seções > espaço dentro de seções
- [ ] Máximo 7±2 elementos por seção
- [ ] Cores para diferenciar, não competir

---

## 🎯 Antes e Depois - Resumo

| Aspecto | ❌ Pesado | ✅ Leve |
|---------|----------|---------|
| **Background** | `bg-white` (#FFF) | `bg-gray-50` (#FAFBFC) |
| **Bordas** | `border-2 border-blue-500` | Sem bordas ou `border-gray-100` |
| **Sombras** | `shadow-lg` | `shadow-sm` ou nenhuma |
| **Espaçamento** | `gap-3 space-y-2 p-4` | `gap-8 space-y-12 px-8 py-7` |
| **Font Size** | `text-2xl` + `font-bold` | `text-6xl` + `font-light` |
| **Font Weight** | `font-bold` (700) | `font-light` (300) ou `font-normal` (400) |
| **Cores Texto** | `text-black` (#000) | `text-gray-700` (#374151) |
| **Cores Acento** | `red-600`, `blue-600` | `rose-400`, `blue-500` |
| **Barras Progresso** | `h-2 bg-blue-600` | `h-[3px] bg-gradient-to-r from-blue-400` |
| **Hierarquia** | Peso (bold vs normal) | Tamanho (6xl vs xs) |

---

## 🚀 Implementação Gradual

**Fase 1 - Quick Wins (Impacto Imediato):**
1. Trocar todos `bg-white` por `bg-gray-50` ou `#FAFBFC`
2. Remover todas as `border-2` ou `border-l-4` coloridas
3. Aumentar espaçamentos: `gap-3` → `gap-8`, `space-y-5` → `space-y-12`

**Fase 2 - Tipografia (Alto Impacto):**
1. Trocar `font-bold` por `font-light` em valores grandes
2. Aumentar tamanhos: `text-2xl` → `text-6xl` para valores principais
3. Usar `font-normal` como padrão, não `font-medium`

**Fase 3 - Cores (Conforto):**
1. Trocar `red-600` → `rose-400`
2. Trocar `green-600` → `emerald-500`
3. Trocar `blue-600` → `blue-500`
4. Trocar `text-black` → `text-gray-700`

**Fase 4 - Refinamento:**
1. Ajustar opacidades e gradientes
2. Otimizar animações (200-300ms)
3. Testar fadiga visual (usar por 30 min)

---

## 💡 Teste de Fadiga Visual

Para verificar se o design está "leve":

1. **Teste dos 3 Segundos:** Você consegue entender a página em 3 segundos?
2. **Teste de Brilho:** Diminua o brilho da tela. Ainda é confortável?
3. **Teste de Distância:** Afaste-se 2 metros. A hierarquia está clara?
4. **Teste de Tempo:** Use a aplicação por 15 minutos. Seus olhos cansaram?
5. **Teste de Cores:** Converta para escala de cinza. A hierarquia persiste?

Se qualquer teste falhar, revise:
- Bordas/sombras em excesso
- Contraste muito alto
- Font-weights muito pesados
- Cores muito saturadas
- Espaçamento insuficiente

---

## 📚 Recursos

**Inspirações de Design Leve:**
- Claude.ai (minimalista, confortável)
- Linear.app (hierarquia suave)
- Stripe Dashboard (espaçamento generoso)
- Notion (tipografia leve)

**Ferramentas:**
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Coolors](https://coolors.co) - Paletas suaves
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Acessibilidade

---

Este guia é um documento vivo. Atualize conforme aprende mais sobre conforto visual!
