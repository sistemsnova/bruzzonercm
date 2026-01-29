import React, { useState, useMemo } from 'react';
import { 
  Users, Truck, Search, Phone, Mail, 
  MessageSquare, ChevronRight, TrendingDown, 
  TrendingUp, ArrowRight, Download, Calendar,
  AlertCircle, CheckCircle2, DollarSign, ExternalLink,
  Receipt, FileText, ArrowLeft, Printer, Share2,
  Plus, CreditCard, Wallet, Landmark, X, Save,
  History, Eye
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Client, Supplier } from '../types';

type DocumentType = 'RECIBO' | 'ORDEN_PAGO';

export const Balances: React.FC = () => {
  const { clients, suppliers, addTransaction, updateClient, updateSupplier, boxes } = useFirebase();
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDocModal, setShowDocModal] = useState<{ show: boolean, type: DocumentType | null }>({ show: false, type: null });
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mockComprobantes = [
    { id: 'FC-0001-4829', date: '2024-05-15', type: 'Factura A', amount: -45000, status: 'Pendiente' },
    { id: 'RE-0001-1203', date: '2024-05-10', type: 'Recibo', amount: 15000, status: 'Aplicado' },
  ];

  const sendWhatsApp = (client: Client) => {
    const message = encodeURIComponent(`Hola ${client.name}, te contactamos de la administración por tu cuenta corriente. Tu saldo deudor es de $${Math.abs(client.balance).toLocaleString()}.`);
    window.open(`https://wa.me/${client.phone || ''}?text=${message}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.cuit.includes(search)) &&
    (c.balance !== 0)
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || s.cuit.includes(search)
  );

  const handleProcessPayment = async () => {
    if (paymentAmount <= 0) return;
    setIsProcessing(true);
    try {
      const targetBox = boxes.find(b => b.status === 'abierta')?.id || 'principal';
      const isRecibo = showDocModal.type === 'RECIBO';
      
      if (isRecibo && selectedClient) {
        await updateClient(selectedClient.id, { balance: selectedClient.balance + paymentAmount });
        await addTransaction({
          amount: paymentAmount, type: 'ingreso', boxId: targetBox, category: 'cobro_cliente',
          description: `Recibo de Cobro: ${selectedClient.name}`, date: new Date().toISOString()
        });
      } else if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, { balance: selectedSupplier.balance + paymentAmount });
        await addTransaction({
          amount: paymentAmount, type: 'egreso', boxId: targetBox, category: 'pago_proveedor',
          description: `Orden de Pago: ${selectedSupplier.name}`, date: new Date().toISOString()
        });
      }
      alert("Operación registrada correctamente");
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
        <div>
          <h1 className="text-2xl font-bold text-slate-800 italic">Balances y Cuentas Corrientes</h1>
          <p className="text-slate-500 text-sm">Control de deuda de clientes y saldos con proveedores.</p>
        </div>
        <div className="flex bg-white border p-1 rounded-2xl shadow-sm">
           <button onClick={() => setActiveTab('clients')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${activeTab === 'clients' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>Clientes</button>
           <button onClick={() => setActiveTab('suppliers')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${activeTab === 'suppliers' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Proveedores</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border flex items-center gap-4 shadow-sm">
           <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl"><TrendingDown /></div>
           <div><p className="text-[10px] font-black uppercase text-slate-400">Deuda de Clientes</p><h3 className="text-2xl font-black">${clients.filter(c=>c.balance<0).reduce((acc,c)=>acc+Math.abs(c.balance),0).toLocaleString()}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border flex items-center gap-4 shadow-sm">
           <div className="p-4 bg-slate-100 text-slate-900 rounded-2xl"><TrendingUp /></div>
           <div><p className="text-[10px] font-black uppercase text-slate-400">Deuda a Proveedores</p><h3 className="text-2xl font-black">${suppliers.reduce((acc,s)=>acc+Math.abs(s.balance),0).toLocaleString()}</h3></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex gap-4">
           <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-xl" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="px-6 py-4">Nombre / CUIT</th>
              <th className="px-6 py-4 text-right">Saldo Actual</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(activeTab === 'clients' ? filteredClients : filteredSuppliers).map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4"><p className="font-bold text-sm">{item.name}</p><p className="text-[10px] font-mono text-slate-400">{item.cuit}</p></td>
                <td className={`px-6 py-4 text-right font-black ${item.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>${item.balance.toLocaleString()}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={() => activeTab === 'clients' ? sendWhatsApp(item) : null} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><MessageSquare className="w-4 h-4" /></button>
                  <button onClick={() => {
                    if(activeTab === 'clients') { setSelectedClient(item); setShowDocModal({show: true, type: 'RECIBO'}); }
                    else { setSelectedSupplier(item); setShowDocModal({show: true, type: 'ORDEN_PAGO'}); }
                  }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><DollarSign className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDocModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className={`p-8 flex justify-between items-center text-white ${showDocModal.type === 'RECIBO' ? 'bg-orange-600' : 'bg-slate-900'}`}>
               <h2 className="text-xl font-black uppercase">{showDocModal.type === 'RECIBO' ? 'Recibo de Cobro' : 'Orden de Pago'}</h2>
               <button onClick={() => setShowDocModal({show: false, type: null})}><X /></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Saldo Pendiente</p>
                  <p className="text-3xl font-black">${(selectedClient?.balance || selectedSupplier?.balance || 0).toLocaleString()}</p>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto a {showDocModal.type === 'RECIBO' ? 'Cobrar' : 'Pagar'}</label>
                  <input type="number" className="w-full p-4 border-2 rounded-2xl text-center text-3xl font-black text-orange-600 outline-none" value={paymentAmount || ''} onChange={e=>setPaymentAmount(parseFloat(e.target.value))}/>
               </div>
               <button onClick={handleProcessPayment} disabled={isProcessing} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">
                  {isProcessing ? 'Procesando...' : 'Confirmar Operación'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};