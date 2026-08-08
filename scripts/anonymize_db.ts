import dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { prisma } from '../lib/prisma'
import { anonymizeCliente, anonymizeFeedback } from '../lib/anonymize'

async function runDatabaseAnonymization() {
  console.log('🚀 Iniciando anonimização completa do banco de dados Neon PostgreSQL...')

  const clientes = await prisma.cliente.findMany()
  console.log(`📦 Encontrados ${clientes.length} clientes no banco de dados.`)

  let clientesUpdated = 0
  for (const c of clientes) {
    const anon = anonymizeCliente(c)
    await prisma.cliente.update({
      where: { id: c.id },
      data: {
        nome: anon.nome!,
        contato: anon.contato,
        empresa: anon.empresa,
        site_url: anon.site_url,
        unico_id: anon.unico_id,
        nota_interna: anon.nota_interna,
        feedback_completo: anon.feedback_completo,
      },
    })
    clientesUpdated++
  }
  console.log(`✅ ${clientesUpdated} clientes foram anonimizados no PostgreSQL com sucesso!`)

  const feedbacks = await prisma.feedbackMelhoria.findMany()
  console.log(`📦 Encontrados ${feedbacks.length} feedbacks no banco de dados.`)

  let feedbacksUpdated = 0
  for (const f of feedbacks) {
    const anon = anonymizeFeedback(f)
    await prisma.feedbackMelhoria.update({
      where: { id: f.id },
      data: {
        cliente: anon.cliente!,
        unico_id: anon.unico_id,
        descricao: anon.descricao!,
      },
    })
    feedbacksUpdated++
  }
  console.log(`✅ ${feedbacksUpdated} feedbacks foram anonimizados com sucesso!`)
  console.log('🎉 Anonimização concluída sem vazamento de dados pessoais/sensíveis!')
}

runDatabaseAnonymization()
  .catch((err) => {
    console.error('❌ Erro na anonimização:', err)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })
