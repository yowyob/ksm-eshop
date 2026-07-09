'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { TENANTS } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Trash2, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  AlertTriangle,
  X,
  FileText,
  Warehouse
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useProductStore } from '@/store/useProductStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { StockMovement, WarehouseTransfer, ProductTransformation, InventorySession, InventorySessionItem } from '@/lib/types';

export default function AdminInventoryPage() {
  const { tenantId } = useParams();
  const tenant = TENANTS.find(t => t.slug === tenantId);

  const { products, variants } = useProductStore();
  const { 
    warehouses, 
    movements, 
    transfers, 
    transformations, 
    inventorySessions,
    inventorySessionItems,
    getVariantStock,
    getWarehouseStockList,
    createMovement,
    validateMovement,
    deleteMovement,
    createTransfer,
    completeTransfer,
    deleteTransfer,
    createTransformation,
    validateTransformation,
    deleteTransformation,
    createInventorySession,
    validateInventorySession,
    deleteInventorySession
  } = useInventoryStore();

  const [activeTab, setActiveTab] = useState<'levels' | 'movements' | 'transfers' | 'transformations' | 'sessions'>('levels');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  
  // Modals
  const [isAddingMovement, setIsAddingMovement] = useState(false);
  const [isAddingTransfer, setIsAddingTransfer] = useState(false);
  const [isAddingTransformation, setIsAddingTransformation] = useState(false);
  const [isAddingSession, setIsAddingSession] = useState(false);

  // Form inputs
  const [newMvt, setNewMvt] = useState({
    variantId: '', warehouseId: '', type: 'INBOUND' as any, quantity: '1', status: 'VALIDATED' as any
  });
  const [newTrsf, setNewTrsf] = useState({
    sourceWarehouseId: '', targetWarehouseId: '', variantId: '', quantity: '1'
  });
  const [newTransf, setNewTransf] = useState({
    sourceVariantId: '', targetVariantId: '', sourceQuantity: '1', targetQuantity: '1', warehouseId: ''
  });
  const [newSession, setNewSession] = useState({
    warehouseId: '', counts: [] as { variantId: string, quantityCounted: string }[]
  });

  if (!tenant) return null;

  const tenantWarehouses = warehouses.filter(w => w.tenantId === tenant.id);
  const tenantMovements = movements.filter(m => m.tenantId === tenant.id);
  const tenantTransfers = transfers.filter(t => t.tenantId === tenant.id);
  const tenantTransformations = transformations.filter(tf => tf.tenantId === tenant.id);
  const tenantSessions = inventorySessions.filter(s => s.tenantId === tenant.id);

  // Initialize selected warehouse
  const currentWarehouseId = selectedWarehouseId || tenantWarehouses[0]?.id;

  const getVariantName = (vId: string) => {
    const v = variants.find(varObj => varObj.id === vId);
    const p = products.find(prodObj => prodObj.id === v?.productId);
    return v && p ? `${p.name} (${v.sku})` : 'Variante inconnue';
  };

  const getWarehouseName = (whId: string) => {
    return warehouses.find(w => w.id === whId)?.name || 'Dépôt inconnu';
  };

  // HANDLERS
  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMvt.variantId || !newMvt.warehouseId || !newMvt.quantity) return;

    try {
      createMovement({
        tenantId: tenant.id,
        organizationId: 'o1',
        variantId: newMvt.variantId,
        warehouseId: newMvt.warehouseId,
        type: newMvt.type,
        status: newMvt.status,
        quantity: parseFloat(newMvt.quantity)
      });
      setIsAddingMovement(false);
      setNewMvt({ variantId: '', warehouseId: '', type: 'INBOUND', quantity: '1', status: 'VALIDATED' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrsf.variantId || !newTrsf.sourceWarehouseId || !newTrsf.targetWarehouseId || !newTrsf.quantity) return;

    try {
      createTransfer({
        tenantId: tenant.id,
        organizationId: 'o1',
        variantId: newTrsf.variantId,
        sourceWarehouseId: newTrsf.sourceWarehouseId,
        targetWarehouseId: newTrsf.targetWarehouseId,
        quantity: parseFloat(newTrsf.quantity)
      });
      setIsAddingTransfer(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransformationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransf.sourceVariantId || !newTransf.targetVariantId || !newTransf.sourceQuantity || !newTransf.targetQuantity || !newTransf.warehouseId) return;

    try {
      createTransformation({
        tenantId: tenant.id,
        organizationId: 'o1',
        sourceVariantId: newTransf.sourceVariantId,
        targetVariantId: newTransf.targetVariantId,
        sourceQuantity: parseFloat(newTransf.sourceQuantity),
        targetQuantity: parseFloat(newTransf.targetQuantity),
        warehouseId: newTransf.warehouseId
      });
      setIsAddingTransformation(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.warehouseId || newSession.counts.length === 0) return;

    const formattedCounts = newSession.counts
      .filter(c => c.variantId && c.quantityCounted)
      .map(c => ({
        variantId: c.variantId,
        quantityCounted: parseFloat(c.quantityCounted)
      }));

    createInventorySession({
      tenantId: tenant.id,
      organizationId: 'o1',
      warehouseId: newSession.warehouseId
    }, formattedCounts);
    setIsAddingSession(false);
    setNewSession({ warehouseId: '', counts: [] });
  };

  const handleCreateAdjustmentFromSession = (sess: InventorySession) => {
    // Collect session items
    const sItems = inventorySessionItems.filter(item => item.sessionId === sess.id);
    
    // For each item, compute discrepancy
    for (const item of sItems) {
      const computedStock = getVariantStock(item.variantId, sess.warehouseId);
      const diff = item.quantityCounted - computedStock;

      if (diff !== 0) {
        // Record movement adjustment
        createMovement({
          tenantId: tenant.id,
          organizationId: 'o1',
          variantId: item.variantId,
          warehouseId: sess.warehouseId,
          type: 'ADJUSTMENT',
          status: 'VALIDATED',
          quantity: diff, // can be positive or negative
          sourceDoc: sess.referenceNumber
        });
      }
    }
    alert("Mouvements d'ajustement créés avec succès pour corriger les écarts de stock !");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase italic">Gestion des Stocks</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
            inventory-core • Solde calculé en temps réel • Invariants stricts
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'movements' && (
            <Button onClick={() => setIsAddingMovement(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs gap-1.5 h-10 px-5 shadow-md">
              <Plus className="h-4 w-4" /> Nouveau Mouvement
            </Button>
          )}
          {activeTab === 'transfers' && (
            <Button onClick={() => setIsAddingTransfer(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs gap-1.5 h-10 px-5 shadow-md">
              <Plus className="h-4 w-4" /> Demander Transfert
            </Button>
          )}
          {activeTab === 'transformations' && (
            <Button onClick={() => setIsAddingTransformation(true)} className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase text-xs gap-1.5 h-10 px-5 shadow-md">
              <Plus className="h-4 w-4" /> Transformation
            </Button>
          )}
          {activeTab === 'sessions' && (
            <Button onClick={() => setIsAddingSession(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-xs gap-1.5 h-10 px-5 shadow-md">
              <Plus className="h-4 w-4" /> Session Comptage
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button onClick={() => setActiveTab('levels')} className={`pb-3 text-xs font-black uppercase tracking-widest ${activeTab === 'levels' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-zinc-400 hover:text-zinc-900'}`}>
          Niveaux de Stocks
        </button>
        <button onClick={() => setActiveTab('movements')} className={`pb-3 text-xs font-black uppercase tracking-widest ${activeTab === 'movements' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-zinc-400 hover:text-zinc-900'}`}>
          Mouvements (Logs)
        </button>
        <button onClick={() => setActiveTab('transfers')} className={`pb-3 text-xs font-black uppercase tracking-widest ${activeTab === 'transfers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-zinc-400 hover:text-zinc-900'}`}>
          Transferts Entrepôts
        </button>
        <button onClick={() => setActiveTab('transformations')} className={`pb-3 text-xs font-black uppercase tracking-widest ${activeTab === 'transformations' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-zinc-400 hover:text-zinc-900'}`}>
          Transformations
        </button>
        <button onClick={() => setActiveTab('sessions')} className={`pb-3 text-xs font-black uppercase tracking-widest ${activeTab === 'sessions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-zinc-400 hover:text-zinc-900'}`}>
          Comptages Physiques
        </button>
      </div>

      {/* TAB 1: STOCK LEVELS */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-100 p-3 rounded-2xl border">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-zinc-500" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-700">Dépôt Actuel :</span>
              <select className="bg-white border rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none" value={currentWarehouseId} onChange={e => setSelectedWarehouseId(e.target.value)}>
                {tenantWarehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                ))}
              </select>
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
              Garantie Invariant: solde = mvts + transf + transferts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stock table */}
            <Card className="md:col-span-2 border-2 border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b text-zinc-500 uppercase text-[9px] font-black tracking-widest">
                      <th className="p-4">SKU / Produit</th>
                      <th className="p-4 text-center">Quantité Calculée</th>
                      <th className="p-4 text-center">Statut Dispo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {variants.filter(v => products.find(p => p.id === v.productId)?.tenantId === tenant.id).map(v => {
                      const stockVal = getVariantStock(v.id, currentWarehouseId);
                      return (
                        <tr key={v.id} className="hover:bg-zinc-50">
                          <td className="p-4">
                            <p className="font-black text-xs uppercase italic text-zinc-900">{getVariantName(v.id)}</p>
                            <p className="text-[9px] text-zinc-400 font-mono mt-0.5">SKU: {v.sku}</p>
                          </td>
                          <td className="p-4 text-center font-black text-sm text-zinc-950">
                            {stockVal} u.
                          </td>
                          <td className="p-4 text-center">
                            {stockVal <= 5 ? (
                              <span className="bg-orange-50 text-orange-600 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-orange-200">Critique</span>
                            ) : (
                              <span className="bg-green-50 text-green-600 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-green-200">Optimal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Warehouse info */}
            <Card className="border-2 border-zinc-200 bg-white">
              <CardHeader className="bg-zinc-50/50 py-3 border-b">
                <CardTitle className="text-xs uppercase italic font-black">Métriques du Dépôt</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs font-bold text-zinc-600">
                <div className="flex justify-between border-b pb-2">
                  <span>Nom:</span>
                  <span className="text-zinc-950 font-black">{getWarehouseName(currentWarehouseId)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Code Site:</span>
                  <span className="text-zinc-950 font-mono">{warehouses.find(w => w.id === currentWarehouseId)?.code}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Type de Site:</span>
                  <span className="bg-blue-100 text-blue-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                    {warehouses.find(w => w.id === currentWarehouseId)?.type}
                  </span>
                </div>
                <div className="bg-zinc-50 border p-3 rounded-xl">
                  <p className="font-black text-[9px] uppercase text-zinc-400 tracking-widest mb-1">Résumé Invariant</p>
                  <p className="text-[10px] text-zinc-500 leading-snug">
                    Le stock disponible affiché à gauche est calculé dynamiquement. Aucun attribut de niveau de stock n&apos;est enregistré de façon autonome dans la base, prévenant ainsi toute désynchronisation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENTS */}
      {activeTab === 'movements' && (
        <Card className="border-2 border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b text-zinc-500 uppercase text-[9px] font-black tracking-widest">
                  <th className="p-4">Réf Mouvement</th>
                  <th className="p-4">Variante (SKU)</th>
                  <th className="p-4">Site / Dépôt</th>
                  <th className="p-4 text-center">Type</th>
                  <th className="p-4 text-center">Quantité</th>
                  <th className="p-4">Doc Source</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {tenantMovements.map(m => {
                  const isDraft = m.status === 'DRAFT';
                  return (
                    <tr key={m.id} className="hover:bg-zinc-50">
                      <td className="p-4 font-mono font-black text-xs text-zinc-900">{m.referenceNumber}</td>
                      <td className="p-4 font-black text-xs uppercase italic text-zinc-800">{getVariantName(m.variantId)}</td>
                      <td className="p-4 text-xs font-bold text-zinc-600">{getWarehouseName(m.warehouseId)}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          m.type === 'INBOUND' ? 'bg-green-50 text-green-700 border-green-200' :
                          m.type === 'OUTBOUND' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="p-4 text-center font-black text-xs text-zinc-950">
                        {m.quantity > 0 && m.type !== 'OUTBOUND' ? `+${m.quantity}` : m.quantity} u.
                      </td>
                      <td className="p-4 text-xs text-zinc-400 font-mono">{m.sourceDoc || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          isDraft ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isDraft ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded"
                                onClick={() => validateMovement(m.id)}
                              >
                                Valider
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-red-500 hover:bg-red-50"
                                onClick={() => deleteMovement(m.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest italic pr-2 select-none">Fait / Immuable</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: WAREHOUSE TRANSFERS */}
      {activeTab === 'transfers' && (
        <Card className="border-2 border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b text-zinc-500 uppercase text-[9px] font-black tracking-widest">
                  <th className="p-4">Réf Transfert</th>
                  <th className="p-4">Variante (SKU)</th>
                  <th className="p-4">Dépôt Source</th>
                  <th className="p-4">Dépôt Cible</th>
                  <th className="p-4 text-center">Quantité</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {tenantTransfers.map(t => {
                  const isRequested = t.status === 'REQUESTED';
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50">
                      <td className="p-4 font-mono font-black text-xs text-zinc-900">{t.referenceNumber}</td>
                      <td className="p-4 font-black text-xs uppercase italic text-zinc-800">{getVariantName(t.variantId)}</td>
                      <td className="p-4 text-xs font-bold text-zinc-600">{getWarehouseName(t.sourceWarehouseId)}</td>
                      <td className="p-4 text-xs font-bold text-zinc-600">{getWarehouseName(t.targetWarehouseId)}</td>
                      <td className="p-4 text-center font-black text-xs text-zinc-950">{t.quantity} u.</td>
                      <td className="p-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          isRequested ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isRequested ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 hover:bg-green-100 rounded"
                                onClick={() => completeTransfer(t.id)}
                              >
                                Compléter
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-red-500 hover:bg-red-50"
                                onClick={() => deleteTransfer(t.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest italic pr-2 select-none">Transféré</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: TRANSFORMATIONS */}
      {activeTab === 'transformations' && (
        <Card className="border-2 border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b text-zinc-500 uppercase text-[9px] font-black tracking-widest">
                  <th className="p-4">Réf Transformation</th>
                  <th className="p-4">Source (Décrémentée)</th>
                  <th className="p-4 text-center">Qté Source</th>
                  <th className="p-4">Cible (Incrémentée)</th>
                  <th className="p-4 text-center">Qté Cible</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {tenantTransformations.map(tf => {
                  const isDraft = tf.status === 'DRAFT';
                  return (
                    <tr key={tf.id} className="hover:bg-zinc-50">
                      <td className="p-4 font-mono font-black text-xs text-zinc-900">{tf.referenceNumber}</td>
                      <td className="p-4 font-black text-xs uppercase italic text-zinc-850">{getVariantName(tf.sourceVariantId)}</td>
                      <td className="p-4 text-center text-red-600 font-black text-xs">-{tf.sourceQuantity} u.</td>
                      <td className="p-4 font-black text-xs uppercase italic text-zinc-850">{getVariantName(tf.targetVariantId)}</td>
                      <td className="p-4 text-center text-green-600 font-black text-xs">+{tf.targetQuantity} u.</td>
                      <td className="p-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          isDraft ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {tf.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isDraft ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded"
                                onClick={() => validateTransformation(tf.id)}
                              >
                                Valider
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-red-500 hover:bg-red-50"
                                onClick={() => deleteTransformation(tf.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest italic pr-2 select-none">Validée</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: PHYSICAL INVENTORY SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {tenantSessions.map(sess => {
            const isDraft = sess.status === 'DRAFT';
            const sItems = inventorySessionItems.filter(item => item.sessionId === sess.id);
            return (
              <Card key={sess.id} className="border-2 border-zinc-200">
                <CardHeader className="bg-zinc-50/50 py-3 border-b flex flex-row justify-between items-center">
                  <div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded mr-2 ${
                      isDraft ? 'bg-zinc-100 text-zinc-500 font-bold' : 'bg-green-100 text-green-800'
                    }`}>
                      {sess.status}
                    </span>
                    <span className="font-mono font-black text-xs text-zinc-900">{sess.referenceNumber}</span>
                    <span className="text-[10px] text-zinc-400 font-bold ml-3">Dépôt: {getWarehouseName(sess.warehouseId)}</span>
                  </div>
                  <div className="flex gap-2">
                    {isDraft ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded"
                          onClick={() => validateInventorySession(sess.id)}
                        >
                          Valider la Session
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => deleteInventorySession(sess.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase text-[9px] tracking-widest gap-1 h-8 shadow"
                        onClick={() => handleCreateAdjustmentFromSession(sess)}
                      >
                        <RefreshCw className="h-3 w-3" /> Créer ajustements
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-100 border-b text-zinc-500 uppercase text-[8px] font-black tracking-widest">
                        <th className="p-3">Produit / Variante</th>
                        <th className="p-3 text-center">Quantité Physique Comptée</th>
                        <th className="p-3 text-center">Stock Théorique (Calculé)</th>
                        <th className="p-3 text-center">Écart de Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {sItems.map(item => {
                        const computedStock = getVariantStock(item.variantId, sess.warehouseId);
                        const diff = item.quantityCounted - computedStock;
                        return (
                          <tr key={item.id}>
                            <td className="p-3 font-bold text-xs text-zinc-800">{getVariantName(item.variantId)}</td>
                            <td className="p-3 text-center font-black text-xs text-zinc-900">{item.quantityCounted} u.</td>
                            <td className="p-3 text-center font-bold text-xs text-zinc-400">{computedStock} u.</td>
                            <td className="p-3 text-center">
                              {diff === 0 ? (
                                <span className="text-green-600 text-xs font-black">Conforme</span>
                              ) : (
                                <span className={`text-xs font-black ${diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {diff > 0 ? `+${diff}` : diff} u.
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}

          {tenantSessions.length === 0 && (
            <div className="p-10 text-center bg-white border border-dashed rounded-3xl">
              <p className="text-zinc-400 font-bold uppercase text-xs">Aucune session d&apos;inventaire enregistrée</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD MOVEMENT */}
      {isAddingMovement && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-zinc-950 p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg uppercase italic text-zinc-900">Enregistrer un mouvement</h3>
              <button onClick={() => setIsAddingMovement(false)} className="h-8 w-8 border rounded-full flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Variante concernée (SKU)</label>
                <select required className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newMvt.variantId} onChange={e => setNewMvt({...newMvt, variantId: e.target.value})}>
                  <option value="">Sélectionner la variante...</option>
                  {variants.filter(v => products.find(p => p.id === v.productId)?.tenantId === tenant.id).map(v => (
                    <option key={v.id} value={v.id}>{getVariantName(v.id)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Dépôt / Site</label>
                <select required className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newMvt.warehouseId} onChange={e => setNewMvt({...newMvt, warehouseId: e.target.value})}>
                  <option value="">Sélectionner le dépôt...</option>
                  {tenantWarehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Type de flux</label>
                  <select className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newMvt.type} onChange={e => setNewMvt({...newMvt, type: e.target.value as any})}>
                    <option value="INBOUND">INBOUND (Entrée)</option>
                    <option value="OUTBOUND">OUTBOUND (Sortie)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (Ajustement)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Statut initial</label>
                  <select className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newMvt.status} onChange={e => setNewMvt({...newMvt, status: e.target.value as any})}>
                    <option value="VALIDATED">VALIDATED (Immédiat)</option>
                    <option value="DRAFT">DRAFT (Brouillon)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Quantité (Strictement Positive)</label>
                <input required type="number" step="1" min="1" className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newMvt.quantity} onChange={e => setNewMvt({...newMvt, quantity: e.target.value})} />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingMovement(false)}>Annuler</Button>
                <Button type="submit" className="bg-blue-600 text-white font-black uppercase tracking-widest">Valider Mouvement</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD TRANSFER */}
      {isAddingTransfer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-zinc-950 p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg uppercase italic text-zinc-900">Demander un transfert</h3>
              <button onClick={() => setIsAddingTransfer(false)} className="h-8 w-8 border rounded-full flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Variante (SKU)</label>
                <select required className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newTrsf.variantId} onChange={e => setNewTrsf({...newTrsf, variantId: e.target.value})}>
                  <option value="">Sélectionner la variante...</option>
                  {variants.filter(v => products.find(p => p.id === v.productId)?.tenantId === tenant.id).map(v => (
                    <option key={v.id} value={v.id}>{getVariantName(v.id)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Dépôt Source</label>
                  <select required className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newTrsf.sourceWarehouseId} onChange={e => setNewTrsf({...newTrsf, sourceWarehouseId: e.target.value})}>
                    <option value="">Source...</option>
                    {tenantWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Dépôt Cible</label>
                  <select required className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newTrsf.targetWarehouseId} onChange={e => setNewTrsf({...newTrsf, targetWarehouseId: e.target.value})}>
                    <option value="">Cible...</option>
                    {tenantWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Quantité (Strictement Positive)</label>
                <input required type="number" min="1" className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newTrsf.quantity} onChange={e => setNewTrsf({...newTrsf, quantity: e.target.value})} />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingTransfer(false)}>Annuler</Button>
                <Button type="submit" className="bg-purple-600 text-white font-black uppercase tracking-widest">Lancer Transfert</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD TRANSFORMATION */}
      {isAddingTransformation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-zinc-950 p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg uppercase italic text-zinc-900">Transformation Produit</h3>
              <button onClick={() => setIsAddingTransformation(false)} className="h-8 w-8 border rounded-full flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleTransformationSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Dépôt / Site</label>
                <select required className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newTransf.warehouseId} onChange={e => setNewTransf({...newTransf, warehouseId: e.target.value})}>
                  <option value="">Sélectionner le dépôt...</option>
                  {tenantWarehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
              <div className="border-t pt-2 space-y-2">
                <h4 className="text-[10px] font-black uppercase text-red-600">Source (Consommé)</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select required className="w-full border rounded-lg h-9 px-2 text-xs font-bold" value={newTransf.sourceVariantId} onChange={e => setNewTransf({...newTransf, sourceVariantId: e.target.value})}>
                      <option value="">Sélectionner...</option>
                      {variants.filter(v => products.find(p => p.id === v.productId)?.tenantId === tenant.id).map(v => (
                        <option key={v.id} value={v.id}>{getVariantName(v.id)}</option>
                      ))}
                    </select>
                  </div>
                  <input required type="number" min="1" className="w-full border rounded-lg h-9 px-2 text-xs font-bold" placeholder="Qté" value={newTransf.sourceQuantity} onChange={e => setNewTransf({...newTransf, sourceQuantity: e.target.value})} />
                </div>
              </div>
              <div className="border-t pt-2 space-y-2">
                <h4 className="text-[10px] font-black uppercase text-green-600">Cible (Produit)</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select required className="w-full border rounded-lg h-9 px-2 text-xs font-bold" value={newTransf.targetVariantId} onChange={e => setNewTransf({...newTransf, targetVariantId: e.target.value})}>
                      <option value="">Sélectionner...</option>
                      {variants.filter(v => products.find(p => p.id === v.productId)?.tenantId === tenant.id).map(v => (
                        <option key={v.id} value={v.id}>{getVariantName(v.id)}</option>
                      ))}
                    </select>
                  </div>
                  <input required type="number" min="1" className="w-full border rounded-lg h-9 px-2 text-xs font-bold" placeholder="Qté" value={newTransf.targetQuantity} onChange={e => setNewTransf({...newTransf, targetQuantity: e.target.value})} />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingTransformation(false)}>Annuler</Button>
                <Button type="submit" className="bg-zinc-900 text-white font-black uppercase tracking-widest">Enregistrer Brouillon</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD PHYSICAL INVENTORY SESSION */}
      {isAddingSession && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-zinc-950 p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg uppercase italic text-zinc-900">Nouvelle Session d&apos;Inventaire</h3>
              <button onClick={() => setIsAddingSession(false)} className="h-8 w-8 border rounded-full flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSessionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Dépôt audité</label>
                <select required className="w-full border-2 rounded-xl h-10 px-3 text-xs font-bold" value={newSession.warehouseId} onChange={e => {
                  const whId = e.target.value;
                  // Initialize counts for all variants of this tenant
                  const tenantVariants = variants.filter(v => products.find(p => p.id === v.productId)?.tenantId === tenant.id);
                  const initialCounts = tenantVariants.map(v => ({
                    variantId: v.id,
                    quantityCounted: getVariantStock(v.id, whId).toString()
                  }));
                  setNewSession({ warehouseId: whId, counts: initialCounts });
                }}>
                  <option value="">Sélectionner le dépôt...</option>
                  {tenantWarehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>

              {newSession.warehouseId && (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Saisir les Quantités Physiques</label>
                  {newSession.counts.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-zinc-700 truncate max-w-[200px]">{getVariantName(c.variantId)}</span>
                      <input 
                        type="number" 
                        min="0" 
                        className="w-20 border rounded-lg h-8 px-2 text-xs font-black text-center" 
                        value={c.quantityCounted} 
                        onChange={e => {
                          const updated = [...newSession.counts];
                          updated[idx].quantityCounted = e.target.value;
                          setNewSession({...newSession, counts: updated});
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingSession(false)}>Annuler</Button>
                <Button type="submit" className="bg-amber-600 text-white font-black uppercase tracking-widest">Enregistrer Brouillon</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
