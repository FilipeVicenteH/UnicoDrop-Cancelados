import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL || ''
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  try {
    const logs = await prisma.whatsappLog.findMany({
      orderBy: { enviado_em: 'desc' },
      take: 50
    })
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar histórico de envios' }, { status: 500 })
  }
}
