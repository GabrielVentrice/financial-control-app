# Guia de Design - Claude.ai Design System

## 📋 Índice

1. [Introdução](#introdução)
2. [Princípios de Design](#princípios-de-design)
3. [Cores](#cores)
4. [Tipografia](#tipografia)
5. [Espaçamento](#espaçamento)
6. [Componentes](#componentes)
7. [Layouts](#layouts)
8. [Acessibilidade](#acessibilidade)
9. [Animações](#animações)
10. [Responsividade](#responsividade)

---

## Introdução

Este design system é inspirado na interface do Claude.ai, focando em simplicidade, clareza e uma experiência de usuário excepcional. O design prioriza legibilidade, hierarquia visual clara e interações intuitivas.

### Filosofia

- **Minimalista**: Removemos tudo que não é essencial
- **Funcional**: Cada elemento tem um propósito claro
- **Acessível**: Design inclusivo para todos os usuários
- **Consistente**: Padrões reutilizáveis em toda a aplicação

---

## Princípios de Design

### 1. Clareza acima de tudo
O conteúdo é rei. O design deve facilitar a compreensão, não distrair dela.

### 2. Hierarquia visual forte
Use tamanhos, pesos e espaçamento para criar hierarquia clara de informação.

### 3. Espaço em branco é seu amigo
Respire. Dê espaço aos elementos para que possam brilhar.

### 4. Consistência cria confiança
Use os mesmos padrões repetidamente para criar familiaridade.

### 5. Feedback imediato
Toda ação do usuário deve ter uma resposta visual imediata.

---

## Cores

### Paleta Principal

#### Orange (Cor de destaque)
A cor laranja/terra é usada para elementos interativos e destaque.

- **50**: `#FFF5F0` - Backgrounds muito claros
- **100**: `#FFE8DC` - Backgrounds claros
- **500**: `#CC785D` - Cor principal de links e botões
- **600**: `#A85C42` - Hover states
- **900**: `#3D1F12` - Variantes escuras

#### Neutros
Os tons de cinza formam a base do design.

- **White**: `#FFFFFF` - Background principal
- **50**: `#FAFAFA` - Background secundário (sidebar)
- **100**: `#F5F5F5` - Background de mensagens do usuário
- **200**: `#E5E5E5` - Bordas principais
- **800**: `#262626` - Texto em elementos escuros
- **900**: `#171717` - Texto principal e botões primários

### Uso de Cores

```
Texto Principal: #171717
Texto Secundário: #525252
Texto Terciário: #737373
Links: #CC785D
Bordas: #E5E5E5
Background: #FFFFFF
Background Secundário: #F5F5F5
```

### Cores Semânticas

- **Success**: `#10B981` (Verde)
- **Error**: `#EF4444` (Vermelho)
- **Warning**: `#F59E0B` (Amarelo)
- **Info**: `#3B82F6` (Azul)

### Diretrizes

✅ **Faça:**
- Use neutros para 90% da interface
- Reserve cores vibrantes para CTAs e estados importantes
- Mantenha contraste adequado para acessibilidade (mínimo 4.5:1)

❌ **Não faça:**
- Usar muitas cores ao mesmo tempo
- Usar cores sem propósito claro
- Ignorar contraste em textos pequenos

---

## Tipografia

### Família de Fontes

**Primary**: System font stack para melhor performance
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 
'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
```

**Code**: Para blocos de código
```
'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace
```

### Escala de Tamanhos

| Tamanho | Valor | Uso |
|---------|-------|-----|
| xs | 0.75rem (12px) | Labels pequenos, timestamps |
| sm | 0.875rem (14px) | Texto secundário, inputs |
| base | 1rem (16px) | Texto principal |
| lg | 1.125rem (18px) | Subtítulos |
| xl | 1.25rem (20px) | Títulos de seção |
| 2xl | 1.5rem (24px) | Títulos de página |
| 3xl | 1.875rem (30px) | Headers importantes |
| 4xl | 2.25rem (36px) | Headlines |
| 5xl | 3rem (48px) | Display text |

### Pesos de Fonte

- **Normal (400)**: Texto padrão
- **Medium (500)**: Ênfase suave, botões
- **Semibold (600)**: Subtítulos, labels importantes
- **Bold (700)**: Títulos principais

### Altura de Linha

- **Tight (1.25)**: Títulos e headers
- **Normal (1.5)**: Texto padrão
- **Relaxed (1.625)**: Parágrafos longos
- **Loose (2)**: Texto com muito espaçamento

### Exemplos de Uso

```css
/* Título de página */
font-size: 1.5rem;
font-weight: 600;
line-height: 1.25;
color: #171717;

/* Texto de mensagem */
font-size: 1rem;
font-weight: 400;
line-height: 1.5;
color: #171717;

/* Texto secundário */
font-size: 0.875rem;
font-weight: 400;
line-height: 1.5;
color: #525252;

/* Label de input */
font-size: 0.875rem;
font-weight: 500;
line-height: 1.5;
color: #171717;
```

### Diretrizes

✅ **Faça:**
- Use uma escala consistente de tamanhos
- Mantenha hierarquia clara entre títulos e corpo
- Use line-height adequado para legibilidade (1.5 é ideal para corpo)

❌ **Não faça:**
- Usar mais de 3-4 tamanhos de fonte por página
- Usar fontes muito pequenas (<14px) para texto principal
- Usar All Caps em blocos longos de texto

---

## Espaçamento

### Sistema de Espaçamento

Baseado em múltiplos de 4px (0.25rem):

| Token | Valor | Pixels | Uso Comum |
|-------|-------|--------|-----------|
| 0 | 0 | 0px | Reset |
| 1 | 0.25rem | 4px | Espaçamento mínimo |
| 2 | 0.5rem | 8px | Entre ícone e texto |
| 3 | 0.75rem | 12px | Padding pequeno |
| 4 | 1rem | 16px | Padding padrão |
| 5 | 1.25rem | 20px | Entre seções pequenas |
| 6 | 1.5rem | 24px | Padding de cards |
| 8 | 2rem | 32px | Entre seções |
| 10 | 2.5rem | 40px | Margens grandes |
| 12 | 3rem | 48px | Separação de blocos |
| 16 | 4rem | 64px | Espaçamento máximo |

### Aplicações Práticas

**Componentes pequenos** (Botões, inputs):
- Padding vertical: 0.625rem (10px)
- Padding horizontal: 1rem (16px)

**Cards e containers**:
- Padding: 1.5rem (24px)
- Gap entre elementos: 1rem (16px)

**Layouts de página**:
- Margem entre seções: 2-3rem (32-48px)
- Margem lateral: 1.5rem (24px)

**Mensagens de chat**:
- Gap entre mensagens: 1rem (16px)
- Padding interno: 0.75rem (12px)

### Diretrizes

✅ **Faça:**
- Use múltiplos de 4px sempre que possível
- Seja consistente com espaçamentos similares
- Dê mais espaço entre seções diferentes

❌ **Não faça:**
- Usar valores aleatórios (ex: 13px, 27px)
- Apertar demais os elementos
- Usar o mesmo espaçamento para tudo

---

## Componentes

### Botões

#### Botão Primário

Usado para ações principais e CTA.

```css
background: #171717;
color: #FFFFFF;
border-radius: 0.5rem;
padding: 0.625rem 1.25rem;
font-size: 0.875rem;
font-weight: 500;
height: 2.5rem;
border: none;

/* Hover */
background: #262626;

/* Active */
background: #404040;

/* Disabled */
background: #E5E5E5;
color: #A3A3A3;
```

**Quando usar:**
- Ação principal da página/modal
- "Enviar", "Salvar", "Continuar"
- Máximo 1 por tela visível

#### Botão Secundário

Usado para ações alternativas.

```css
background: #FFFFFF;
color: #171717;
border: 1px solid #E5E5E5;
border-radius: 0.5rem;
padding: 0.625rem 1.25rem;
font-size: 0.875rem;
font-weight: 500;
height: 2.5rem;

/* Hover */
background: #F5F5F5;

/* Active */
background: #E5E5E5;
```

**Quando usar:**
- Ações secundárias
- "Cancelar", "Voltar", "Editar"
- Múltiplos por tela são aceitáveis

#### Botão Ghost

Usado para ações terciárias e menus.

```css
background: transparent;
color: #171717;
border: none;
border-radius: 0.5rem;
padding: 0.625rem 1.25rem;
font-size: 0.875rem;
font-weight: 500;
height: 2.5rem;

/* Hover */
background: #F5F5F5;

/* Active */
background: #E5E5E5;
```

**Quando usar:**
- Itens de menu
- Ações menos importantes
- Quando não quer peso visual

### Inputs

#### Input de Texto

```css
background: #FFFFFF;
border: 1px solid #E5E5E5;
border-radius: 0.5rem;
padding: 0.625rem 0.875rem;
font-size: 0.875rem;
height: 2.5rem;
color: #171717;

/* Placeholder */
color: #A3A3A3;

/* Hover */
border-color: #D4D4D4;

/* Focus */
border-color: #CC785D;
outline: none;
box-shadow: 0 0 0 3px rgba(204, 120, 93, 0.2);

/* Error */
border-color: #EF4444;

/* Disabled */
background: #F5F5F5;
cursor: not-allowed;
```

#### Textarea

Mesmo estilo do input, mas:
- `height: auto`
- `min-height: 6rem`
- `resize: vertical`

### Cards

Containers para agrupar conteúdo relacionado.

```css
background: #FFFFFF;
border: 1px solid #E5E5E5;
border-radius: 0.75rem;
padding: 1.5rem;
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
```

**Variações:**
- **Elevated**: Adicionar `box-shadow` mais forte
- **Interactive**: Adicionar hover com `background: #FAFAFA`
- **Selected**: Border com cor primária `border-color: #CC785D`

### Mensagens (Chat)

#### Mensagem do Usuário

```css
background: #F5F5F5;
color: #171717;
border-radius: 1rem;
padding: 0.75rem 1rem;
max-width: 70%;
margin-left: auto;
```

#### Mensagem do Assistente

```css
background: transparent;
color: #171717;
padding: 0.75rem 0;
max-width: 100%;
```

#### Bloco de Código

```css
background: #0A0A0A;
color: #FAFAFA;
border-radius: 0.5rem;
padding: 1rem;
font-family: 'SF Mono', monospace;
font-size: 0.875rem;
overflow-x: auto;
```

### Sidebar

```css
background: #FAFAFA;
border-right: 1px solid #E5E5E5;
width: 16rem;
padding: 1rem;
```

#### Item da Sidebar

```css
padding: 0.5rem 0.75rem;
border-radius: 0.5rem;
font-size: 0.875rem;
color: #171717;
cursor: pointer;

/* Hover */
background: #F5F5F5;

/* Active */
background: #E5E5E5;
font-weight: 500;
```

### Modal

```css
background: #FFFFFF;
border-radius: 1rem;
padding: 1.5rem;
max-width: 32rem;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

**Overlay**:
```css
background: rgba(0, 0, 0, 0.5);
position: fixed;
inset: 0;
z-index: 1300;
```

### Tooltip

```css
background: #262626;
color: #FFFFFF;
border-radius: 0.375rem;
padding: 0.375rem 0.75rem;
font-size: 0.75rem;
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
max-width: 16rem;
```

---

## Layouts

### Grid do Chat

Layout principal da interface do Claude:

```
┌─────────────┬───────────────────────────────────┐
│             │         Header (56px)             │
│   Sidebar   ├───────────────────────────────────┤
│   (256px)   │                                   │
│             │         Chat Area                 │
│             │       (flex: 1)                   │
│             │                                   │
│             ├───────────────────────────────────┤
│             │    Input Area (auto height)       │
└─────────────┴───────────────────────────────────┘
```

### Container Principal

```css
max-width: 48rem; /* 768px */
margin: 0 auto;
padding: 0 1.5rem;
```

Para mensagens mais longas:
```css
max-width: 56rem; /* 896px */
```

### Espaçamento de Conteúdo

**Chat Area**:
- Padding lateral: 1.5rem (24px)
- Gap entre mensagens: 1rem (16px)
- Padding top/bottom: 2rem (32px)

**Sidebar**:
- Padding interno: 1rem (16px)
- Gap entre itens: 0.25rem (4px)
- Seções separadas por: 1.5rem (24px)

---

## Acessibilidade

### Contraste de Cores

Todos os textos devem ter contraste mínimo:
- **Texto normal**: 4.5:1
- **Texto grande**: 3:1
- **Elementos UI**: 3:1

**Combinações aprovadas:**
- ✅ `#171717` em `#FFFFFF` (18.4:1)
- ✅ `#525252` em `#FFFFFF` (7.5:1)
- ✅ `#FFFFFF` em `#171717` (18.4:1)
- ✅ `#FFFFFF` em `#CC785D` (4.5:1)

### Estados de Foco

Todos os elementos interativos devem ter foco visível:

```css
outline: 2px solid #CC785D;
outline-offset: 2px;
```

Ou usar box-shadow:
```css
box-shadow: 0 0 0 3px rgba(204, 120, 93, 0.2);
```

### Navegação por Teclado

- **Tab**: Navegar entre elementos
- **Enter/Space**: Ativar botões
- **Esc**: Fechar modais
- **Arrow keys**: Navegar em listas/menus

### Labels e ARIA

Sempre use labels em inputs:

```html
<label for="message">Sua mensagem</label>
<input id="message" type="text" />
```

Use ARIA quando necessário:

```html
<button aria-label="Fechar modal">×</button>
<div role="alert">Erro ao enviar mensagem</div>
```

### Texto Alternativo

Sempre forneça alt text para imagens:

```html
<img src="avatar.jpg" alt="Avatar do usuário" />
```

---

## Animações

### Princípios

- **Sutis**: Animações devem melhorar, não distrair
- **Rápidas**: 150-350ms é ideal
- **Propositais**: Cada animação tem um propósito

### Durações

- **Fast (150ms)**: Hover, pequenas mudanças
- **Normal (250ms)**: Transições padrão
- **Slow (350ms)**: Mudanças complexas

### Easing

```css
/* Entrada */
cubic-bezier(0.4, 0, 1, 1)

/* Saída */
cubic-bezier(0, 0, 0.2, 1)

/* Entrada e Saída */
cubic-bezier(0.4, 0, 0.2, 1)
```

### Exemplos Comuns

**Hover em botão:**
```css
transition: background-color 150ms cubic-bezier(0, 0, 0.2, 1);
```

**Abertura de modal:**
```css
/* Modal */
animation: fadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1);

/* Overlay */
animation: fadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1);

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Mensagem nova no chat:**
```css
animation: slideUp 250ms cubic-bezier(0, 0, 0.2, 1);

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Diretrizes

✅ **Faça:**
- Usar animações para feedback de ações
- Manter animações curtas (<400ms)
- Testar em dispositivos mais lentos

❌ **Não faça:**
- Animar tudo
- Usar animações longas (>500ms)
- Ignorar `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsividade

### Breakpoints

```css
/* Mobile first */
/* Base: 0px+ (mobile) */

/* Small: 640px+ (tablets) */
@media (min-width: 640px) { }

/* Medium: 768px+ (tablets landscape) */
@media (min-width: 768px) { }

/* Large: 1024px+ (desktops) */
@media (min-width: 1024px) { }

/* Extra Large: 1280px+ (large desktops) */
@media (min-width: 1280px) { }

/* 2X Large: 1536px+ (very large screens) */
@media (min-width: 1536px) { }
```

### Layout Responsivo

#### Mobile (<768px)
```css
/* Sidebar oculta ou overlay */
.sidebar {
  position: fixed;
  transform: translateX(-100%);
  transition: transform 250ms;
}

.sidebar.open {
  transform: translateX(0);
}

/* Chat full width */
.chat {
  width: 100%;
  padding: 1rem;
}

/* Input menor */
.input-container {
  padding: 0.75rem;
}
```

#### Tablet (768px - 1024px)
```css
/* Sidebar pode ser toggled */
.sidebar {
  width: 14rem;
}

/* Chat com padding adequado */
.chat {
  max-width: 42rem;
  padding: 1.5rem;
}
```

#### Desktop (1024px+)
```css
/* Sidebar sempre visível */
.sidebar {
  width: 16rem;
}

/* Chat com largura máxima */
.chat {
  max-width: 48rem;
  padding: 2rem;
}
```

### Componentes Responsivos

**Botões:**
```css
/* Mobile: Full width */
button {
  width: 100%;
}

/* Tablet+: Width natural */
@media (min-width: 768px) {
  button {
    width: auto;
  }
}
```

**Tipografia:**
```css
/* Mobile */
h1 {
  font-size: 1.5rem; /* 24px */
}

/* Desktop */
@media (min-width: 1024px) {
  h1 {
    font-size: 2.25rem; /* 36px */
  }
}
```

### Touch Targets

Em mobile, todos os elementos interativos devem ter:
- Mínimo: 44x44px
- Recomendado: 48x48px

```css
@media (max-width: 767px) {
  button, a, input {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## Exemplos de Implementação

### Exemplo 1: Botão Primário Completo

```html
<button class="btn-primary">
  Enviar mensagem
</button>

<style>
.btn-primary {
  /* Visual */
  background: #171717;
  color: #FFFFFF;
  border: none;
  border-radius: 0.5rem;
  
  /* Espaçamento */
  padding: 0.625rem 1.25rem;
  height: 2.5rem;
  
  /* Tipografia */
  font-size: 0.875rem;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Comportamento */
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0, 0, 0.2, 1);
  
  /* Acessibilidade */
  user-select: none;
}

.btn-primary:hover {
  background: #262626;
}

.btn-primary:active {
  background: #404040;
}

.btn-primary:focus-visible {
  outline: 2px solid #CC785D;
  outline-offset: 2px;
}

.btn-primary:disabled {
  background: #E5E5E5;
  color: #A3A3A3;
  cursor: not-allowed;
}
</style>
```

### Exemplo 2: Card de Mensagem

```html
<div class="message message-user">
  <p>Como posso criar um botão no React?</p>
</div>

<div class="message message-assistant">
  <p>Vou te ajudar a criar um botão em React...</p>
</div>

<style>
.message {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.message-user {
  background: #F5F5F5;
  color: #171717;
  max-width: 70%;
  margin-left: auto;
  margin-right: 0;
}

.message-assistant {
  background: transparent;
  color: #171717;
  max-width: 100%;
}

.message p {
  margin: 0;
}

/* Animação ao aparecer */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  animation: slideUp 250ms cubic-bezier(0, 0, 0.2, 1);
}
</style>
```

### Exemplo 3: Input com Label

```html
<div class="input-group">
  <label for="prompt" class="input-label">
    Sua mensagem
  </label>
  <textarea 
    id="prompt" 
    class="input-textarea"
    placeholder="Digite sua mensagem aqui..."
    rows="3"
  ></textarea>
  <p class="input-helper">
    Pressione Enter para enviar, Shift+Enter para nova linha
  </p>
</div>

<style>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #171717;
}

.input-textarea {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: #171717;
  resize: vertical;
  min-height: 6rem;
  transition: border-color 150ms cubic-bezier(0, 0, 0.2, 1);
}

.input-textarea::placeholder {
  color: #A3A3A3;
}

.input-textarea:hover {
  border-color: #D4D4D4;
}

.input-textarea:focus {
  border-color: #CC785D;
  outline: none;
  box-shadow: 0 0 0 3px rgba(204, 120, 93, 0.2);
}

.input-helper {
  font-size: 0.75rem;
  color: #737373;
  margin: 0;
}
</style>
```

---

## Checklist de Implementação

Ao criar novos componentes, verifique:

### Visual
- [ ] Usa cores do design system
- [ ] Tem border-radius consistente
- [ ] Tem espaçamento adequado (múltiplos de 4px)
- [ ] Tipografia segue a escala definida
- [ ] Sombras apropriadas (se necessário)

### Interação
- [ ] Estados de hover definidos
- [ ] Estados de active definidos
- [ ] Estados de disabled (quando aplicável)
- [ ] Estados de loading (quando aplicável)
- [ ] Transições suaves (150-350ms)

### Acessibilidade
- [ ] Contraste de texto adequado (mín. 4.5:1)
- [ ] Estado de foco visível
- [ ] Labels e ARIA adequados
- [ ] Navegável por teclado
- [ ] Touch targets mínimos de 44px (mobile)
- [ ] Suporta `prefers-reduced-motion`

### Responsividade
- [ ] Funciona em mobile (<768px)
- [ ] Funciona em tablet (768-1024px)
- [ ] Funciona em desktop (>1024px)
- [ ] Touch targets adequados em mobile
- [ ] Texto legível em todas as telas

---

## Recursos Adicionais

### Ferramentas Recomendadas

- **Figma**: Para prototipagem e design
- **Contrast Checker**: Para verificar acessibilidade
- **CSS Grid Generator**: Para layouts complexos
- **Coolors**: Para paletas de cores

### Links Úteis

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design](https://material.io/) (referência)
- [Tailwind CSS](https://tailwindcss.com/docs) (inspiração)
- [Radix UI](https://www.radix-ui.com/) (componentes acessíveis)

---

## Histórico de Versões

### v1.0.0 (2025)
- Lançamento inicial do design system
- Definição de cores, tipografia e componentes principais
- Diretrizes de acessibilidade e responsividade

---

**Criado com inspiração no design elegante e minimalista do Claude.ai**
