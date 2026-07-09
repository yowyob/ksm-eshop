import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('customerToken');
    return Response.json({ success: true, message: 'Déconnecté avec succès.' });
  } catch (error: any) {
    console.error('[Customer Logout Error]', error);
    return Response.json({ success: false, message: 'Erreur interne.' }, { status: 500 });
  }
}
