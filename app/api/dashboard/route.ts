import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date_field = searchParams.get('date_field') // 'cancelamento' | 'contato'
    const date_from = searchParams.get('date_from')   // YYYY-MM-DD
    const date_to = searchParams.get('date_to')       // YYYY-MM-DD

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    // Build date range filter for the base where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseWhere: any = {}
    if ((date_from || date_to) && date_field) {
      const field = date_field === 'contato' ? 'data_contato' : 'data_cancelamento'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dateRange: any = {}
      if (date_from) {
        const from = new Date(date_from)
        from.setHours(0, 0, 0, 0)
        dateRange.gte = from
      }
      if (date_to) {
        const to = new Date(date_to)
        to.setHours(23, 59, 59, 999)
        dateRange.lte = to
      }
      baseWhere[field] = dateRange
    }

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
      prisma.cliente.count({ where: baseWhere }),
      prisma.cliente.count({ where: { ...baseWhere, status: 'CONVERTIDO' } }),
      prisma.cliente.count({ where: { ...baseWhere, status: 'NAO_CONVERTIDO' } }),
      prisma.cliente.count({ where: { ...baseWhere, status: 'EM_NEGOCIACAO' } }),
      prisma.cliente.count({ where: { ...baseWhere, status: 'PENDENTE' } }),
      prisma.cliente.count({
        where: { data_contato: { gte: hoje, lt: amanha } },
      }),
      prisma.cliente.count({
        where: { data_cancelamento: { gte: hoje, lt: amanha } },
      }),
      prisma.cliente.groupBy({
        by: ['status'],
        _count: { status: true },
        where: baseWhere,
      }),
      prisma.cliente.groupBy({
        by: ['checkout'],
        _count: { checkout: true },
        where: { ...baseWhere, checkout: { not: null } },
        orderBy: { _count: { checkout: 'desc' } },
        take: 8,
      }),
      prisma.cliente.groupBy({
        by: ['prioridade'],
        _count: { prioridade: true },
        where: baseWhere,
      }),
      prisma.cliente.groupBy({
        by: ['plataforma_loja'],
        _count: { plataforma_loja: true },
        where: { ...baseWhere, plataforma_loja: { not: null } },
        orderBy: { _count: { plataforma_loja: 'desc' } },
        take: 8,
      }),
      prisma.cliente.findMany({
        where: { ...baseWhere, motivo_cancelamento: { not: null } },
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
