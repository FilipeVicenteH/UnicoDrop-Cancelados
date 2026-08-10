import { NextRequest, NextResponse } from 'next/server'

// Sliding window rate limiter (In-Memory per Edge runtime node)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 60     // Max 60 requests per minute per IP

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1'
  const now = Date.now()

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const record = rateLimitMap.get(ip)

    if (!record || now > record.expiresAt) {
      rateLimitMap.set(ip, { count: 1, expiresAt: now + WINDOW_MS })
    } else {
      record.count += 1
      if (record.count > MAX_REQUESTS) {
        const retryAfter = Math.ceil((record.expiresAt - now) / 1000)
        return new NextResponse(
          JSON.stringify({
            error: 'Muitas requisições. Limite de taxa excedido (Rate Limit).',
            retryAfterSeconds: retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(MAX_REQUESTS),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
    }
  }

  const response = NextResponse.next()

  // Security Headers & Bot protection hints
  response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS))
  response.headers.set('X-Bot-Protection', 'WAF-Active')

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
