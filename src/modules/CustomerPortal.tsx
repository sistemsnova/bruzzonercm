
import React, { useState, useMemo } from 'react';
import { 
  LogOut, Wallet, ShoppingBag, History, FileText, 
  ChevronRight, CreditCard, Banknote, ShieldCheck,
  Star, Gift, Info, Smartphone, Receipt, CheckCircle2,
  Clock, Download, ExternalLink, X, Loader2
} from 'lucide-react';
import { Client, Sale } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { CompanyInfo } from '../App';

interface CustomerPortalProps {
  client: Client;
  onLogout: () => void;
  companyInfo: CompanyInfo;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ client, onLogout, companyInfo }) => {
  const { sales } = useFirebase();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'payments'>('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrar ventas del cliente
  const clientSales = useMemo(() => {
    return sales.filter(s => s.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, client.id]);

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      alert('¡Gracias! El aviso de pago ha sido enviado. Un asesor lo validará a la brevedad.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-xl text-white rotate-2">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Sistems Nova</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal de Clientes</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs"
        >
          <LogOut className="w-4 h-4" /> <span className="hidden md:inline uppercase tracking-widest">Salir</span>
        </button>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 pb-32">
        {/* Welcome Card */}
        <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-2">
            <p className="text-orange-500 font-black uppercase text-[10px] tracking-widest">Bienvenido de nuevo</p>
            <h2 className="text-3xl font-black">{client.name}</h2>
            <p className="text-slate-400 text-sm font-medium">{client.cuit}</p>
          </div>
          <div className="mt-8 flex gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Puntos Club</p>
               <div className="flex items-center gap-2 text-orange-500">
                  <Star className="w-5 h-5 fill-orange-500" />
                  <span className="text-2xl font-black">{client.accumulatedPoints || 0}</span>
               </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm flex-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lista de Precios</p>
               <span className="text-sm font-bold text-slate-200">Preferencial Gremio</span>
            </div>
          </div>
          <Smartphone className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </section>

        {/* Tab Navigation */}
        <nav className="flex bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 gap-2">
           {[
             { id: 'overview', label: 'Resumen', icon: Wallet },
             { id: 'history', label: 'Mis Compras', icon: History },
             { id: 'payments', label: 'Informar Pago', icon: Banknote },
           ].map(tab => (
             <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-[1.5rem] transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
             >
               <tab.icon className="w-5 h-5" />
               <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
             </button>
           ))}
        </nav>

        {/* Content Tabs */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo a Pagar</p>
                    <h3 className={`text-5xl font-black ${client.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.abs(client.balance).toLocaleString()}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {client.balance < 0 ? 'Tienes facturas pendientes de pago.' : 'Tu cuenta está al día o tienes saldo a favor.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <CreditCard className="w-5 h-5 text-orange-500" /> Pagar Saldo Ahora
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-center gap-5">
                    <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm"><CheckCircle2 className="w-8 h-8" /></div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-tight">Última Compra</p>
                      <h3 className="text-lg font-black text-blue-900">{clientSales[0]?.date ? new Date(clientSales[0].date).toLocaleDateString() : 'N/A'}</h3>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 flex items-center gap-5">
                    <div className="p-4 bg-white rounded-2xl text-green-600 shadow-sm"><Star className="w-8 h-8" /></div>
                    <div>
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-tight">Beneficio Club</p>
                      <h3 className="text-lg font-black text-green-900">5% OFF Próxima Compra</h3>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
               {clientSales.length === 0 ? (
                 <div className="bg-white p-20 rounded-[3rem] text-center space-y-4">
                    <History className="w-12 h-12 text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sin historial de compras</p>
                 </div>
               ) : (
                 clientSales.map(sale => (
                   <div key={sale.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm tracking-tight">{sale.docType.replace('_', ' ').toUpperCase()} N° {sale.id.slice(-6)}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(sale.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full md:w-auto gap-10">
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-900">${sale.total.toLocaleString()}</p>
                          <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Pagado</span>
                        </div>
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-left duration-500">
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Informar un Pago</h3>
                 <p className="text-slate-500 text-sm">¿Ya realizaste una transferencia? Adjunta el comprobante aquí para que actualizamos tu saldo.</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Pagado</label>
                    <input type="number" placeholder="0.00" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-2xl font-black outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  
                  <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center group hover:border-orange-200 hover:bg-orange-50/20 transition-all cursor-pointer">
                    <Smartphone className="w-12 h-12 text-slate-200 mb-4 group-hover:text-orange-500" />
                    <p className="font-bold text-slate-400 group-hover:text-orange-600">Subir foto del comprobante</p>
                    <p className="text-[10px] text-slate-300 uppercase font-black mt-1">Formatos: JPG, PNG, PDF</p>
                  </div>

                  <button 
                    onClick={handleSimulatePayment}
                    className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3"
                  >
                    Enviar Notificación
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Payment Info Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-600 text-white">
                <h3 className="text-xl font-black uppercase tracking-tight">Datos para Pago</h3>
                <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-10 space-y-8">
                <section className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alias CBU</p>
                      <p className="text-lg font-black text-slate-900">FERROGEST.PRO.PAGOS</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco / Billetera</p>
                      <p className="text-lg font-black text-slate-900">Banco Galicia / Mercado Pago</p>
                   </div>
                </section>
                
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Una vez realizada la transferencia, puedes informar el pago en la pestaña <b>"Informar Pago"</b> para una acreditación rápida.
                  </p>
                </div>

                <button 
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-orange-500" />}
                  Ya realicé la transferencia
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Direct Contact) */}
      <a 
        href={`https://wa.me/${client.whatsapp}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 p-5 bg-green-500 text-white rounded-full shadow-2xl shadow-green-500/40 animate-bounce transition-all hover:scale-110 z-50"
      >
        <Smartphone className="w-8 h-8" />
      </a>
    </div>
  );
};

export default CustomerPortal;
