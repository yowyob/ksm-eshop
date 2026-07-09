import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const result = await backendFetch('/api/warehouses', {
    method: 'GET',
  });
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await backendFetch('/api/warehouses', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Response.json(result);
  } catch (error: any) {
    return Response.json({
      success: false,
      message: error.message || 'Invalid JSON request body.',
      errorCode: 'BAD_REQUEST',
    }, { status: 400 });
  }
}
