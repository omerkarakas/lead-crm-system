/**
 * GET /api/openapi.json - OpenAPI Specification Endpoint
 *
 * Returns the complete OpenAPI 3.1 specification for Moka CRM API.
 * Used by documentation UIs like Scalar.
 */

import { NextResponse } from 'next/server';
import { openApiDocument } from '@/lib/openapi/schema';

export async function GET() {
  return NextResponse.json(openApiDocument, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export const dynamic = 'force-static';
