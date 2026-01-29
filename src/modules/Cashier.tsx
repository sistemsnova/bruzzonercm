
import React, { useState, useMemo } from 'react';
import { 
  Wallet, ArrowRightLeft, History, Landmark, CreditCard, 
  Plus, MoreVertical, TrendingUp, TrendingDown, X, CheckCircle2,
  Banknote, ArrowDownCircle, ArrowUpCircle, Search, Filter,
  Calculator, AlertTriangle, Loader2, Save, Printer, Eye,
  Lock, Unlock, ShieldCheck, DollarSign,
  Users, ChevronRight, Info, ArrowUpRight, Edit3, Trash2,
  FileText, Receipt, PieChart, ChevronDown
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Transaction, PaymentDetail, Box } from '../types';

interface CashMovement {
  id: string;
  date: string;
  boxId: string;
  type: 'ingreso' | 'egreso' | 'transferencia';
  amount: number;
  method: string;
  category: string;
  description: string;
  user: string;
  isFixed?: boolean;
}

export const Cashier: React.FC = () => {
  const { transactions, boxes, addBox, updateBox, deleteBox, addTransaction } = useFirebase();
  const [activeTab, setActiveTab] = useState<'boxes' | 'history' | 'reports'>('boxes');
  const [showMovementModal, setShowMovementModal] = useState<{show: boolean, type: 'ingreso' | 'egreso' | 'transferencia' | null}>({ show: false, type: null });
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [isSavingBox, setIsSavingBox] = useState(false);

  const totalConsolidated = useMemo(() => boxes.reduce((acc, box) => acc + box.balance, 0), [boxes]);
  const cashInHand = useMemo(() => boxes.filter(b => b.type === 'efectivo').reduce((acc, b) => acc + b.balance, 0), [boxes]);

  const handleRegisterMovement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const boxId = formData.get('boxId') as string;
    const type = showMovementModal.type!;
    const targetBox = boxes.find(b => b.id === boxId);

    if (!targetBox) {
        alert("Debes seleccionar una caja de origen.");
        return;
    }

    try {
      await addTransaction({
        date: new Date().toISOString(),
        amount: amount,
        type: type,
        boxId: boxId,
        category: formData.get('category') as any,
        description: formData.get('description') as string,
        paymentDetails: [{ id: `pm-${Date.now()}`, method: formData.get('method') as any, amount: amount, netAmount: amount, targetBoxId: boxId }]
      });

      // Update actual box balance
      const newBalance = type === 'egreso' ? targetBox.balance - amount : targetBox.balance + amount;
      await updateBox(boxId, { balance: newBalance });

      setShowMovementModal({ show: false, type: null });
      alert('Movimiento registrado y saldo actualizado.');
    } catch (err) {
      alert('Error al registrar movimiento.');
    }
  };

  const handleSaveBox = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingBox(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const type = formData.get('type') as Box['type'];
    const responsible = formData.get('responsible') as string;
    const initialBalance = parseFloat(formData.get('balance') as string) || 0;

    try {
      if (editingBox) {
        await updateBox(editingBox.id, { name, type, responsible });
      } else {
        await addBox({
          name,
          type,
          responsible,
          balance: initialBalance,
          status: 'abierta'
        });
      }
      setShowBoxModal(false);
      setEditingBox(null);
    } finally {
      setIsSavingBox(false);
    }
  };

  const handleDeleteBoxLocal = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este fondo? Esta acción es irreversible.')) {
      await deleteBox(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tesorería y Pagos</h1>
          <p className="text-slate-500 text-sm font-medium">Registra sueldos, impuestos y gestiona tus fondos.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowMovementModal({show: true, type: 'egreso'})}
            className="flex items-center gap-3 bg-red-600 text-white px-8 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
          >
            <ArrowUpCircle className="w-5 h-5" /> Registrar Gasto / Pago
          </button>
          <button 
            onClick={() => setShowMovementModal({show: true, type: 'ingreso'})}
            className="flex items-center gap-3 bg-green-600 text-white px-8 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95"
          >
            <ArrowDownCircle className="w-5 h-5" /> Ingreso Manual
          </button>
          <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
            <button 
              onClick={() => setActiveTab('boxes')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'boxes' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Fondos
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Historial
            </button>
          </div>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Total Consolidado</p>
            <h3 className="text-3xl font-black">${totalConsolidated.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
               <ShieldCheck className="w-4 h-4 text-green-500" />
               Auditoría en tiempo real
            </div>
          </div>
          <DollarSign className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
           <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><Banknote className="w-8 h-8" /></div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Efectivo en Mano</p>
             <h3 className="text-2xl font-black text-slate-800">${cashInHand.toLocaleString()}</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
           <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Landmark className="w-8 h-8" /></div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Saldos Bancarios</p>
             <h3 className="text-2xl font-black text-slate-800">${boxes.filter(b => b.type === 'banco').reduce((acc,b) => acc + b.balance, 0).toLocaleString()}</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
           <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><CreditCard className="w-8 h-8" /></div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Cuentas Digitales</p>
             <h3 className="text-2xl font-black text-slate-800">${boxes.filter(b => b.type === 'virtual').reduce((acc,b) => acc + b.balance, 0).toLocaleString()}</h3>
           </div>
        </div>
      </div>

      {activeTab === 'boxes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {boxes.map(box => (
                <div key={box.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${box.status === 'abierta' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                      {box.type === 'banco' ? <Landmark className="w-6 h-6" /> : box.type === 'virtual' ? <CreditCard className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                    </div>
                    <div className="flex items-center gap-1">
                       <button 
                        onClick={() => { setEditingBox(box); setShowBoxModal(true); }}
                        className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                       >
                         <Edit3 className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleDeleteBoxLocal(box.id)}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 mb-1">{box.name}</h3>
                  <p className="text-3xl font-black text-slate-900 mb-6">${box.balance.toLocaleString()}</p>
                  
                  {box.status === 'abierta' && (
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>Resp: <span className="text-slate-800">{box.responsible || 'Sistema'}</span></span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {setSelectedBox(box); setShowCloseModal(true);}}
                          className="py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          <Calculator className="w-4 h-4 text-orange-500" /> Arqueo y Cierre
                        </button>
                        <button 
                          onClick={() => setShowMovementModal({show: true, type: 'transferencia'})}
                          className="py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                          <ArrowRightLeft className="w-4 h-4" /> Transferir
                        </button>
                      </div>
                    </div>
                  )}

                  {box.status === 'cerrada' && (
                    <div className="pt-6 border-t border-slate-50 flex flex-col gap-2">
                       <p className="text-[10px] text-slate-400 font-bold uppercase text-center italic">Cerrada el {box.lastClosed}</p>
                       <button 
                        onClick={() => updateBox(box.id, { status: 'abierta' })}
                        className="w-full py-4 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
                       >
                         <Plus className="w-4 h-4 inline mr-2" /> Apertura de Caja
                       </button>
                    </div>
                  )}
                </div>
              ))}

              <button 
                onClick={() => { setEditingBox(null); setShowBoxModal(true); }}
                className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-300 hover:border-orange-200 hover:bg-orange-50/20 transition-all group"
              >
                <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white mb-4"><Plus className="w-8 h-8" /></div>
                <span className="font-black uppercase text-xs tracking-[0.2em]">Nuevo Fondo / Cuenta</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" /> Control de Gastos
              </h4>
              <p className="text-slate-400 text-xs font-medium px-2">Usa los botones superiores para registrar pagos de sueldos, impuestos y servicios de forma rápida.</p>
              <div className="p-4 bg-slate-50 rounded-3xl flex items-center gap-4">
                 <div className="p-3 bg-white rounded-2xl text-orange-600 shadow-sm"><Info className="w-5 h-5" /></div>
                 <div>
                   <p className="text-[10px] font-black text-slate-900 uppercase">Sueldos de Personal</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase">Se liquidan desde "Personal"</p>
                 </div>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
           <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1 w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Buscar por descripción, caja o usuario..." 
                 className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
               />
             </div>
             <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-white shadow-sm bg-white transition-all">
                <Filter className="w-4 h-4" /> Filtros
             </button>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                 <tr>
                   <th className="px-8 py-5">Fecha / Hora</th>
                   <th className="px-8 py-5">Caja</th>
                   <th className="px-8 py-5">Concepto</th>
                   <th className="px-8 py-5 text-right">Importe</th>
                   <th className="px-8 py-5 text-center">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {transactions.slice(0, 20).map(t => (
                   <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-5">
                       <p className="font-bold text-slate-800 text-sm">{new Date(t.date).toLocaleDateString()}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleTimeString()}</p>
                     </td>
                     <td className="px-8 py-5">
                       <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                         {boxes.find(b => b.id === t.boxId)?.name || 'Mostrador'}
                       </span>
                     </td>
                     <td className="px-8 py-5">
                       <p className="font-bold text-slate-800 text-sm">{t.category || 'Varios'}</p>
                       <p className="text-[10px] text-slate-400 font-medium">{t.description}</p>
                     </td>
                     <td className="px-8 py-5 text-right">
                       <span className={`text-lg font-black ${t.type === 'egreso' ? 'text-red-600' : 'text-green-600'}`}>
                         {t.type === 'egreso' ? '-' : '+'}${t.amount.toLocaleString()}
                       </span>
                     </td>
                     <td className="px-8 py-5 text-center">
                        <button className="p-2 text-slate-300 hover:text-orange-600"><Eye className="w-5 h-5" /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Modal: Nuevo Movimiento */}
      {showMovementModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className={`p-8 border-b flex justify-between items-center text-white ${showMovementModal.type === 'ingreso' ? 'bg-green-600' : showMovementModal.type === 'egreso' ? 'bg-red-600' : 'bg-blue-600'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                   <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Registrar {showMovementModal.type}</h2>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">Gestión manual de fondos</p>
                </div>
              </div>
              <button onClick={() => setShowMovementModal({show: false, type: null})} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterMovement} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Caja / Fondo</label>
                <div className="relative">
                  <select 
                    name="boxId" 
                    className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    required
                  >
                    <option value="">Elegir caja...</option>
                    {boxes.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} (${b.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 italic ml-1">El dinero se {showMovementModal.type === 'egreso' ? 'restará' : 'sumará'} de la caja elegida.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                  <select name="category" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold bg-slate-50 outline-none">
                    <option value="gasto">Gasto General</option>
                    <option value="sueldo">Sueldo / Adelanto</option>
                    <option value="impuesto">Impuestos / Tasas</option>
                    <option value="venta">Venta / Cobranza</option>
                    <option value="ajuste">Ajuste de Saldo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importe ($)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-black text-xl outline-none" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                <textarea name="description" required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium text-sm outline-none h-24 resize-none" placeholder="Ej: Pago de Luz local central..."></textarea>
              </div>

              <div className="p-8 bg-slate-50 border-t flex gap-4 -mx-8 -mb-8">
                <button type="button" onClick={() => setShowMovementModal({show: false, type: null})} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className={`flex-1 py-4 text-white rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest transition-all ${showMovementModal.type === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear/Editar Caja */}
      {showBoxModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">{editingBox ? 'Editar Fondo' : 'Nueva Caja / Fondo'}</h2>
              <button onClick={() => setShowBoxModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveBox} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Descriptivo</label>
                <input name="name" defaultValue={editingBox?.name} required className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold" placeholder="Ej: Caja Principal, Cuenta Galicia..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Fondo</label>
                  <select name="type" defaultValue={editingBox?.type} className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold bg-white">
                    <option value="efectivo">Efectivo Físico</option>
                    <option value="banco">Cuenta Bancaria</option>
                    <option value="virtual">Billetera Virtual (MP, etc)</option>
                    {/* NEW: Caja a Depositar */}
                    <option value="caja_a_depositar">Caja a Depositar</option>
                  </select>
                </div>
                {!editingBox && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Inicial ($)</label>
                    <input name="balance" type="number" step="0.01" className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold" placeholder="0.00" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsable</label>
                <input name="responsible" defaultValue={editingBox?.responsible} className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold" />
              </div>
              <button type="submit" disabled={isSavingBox} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-orange-500 disabled:opacity-50">
                {isSavingBox ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (editingBox ? 'Guardar Cambios' : 'Crear Fondo')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};