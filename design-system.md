# 🎨 Guia de Design System — Tema “Claude Dark”

> Aplicação: dashboards de produtividade e gestão financeira (ex: Controle Financeiro)  
> Objetivo: interface minimalista, com hierarquia tipográfica e contraste suave, evitando saturação visual.

---

## 🧱 1. Fundamentos

### 1.1 Cores Base

| Token | Cor | Uso |
|--------|------|----|
| `background/page` | `#0C0C0C` | Fundo principal |
| `background/sidebar` | `#1A1A1A` | Menu lateral |
| `background/card` | `#1F1F1F` | Cartões e blocos |
| `border/base` | `#2E2E2E` | Bordas padrão |
| `text/primary` | `#F3F3F3` | Texto principal |
| `text/secondary` | `#B0B0B0` | Texto auxiliar |
| `accent/primary` | `#FF7A45` | Botões e destaques |
| `accent/success` | `#3DD68C` | Valores positivos |
| `accent/danger` | `#E34D4D` | Alertas e erros |

📘 **Princípio:** contraste vem da **tipografia e estrutura**, não de fundos coloridos.

---

### 1.2 Tipografia

| Estilo | Fonte | Tamanho | Peso | Uso |
|---------|--------|----------|------|----|
| Display | Source Serif 4 | 40–48px | 400 | Títulos hero |
| Heading | Inter | 22–24px | 500 | Títulos de seção |
| Body | Inter | 15–16px | 400 | Texto padrão |
| Muted | Inter | 13px | 400 | Subtextos |

🪶 Use *Inter* para interface e *Source Serif* apenas em títulos ou mensagens hero.

---

### 1.3 Espaçamento

Base grid: **8px**

| Token | Valor | Uso |
|--------|--------|----|
| `xs` | 4px | microgaps |
| `sm` | 8px | pequenos espaçamentos |
| `md` | 12px | elementos internos |
| `lg` | 16px | distância entre blocos |
| `xl` | 24px | margens de seção |
| `3xl` | 48px | separação de grandes seções |

---

## 🧭 2. Layout

### Estrutura geral

```
AppShell
 ├── Sidebar
 ├── Header
 └── MainContent
      ├── Cards
      ├── Charts
      └── Tables
```

**Sidebar:** fixa (280px), fundo `background/sidebar`  
**Header:** 72px de altura, fundo `background/page`  
**Content:** largura máxima 1280px, padding 40px

---

## 🧩 3. Componentes

### 3.1 Sidebar

- Fundo: `#1A1A1A`
- Texto ativo: `#F3F3F3`
- Item ativo: borda lateral `#FF7A45`
- Ícones 20px, espaçamento horizontal 12–16px
- Raio 10px nas áreas de hover

### 3.2 Header

- Altura: 72px
- Botão primário: fundo `#FF7A45`, texto `#0C0C0C`, hover `#FF8C5E`
- Título: 22px, `Inter 500`

### 3.3 Cards

- Fundo: `#1F1F1F`
- Borda: `1px solid #2E2E2E`
- Raio: 16px
- Padding: 20px
- Gap interno: 16px
- Cores de destaque: verde, vermelho, amarelo suave

### 3.4 Alert Boxes

```
.alert {
  border-left: 3px solid var(--accent-warning);
  background: var(--background/card);
  padding: var(--spacing.lg);
  border-radius: var(--radii.lg);
}
.alert h4 { color: var(--text/primary); }
.alert p { color: var(--text/secondary); }
```

---

## ⚙️ 4. Interações e Estados

| Estado | Descrição |
|---------|------------|
| **Hover** | Escurece 5% o fundo, sombra leve. |
| **Active** | Fundo `{background/hover}`, borda `{accent/primary}`. |
| **Focus** | Borda `{accent/info}`. |
| **Disabled** | Opacidade 0.4, cursor `not-allowed`. |

---

## 🧠 5. Hierarquia

1. Título: 22px, branco puro  
2. Subtítulo: 15px, cinza claro  
3. Dados principais: cor de acento (verde/vermelho)  
4. Divisores: `#333333`

---

## 🧰 6. Exemplo prático

```html
<main class="bg-[#0C0C0C] text-[#F3F3F3] p-[40px]">
  <header class="flex justify-between items-center mb-[32px]">
    <h1 class="text-[22px] font-medium">Dashboard Financeiro</h1>
    <button class="bg-[#FF7A45] hover:bg-[#FF8C5E] text-black px-[18px] py-[10px] rounded-md">Atualizar</button>
  </header>

  <section class="grid grid-cols-3 gap-[16px]">
    <div class="border-l-[3px] border-[#D1B892] p-[16px] bg-[#1F1F1F] rounded-lg">
      <h4 class="font-semibold text-[15px]">Gastos Acima do Esperado</h4>
      <p class="text-[#B0B0B0] text-[13px]">Seus gastos estão 20% acima...</p>
    </div>
  </section>
</main>
```

---

## 📘 7. Diretrizes gerais

| Categoria | Regra |
|------------|--------|
| **Espaço em branco** | É parte do design — use generosamente. |
| **Cores saturadas** | Apenas para alertas e CTAs. |
| **Sombras** | Suaves e sutis. |
| **Fonte serifada** | Só para mensagens hero. |
| **Transições** | `ease-out 120ms`. |
| **Foco visual** | Um único elemento colorido por bloco. |