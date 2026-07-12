import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET() {
  try {
    // 1. Fetch organizations
    const orgsRes = await backendFetch('/api/organizations');
    if (!orgsRes.success) return NextResponse.json({ error: 'Failed to fetch orgs', details: orgsRes });

    const targetOrgs = [
      "a6d70676-33d2-4776-b3f3-fab54cad7ba3",
      "fac51104-41e7-4760-bdf4-4abd8f0ea059",
      "aba962f4-a720-475d-9f89-de028a7291ff",
      "5772c1c6-54f7-486f-8bf8-38712ff5a900",
      "50e82570-0dbb-4ed0-bb96-293c99a2272f",
      "d9d6a900-a3a6-4572-8349-415ad008b976",
      "90f483ae-3e2d-449a-8691-b67251019b99"
    ];
    
    const results = [];

    // 2. For each org, POST to /api/organizations/{id}/services
    for (const orgId of targetOrgs) {
      const assignRes = await backendFetch(`/api/organizations/${orgId}/services`, {
        method: 'POST',
        body: JSON.stringify({
          "serviceCode": "SALES",
          "requestQuotaLimit": 9999999,
          "requestQuotaWindowSeconds": 31536000
        }), 
        headers: {
          'Content-Type': 'application/json'
        }
      });

      results.push({ orgId, assignRes });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
