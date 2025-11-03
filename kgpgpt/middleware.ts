import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Just pass through - authentication is handled in API routes
  return NextResponse.next()
}

export const config = {
  matcher: []
}
