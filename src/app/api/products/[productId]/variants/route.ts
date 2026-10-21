import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { listerVariantes } from '@/lib/kernel-catalog';

type Context = {
  params: Promise<{ productId: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  return Response.json(await listerVariantes(productId));
}

export async function POST(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  try {
    const body = await request.json();
    // Les variantes vivent sur la définition du produit (l'ancienne route /api/products a disparu).
    const result = await backendFetch(`/api/product-core/products/${productId}/variants`, {
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
