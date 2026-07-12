'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Search, Loader2, Plus, X, Building2, User, Trash2 } from 'lucide-react';

export default function AdminClientsPage() {
  const { tenantId } = useParams() as { tenantId: string };
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deduplicating, setDeduplicating] = useState(false);
  const [dedupResult, setDedupResult] = useState<string | null>(null);

  // Form states based on Kernel schema
  const [formData, setFormData] = useState({
    name: '',
    longName: '',
    code: '',
    type: 'INDIVIDUAL',
    partyType: 'ACTOR',
    roles: 'CUSTOMER', // will be converted to array
    enabled: true,
  });

  const fetchClients = async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = search
        ? `/api/admin/clients/search?organizationId=${tenantId}&query=${encodeURIComponent(search)}`
        : `/api/admin/clients?organizationId=${tenantId}`;
        
      const res = await fetch(url);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        let list: any[] = [];
        const raw = data.data;
        if (Array.isArray(raw)) list = raw;
        else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
        else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
        setClients(list);
      } else {
        if (data.errorCode === '401' || data.message === 'Unauthorized' || data.message === 'Non autorisé.') {
          router.push('/admin/login');
          return;
        }
        setError(data.message || 'Impossible de charger les clients.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients(searchTerm);
    }, 500); // Débounce de 500ms pour éviter de surcharger l'API

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, tenantId]);

  const openModal = () => {
    setFormData({
      name: '',
      longName: '',
      code: `C-${Math.floor(Math.random() * 10000)}`,
      type: 'INDIVIDUAL',
      partyType: 'ACTOR',
      roles: 'CUSTOMER',
      enabled: true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        organizationId: tenantId,
        partyType: formData.partyType,
        code: formData.code,
        name: formData.name,
        longName: formData.longName || formData.name,
        roles: [formData.roles],
        type: formData.type,
        enabled: formData.enabled,
        prospect: false
      };
      
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchClients();
      } else {
        alert(data.message || 'Erreur lors de la création du client.');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeduplicate = async () => {
    if (!confirm('Voulez-vous vraiment supprimer les clients en double ? Cette action est irréversible.')) return;
    setDeduplicating(true);
    setDedupResult(null);
    try {
      const res = await fetch('/api/admin/clients/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: tenantId })
      });
      const data = await res.json();
      setDedupResult(data.message || 'Opération terminée.');
      if (data.success) fetchClients();
    } catch (err: any) {
      setDedupResult('Erreur : ' + err.message);
    } finally {
      setDeduplicating(false);
    }
  };

  const filteredClients = clients;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase italic flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Clients
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Organisation : <span className="text-blue-600">{tenantId}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDeduplicate}
            disabled={deduplicating}
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 font-black uppercase text-[10px] gap-2 h-9"
          >
            {deduplicating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Supprimer doublons
          </Button>
          <Button 
            onClick={openModal}
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] gap-2 h-9"
          >
            <Plus className="h-3 w-3" /> Nouveau Client
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}
      {dedupResult && (
        <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>{dedupResult}</span>
          <button onClick={() => setDedupResult(null)} className="text-emerald-500 hover:text-emerald-800"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Rechercher un client par nom ou code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-zinc-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors bg-white"
          />
        </div>
      </div>

      {loading ? (
        <Card className="border-2 border-zinc-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Chargement des clients...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id || client.partyId} className="border-2 border-zinc-200 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-2 border-b border-zinc-100 bg-zinc-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-black text-zinc-900 flex items-center gap-2">
                      {client.type === 'COMPANY' ? <Building2 className="h-4 w-4 text-blue-500" /> : <User className="h-4 w-4 text-orange-500" />}
                      {client.name}
                    </CardTitle>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Code: {client.code}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    client.enabled !== false 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {client.enabled !== false ? 'ACTIF' : 'INACTIF'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                  <span className="font-bold text-[10px] uppercase text-zinc-400">Raison Sociale :</span>
                  {client.longName || client.name}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                  <span className="font-bold text-[10px] uppercase text-zinc-400">Rôles :</span>
                  {Array.isArray(client.roles) ? client.roles.join(', ') : client.roles}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
              Aucun client trouvé.
            </div>
          )}
        </div>
      )}

      {/* Modal Produit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">
                Nouveau Client
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setIsModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="clientForm" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nom / Prénom</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-zinc-200 rounded-lg p-3 font-bold focus:border-blue-600 focus:outline-none" />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Raison Sociale / Nom Complet</label>
                    <input type="text" value={formData.longName} onChange={e => setFormData({...formData, longName: e.target.value})} className="w-full border-2 border-zinc-200 rounded-lg p-3 font-bold focus:border-blue-600 focus:outline-none" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Code Client</label>
                    <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border-2 border-zinc-200 rounded-lg p-3 font-bold focus:border-blue-600 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Type de personne</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border-2 border-zinc-200 rounded-lg p-3 font-bold focus:border-blue-600 focus:outline-none bg-white">
                      <option value="INDIVIDUAL">Particulier (INDIVIDUAL)</option>
                      <option value="COMPANY">Entreprise (COMPANY)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rôle Principal</label>
                    <select value={formData.roles} onChange={e => setFormData({...formData, roles: e.target.value})} className="w-full border-2 border-zinc-200 rounded-lg p-3 font-bold focus:border-blue-600 focus:outline-none bg-white">
                      <option value="CUSTOMER">Client (CUSTOMER)</option>
                      <option value="SUPPLIER">Fournisseur (SUPPLIER)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Statut</label>
                    <select value={formData.enabled ? 'true' : 'false'} onChange={e => setFormData({...formData, enabled: e.target.value === 'true'})} className="w-full border-2 border-zinc-200 rounded-lg p-3 font-bold focus:border-blue-600 focus:outline-none bg-white">
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-zinc-50 flex justify-end gap-3 rounded-b-2xl">
              <Button type="button" variant="outline" className="font-bold border-2" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button type="submit" form="clientForm" disabled={saving} className="font-bold bg-blue-600 hover:bg-blue-700 min-w-[120px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer Client'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

