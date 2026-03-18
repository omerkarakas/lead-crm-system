import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 * Docker health check ve monitoring için kullanılır
 */
export async function GET() {
  try {
    // PocketBase bağlantısını kontrol et (opsiyonel)
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL
    let pbStatus = 'unknown'

    if (pbUrl) {
      try {
        const pbHealthResponse = await fetch(`${pbUrl}/api/health`, {
          signal: AbortSignal.timeout(5000),
        })
        pbStatus = pbHealthResponse.ok ? 'healthy' : 'unhealthy'
      } catch {
        pbStatus = 'unreachable'
      }
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      pocketbase: pbStatus,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
