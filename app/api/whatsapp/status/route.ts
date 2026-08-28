import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL || ''
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  try {
    let session = await prisma.whatsappSession.findFirst({
      orderBy: { id: 'desc' }
    })

    if (!session) {
      session = await prisma.whatsappSession.create({
        data: {
          status: 'DISCONNECTED',
          numero_conectado: null,
          qr_code_base64: null,
        }
      })
    }

    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar status do WhatsApp' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, numero } = body

    let session = await prisma.whatsappSession.findFirst({
      orderBy: { id: 'desc' }
    })

    if (!session) {
      session = await prisma.whatsappSession.create({
        data: { status: 'DISCONNECTED' }
      })
    }

    if (action === 'GENERATE_QR') {
      // Dummy SVG/Base64 QR Code simulation for WhatsApp Pairing
      const mockQrCode = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=UNICOCRM-WHATSAPP-PAIRING-SESSION-' + Date.now()
      
      const updated = await prisma.whatsappSession.update({
        where: { id: session.id },
        data: {
          status: 'WAITING_QR',
          qr_code_base64: mockQrCode,
          numero_conectado: null,
        }
      })
      return NextResponse.json(updated)
    }

    if (action === 'CONNECT') {
      const updated = await prisma.whatsappSession.update({
        where: { id: session.id },
        data: {
          status: 'CONNECTED',
          numero_conectado: numero || '+55 (11) 96615-2956',
          qr_code_base64: null,
        }
      })
      return NextResponse.json(updated)
    }

    if (action === 'DISCONNECT') {
      const updated = await prisma.whatsappSession.update({
        where: { id: session.id },
        data: {
          status: 'DISCONNECTED',
          numero_conectado: null,
          qr_code_base64: null,
        }
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
  }
}
