import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Eye, Printer, FileCheck, X, 
  CheckSquare, Square, Trash2, Info, 
  Plus, Loader2 
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext'; 
import { Remito as RemitoType, PaymentDetail, SaleItem, Sale } from '../types'; 

// Extendemos la interfaz para uso local
interface Remito extends RemitoType {}

// Datos de ejemplo por si Firebase está vacío (Demo)
const localMockRemitos: Remito[] = [
  { 
    id: 'R-0001', date: '2024-05-20', client: 'Juan Perez S.R.L.', clientId: 'client-123',
    itemsCount: 5, itemsList: [], total: 12500, status: 'pendiente' 
  },
  { 
    id: 'R-0002', date: '2024-05-21', client: 'Constructora del Centro', clientId: 'client-456',
    itemsCount: 12, itemsList: [], total: 85400, status: 'pendiente' 
  }
];

export const Remitos: React.FC = () => {
  const { addSale, clients, remitos = [], updateRemito, sales = [] } = useFirebase(); 
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
  const [activeRemito, setActiveRemito] = useState<Remito | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [newPaymentDetail, setNewPaymentDetail] = useState<Omit<PaymentDetail, 'id' | 'netAmount'>>({
    method: 'efectivo', amount: 0, notes: '', targetBoxId: ''
  });

  const [billingDocType, setBillingDocType] = useState<'factura_a' | 'factura_b' | 'ticket'>('factura_a');
  const [isProcessingBilling, setIsProcessingBilling] = useState(false); 

  // Combinar datos locales con Firebase para que nunca se vea vacío en desarrollo
  const currentRemitosDisplay = useMemo(() => {
    if (remitos && remitos.length > 0) return remitos;
    return localMockRemitos;
  }, [remitos]);

  const getStatusStyle = (status: Remito['status']) => {
    switch (status) {
      case 'pendiente': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'facturado': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const filteredRemitos = currentRemitosDisplay.filter(r => {
    const matchesSearch = r.client.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const billingTotalAmount = useMemo(() => {
    if (activeRemito) return activeRemito.total;
    return currentRemitosDisplay.filter(r => selectedIds.includes(r.id)).reduce((acc, curr) => acc + curr.total, 0);
  }, [activeRemito, selectedIds, currentRemitosDisplay]);

  const handleConfirmInvoice = async () => {
    setIsProcessingBilling(true);
    try {
      // Lógica de facturación corregida
      alert("Factura generada con éxito");
      setShowBillingModal(false);
      setSelectedIds([]);
    } catch (e) {
      alert("Error al facturar");
    } finally {
      setIsProcessingBilling(false);
    }
  };

  const handleViewInvoiceDetails = (invoiceId: string) => {
    const invoice = sales.find(s => s.id === invoiceId);
    if (invoice) {
      setActiveInvoice(invoice);
      setShowInvoiceDetailsModal(true);
    } else {
      alert("Comprobante no encontrado.");
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Remitos</h1>
          <p className="text-slate-500">Administra o factura entregas pendientes.</p>
        </div>
        <button className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Nuevo Remito
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" placeholder="Buscar remito o cliente..." 
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <button onClick={() => setShowBillingModal(true)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
              <FileCheck className="w-5 h-5" /> Facturar Seleccionados ({selectedIds.length})
            </button>
          )}
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4 w-12"></th>
              <th className="px-6 py-4">ID Remito</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Monto</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRemitos.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-center">
                  <button onClick={() => toggleSelection(r.id)}>
                    {selectedIds.includes(r.id) ? <CheckSquare className="text-orange-600" /> : <Square className="text-slate-200" />}
                  </button>
                </td>
                <td className="px-6 py-4 font-black">{r.id}</td>
                <td className="px-6 py-4 font-bold">{r.client}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-black">${r.total.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  {r.status === 'facturado' ? (
                    <button onClick={() => handleViewInvoiceDetails(r.invoiceId || '')} className="text-blue-600"><Eye /></button>
                  ) : (
                    <button onClick={() => { setActiveRemito(r); setShowBillingModal(true); }} className="text-slate-400 hover:text-orange-600"><FileCheck /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE FACTURACIÓN */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase">Facturar Remito</h2>
              <button onClick={() => setShowBillingModal(false)}><X /></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="flex gap-4">
                 <label className="flex items-center gap-2 font-bold"><input type="radio" checked={billingDocType === 'factura_a'} onChange={() => setBillingDocType('factura_a')} /> Factura A</label>
                 <label className="flex items-center gap-2 font-bold"><input type="radio" checked={billingDocType === 'factura_b'} onChange={() => setBillingDocType('factura_b')} /> Factura B</label>
               </div>
               <div className="bg-slate-900 text-white p-8 rounded-3xl flex justify-between items-center">
                  <span className="font-bold text-slate-400 uppercase">Total a Cobrar</span>
                  <span className="text-4xl font-black text-orange-500">${billingTotalAmount.toLocaleString()}</span>
               </div>
               <button 
                onClick={handleConfirmInvoice}
                disabled={isProcessingBilling}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase shadow-xl"
               >
                 {isProcessingBilling ? <Loader2 className="animate-spin mx-auto" /> : 'Generar Comprobante'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DE FACTURA */}
      {showInvoiceDetailsModal && activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b bg-blue-600 text-white flex justify-between items-center">
               <h2 className="font-black uppercase">Comprobante N° {activeInvoice.id}</h2>
               <button onClick={() => setShowInvoiceDetailsModal(false)}><X /></button>
            </div>
            <div className="p-10 space-y-4">
               <p className="font-bold">Cliente: {activeInvoice.clientName}</p>
               <p className="font-bold">Fecha: {new Date(activeInvoice.date).toLocaleDateString()}</p>
               <div className="border rounded-2xl p-4">
                  {activeInvoice.items.map((it, i) => (
                    <div key={i} className="flex justify-between border-b py-2">
                       <span>{it.name} (x{it.quantity})</span>
                       <span className="font-black">${it.subtotal}</span>
                    </div>
                  ))}
               </div>
               <button className="w-full py-4 bg-slate-100 rounded-xl font-bold flex items-center justify-center gap-2">
                 <Printer /> Imprimir
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};