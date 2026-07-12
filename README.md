# UnicoCRM — Clientes Cancelados UnicoDrop

Sistema CRM profissional para acompanhamento e reconversão de clientes cancelados.

## Stack

- **Framework**: Next.js 15 (App Router + TypeScript)
- **Database**: Neon PostgreSQL (serverless, grátis)
- **ORM**: Prisma com driver adapter Neon
- **Deploy**: Vercel (grátis)
- **UI**: Tailwind CSS 4 + Lucide Icons + Recharts

---

## Setup Local (Desenvolvimento)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar banco de dados

1. Acesse [https://console.neon.tech](https://console.neon.tech) e crie uma conta gratuita
2. Crie um novo projeto
3. Vá em **Connection Details** → selecione **Prisma** no dropdown
4. Copie a `DATABASE_URL`

Crie o arquivo `.env.local`:
```bash
DATABASE_URL="postgresql://..."
```

### 3. Criar as tabelas
```bash
npx prisma db push
```

### 4. Iniciar o servidor
```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Deploy no Vercel

### 1. Subir o código no GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/unico-crm.git
git push -u origin main
```

### 2. Conectar ao Vercel
1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em **New Project** → importe o repositório
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → cole a URL do Neon

### 3. Fazer deploy
O Vercel faz o deploy automaticamente após cada push no GitHub.

---

## Funcionalidades

- ✅ Dashboard com métricas em tempo real
- ✅ Cadastro completo de clientes cancelados
- ✅ Registro de: site, plugin de rastreio, checkout, uso na UD
- ✅ Verificação automática se site está online
- ✅ Filtros avançados por status, prioridade, recursos usados
- ✅ Formulário multi-step intuitivo
- ✅ Gráficos de conversão e distribuição
- ✅ Página de relatórios com exportação CSV
- ✅ Multi-usuário simultâneo (via banco de dados na nuvem)
- ✅ Responsivo e otimizado para Vercel

---

## Comandos Úteis

```bash
# Rodar em desenvolvimento
npm run dev

# Abrir Prisma Studio (interface visual do banco)
npx prisma studio

# Resetar banco (⚠️ apaga todos os dados)
npx prisma db push --force-reset

# Build de produção
npm run build
```
