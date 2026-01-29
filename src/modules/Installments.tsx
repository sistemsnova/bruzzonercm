import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard, Plus, Search, User, Calendar, DollarSign,
  Info, Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Edit3, Trash2, X, Receipt, History, Landmark, Save,
  Ban, TrendingUp, Scale, Settings
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Client, InstallmentPlan, InstallmentPayment } from '../types';

// Definiciones internas para evitar errores de importación de constants.ts
type InstallmentStatus = 'activo' | 'pagado' | 'mora' | 'cancelado';

const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  'activo': 'Activo',
  'pagado': 'Pagado',
  'mora': 'En Mora',
  'cancelado': 'Cancelado',
};

const INSTALLMENT_STATUS_COLORS: Record<InstallmentStatus, string> = {
  'activo': 'bg-blue-50 text-blue-700 border-blue-100',
  'pagado': 'bg-green-50 text-green-700 border-green-100',
  'mora': 'bg-red-50 text-red-700 border-red-100',
  'cancelado': 'bg-slate-50 text-slate-500 border-slate-100',
};

export const Installments: React.FC = () => {
  const { clients, installmentPlans, addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan, addTransaction, boxes } = useFirebase();

  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InstallmentStatus | 'all'>('all');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activePlan, setActivePlan] = useState<InstallmentPlan | null>(null);
  const [planFormData, setPlanFormData] = useState<Partial<InstallmentPlan>>({
    clientId: '', clientName: '', totalAmount: 0, downPayment: 0,
    installmentsCount: 1, amountPerInstallment: 0, remainingAmount: 0,
    payments: [], status: 'activo', startDate: new Date().toISOString().split('T')[0],
    nextDueDate: '', description: '',
  });
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const [showRegisterPaymentModal, setShowRegisterPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ amountPaid: 0, method: 'efectivo', notes: '' });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Cálculo automático de cuotas
  useEffect(() => {
    const totalToFinance = (planFormData.totalAmount || 0) - (planFormData.downPayment || 0);
    const count = planFormData.installmentsCount || 1;
    const perInstallment = parseFloat((totalToFinance / count).toFixed(2));

    setPlanFormData(prev => ({
      ...prev,
      amountPerInstallment: perInstallment,
      remainingAmount: activePlan ? activePlan.remainingAmount : parseFloat(totalToFinance.toFixed(2)),
    }));
  }, [planFormData.totalAmount, planFormData.downPayment, planFormData.installmentsCount, activePlan]);

  // Selección de cliente
  useEffect(() => {
    if (planFormData.clientId) {
      const client = clients.find(c => c.id === planFormData.clientId);
      if (client) setPlanFormData(prev => ({ ...prev, clientName: client.name }));
    }
  }, [planFormData.clientId, clients]);

  const openPlanForm = (plan: InstallmentPlan | null) => {
    if (plan) {
      setActivePlan(plan);
      setPlanFormData(plan);
    } else {
      setActivePlan(null);
      setPlanFormData({
        clientId: '', clientName: '', totalAmount: 0, downPayment: 0,
        installmentsCount: 1, status: 'activo', description: '',
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planFormData.clientId || !planFormData.totalAmount) {
      alert('Datos incompletos');
      return;
    }
    setIsSavingPlan(true);
    try {
      const data = { ...planFormData } as Omit<InstallmentPlan, 'id'>;
      if (activePlan) await updateInstallmentPlan(activePlan.id, data);
      else await addInstallmentPlan(data);
      setShowPlanModal(false);
    } catch (e) { console.error(e); }
    finally { setIsSavingPlan(false); }
  };

  const handleRegisterPayment = async () => {
    if (!activePlan || paymentData.amountPaid <= 0) return;
    setIsProcessingPayment(true);
    try {
      const newRemaining = activePlan.remainingAmount - paymentData.amountPaid;
      const pdId = `pay-${Date.now()}`;
      
      // Buscar una caja abierta para el ingreso
      const targetBox = boxes.find(b => b.status === 'abierta')?.id || 'principal';

      const newPayment: InstallmentPayment = {
        id: pdId,
        date: new Date().toISOString(),
        amountPaid: paymentData.amountPaid,
        method: paymentData.method,
        notes: paymentData.notes,
      };

      await updateInstallmentPlan(activePlan.id, {
        remainingAmount: newRemaining,
        payments: [...activePlan.payments, newPayment],
        status: newRemaining <= 0 ? 'pagado' : 'activo'
      });

      await addTransaction({
        amount: paymentData.amountPaid,
        type: 'ingreso',
        boxId: targetBox,
        category: 'venta',
        description: `Cobro Cuota - Plan ${activePlan.id} - ${activePlan.clientName}`,
        date: new Date().toISOString()
      });

      setShowRegisterPaymentModal(false);
      alert("Pago registrado correctamente");
    } catch (e) { alert("Error al procesar el pago"); }
    finally { setIsProcessingPayment(false); }
  };

  const filteredPlans = useMemo(() => {
    return installmentPlans.filter(p => {
      const mSearch = p.clientName.toLowerCase().includes(filterSearch.toLowerCase()) || p.id.toLowerCase().includes(filterSearch.toLowerCase());
      const mStatus = filterStatus === 'all' || p.status === filterStatus;
      return mSearch && mStatus;
    });
  }, [installmentPlans, filterSearch, filterStatus]);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-xl"><CreditCard className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-slate-800">Cuotas Internas</h1><p className="text-slate-500 text-sm">Financiación propia a clientes</p></div>
        </div>
        <button onClick={() => openPlanForm(null)} className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus className="w-5 h-5" /> Nuevo Plan</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border flex items-center gap-4 shadow-sm">
           <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Scale className="w-6 h-6" /></div>
           <div><p className="text-[10px] font-black text-slate-400 uppercase">Activos</p><p className="text-2xl font-black">{installmentPlans.filter(p=>p.status==='activo').length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border flex items-center gap-4 shadow-sm">
           <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
           <div><p className="text-[10px] font-black text-slate-400 uppercase">En Mora</p><p className="text-2xl font-black text-red-600">{installmentPlans.filter(p=>p.status==='mora').length}</p></div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl flex items-center gap-4 shadow-xl text-white">
           <div className="p-3 bg-white/10 rounded-xl"><TrendingUp className="w-6 h-6 text-orange-500" /></div>
           <div><p className="text-[10px] font-black text-slate-400 uppercase">Total en Calle</p><p className="text-xl font-black">${installmentPlans.reduce((acc,p)=>acc+p.remainingAmount,0).toLocaleString()}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex gap-4">
          <input type="text" placeholder="Buscar por cliente..." className="flex-1 px-4 py-2 border rounded-xl outline-none focus:border-purple-500" value={filterSearch} onChange={e=>setFilterSearch(e.target.value)} />
          <select className="px-4 py-2 border rounded-xl bg-white" value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)}>
            <option value="all">Todos los estados</option>
            {Object.entries(INSTALLMENT_STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="px-6 py-4">Descripción / Plan</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4 text-right">Saldo</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPlans.map(plan => (
              <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4"><p className="font-bold text-sm">{plan.description}</p><p className="text-[10px] text-slate-400 font-mono">ID: {plan.id}</p></td>
                <td className="px-6 py-4 font-bold text-slate-700">{plan.clientName}</td>
                <td className="px-6 py-4 text-right font-black text-red-600">${plan.remainingAmount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${INSTALLMENT_STATUS_COLORS[plan.status]}`}>
                    {INSTALLMENT_STATUS_LABELS[plan.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={()=>openRegisterPaymentModal(plan)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><DollarSign className="w-4 h-4" /></button>
                  <button onClick={()=>openPlanForm(plan)} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PLAN (NUEVO/EDITAR) */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="font-black uppercase">Plan de Financiación</h2>
              <button onClick={()=>setShowPlanModal(false)}><X className="w-6 h-6"/></button>
            </div>
            <div className="p-8 space-y-4">
               <select className="w-full p-3 border rounded-xl font-bold" value={planFormData.clientId} onChange={e=>setPlanFormData({...planFormData, clientId: e.target.value})}>
                 <option value="">Seleccionar Cliente...</option>
                 {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <input type="text" placeholder="Descripción del plan" className="w-full p-3 border rounded-xl font-bold" value={planFormData.description} onChange={e=>setPlanFormData({...planFormData, description: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold uppercase text-slate-400">Total $</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={planFormData.totalAmount} onChange={e=>setPlanFormData({...planFormData, totalAmount: parseFloat(e.target.value)})}/></div>
                  <div><label className="text-[10px] font-bold uppercase text-slate-400">Cuotas</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={planFormData.installmentsCount} onChange={e=>setPlanFormData({...planFormData, installmentsCount: parseInt(e.target.value)})}/></div>
               </div>
               <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                  <p className="font-bold text-xs uppercase text-slate-400">Monto por cuota</p>
                  <p className="text-3xl font-black text-orange-500">${planFormData.amountPerInstallment}</p>
               </div>
            </div>
            <div className="p-6 bg-slate-50 border-t">
              <button onClick={handleSavePlan} disabled={isSavingPlan} className="w-full py-4 bg-purple-600 text-white rounded-xl font-black uppercase text-xs shadow-lg">
                {isSavingPlan ? 'Guardando...' : 'Confirmar Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRO CUOTA */}
      {showRegisterPaymentModal && activePlan && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b bg-green-50 flex justify-between items-center">
               <h2 className="font-black uppercase text-green-800">Registrar Pago</h2>
               <button onClick={()=>setShowRegisterPaymentModal(false)}><X className="w-6 h-6"/></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                 <span className="text-xs font-bold text-slate-400 uppercase">Saldo Pendiente</span>
                 <span className="text-2xl font-black text-red-600">${activePlan.remainingAmount.toLocaleString()}</span>
               </div>
               <input 
                type="number" placeholder="Monto a cobrar"
                className="w-full p-4 border-2 border-green-100 rounded-2xl text-center text-3xl font-black text-green-600 outline-none focus:border-green-500"
                value={paymentData.amountPaid}
                onChange={e=>setPaymentData({...paymentData, amountPaid: parseFloat(e.target.value)})}
               />
               <select className="w-full p-3 border rounded-xl font-bold" value={paymentData.method} onChange={e=>setPaymentData({...paymentData, method: e.target.value})}>
                 <option value="efectivo">Efectivo</option>
                 <option value="transferencia">Transferencia</option>
                 <option value="tarjeta">Tarjeta</option>
               </select>
               <button onClick={handleRegisterPayment} disabled={isProcessingPayment} className="w-full py-4 bg-green-600 text-white rounded-xl font-black uppercase shadow-xl">
                 {isProcessingPayment ? 'Procesando...' : 'Confirmar Cobro'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};