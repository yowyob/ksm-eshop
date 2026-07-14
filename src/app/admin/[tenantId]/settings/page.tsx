'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertTriangle, Save, Building2, CheckCircle2 } from 'lucide-react';

export default function OrganizationSettingsPage() {
  const { tenantId } = useParams() as { tenantId: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [orgData, setOrgData] = useState({
    id: '',
    code: '',
    name: '',
    shortName: '',
    longName: '',
    displayName: '',
    legalName: '',
    description: '',
    email: '',
    websiteUrl: '',
    logoUri: '',
    service: 'PRIVATE_COMPANY',
    organizationType: 'PRIVATE_COMPANY',
    isActive: true
  });

  const fetchOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pour éviter les droits insuffisants sur un seul endpoint, 
      // on récupère de la liste générale et on filtre
      const res = await fetch(`/api/organizations?size=100`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      
      if (data.success && data.data) {
        const orgs = Array.isArray(data.data) ? data.data : (data.data.content || []);
        const current = orgs.find((o: any) => o.id === tenantId);
        
        if (current) {
          setOrgData({
            id: current.id || '',
            code: current.code || '',
            name: current.name || '',
            shortName: current.shortName || current.name || '',
            longName: current.longName || current.name || '',
            displayName: current.displayName || current.name || '',
            legalName: current.legalName || current.name || '',
            description: current.description || '',
            email: current.email || '',
            websiteUrl: current.websiteUrl || '',
            logoUri: current.logoUri || '',
            service: current.service || 'PRIVATE_COMPANY',
            organizationType: current.organizationType || 'PRIVATE_COMPANY',
            isActive: current.isActive !== undefined ? current.isActive : true
          });
        } else {
          setError('Impossible de trouver les informations de cette organisation.');
        }
      } else {
        setError(data.message || 'Erreur lors du chargement de l\'organisation.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, router]);

  useEffect(() => {
    if (tenantId) fetchOrganization();
  }, [tenantId, fetchOrganization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/organizations/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData)
      });

      const data = await res.json();

      if (data.success || res.ok) {
        setSuccess('Les informations de l\'organisation ont été mises à jour avec succès.');
        // Rafraîchir les données et forcer le rechargement du layout pour mettre à jour la sidebar
        await fetchOrganization();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.message || 'Erreur lors de la mise à jour.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
        <p className="font-bold uppercase tracking-widest text-sm">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 uppercase italic tracking-tighter">Paramètres</h1>
          <p className="text-zinc-500 font-medium mt-1">Configurez les informations et détails de votre organisation.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold text-sm">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      <Card className="border-2 border-zinc-100 rounded-3xl shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-zinc-50 bg-zinc-50/50 p-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-zinc-900">
            <Building2 className="h-4 w-4 text-blue-600" /> Informations Générales
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Code Unique de l&apos;Organisation</label>
                <input 
                  required
                  type="text"
                  className="w-full h-11 bg-zinc-100 border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold text-zinc-500 focus:outline-none cursor-not-allowed font-mono"
                  disabled
                  value={orgData.code}
                />
                <p className="text-[10px] text-zinc-400 font-medium">L&apos;identifiant code de l&apos;organisation est défini à sa création.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nom Officiel de l&apos;Organisation</label>
                <input 
                  required
                  type="text"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={orgData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOrgData({
                      ...orgData,
                      name: val,
                      shortName: val,
                      longName: val,
                      displayName: val,
                      legalName: val
                    });
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email de Contact</label>
                <input 
                  type="email"
                  placeholder="contact@organisation.com"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={orgData.email}
                  onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Site Web</label>
                <input 
                  type="url"
                  placeholder="https://www.organisation.com"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={orgData.websiteUrl}
                  onChange={(e) => setOrgData({ ...orgData, websiteUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Logo URL</label>
                <input 
                  type="text"
                  placeholder="https://mon-image.png"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={orgData.logoUri}
                  onChange={(e) => setOrgData({ ...orgData, logoUri: e.target.value })}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description / Slogan</label>
                <textarea 
                  className="w-full h-24 bg-white border-2 border-zinc-200 rounded-xl p-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors resize-none"
                  placeholder="Décrivez votre activité..."
                  value={orgData.description}
                  onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100">
              <Button 
                type="submit" 
                disabled={saving} 
                className="h-11 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-600/20 rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Sauvegarder les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
