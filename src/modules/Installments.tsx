import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard, Plus, Search, X, DollarSign, Edit3, Trash2, Loader2, Save } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { InstallmentPlan, InstallmentPayment } from '../types';

export const Installments: React.FC = () => {
  const { clients = [], installmentPlans = [], addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan, addTransaction, boxes = [] } = useFirebase() || {};

  const [filterSearch, setFilterSearch] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activePlan, setActivePlan] = useState<InstallmentPlan | null>(null);
  const [planFormData, setPlanFormData] = useState<Partial<InstallmentPlan>>({
    clientId: '', totalAmount: 0, installmentsCount: 1, description: '', status: 'activo'
  });
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [paymentData, setPaymentData] = useState({ amountPaid: 0 });

  const handleSavePlan = async () => {
    if (!planFormData.clientId || !planFormData.totalAmount) return;
    setIsSavingPlan(true);
    try {
      const planToSave: any = {
        ...planFormData,
        clientId: planFormData.clientId,
        clientName: clients.find(c => c.id === planFormData.clientId)?.name || 'Cliente',
        totalAmount: Number(planFormData.totalAmount),
        remainingAmount: Number(planFormData.totalAmount),
        payments: [],
        startDate: new Date().toISOString()
      };
      if (activePlan) await updateInstallmentPlan(activePlan.id, planToSave);
      else await addInstallmentPlan(planToSave);
      setShowPlanModal(false);
    } finally { setIsSavingPlan(false); }
  };

  const handleRegisterPayment = async (plan: InstallmentPlan) => {
    const amount = paymentData.amountPaid;
    if (amount <= 0) return;
    try {
      const targetBox = boxes.find(b => b.status === 'abierta')?.id || 'principal';
      const pd = { id: `pay-${Date.now()}`, method: 'efectivo' as any, amount: amount, netAmount: amount, targetBoxId: targetBox };
      
      const newPayment: InstallmentPayment = {
        id: `pay-${Date.now()}`,
        date: new Date().toISOString(),
        amountPaid: amount,
        method: 'efectivo',
        notes: 'Pago de cuota',
        paymentDetails: [pd] // Corregido: faltaba esta propiedad requerida
      };

      await updateInstallmentPlan(plan.id, {
        remainingAmount: plan.remainingAmount - amount,
        payments: [...plan.payments, newPayment],
        status: plan.remainingAmount - amount <= 0 ? 'pagado' : 'activo'
      });

      await addTransaction({
        amount,
        type: 'ingreso',
        boxId: targetBox,
        category: 'venta',
        description: `Cuota: ${plan.clientName}`,
        date: new Date().toISOString(),
        paymentDetails: [pd] // Corregido: faltaba esta propiedad requerida
      });
      alert("Pago registrado");
    } catch (e) { alert("Error"); }
  };

  const filteredPlans = useMemo(() => {
    return installmentPlans.filter(p => 
      p.clientName.toLowerCase().includes(filterSearch.toLowerCase()) || p.id.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [installmentPlans, filterSearch]); // Corregido: 'search' ahora es 'filterSearch'

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cuotas Internas</h1>
        <button onClick={() => setShowPlanModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Plan</button>
      </header>
      <div className="bg-white rounded-3xl border overflow-hidden">
        <div className="p-4 border-b">
           <input type="text" placeholder="Buscar cliente..." className="w-full max-w-md p-2 border rounded-xl" value={filterSearch} onChange={e=>setFilterSearch(e.target.value)} />
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase border-b">
            <tr><th>Cliente</th><th className="text-right">Saldo</th><th className="text-center">Acciones</th></tr>
          </thead>
          <tbody className="divide-y">
            {filteredPlans.map(plan => (
              <tr key={plan.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold">{plan.clientName}</td>
                <td className="px-6 py-4 text-right font-black text-red-600">${plan.remainingAmount}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={() => { setPaymentData({amountPaid: 1000}); handleRegisterPayment(plan); }} className="p-2 text-green-600"><DollarSign className="w-4 h-4" /></button>
                  <button onClick={() => deleteInstallmentPlan(plan.id)} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <h2 className="text-xl font-black mb-4 uppercase">Nuevo Plan</h2>
            <select className="w-full p-2 border rounded-xl mb-4" onChange={e=>setPlanFormData({...planFormData, clientId: e.target.value})}>
              <option>Seleccionar Cliente</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" placeholder="Monto Total" className="w-full p-2 border rounded-xl mb-4" onChange={e=>setPlanFormData({...planFormData, totalAmount: parseFloat(e.target.value)})}/>
            <button onClick={handleSavePlan} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">{isSavingPlan ? 'Guardando...' : 'Crear Plan'}</button>
            <button onClick={()=>setShowPlanModal(false)} className="w-full mt-2 text-xs font-bold text-slate-400">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};