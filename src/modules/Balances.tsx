import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, TrendingDown, TrendingUp, DollarSign, X } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Client, Supplier } from '../types';

type DocumentType = 'RECIBO' | 'ORDEN_PAGO';

export const Balances: React.FC = () => {
  const { clients = [], suppliers = [], addTransaction, updateClient, updateSupplier, boxes = [] } = useFirebase() || {};

  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDocModal, setShowDocModal] = useState<{ show: boolean, type: DocumentType | null }>({ show: false, type: null });
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendWhatsApp = (client: Client) => {
    if (!client.phone) return;
    const message = encodeURIComponent(`Hola ${client.name}, saldo deudor: $${Math.abs(client.balance).toLocaleString()}.`);
    window.open(`https://wa.me/${client.phone}?text=${message}`, '_blank');
  };

  const filteredClients = useMemo(() => 
    clients.filter(c => c && c.balance !== 0 && (c.name?.toLowerCase().includes(search.toLowerCase()) || c.cuit?.includes(search))), 
    [clients, search]);

  const filteredSuppliers = useMemo(() => 
    suppliers.filter(s => s && (s.name?.toLowerCase().includes(search.toLowerCase()) || s.cuit?.includes(search))), 
    [suppliers, search]);

  const handleProcessPayment = async () => {
    if (paymentAmount <= 0) return;
    setIsProcessing(true);
    try {
      const openBox = boxes.find(b => b.status === 'abierta');
      const targetBoxId = openBox?.id || 'principal';
      const isRecibo = showDocModal.type === 'RECIBO';
      
      if (isRecibo && selectedClient) {
        await updateClient(selectedClient.id, { balance: Number(selectedClient.balance) + Number(paymentAmount) });
        await addTransaction({
          amount: Number(paymentAmount),
          type: 'ingreso',
          boxId: targetBoxId,
          category: 'venta', // Corregido: 'venta' es la categoría permitida en types.ts
          description: `Recibo: ${selectedClient.name}`,
          date: new Date().toISOString(),
          paymentDetails: []
        });
      } else if (!isRecibo && selectedSupplier) {
        await updateSupplier(selectedSupplier.id, { balance: Number(selectedSupplier.balance) + Number(paymentAmount) });
        await addTransaction({
          amount: Number(paymentAmount),
          type: 'egreso',
          boxId: targetBoxId,
          category: 'gasto', // Corregido: 'gasto' es la categoría permitida en types.ts
          description: `Pago: ${selectedSupplier.name}`,
          date: new Date().toISOString(),
          paymentDetails: []
        });
      }
      setShowDocModal({ show: false, type: null });
      setPaymentAmount(0);
    } catch (e) {
      alert("Error al procesar");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 italic">Saldos y Cuentas Corrientes</h1>
        <div className="flex bg-white border p-1 rounded-2xl">
           <button onClick={() => setActiveTab('clients')} className={`px-6 py-2 rounded-xl text-xs font-bold ${activeTab === 'clients' ? 'bg-orange-600 text-white' : ''}`}>Clientes</button>
           <button onClick={() => setActiveTab('suppliers')} className={`px-6 py-2 rounded-xl text-xs font-bold ${activeTab === 'suppliers' ? 'bg-slate-900 text-white' : ''}`}>Proveedores</button>
        </div>
      </header>
      <div className="bg-white rounded-[2rem] border overflow-hidden">
        <div className="p-4 bg-slate-50 border-b">
           <input type="text" placeholder="Buscar..." className="w-full max-w-md p-2 border rounded-xl" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase border-b">
            <tr><th>Nombre</th><th className="text-right">Saldo</th><th className="text-center">Acciones</th></tr>
          </thead>
          <tbody className="divide-y">
            {(activeTab === 'clients' ? filteredClients : filteredSuppliers).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold">{item.name}</td>
                <td className={`px-6 py-4 text-right font-black ${item.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>${item.balance.toLocaleString()}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={() => activeTab === 'clients' && sendWhatsApp(item as Client)} className="p-2 text-green-600"><MessageSquare className="w-4 h-4" /></button>
                  <button onClick={() => {
                    if(activeTab === 'clients') { setSelectedClient(item as Client); setShowDocModal({show: true, type: 'RECIBO'}); }
                    else { setSelectedSupplier(item as Supplier); setShowDocModal({show: true, type: 'ORDEN_PAGO'}); }
                  }} className="p-2 text-blue-600"><DollarSign className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showDocModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 z-[110] flex items-center justify-center">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md">
            <h2 className="text-xl font-black mb-6 uppercase">{showDocModal.type}</h2>
            <input type="number" className="w-full p-4 border-2 rounded-2xl text-center text-2xl font-black mb-4" value={paymentAmount || ''} onChange={e=>setPaymentAmount(parseFloat(e.target.value) || 0)}/>
            <button onClick={handleProcessPayment} disabled={isProcessing} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">{isProcessing ? 'Procesando...' : 'Confirmar'}</button>
            <button onClick={()=>setShowDocModal({show:false, type:null})} className="w-full mt-4 text-slate-400 text-xs font-bold">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};