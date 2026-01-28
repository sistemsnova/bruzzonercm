
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CreditCard, Plus, Search, User, Calendar, DollarSign,
  Info, Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Edit3, Trash2, X, Receipt, History, Landmark, Save,
  Ban, TrendingUp, Scale, Settings
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Client, InstallmentPlan, InstallmentPayment } from '../types';

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

const Installments: React.FC = () => {
  // Fix: added boxes to destructuring
  const { clients, installmentPlans, addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan, addTransaction, boxes } = useFirebase();

  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InstallmentStatus | 'all'>('all');

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activePlan, setActivePlan] = useState<InstallmentPlan | null>(null); // For editing/viewing
  const [planFormData, setPlanFormData] = useState<Partial<InstallmentPlan>>({
    clientId: '',
    clientName: '',
    totalAmount: 0,
    downPayment: 0,
    installmentsCount: 1,
    amountPerInstallment: 0,
    remainingAmount: 0,
    payments: [],
    status: 'activo',
    startDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    description: '',
  });
  // Fix: Renamed isSavingOrder to isSavingPlan to match component context
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // States for registering new payment
  const [showRegisterPaymentModal, setShowRegisterPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    method: 'efectivo',
    notes: '',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Calculate `amountPerInstallment` and `remainingAmount`
  useEffect(() => {
    const totalAmountAfterDownPayment = (planFormData.totalAmount || 0) - (planFormData.downPayment || 0);
    const installmentsCount = planFormData.installmentsCount! > 0 ? planFormData.installmentsCount! : 1;
    const calculatedAmountPerInstallment = parseFloat((totalAmountAfterDownPayment / installmentsCount).toFixed(2));

    setPlanFormData(prev => ({
      ...prev,
      amountPerInstallment: calculatedAmountPerInstallment,
      // For a new plan, remaining amount is total after down payment
      // For existing plans, it would be calculated from `payments`
      remainingAmount: activePlan ? activePlan.remainingAmount : parseFloat(totalAmountAfterDownPayment.toFixed(2)),
    }));
  }, [planFormData.totalAmount, planFormData.downPayment, planFormData.installmentsCount, activePlan]);

  // Handle client selection in plan form
  useEffect(() => {
    if (planFormData.clientId) {
      const client = clients.find(c => c.id === planFormData.clientId);
      if (client) {
        setOrderFormData(prev => ({ ...prev, clientName: client.name }));
      }
    } else {
      setPlanFormData(prev => ({ ...prev, clientName: '' }));
    }
  }, [planFormData.clientId, clients]);

  // Temporary function because setOrderFormData was likely a typo in the original file pointing to setPlanFormData
  const setOrderFormData = setPlanFormData;


  const openPlanForm = (plan: InstallmentPlan | null) => {
    if (plan) {
      setActivePlan(plan);
      setPlanFormData(plan);
    } else {
      setActivePlan(null);
      setPlanFormData({
        clientId: '',
        clientName: '',
        totalAmount: 0,
        downPayment: 0,
        installmentsCount: 1,
        amountPerInstallment: 0,
        remainingAmount: 0, // Will be calculated by useEffect
        payments: [],
        status: 'activo',
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // Default 1 month later
        description: '',
      });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planFormData.clientId || !planFormData.description || !planFormData.totalAmount || planFormData.totalAmount <= 0) {
      alert('Por favor, selecciona un cliente, añade una descripción y un monto total.');
      return;
    }
    // Fix: Used setIsSavingPlan instead of setIsSavingOrder
    setIsSavingPlan(true);
    try {
      // Fix: Ensured all required properties of InstallmentPlan are present and typed correctly
      const planToSave: Omit<InstallmentPlan, 'id'> = {
        clientId: planFormData.clientId!,
        clientName: planFormData.clientName || 'Cliente',
        totalAmount: planFormData.totalAmount!,
        downPayment: planFormData.downPayment || 0,
        installmentsCount: Math.max(1, planFormData.installmentsCount || 1),
        amountPerInstallment: planFormData.amountPerInstallment || 0,
        remainingAmount: activePlan ? activePlan.remainingAmount : (planFormData.totalAmount! - (planFormData.downPayment || 0)),
        payments: planFormData.payments || [],
        status: (planFormData.status as InstallmentStatus) || 'activo',
        startDate: planFormData.startDate || new Date().toISOString().split('T')[0],
        nextDueDate: planFormData.nextDueDate,
        description: planFormData.description!,
      };
      
      if (activePlan) {
        await updateInstallmentPlan(activePlan.id, planToSave);
      } else {
        await addInstallmentPlan(planToSave);
      }
      alert('Plan de cuotas guardado con éxito!');
      setShowPlanModal(false);
    } catch (error) {
      console.error('Error al guardar el plan de cuotas:', error);
      alert('Ocurrió un error al guardar el plan de cuotas.');
    } finally {
      // Fix: Used setIsSavingPlan instead of setIsSavingOrder
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este plan de cuotas? Esta acción es irreversible.')) {
      try {
        await deleteInstallmentPlan(planId);
        alert('Plan de cuotas eliminado con éxito.');
      } catch (error) {
        console.error('Error al eliminar el plan de cuotas:', error);
        alert('Ocurrió un error al eliminar el plan de cuotas.');
      }
    }
  };

  const openRegisterPaymentModal = (plan: InstallmentPlan) => {
    setActivePlan(plan);
    setPaymentData({
      amountPaid: Math.min(plan.amountPerInstallment, plan.remainingAmount), // Pre-fill with one installment or remaining
      method: 'efectivo',
      notes: '',
    });
    setShowRegisterPaymentModal(true);
  };

  const handleRegisterPayment = async () => {
    if (!activePlan || paymentData.amountPaid <= 0 || paymentData.amountPaid > activePlan.remainingAmount) {
      alert('Monto de pago inválido o excede el saldo pendiente.');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const newRemaining = activePlan.remainingAmount - paymentData.amountPaid;
      const newStatus: InstallmentStatus = newRemaining <= 0 ? 'pagado' : 'activo';
      
      const pdId = `pd-${Date.now()}`;
      
      // Fix: Added missing required paymentDetails property to the new payment object
      const newPayment: InstallmentPayment = {
        id: `pay-${Date.now()}`,
        date: new Date().toISOString(),
        amountPaid: paymentData.amountPaid,
        method: paymentData.method,
        // Enriched with a single PaymentDetail
        paymentDetails: [{
           id: pdId,
           method: paymentData.method as any,
           amount: paymentData.amountPaid,
           netAmount: paymentData.amountPaid
        }], 
        notes: paymentData.notes,
      };

      const updatedPayments = [...activePlan.payments, newPayment];
      
      // Update client balance
      const client = clients.find(c => c.id === activePlan.clientId);
      if (client) {
        await updateFirebaseClientBalance(activePlan.clientId, client.balance + paymentData.amountPaid);
      }

      // Add a transaction record
      // Fix: added missing required boxId and enriched paymentDetails
      await addTransaction({
        amount: paymentData.amountPaid,
        type: 'ingreso',
        boxId: boxes.find(b => b.status === 'abierta')?.id || boxes[0]?.id || 'mostrador',
        category: 'venta',
        paymentDetails: [{
           id: pdId,
           method: paymentData.method as any,
           amount: paymentData.amountPaid,
           netAmount: paymentData.amountPaid
        }],
        description: `Pago de cuota de plan ${activePlan.id} por ${activePlan.clientName}`,
        date: new Date().toISOString()
      });

      // Update the installment plan
      await updateInstallmentPlan(activePlan.id, {
        remainingAmount: newRemaining,
        payments: updatedPayments,
        status: newStatus,
        nextDueDate: newStatus === 'pagado' ? undefined : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      });

      alert('Pago registrado con éxito!');
      setShowRegisterPaymentModal(false);
      setActivePlan(null);
    } catch (error) {
      console.error('Error al registrar pago:', error);
      alert('Ocurrió un error al registrar el pago.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Dummy function for client balance update (Firebase context would handle real update)
  const updateFirebaseClientBalance = async (clientId: string, newBalance: number) => {
    console.log(`Simulating client ${clientId} balance update to: $${newBalance}`);
  };

  const filteredPlans = useMemo(() => {
    return installmentPlans.filter(plan => {
      const matchesSearch = plan.clientName.toLowerCase().includes(filterSearch.toLowerCase()) || plan.id.toLowerCase().includes(filterSearch.toLowerCase());
      const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [installmentPlans, filterSearch, filterStatus]);


  const totalActivePlansAmount = useMemo(() => {
    return installmentPlans.filter(p => p.status === 'activo' || p.status === 'mora').reduce((acc, p) => acc + p.remainingAmount, 0);
  }, [installmentPlans]);


  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600 text-white rounded-[1.5rem] shadow-xl"><CreditCard className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cuotas Internas</h1>
            <p className="text-slate-500 text-sm">Gestiona planes de pago personalizados para tus clientes.</p>
          </div>
        </div>
        <button
          onClick={() => openPlanForm(null)}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20"
        >
          <Plus className="w-5 h-5" /> Nuevo Plan de Cuotas
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Planes Activos</p>
            <h3 className="text-2xl font-black text-slate-800">{installmentPlans.filter(p => p.status === 'activo').length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Planes en Mora</p>
            <h3 className="text-2xl font-black text-red-600">{installmentPlans.filter(p => p.status === 'mora').length}</h3>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex items-center gap-4 text-white">
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total Adeudado Cuotas</p>
            <h3 className="text-xl font-black">${totalActivePlansAmount.toLocaleString()}</h3>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o ID de plan..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-sm">
              {(['all', 'activo', 'pagado', 'mora', 'cancelado'] as (InstallmentStatus | 'all')[])
                .map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                      filterStatus === status ? 'bg-purple-600 text-white shadow-md' : 'text-slate-50 hover:bg-slate-50'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : INSTALLMENT_STATUS_LABELS[status as InstallmentStatus]}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Plan N° / Descripción</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Cuotas</th>
                <th className="px-6 py-4 text-right">Monto Total</th>
                <th className="px-6 py-4 text-right">Saldo Pendiente</th>
                <th className="px-6 py-4">Próx. Vencimiento</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <CreditCard className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold">No se encontraron planes de cuotas</p>
                      <p className="text-slate-400 text-sm">Prueba ajustando los filtros de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-black text-slate-900">
                      {plan.id}
                      <p className="text-[10px] font-medium text-slate-500 mt-1">{plan.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                          {plan.clientName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{plan.clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {plan.payments.filter(p => p.amountPaid > 0).length}/{plan.installmentsCount}
                      <p className="text-[10px] text-slate-400 font-medium">${plan.amountPerInstallment.toLocaleString()}/cuota</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900">${plan.totalAmount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-black ${plan.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${plan.remainingAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {plan.nextDueDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(plan.nextDueDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${INSTALLMENT_STATUS_COLORS[plan.status]}`}>
                        {INSTALLMENT_STATUS_LABELS[plan.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openPlanForm(plan)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver/Editar Plan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRegisterPaymentModal(plan)}
                          disabled={plan.status === 'pagado' || plan.status === 'cancelado'}
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Registrar Pago"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW/EDIT PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activePlan ? 'Editar Plan de Cuotas' : 'Nuevo Plan de Cuotas'}</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{activePlan ? `ID: ${activePlan.id}` : 'Registro de nuevo plan'}</p>
                </div>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <section className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Cliente
                  </label>
                  <select
                    value={planFormData.clientId || ''}
                    onChange={e => setPlanFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold bg-white"
                    disabled={!!activePlan} // Disable client selection if editing an existing plan
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name} ({client.cuit})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción del Plan</label>
                  <input
                    type="text"
                    value={planFormData.description || ''}
                    onChange={e => setPlanFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ej: Compra de herramientas eléctricas, Mes de Septiembre"
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Total a Financiar ($)</label>
                    <input
                      type="number"
                      value={planFormData.totalAmount || ''}
                      onChange={e => setPlanFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anticipo / Entrega Inicial ($)</label>
                    <input
                      type="number"
                      value={planFormData.downPayment || ''}
                      onChange={e => setPlanFormData(prev => ({ ...prev, downPayment: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-blue-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad de Cuotas</label>
                    <input
                      type="number"
                      value={planFormData.installmentsCount || ''}
                      onChange={e => setPlanFormData(prev => ({ ...prev, installmentsCount: parseInt(e.target.value) || 1 }))}
                      placeholder="1"
                      min="1"
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Fecha de Inicio del Plan
                    </label>
                    <input
                      type="date"
                      value={planFormData.startDate || ''}
                      onChange={e => setPlanFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold bg-white"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span>Monto Restante a Financiar</span>
                  <span>${((planFormData.totalAmount || 0) - (planFormData.downPayment || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <span className="text-xl font-black uppercase tracking-tight">MONTO POR CUOTA</span>
                  <span className="text-4xl font-black text-orange-500">${(planFormData.amountPerInstallment || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </section>

              {activePlan && (
                <section className="space-y-6 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" /> Historial de Pagos
                  </h3>
                  <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                          <th className="px-6 py-3 text-left">Fecha</th>
                          <th className="px-6 py-3 text-right">Monto</th>
                          <th className="px-6 py-3 text-center">Método</th>
                          <th className="px-6 py-3 text-left">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activePlan.payments.length === 0 ? (
                          <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic">No hay pagos registrados.</td></tr>
                        ) : (
                          activePlan.payments.map((payment, idx) => (
                            <tr key={payment.id || idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">{new Date(payment.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right font-black">${payment.amountPaid.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">
                                  {payment.method}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 text-sm italic">{payment.notes || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowPlanModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button
                onClick={handleSavePlan}
                disabled={isSavingPlan || !planFormData.clientId || !planFormData.description || !planFormData.totalAmount || planFormData.totalAmount <= 0}
                className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black shadow-xl shadow-purple-600/20 hover:bg-purple-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSavingPlan ? 'Guardando Plan...' : 'Guardar Plan de Cuotas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER PAYMENT */}
      {showRegisterPaymentModal && activePlan && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-green-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registrar Pago</h2>
                  <p className="text-green-600 text-sm font-medium">Plan {activePlan.id} • Cliente: {activePlan.clientName}</p>
                </div>
              </div>
              <button onClick={() => setShowRegisterPaymentModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                <span className="text-3xl font-black text-red-600">${activePlan.remainingAmount.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto del Pago ($)</label>
                <input
                  type="number"
                  value={paymentData.amountPaid || ''}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-center text-3xl font-black focus:ring-2 focus:ring-green-500 outline-none text-green-600"
                  max={activePlan.remainingAmount}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold bg-white"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas (Opcional)</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Referencia de la transacción, etc."
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-sm h-24 resize-none"
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setShowRegisterPaymentModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterPayment}
                disabled={isProcessingPayment || paymentData.amountPaid <= 0 || paymentData.amountPaid > activePlan.remainingAmount}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-600/20 hover:bg-green-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isProcessingPayment ? 'Procesando Pago...' : 'Registrar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Installments;
