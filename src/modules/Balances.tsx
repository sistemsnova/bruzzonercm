
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
import { useFirebase } from '../context/FirebaseContext';
import { Client, Supplier, Transaction } from '../types';

type DocumentType = 'RECIBO' | 'ORDEN_PAGO';

export const Balances: React.FC = () => {
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
                    <method.icon