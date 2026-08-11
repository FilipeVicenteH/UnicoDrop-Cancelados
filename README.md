# 🚀 UnicoCRM — SaaS Analytics & Reconversão de Churn

[![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-02E693?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Vercel Status](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://unico-crm.vercel.app)

> **Sistema SaaS Full Stack desenvolvido para acompanhamento, categorização de motivos de saída e reconversão estratégica de clientes cancelados da plataforma UnicoDrop.**

🔗 **Live Demo**: [unico-crm.vercel.app](https://unico-crm.vercel.app)

---

## 📊 Arquitetura de Dados & Recursos

- **Dashboard de Métricas em Tempo Real**: KPIs de MRR recuperado, taxa de churn por motivo (preço, suporte, bugs, concorrência) e gráficos com Recharts.
- **Verificação Automática de Disponibilidade**: Checagem assíncrona de status HTTP dos e-commerces dos clientes.
- **Formulário Multi-Step Intuitivo**: Onboarding completo de registros de cancelamento com validação de dados.
- **Relatórios & Exportação**: Filtros combinados avançados por prioridade, recursos utilizados e exportação em formato CSV.

---

## 🛠️ Tech Stack & Ferramentas

- **Front-End & SSR**: Next.js 15 (App Router, Server Components & Server Actions).
- **Linguagem & Tipagem**: TypeScript.
- **Estilização & UI**: Tailwind CSS 4, Lucide Icons, Recharts, React Hot Toast.
- **Banco de Dados & ORM**: Neon PostgreSQL Serverless, Prisma ORM (Driver Adapter).
- **Hospedagem & CI/CD**: Vercel.

---

## ⚡ Setup Local (Desenvolvimento)

```bash
# 1. Clone o repositório
git clone https://github.com/FilipeVicenteH/UnicoDrop-Cancelados.git

# 2. Acesse a pasta do projeto
cd UnicoDrop-Cancelados

# 3. Instale as dependências
npm install

# 4. Configure a variável de ambiente (.env.local)
DATABASE_URL="postgresql://usuario:senha@ep-xyz.neon.tech/neondb?sslmode=require"

# 5. Execute as migrations do Prisma
npx prisma db push

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

---

## 👤 Autor

**Filipe Vicente Hidalgo**  
- **LinkedIn**: [linkedin.com/in/filipevicentehidalgo](https://www.linkedin.com/in/filipevicentehidalgo)  
- **Portfólio**: [filipevicenteh.vercel.app](https://filipevicenteh.vercel.app)
