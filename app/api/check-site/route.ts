import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })
  }

  try {
    let checkUrl = url
    if (!checkUrl.startsWith('http')) {
      checkUrl = `https://${checkUrl}`
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(checkUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timeout)

      return NextResponse.json({
        online: response.ok || response.status < 500,
        status: response.status,
        statusText: response.statusText,
        url: checkUrl,
      })
    } catch {
      clearTimeout(timeout)
      // Try with GET if HEAD fails
      try {
        const controller2 = new AbortController()
        const timeout2 = setTimeout(() => controller2.abort(), 8000)
        const response2 = await fetch(checkUrl, {
          method: 'GET',
          signal: controller2.signal,
          redirect: 'follow',
        })
        clearTimeout(timeout2)
        return NextResponse.json({
          online: response2.ok || response2.status < 500,
          status: response2.status,
          statusText: response2.statusText,
          url: checkUrl,
        })
      } catch {
        return NextResponse.json({ online: false, status: 0, statusText: 'Offline', url: checkUrl })
      }
    }
  } catch {
    return NextResponse.json({ online: false, status: 0, statusText: 'Erro', url })
  }
}
