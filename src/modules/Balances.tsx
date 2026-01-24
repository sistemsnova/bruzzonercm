
import React, { useState } from 'react';
import { 
  Users, Truck, Search, Phone, Mail, 
  MessageSquare, ChevronRight, TrendingDown, 
  TrendingUp, ArrowRight, Download, Calendar,
  AlertCircle, CheckCircle2, DollarSign, ExternalLink,
  Receipt, FileText, ArrowLeft, Printer, Share2,
  Plus, CreditCard, Wallet, Landmark, X, Save,
  History, Eye
} from 'lucide-react';
// Fix: Import useFirebase from context/FirebaseContext instead of useMockFirebase from App
import { useFirebase } from '../context/FirebaseContext';
import { Client, Supplier, Transaction } from '../types';

type DocumentType = 'RECIBO' | 'ORDEN_PAGO';

export const Balances: React.FC = () => {
  // Fix: Use useFirebase hook from the proper context
  const { clients, suppliers, addTransaction, updateClient } = useFirebase();
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDocModal, setShowDocModal] = useState<{ show: boolean, type: DocumentType | null }>({ show: false, type: null });

  const mockComprobantes = [
    { id: 'FC-0001-4829', date: '2024-05-15', type: 'Factura A', amount: -45000, status: 'Pendiente' },
    { id: 'RE-0001-1203', date: '2024-05-10', type: 'Recibo', amount: 15000, status: 'Applied' },
    { id: 'FC-0001-4700', date: '2024-05-05', type: 'Factura B', amount: -15200, status: 'Vencido' },
    { id: 'NC-0001-0052', date: '2024-05-01', type: 'Nota de Crédito', amount: 2500, status: 'Applied' },
  ];

  const sendWhatsApp = (client: Client) => {
    const message = encodeURIComponent(`Hola ${client.name}, te contactamos de FerroGest por tu cuenta corriente. Tu saldo deudor es de $${Math.abs(client.balance).toLocaleString()}. Por favor contáctanos para coordinar el pago. Gracias.`);
    window.open(`https://wa.me/${client.whatsapp}?text=${message}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.cuit.includes(search)) &&
    (activeTab === 'clients' ? c.balance < 0 : true)
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || s.cuit.includes(search)
  );

  const totalClientDebt = clients.filter(c => c.balance < 0).reduce((acc, c) => acc + Math.abs(c.balance), 0);
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + Math.abs(s.balance), 0);

  const handleOpenRecibo = (comp: any) => {
    alert(`Visualizando Comprobante: ${comp.id}`);
  };

  const closeModals = () => {
    setSelectedClient(null);
    setSelectedSupplier(null);
  };

  // UI para Formulario de Recibo / Orden de Pago
  const renderDocumentForm = () => {
    const isRecibo = showDocModal.type === 'RECIBO';
    const target = isRecibo ? selectedClient : selectedSupplier;
    if (!target) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          <div className={`p-8 border-b flex justify-between items-center text-white ${isRecibo ? 'bg-orange-600' : 'bg-slate-900'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{isRecibo ? 'Nuevo Recibo de Cobro' : 'Nueva Orden de Pago'}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{target.name} • {target.cuit}</p>
              </div>
            </div>
            <button onClick={() => setShowDocModal({ show: false, type: null })} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importe del Pago ($)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className={`w-full px-6 py-5 border-2 rounded-2xl focus:ring-2 outline-none font-black text-3xl text-center shadow-inner ${isRecibo ? 'border-orange-100 focus:ring-orange-500 text-orange-600' : 'border-slate-100 focus:ring-slate-500 text-slate-800'}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Movimiento</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-5 py-5 border border-slate-200 rounded-2xl font-bold bg-slate-50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma de {isRecibo ? 'Cobro' : 'Pago'}</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', label: 'Efectivo', icon: Wallet },
                  { id: 'transfer', label: 'Transferencia', icon: Landmark },
                  { id: 'check', label: 'Cheque', icon: FileText },
                ].map(method => (
                  <button key={method.id} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:border-orange-500 hover:bg-orange-50 transition-all group">
                    <method.icon className="w-5 h-5 text-slate-400 group-hover:text-orange-600" />
                    <span className="text-[10px] font-black uppercase text-slate-600">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t flex gap-4">
            <button onClick={() => setShowDocModal({ show: false, type: null })} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={() => { alert('Operación confirmada'); setShowDocModal({ show: false, type: null }); }} className={`flex-[1.5] py-4 text-white rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest transition-all ${isRecibo ? 'bg-orange-600 hover:bg-orange-50' : 'bg-slate-900 hover:bg-slate-800'}`}>Confirmar Operación <Save className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedClient || selectedSupplier) {
    const isClient = !!selectedClient;
    const item = isClient ? selectedClient : selectedSupplier;

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        {showDocModal.show && renderDocumentForm()}
        
        <header className="flex justify-between items-center">
          <button onClick={closeModals} className="flex items-center gap-2 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition-all"><ArrowLeft className="w-5 h-5" /> Volver al Listado</button>
          <div className="flex gap-2">
            <button onClick={() => setShowDocModal({ show: true, type: isClient ? 'RECIBO' : 'ORDEN_PAGO' })} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all ${isClient ? 'bg-orange-600 text-white' : 'bg-slate-900 text-white'}`}><Plus className="w-4 h-4" /> {isClient ? 'Emitir Recibo' : 'Nueva Orden de Pago'}</button>
          </div>
        </header>

        <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl ${isClient ? 'bg-slate-900' : 'bg-slate-800'}`}>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-3xl font-black ${isClient ? 'bg-orange-600' : 'bg-blue-600'}`}>{item.name.charAt(0)}</div>
              <div><h2 className="text-3xl font-black tracking-tight">{item.name}</h2><p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{item.cuit}</p></div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">{isClient ? 'Saldo Total Deudor' : 'Saldo Total Acreedor'}</p>
              <h3 className="text-5xl font-black text-white">${Math.abs(item.balance).toLocaleString()}</h3>
            </div>
          </div>
          <DollarSign className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><History className={`w-5 h-5 ${isClient ? 'text-orange-600' : 'text-blue-600'}`} /> Historial de Movimientos</h4>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr><th className="px-8 py-5">Fecha</th><th className="px-8 py-5">Tipo / N°</th><th className="px-8 py-5 text-right">Importe</th><th className="px-8 py-5 text-center">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockComprobantes.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">{new Date(comp.date).toLocaleDateString()}</td>
                  <td className="px-8 py-6"><p className="font-black text-slate-800 text-sm tracking-tight">{comp.id}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{comp.type}</p></td>
                  <td className="px-8 py-6 text-right"><span className={`text-lg font-black ${comp.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>${Math.abs(comp.amount).toLocaleString()}</span></td>
                  <td className="px-8 py-6 text-center"><button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"><Eye className="w-4 h-4" /> Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Saldos y Cuentas</h1><p className="text-slate-500">Control de deudores y acreedores.</p></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6"><div className="p-4 bg-orange-100 text-orange-600 rounded-2xl"><TrendingDown className="w-8 h-8" /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deuda de Clientes</p><h3 className="text-3xl font-black text-slate-800">${totalClientDebt.toLocaleString()}</h3></div></div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6"><div className="p-4 bg-red-100 text-red-600 rounded-2xl"><TrendingUp className="w-8 h-8" /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deuda a Proveedores</p><h3 className="text-3xl font-black text-slate-800">${totalSupplierDebt.toLocaleString()}</h3></div></div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white flex items-center gap-6"><div className="p-4 bg-white/10 rounded-2xl"><DollarSign className="w-8 h-8 text-orange-500" /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Neto</p><h3 className="text-3xl font-black text-orange-500">${(totalClientDebt - totalSupplierDebt).toLocaleString()}</h3></div></div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('clients')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'clients' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}><Users className="w-5 h-5" /> Deudores</button>
        <button onClick={() => setActiveTab('suppliers')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'suppliers' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}><Truck className="w-5 h-5" /> Acreedores</button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder={`Buscar...`} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl outline-none" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr><th className="px-8 py-5">Nombre / CUIT</th><th className="px-8 py-5 text-right">Saldo</th><th className="px-8 py-5 text-center">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'clients' ? filteredClients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedClient(c)}>
                <td className="px-8 py-6"><div><p className="font-bold text-slate-800 text-sm">{c.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.cuit}</p></div></td>
                <td className="px-8 py-6 text-right"><span className={`text-lg font-black ${c.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>${Math.abs(c.balance).toLocaleString()}</span></td>
                <td className="px-8 py-6"><div className="flex items-center justify-center gap-3"><button onClick={(e) => { e.stopPropagation(); sendWhatsApp(c); }} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-200 text-[10px] font-black uppercase"><MessageSquare className="w-4 h-4" /> WhatsApp</button><ChevronRight className="w-5 h-5 text-slate-300" /></div></td>
              </tr>
            )) : filteredSuppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedSupplier(s)}>
                <td className="px-8 py-6"><div><p className="font-bold text-slate-800 text-sm">{s.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.cuit}</p></div></td>
                <td className="px-8 py-6 text-right"><span className={`text-lg font-black ${s.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>${Math.abs(s.balance).toLocaleString()}</span></td>
                <td className="px-8 py-6 text-center"><ChevronRight className="w-5 h-5 text-slate-300 mx-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Balances;
