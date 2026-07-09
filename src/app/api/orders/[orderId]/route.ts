import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

type Context = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  const { orderId } = await params;
  const result = await backendFetch(`/api/sales/orders/${orderId}`, {
    method: 'GET',
  });
  return Response.json(result);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { orderId } = await params;
  try {
    const body = await request.json();
    const result = await backendFetch(`/api/sales/orders/${orderId}`, {
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
  const { orderId } = await params;
  const result = await backendFetch(`/api/sales/orders/${orderId}`, {
    method: 'DELETE',
  });
  return Response.json(result);
}
