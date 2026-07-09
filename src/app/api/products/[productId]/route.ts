import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

type Context = {
  params: Promise<{ productId: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  const result = await backendFetch(`/api/products/${productId}`, {
    method: 'GET',
  });
  return Response.json(result);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  try {
    const body = await request.json();
    const result = await backendFetch(`/api/products/${productId}`, {
      method: 'PATCH',
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

export async function DELETE(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  const result = await backendFetch(`/api/products/${productId}`, {
    method: 'DELETE',
  });
  return Response.json(result);
}
