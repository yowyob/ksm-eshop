import { NextRequest } from 'next/server';
import { setSuspendedOrg, isOrgSuspended } from '@/lib/suspended-orgs';

// GET - statut de suspension d'une organisation
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    const suspended = isOrgSuspended(orgId);
    return Response.json({ success: true, suspended });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

// POST - suspendre / réactiver une organisation (état local KSM)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    const body = await request.json();
    const { suspended } = body; // true = suspendre, false = réactiver

    await setSuspendedOrg(orgId, suspended);

    return Response.json({
      success: true,
      message: suspended ? 'Organisation suspendue.' : 'Suspension levée.',
      suspended,
    });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
