import { backendFetch } from '@/lib/api-client';
import { getKernelToken } from '@/lib/kernel-auth';

export async function GET(request: Request) {
  try {
    const adminToken = await getKernelToken();
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // Hardcode the user's 7 exact organization IDs
    const orgs = [
      { id: 'fac51104-41e7-4760-bdf4-4abd8f0ea059', name: 'KSM SARL' },
      { id: 'aba962f4-a720-475d-9f89-de028a7291ff', name: 'KSM eShop' },
      { id: '5772c1c6-54f7-486f-8bf8-38712ff5a900', name: 'KSM Gadgets' },
      { id: '50e82570-0dbb-4ed0-bb96-293c99a2272f', name: 'KSM Accessories' },
      { id: 'a6d70676-33d2-4776-b3f3-fab54cad7ba3', name: 'KSM Computers' },
      { id: '90f483ae-3e2d-449a-8691-b67251019b99', name: 'KSM Home Appliances' },
      { id: 'd9d6a900-a3a6-4572-8349-415ad008b976', name: 'KSM Electronics' }
    ];
    
    // 2. Fetch User Me to get ownerId
    const meRes = await backendFetch('/api/users/me', {
      method: 'GET',
      headers
    });
    const userId = meRes.data?.id || '00000000-0000-0000-0000-000000000000';

    const results = [];

    // 3. Create agency for each org
    for (const org of orgs) {
      const orgId = org.id;
      
      const orgName = org.name || `Organisation-${orgId.substring(0,4)}`;
      const agencyPayload = {
        code: `AG-${orgName.substring(0,3).toUpperCase()}-01`,
        ownerId: userId,
        managerId: userId,
        name: `Agence Principale ${orgName}`,
        location: "Siège social",
        description: `Agence par défaut pour ${orgName}`,
        transferable: true,
        active: true,
        shortName: "Principale",
        longName: `Agence Principale ${orgName}`,
        isIndividualBusiness: false,
        isHeadquarter: true,
        country: "Cameroun",
        city: "Yaoundé",
        isPublic: true,
        isBusiness: true,
        agencyType: "AGENCY"
      };

      const createRes = await backendFetch(`/api/organizations/${orgId}/agencies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(agencyPayload)
      });

      results.push({
        organization: org.name,
        success: createRes.success,
        response: createRes.data || createRes.message
      });
    }

    return Response.json({ success: true, results });

  } catch (err: any) {
    return Response.json({ error: err.message });
  }
}
