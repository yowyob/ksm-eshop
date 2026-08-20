import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

/**
 * Achever un transfert inter-dépôts.
 *
 * L'ancienne interface achevait un transfert d'un coup. Le grand-livre en distingue deux temps :
 * on **expédie**, puis on **réceptionne**. Entre les deux, la marchandise est en route — sortie du
 * dépôt de départ, pas encore entrée dans celui d'arrivée. C'est ce qui empêche de compter deux
 * fois la même palette, et l'ancienne interface ne savait pas l'exprimer.
 *
 * La boutique n'a qu'un bouton, ce qui convient à un commerce où les deux gestes sont simultanés.
 * On enchaîne donc les deux appels.
 *
 * **Si la réception échoue après l'expédition**, le transfert reste « en transit ». Ce n'est pas un
 * état corrompu mais un état exact : la marchandise est effectivement partie. Elle pourra être
 * réceptionnée plus tard, et aucune quantité n'a été perdue ni dupliquée. C'est précisément ce que
 * l'état intermédiaire sert à décrire, et pourquoi on ne cherche pas à le masquer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transferId: string }> }
) {
  const { transferId } = await params;

  const shipped = await backendFetch(`/api/stock/transfers/${transferId}/ship`, { method: 'POST' });
  if (!shipped.success) {
    console.error('Stock transfer ship failed:', shipped);
    return Response.json(shipped, { status: 502 });
  }

  const received = await backendFetch(`/api/stock/transfers/${transferId}/receive`, { method: 'POST' });
  if (!received.success) {
    console.error('Stock transfer receive failed after shipping:', received);
    return Response.json(
      {
        ...received,
        message:
          "La marchandise est expédiée mais n'a pas pu être réceptionnée. Le transfert reste en transit et pourra être réceptionné.",
      },
      { status: 502 }
    );
  }

  return Response.json(received);
}
