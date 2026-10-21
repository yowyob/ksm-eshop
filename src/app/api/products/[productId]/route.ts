import { NextRequest } from 'next/server';
import { lireProduit, modifierProduit, retirerProduit } from '@/lib/kernel-catalog';

type Context = {
  params: Promise<{ productId: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  return Response.json(await lireProduit(productId));
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  try {
    const body = await request.json();
    return Response.json(await modifierProduit(productId, body));
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
  return Response.json(await retirerProduit(productId));
}
