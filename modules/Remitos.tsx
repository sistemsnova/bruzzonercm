
import React, { useState } from 'react';
import { 
  Search, ClipboardList, Filter, MoreHorizontal, 
  Eye, Printer, FileCheck, Truck, X, 
  ChevronRight, Calendar, User, Package,
  CheckSquare, Square, CreditCard, Receipt,
  CheckCircle2, AlertCircle, Wallet, Landmark,
  Edit3, Trash2, Info, Save, Trash, PlusCircle,
  Loader2, 
  FileText,
  Plus 
} from 'lucide-react';
// Fix: Import useFirebase from context/FirebaseContext instead of useMockFirebase from App
import { useFirebase } from '../context/FirebaseContext'; 
import { Product, RemitoItem as RemitoItemType, PaymentDetail } from '../types'; 

interface RemitoItem extends RemitoItemType {} 

interface Remito {
  id: string;
  date: string;
  client: string;
  itemsCount: number;
  itemsList: RemitoItem[];
  total: number;
  status: 'pendiente' | 'entregado' | 'cancelado';
}

export const Remitos: React.FC = () => {
  // Fix: Use useFirebase hook from the proper context
  const { addSale, getProductById, clients } = useFirebase(); 
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [activeRemito, setActiveRemito] = useState<Remito | null>(null);
  
  // Soporte para pagos mixtos en la facturación de remitos
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [newPaymentDetail, setNewPaymentDetail] = useState<Omit<PaymentDetail, 'id'>>({
    method: 'efectivo', amount: 0, notes: ''
  });

  const [docType, setDocType] = useState('invoice');

  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [extraDescription, setExtraDescription] = useState<string>('');

  const [mockRemitos, setMockRemitos] = useState<Remito[]>([
    { 
      id: 'R-0001', 
      date: '2024-05-20', 
      client: 'Juan Perez S.R.L.', 
      itemsCount: 5, 
      itemsList: [
        { id: 'p1', sku: 'MART-001', name: 'Martillo Stanley 20oz', quantity: 2, price: 5500, brand: 'Stanley', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 },
        { id: 'p5', sku: 'CABLE-3X15', name: 'Cable Eléctrico 3x1.5mm', quantity: 3, price: 500, brand: 'Kalop', selectedSaleUnit: 'metro_lineal', originalPrimaryUnit: 'metro_lineal', originalSaleUnit: 'metro_lineal', originalSaleUnitConversionFactor: 1 }
      ],
      total: 12500, 
      status: 'pendiente' 
    },
    { 
      id: 'R-0002', 
      date: '2024-05-21', 
      client: 'Constructora del Centro', 
      itemsCount: 12, 
      itemsList: [
        { id: 'p2', sku: 'TAL-650', name: 'Taladro Bosch GSB 650', quantity: 1, price: 18500, brand: 'Bosch', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 },
        { id: 'p3', sku: 'PINT-BLANCA', name: 'Pintura Látex Blanca 4L', quantity: 10, price: 4200, brand: 'Alba', selectedSaleUnit: 'litro', originalPrimaryUnit: 'litro', originalSaleUnit: 'litro', originalSaleUnitConversionFactor: 1 }
      ],
      total: 85400, 
      status: 'pendiente' 
    },
  ]);

  const [isProcessingBilling, setIsProcessingBilling] = useState(false); 

  // Fixed: Added getStatusStyle helper
  const getStatusStyle = (status: Remito['status']) => {
    switch (status) {
      case 'pendiente': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'entregado': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelado': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const filteredRemitos = mockRemitos.filter(r => {
    const matchesSearch = r.client.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredRemitos.length && filteredRemitos.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRemitos.map(r => r.id));
    }
  };

  const selectedRemitosData = mockRemitos.filter(r => selectedIds.includes(r.id));
  const selectedRemitosTotal = selectedRemitosData.reduce((acc, curr) => acc + curr.total, 0);
  const finalTotal = (activeRemito ? activeRemito.total : selectedRemitosTotal) + extraAmount;
  
  const sumOfCurrentPayments = paymentDetails.reduce((sum, detail) => sum + detail.amount, 0);
  const remainingToAllocate = finalTotal - sumOfCurrentPayments;

  const handleAddPaymentDetail = () => {
    if (newPaymentDetail.amount <= 0) return;
    setPaymentDetails(prev => [...prev, { ...newPaymentDetail, id: Date.now().toString() }]);
    setNewPaymentDetail({ method: 'efectivo', amount: 0, notes: '' }); 
  };

  const handleConfirmInvoice = async () => {
    if (paymentDetails.length === 0) {
      alert("Por favor, agrega al menos un medio de pago.");
      return;
    }
    if (Math.abs(remainingToAllocate) > 0.01) { 
      alert(`Falta asignar $${remainingToAllocate.toLocaleString()}`);
      return;
    }

    setIsProcessingBilling(true);
    try {
      const remitosToInvoice = activeRemito ? [activeRemito] : selectedRemitosData;
      let allItems: any[] = []; 

      for (const remito of remitosToInvoice) {
        for (const item of remito.itemsList) {
          const productInDb = await getProductById(item.id); 
          const existingItemIndex = allItems.findIndex(i => i.id === item.id);
          if (existingItemIndex !== -1) {
            allItems[existingItemIndex].quantity += item.quantity;
          } else {
            allItems.push({ ...item });
          }
        }
      }

      const saleData = {
        client: activeRemito?.client || selectedRemitosData[0]?.client,
        items: allItems,
        total: finalTotal,
        paymentDetails, 
        docType: docType,
        remitoIds: remitosToInvoice.map(r => r.id),
        seller: "Admin PC 01", 
        date: new Date().toISOString(),
      };

      await addSale(saleData);

      setMockRemitos(prev => 
        prev.map(r => remitosToInvoice.some(ri => ri.id === r.id) ? { ...r, status: 'entregado' } : r)
      );

      alert(`¡Facturación completada! Total: $${finalTotal.toLocaleString()}`);
      setSelectedIds([]);
      setShowBillingModal(false);
      setPaymentDetails([]);
      setActiveRemito(null); 
    } finally {
      setIsProcessingBilling(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Remitos</h1>
          <p className="text-slate-500">Administra o factura remitos de entrega.</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar remito o cliente..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-sm">
              {['todos', 'pendiente', 'entregado'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                    filter === f ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <button onClick={toggleAll} className="p-1 rounded hover:bg-slate-200 transition-colors">
                    {selectedIds.length === filteredRemitos.length && filteredRemitos.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Remito N°</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRemitos.map((r) => (
                <tr key={r.id} className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedIds.includes(r.id) ? 'bg-orange-50/50' : ''}`}>
                  <td className="px-6 py-4 text-center" onClick={() => toggleSelection(r.id)}>
                    {selectedIds.includes(r.id) ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5 text-slate-200" />}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">{r.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{r.client}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{r.itemsCount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">${r.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => { setActiveRemito(r); setShowBillingModal(true); }}
                      className="p-2 text-slate-400 hover:text-orange-600" title="Facturar"
                    >
                      <FileCheck className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBillingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Cobro de Remito</h2>
                <p className="text-slate-500 mt-1">Cliente: <span className="font-bold text-orange-600">{activeRemito?.client || selectedRemitosData[0]?.client}</span></p>
              </div>
              <button onClick={() => setShowBillingModal(false)} className="p-3 text-slate-400"><X className="w-7 h-7" /></button>
            </div>

            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalle de Pagos</h3>
                    <span className="font-black text-orange-600">Total: ${finalTotal.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                    {paymentDetails.map(pd => (
                        <div key={pd.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
                            <span className="text-sm font-bold text-slate-700 capitalize">{pd.method.replace('_', ' ')}</span>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-slate-900">${pd.amount.toLocaleString()}</span>
                                <button onClick={() => setPaymentDetails(paymentDetails.filter(p => p.id !== pd.id))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-100 rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            className="px-4 py-2 border rounded-xl font-bold"
                            value={newPaymentDetail.method}
                            onChange={e => setNewPaymentDetail({...newPaymentDetail, method: e.target.value as any})}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta_debito">Débito</option>
                            <option value="tarjeta_credito">Crédito</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="cuenta_corriente">Cuenta Corriente</option>
                        </select>
                        <input 
                            type="number"
                            placeholder="Monto"
                            className="px-4 py-2 border rounded-xl font-bold"
                            value={newPaymentDetail.amount || ''}
                            onChange={e => setNewPaymentDetail({...newPaymentDetail, amount: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                    <button onClick={handleAddPaymentDetail} className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase">+ Agregar Pago</button>
                </div>
              </div>

              <div className="pt-8 border-t flex justify-between items-center">
                <span className="text-xl font-black text-slate-800 uppercase">TOTAL FINAL</span>
                <span className="text-5xl font-black text-orange-600">${finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setShowBillingModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button
                disabled={isProcessingBilling || Math.abs(remainingToAllocate) > 0.01}
                onClick={handleConfirmInvoice}
                className="flex-[1.5] py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                {isProcessingBilling ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                {isProcessingBilling ? 'Procesando...' : 'GENERAR COMPROBANTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
