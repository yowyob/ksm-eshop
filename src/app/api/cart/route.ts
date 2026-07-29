import { NextRequest } from 'next/server';
import { getLocalCart, saveLocalCart } from '@/lib/local-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return Response.json({ success: false, message: 'userId manquant' }, { status: 400 });
  }

  try {
    const items = getLocalCart(userId);
    return Response.json({ success: true, data: items });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, items } = body;

    if (!userId) {
      return Response.json({ success: false, message: 'userId manquant' }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return Response.json({ success: false, message: 'items invalide' }, { status: 400 });
    }

    const success = saveLocalCart(userId, items);
    if (success) {
      return Response.json({ success: true, message: 'Panier sauvegardé.' });
    } else {
      return Response.json({ success: false, message: 'Erreur lors de la sauvegarde du panier' }, { status: 500 });
    }
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
