# 📄 Projeto OCR + LLM

Este projeto permite **upload de documentos**, **extração de texto via OCR**, **consulta a um modelo de linguagem (LLM)** para explicar o conteúdo e **download de PDF** com os resultados.

A aplicação é composta por:

* **Backend**: NestJS + Prisma
* **Frontend**: Next.js (App Router)
* **Banco de Dados**: Supabase (PostgreSQL)
* **OCR**: OCR.Space
* **LLM**: Google Gemini
* **Deploy**:

  * Backend → Render
  * Frontend → Vercel

---

## 🚀 Arquitetura Geral

```
Frontend (Vercel - Next.js)
        │
        │ HTTP (JWT)
        ▼
Backend (Render - NestJS)
        │
        ├── Supabase (PostgreSQL)
        ├── OCR.Space API
        └── Google Gemini API
```

---

## 📦 Requisitos

Antes de começar, você precisa ter instalado:

* Node.js **18+**
* npm ou yarn
* Conta no **Supabase**
* Conta no **Render**
* Conta no **Vercel**
* Chave de API do **OCR.Space**
* Chave de API do **Google Gemini**

---

## 🗄️ Banco de Dados (Supabase)

1. Crie um projeto no Supabase
2. Copie a **Connection String** (PostgreSQL)
3. Use essa string como `DATABASE_URL` no backend

Exemplo:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

> ⚠️ Certifique-se de liberar o acesso do IP do Render no Supabase.

---

## 🔧 Backend (NestJS)

### 📁 Estrutura

```
backend/
├── src/
│   ├── auth/
│   ├── documents/
│   ├── ocr/
│   ├── llm/
│   ├── prisma/
│   └── main.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

---

### 🔑 Variáveis de Ambiente (Backend)

Crie um arquivo `.env` na pasta `backend`:

```env
# ==============================
# Database (Supabase - PostgreSQL)
# ==============================
# 1. Crie uma conta em https://supabase.com
# 2. Crie um novo projeto
# 3. Vá em Settings > Database
# 4. Copie a "Connection string" (PostgreSQL)
DATABASE_URL=

# ==============================
# Auth (JWT)
# ==============================
# Chave secreta usada para assinar os tokens JWT
# Pode ser qualquer string segura
# Exemplo de geração:
# openssl rand -base64 32
JWT_SECRET=

# ==============================
# Supabase (Storage / Service)
# ==============================
# SUPABASE_URL:
# 1. No projeto Supabase, vá em Settings > API
# 2. Copie o "Project URL"
SUPABASE_URL=

# SUPABASE_SERVICE_ROLE_KEY:
# 1. Ainda em Settings > API
# 2. Copie a "Service Role Key"
# ⚠️ Nunca usar essa chave no frontend
SUPABASE_SERVICE_ROLE_KEY=

# ==============================
# OCR (OCR.Space)
# ==============================
# 1. Crie uma conta em https://ocr.space/
# 2. Vá em API Keys
# 3. Gere uma chave de API
OCR_SPACE_API_KEY=

# ==============================
# LLM (Google Gemini)
# ==============================
# 1. Acesse https://ai.google.dev/
# 2. Crie ou selecione um projeto
# 3. Gere uma API Key
GEMINI_API_KEY=
```

---

### ▶️ Rodando o Backend Localmente

```bash
cd backend
npm install

# gerar client do Prisma
npx prisma generate

# aplicar migrations (se houver)
npx prisma migrate deploy

# iniciar servidor
npm run start:dev
```

Servidor padrão:

```
http://localhost:3000
```

---

### ☁️ Deploy do Backend (Render)

1. Crie um **Web Service** no Render
2. Conecte ao repositório
3. Configure:

   * **Build Command**:

     ```bash
     npm install && npx prisma generate
     ```
   * **Start Command**:

     ```bash
     npm run start:prod
     ```
4. Adicione todas as variáveis do `.env` no painel do Render

Após o deploy, você terá algo como:

```
https://projeto-ocr-llm.onrender.com
```

---

## 🎨 Frontend (Next.js)

### 📁 Estrutura

```
frontend/
├── app/
│   ├── login/
│   ├── dashboard/
│   └── page.tsx
├── lib/
│   └── api.ts
└── package.json
```

---

### 🔑 Variáveis de Ambiente (Frontend)

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://projeto-ocr-llm.onrender.com
```

> ⚠️ Essa variável **precisa** começar com `NEXT_PUBLIC_`.

---

### ▶️ Rodando o Frontend Localmente

```bash
cd frontend
npm install
npm run dev
```

Acesse:

```
http://localhost:3000
```

---

### ☁️ Deploy do Frontend (Vercel)

1. Crie um projeto no Vercel
2. Conecte ao repositório
3. Configure a variável de ambiente:

```env
NEXT_PUBLIC_API_URL=https://projeto-ocr-llm.onrender.com
```

4. Deploy 🎉

---

## 🔐 Autenticação

* Autenticação baseada em **JWT**
* Token salvo no `localStorage`
* Requisições autenticadas via `Authorization: Bearer <token>`

---

## 🧠 Funcionalidades

* Upload de documentos (PDF / imagem)
* OCR automático
* Armazenamento do texto extraído
* Perguntas ao LLM com base no OCR
* Histórico de interações
* Download de PDF com OCR + respostas

---

## 🧪 Fluxo de Uso

1. Login
2. Upload de documento
3. Executar OCR
4. Fazer perguntas sobre o documento
5. Baixar PDF consolidado

---

## 📌 Observações Importantes

* O texto OCR **é armazenado no banco** (não depende do front)
* O LLM sempre consulta o OCR salvo
* PDFs são gerados dinamicamente no backend