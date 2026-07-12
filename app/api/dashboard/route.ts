import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const [
      total,
      convertidos,
      nao_convertidos,
      em_negociacao,
      pendentes,
      contatados_hoje,
      cancelados_hoje,
      por_status,
      por_checkout,
      por_prioridade,
      por_plataforma,
      clientes_com_motivo,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.cliente.count({ where: { status: 'CONVERTIDO' } }),
      prisma.cliente.count({ where: { status: 'NAO_CONVERTIDO' } }),
      prisma.cliente.count({ where: { status: 'EM_NEGOCIACAO' } }),
      prisma.cliente.count({ where: { status: 'PENDENTE' } }),
      prisma.cliente.count({
        where: { data_contato: { gte: hoje, lt: amanha } },
      }),
      prisma.cliente.count({
        where: { data_cancelamento: { gte: hoje, lt: amanha } },
      }),
      prisma.cliente.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.cliente.groupBy({
        by: ['checkout'],
        _count: { checkout: true },
        where: { checkout: { not: null } },
        orderBy: { _count: { checkout: 'desc' } },
        take: 8,
      }),
      prisma.cliente.groupBy({
        by: ['prioridade'],
        _count: { prioridade: true },
      }),
      prisma.cliente.groupBy({
        by: ['plataforma_loja'],
        _count: { plataforma_loja: true },
        where: { plataforma_loja: { not: null } },
        orderBy: { _count: { plataforma_loja: 'desc' } },
        take: 8,
      }),
      prisma.cliente.findMany({
        where: { motivo_cancelamento: { not: null } },
        select: { motivo_cancelamento: true },
      }),
    ])

    // Agrupa motivos de cancelamento por ocorrência
    const motivosMap: Record<string, number> = {}
    for (const c of clientes_com_motivo) {
      const m = (c.motivo_cancelamento || '').trim()
      if (m) motivosMap[m] = (motivosMap[m] || 0) + 1
    }
    const top_motivos = Object.entries(motivosMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([motivo, count]) => ({ motivo, count }))

    const taxa_conversao = total > 0 ? Math.round((convertidos / total) * 100) : 0

    return NextResponse.json({
      total,
      convertidos,
      nao_convertidos,
      em_negociacao,
      pendentes,
      taxa_conversao,
      contatados_hoje,
      cancelados_hoje,
      por_status: por_status.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      por_checkout: por_checkout.map((c) => ({
        checkout: c.checkout || 'Não informado',
        count: c._count.checkout,
      })),
      por_prioridade: por_prioridade.map((p) => ({
        prioridade: p.prioridade,
        count: p._count.prioridade,
      })),
      por_plataforma: por_plataforma.map((p) => ({
        plataforma: p.plataforma_loja || 'Não informado',
        count: p._count.plataforma_loja,
      })),
      top_motivos,
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 })
  }
}
