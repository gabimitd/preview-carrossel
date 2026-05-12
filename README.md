<img width="1890" height="901" alt="image" src="https://github.com/user-attachments/assets/a4a3a142-d758-4b25-a9f9-941104ec7bb4" /># 📸 Preview Carrossel

![Preview Carrossel app](<img width="1890" height="901" alt="image" src="https://github.com/user-attachments/assets/b790661a-6523-4514-a762-c163661c1c2e" />
)

> Pré-visualize como seu carrossel do Instagram vai aparecer no feed antes de postar — com mockup mobile e desktop, modo light/dark, e exportação dos slides já cortados.

**🌐 Acesse: [preview-carrossel.vercel.app](https://preview-carrossel.vercel.app)**

[![Vercel](https://img.shields.io/badge/deploy-Vercel-000?logo=vercel)](https://preview-carrossel.vercel.app)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tests-29%20passing-22c55e)](https://vitest.dev/)

App web estático que recebe a imagem (ou várias imagens) de um carrossel do Instagram, **detecta automaticamente quantos slides tem**, te mostra a prévia exata de como vai ficar o post no Instagram (com avatar, @, caption, curtidas, comentários, tudo editável), e exporta os slides individuais prontos pra subir no feed.

Tudo no navegador. Sem login, sem backend, sem upload pra servidor — sua imagem nunca sai do seu computador.

---

## ✨ O que faz

### 🖼️ Detecção e corte automático
- Sobe **uma imagem larga** (ex: 4320×1350 do Photoshop) e o app detecta sozinho:
  - **1:1 quadrado** (1080×1080)
  - **4:5 retrato** (1080×1350)  formato padrão do Instagram
  - **9:16 story** (1080×1920)
- Algoritmo ancorado pela altura  sinal mais confiável do formato real
- Se errar, é só **arrastar as linhas de corte** ou usar `+` / `−` pra ajustar
- Aceita também **múltiplos arquivos individuais** (slide-1.png, slide-2.png...) — pula a detecção e usa direto

### 📱 Frame realista do Instagram
- Replica o post oficial do Instagram em **mobile** (vertical, feed) e **desktop** (modal de 2 colunas)
- Suporte a **modo claro e escuro do Instagram** (preto puro `#000` no dark, igual ao app real)
- **Carrossel deslizante de verdade**  arrasta a imagem com o dedo/mouse e ela segue em tempo real, com snap suave no release (FLIP animation, easing `cubic-bezier(0.25, 1, 0.5, 1)`)
- Resistência nas bordas (primeiro/último slide), detecção de scroll vertical, navegação por teclado (← →) e setas no hover

### ✏️ Tudo editável
- Avatar (faz upload da sua logo, redimensiona pra 200×200 sozinho)
- `@` do perfil (com selo verificado opcional)
- Caption + hashtags
- Número de curtidas (texto livre — `1.234`, `1k`, `5,5 mil`...)
- Quantidade total de comentários
- Até 3 comentários visíveis (com `@user` + texto)
- "Há X horas", patrocinado, localização

### 👥 Múltiplos perfis salvos
- Até 5 perfis (logo + @) guardados no `localStorage`
- Troca de perfil em 1 clique
- Cada navegador tem seus próprios perfis  perfeito pra usar com várias marcas/clientes

### 💾 Rascunhos automáticos
- Cada carrossel que você sobe vira um rascunho automaticamente
- Lista de até 5 rascunhos recentes com thumbnail no topo
- 1 clique pra restaurar
- Tratamento de quota do `localStorage`  descarta o mais antigo se encher

### 🎨 Design futurista clean
- Tipografia **Inter** com features tipográficas
- Glassmorphism nos cards (`backdrop-filter blur(20px)`)
- Orbs de gradiente ambient sutil no fundo
- Tema **claro/escuro do app** independente do tema do Instagram
- Toggle device (📱/💻) e tema IG (☀/🌙) flutuantes em cima do preview

### ⬇️ Exportação
- **Slides em ZIP** — cada slide como `slide-1.png`, `slide-2.png`... resolução máxima, prontos pro Instagram
- **Preview em PNG** — captura o frame do Instagram inteiro com `html-to-image` em 2× (Retina-ready) pra mandar pra cliente, colocar em apresentação, etc

---

## 🛠️ Stack

- **[Vite 5](https://vitejs.dev/)** + **[TypeScript](https://www.typescriptlang.org/)** strict (sem framework UI — vanilla JS reativo com store próprio)
- **[Vitest](https://vitest.dev/)** + jsdom  29 testes cobrindo o store, persistência, validações, detecção de grade e splitter
- **Canvas API nativa** — todo o processamento de imagem (corte, redimensionamento, thumbnails) no browser
- **[JSZip](https://stuk.github.io/jszip/)**  empacotamento dos slides
- **[html-to-image](https://github.com/bubkoo/html-to-image)**  captura do preview em PNG
- **localStorage**  persistência de perfis, rascunhos e tema (com fallback de quota)
- **Vercel**  deploy estático automático

Bundle final: **~136 KB** (44 KB gzipped). Sem dependências de framework, hot reload instantâneo no dev.

---

## 🚀 Rodando local

```bash
git clone https://github.com/gabimitd/preview-carrossel.git
cd preview-carrossel
npm install
npm run dev
```

Abre em http://localhost:5173.

### Outros comandos

```bash
npm test         # roda os testes (Vitest)
npm run build    # build de produção (gera dist/)
npm run preview  # serve o build de produção
```

---

## 🌐 Deploy na Vercel

A Vercel detecta o Vite automaticamente. Duas opções:

**Opção 1 — CLI:**
```bash
npm i -g vercel
vercel --prod
```

**Opção 2 — GitHub integration:**
1. Importa o repo na [Vercel](https://vercel.com/new)
2. Aceita os defaults (build: `npm run build`, output: `dist`)
3. Deploy automático em cada push

---

## 🏗️ Arquitetura

```
src/
├── main.ts                # bootstrap, conecta tudo
├── types.ts               # AppState, Profile, Slide, PostContent, Draft
├── state.ts               # store reativo (subscribe + setState + update)
├── app-store.ts           # AppStore tipado com persistência seletiva
├── storage.ts             # localStorage com fallback de QuotaExceededError
├── validations.ts         # sanitizeUsername, clamp, formatTimeAgo
├── upload.ts              # drag&drop + file input → HTMLImageElement[]
├── grid-detect.ts         # algoritmo de detecção da grade por altura
├── splitter.ts            # corte via Canvas (image + cuts → Slide[])
├── grid-editor.ts         # tira com linhas arrastáveis pra ajustar corte
├── ig-frame.ts            # mounter do frame com swipe + FLIP animation
├── ig-frame-mobile.ts     # render do frame mobile
├── ig-frame-desktop.ts    # render do frame desktop modal
├── fields-form.ts         # formulário dos campos editáveis
├── profiles.ts            # menu de perfis salvos (até 5)
├── drafts.ts              # autosave + restore + delete de rascunhos
├── drafts-menu.ts         # UI dos rascunhos
├── theme.ts               # toggles app/IG/device + aplicação do tema
├── resize-image.ts        # redimensiona avatar (200×200) e thumbnails
├── export-png.ts          # captura do preview com html-to-image
├── export-zip.ts          # empacotamento dos slides com JSZip
└── ui-layout.css          # tokens, layout, paleta dark/light
```

**Padrão arquitetural:**
- **Store + listeners** — sem framework. Cada módulo de UI faz `mountX(container, store)`, cria o DOM, e se inscreve no store pra atualizar. Retorna função de cleanup.
- **Cada arquivo tem uma responsabilidade só** — fácil de testar isoladamente. Pure logic (`grid-detect`, `splitter`, `validations`, `state`) é 100% testável em jsdom.
- **Persistência seletiva** — só `profiles`, `theme` e `drafts` são salvos no `localStorage`; estado da sessão atual fica em memória.

**Spec e plano de implementação (preservados no repo):**
- 📄 [Spec do design](docs/superpowers/specs/2026-05-09-preview-carrossel-instagram-design.md)
- 📋 [Plano de implementação](docs/superpowers/plans/2026-05-09-preview-carrossel.md)

---

## 🧪 Testes

```bash
npm test
```

29 testes em 5 arquivos:
- `state.test.ts` • store reativo (subscribe/setState/update/identity check)
- `storage.test.ts` • localStorage helpers + QuotaExceededError fallback
- `validations.test.ts` • sanitização de username, clamp, formatação de tempo
- `grid-detect.test.ts` • todos os formatos comuns + casos com padding extra
- `splitter.test.ts` • corte do canvas com cuts uniformes, não-uniformes e fora dos limites

---

## 🤝 Contribuindo

PRs são bem-vindas. Algumas ideias do que poderia entrar numa v2:

- [ ] Suporte a Reels (formato 9:16 com indicador de vídeo)
- [ ] Animação simulando o "carrossel passando" pra exportar como GIF/MP4
- [ ] Mais idiomas (atualmente só pt-BR)
- [ ] Templates de comentário pré-feitos
- [ ] Domínio customizado / branding do estúdio

---

## 📄 Licença

MIT.

---
