
import React, { useState, useMemo } from 'react';
import { 
  UserPlus, ShieldCheck, Mail, Edit3, Trash2, Layout, CheckCircle2, X, Store, 
  DollarSign, Loader2, FileText, Lock, Plus, TrendingDown, TrendingUp, 
  AlertTriangle, Wallet, Save, Banknote, UserCog, ChevronDown, 
  ShieldAlert, CloudLightning, ShieldCheck as ShieldCheckIcon, Receipt
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { InternalUser, EmployeeAdvance, Box } from '../types';
import { submitPayrollToArca } from '../lib/arcaService';

const UsersModule: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, branches: availableBranches, addTransaction, boxes, updateBox } = useFirebase();

  const [activeView, setActiveView] = useState<'staff' | 'payroll'>('staff');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showQuickAdvanceModal, setShowQuickAdvanceModal] = useState<InternalUser | null>(null);
  const [activeUser, setActiveUser] = useState<InternalUser | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<InternalUser>>({});
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'financial' | 'modules'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isArcaSyncing, setIsArcaSyncing] = useState<string | null>(null);
  const [processingLiquidations, setProcessingLiquidations] = useState<Record<string, boolean>>({});
  
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean, 
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'danger' | 'success' | 'info' | 'arca',
    showBoxSelector?: boolean,
    selectedBoxId?: string
  }>({
    show: false, title: '', message: '', onConfirm: () => {}, type: 'info'
  });

  const [quickAdvance, setQuickAdvance] = useState({ 
    amount: 0, 
    description: '', 
    type: 'adelanto' as EmployeeAdvance['type'],
    boxId: '' 
  });

  const calculateTotalAdvances = (user: Partial<InternalUser>) => {
    return (user.advances || []).reduce((sum, adv) => {
        if (adv.type === 'adelanto' || adv.type === 'descuento') return sum + adv.amount;
        return sum;
    }, 0);
  };

  const calculateTotalBonuses = (user: Partial<InternalUser>) => {
    return (user.advances || []).reduce((sum, adv) => {
        if (adv.type === 'bono') return sum + adv.amount;
        return sum;
    }, 0);
  };

  const calculateNetPay = (user: Partial<InternalUser>) => {
    const salary = user.salary || 0;
    const advances = calculateTotalAdvances(user);
    const bonuses = calculateTotalBonuses(user);
    return salary - advances + bonuses;
  };

  const handleArcaSync = async (user: InternalUser) => {
    const net = calculateNetPay(user);
    setIsArcaSyncing(String(user.id));
    try {
      const result = await submitPayrollToArca(user, net);
      setConfirmModal({
        show: true,
        title: 'Validación ARCA Exitosa',
        message: `${result.message}\nProtocolo: ${result.protocolNumber}\nCUIL: ${result.cuil}`,
        type: 'arca',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false }))
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsArcaSyncing(null);
    }
  };

  const handlePaySalary = (user: InternalUser) => {
    const net = calculateNetPay(user);
    if (!user.salary || user.salary <= 0) {
        setConfirmModal({
            show: true,
            title: 'Sueldo no configurado',
            message: `${user.name} no tiene un sueldo base asignado.`,
            type: 'danger',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false }))
        });
        return;
    }

    const defaultBox = boxes.find(b => b.status === 'abierta') || boxes[0];

    setConfirmModal({
      show: true,
      title: 'Liquidar Haberes',
      message: `Registrar pago de $${net.toLocaleString()} para ${user.name}.`,
      type: 'success',
      showBoxSelector: true,
      selectedBoxId: defaultBox?.id,
      onConfirm: () => {} 
    });
  };

  const processLiquidation = async (user: InternalUser, boxId: string) => {
    const net = calculateNetPay(user);
    const selectedBox = boxes.find(b => b.id === boxId);
    if (!selectedBox) return;

    setConfirmModal(prev => ({ ...prev, show: false }));
    setProcessingLiquidations(prev => ({ ...prev, [String(user.id)]: true }));
    
    try {
      await addTransaction({
        date: new Date().toISOString(),
        amount: net,
        type: 'egreso',
        boxId: boxId,
        category: 'sueldo',
        description: `Liquidación Haberes: ${user.name} (Libro Sueldos Digital)`,
        // Fix: added missing netAmount property required by PaymentDetail
        paymentDetails: [{ id: `pay-${Date.now()}`, method: 'efectivo', amount: net, netAmount: net }]
      });

      await updateBox(boxId, { balance: selectedBox.balance - net });
      await updateUser(String(user.id), { advances: [] });
      
      alert(`Liquidación completada. Se generó egreso en ${selectedBox.name}.`);
    } finally {
      setProcessingLiquidations(prev => ({ ...prev, [String(user.id)]: false }));
    }
  };

  const handleSaveQuickAdvance = async () => {
    if (!showQuickAdvanceModal || quickAdvance.amount <= 0) return;
    
    // Si es un adelanto (vale), necesitamos saber de qué caja sale
    if (quickAdvance.type === 'adelanto' && !quickAdvance.boxId) {
        alert("Para un adelanto de efectivo, debes seleccionar una caja de origen.");
        return;
    }

    const selectedBox = boxes.find(b => b.id === quickAdvance.boxId);
    
    try {
      // 1. Si es adelanto, registramos la salida física de dinero
      if (quickAdvance.type === 'adelanto' && selectedBox) {
        await addTransaction({
          date: new Date().toISOString(),
          amount: quickAdvance.amount,
          type: 'egreso',
          boxId: quickAdvance.boxId,
          category: 'sueldo',
          description: `Vale/Adelanto: ${showQuickAdvanceModal.name}`,
          // Fix: added missing netAmount property required by PaymentDetail
          paymentDetails: [{ id: `pm-${Date.now()}`, method: 'efectivo', amount: quickAdvance.amount, netAmount: quickAdvance.amount }]
        });
        await updateBox(quickAdvance.boxId, { balance: selectedBox.balance - quickAdvance.amount });
      }

      // 2. Registramos el adelanto en la ficha del empleado para el descuento a fin de mes
      const advance: EmployeeAdvance = { 
        id: `adv-${Date.now()}`, 
        date: new Date().toISOString().split('T')[0], 
        amount: quickAdvance.amount, 
        description: quickAdvance.description || (quickAdvance.type === 'adelanto' ? 'Adelanto de sueldo' : 'Bono/Premio'), 
        type: quickAdvance.type 
      };

      await updateUser(String(showQuickAdvanceModal.id), { 
        advances: [...(showQuickAdvanceModal.advances || []), advance] 
      });

      alert("Movimiento registrado con éxito.");
      setShowQuickAdvanceModal(null);
      setQuickAdvance({ amount: 0, description: '', type: 'adelanto', boxId: '' });
    } catch (e) {
      console.error(e);
      alert("Error al registrar el movimiento.");
    }
  };

  const openUserModal = (user: InternalUser | null) => {
    setActiveUser(user);
    if (user) {
      setUserFormData(user);
    } else {
      setUserFormData({ 
        name: '', email: '', password: '', role: 'vendedor', status: 'Activo', 
        branchName: availableBranches[0]?.name || 'Central', 
        modules: ['sales'], salary: 0, advances: [],
        joiningDate: new Date().toISOString().split('T')[0]
      });
    }
    setActiveModalTab('general');
    setShowUserModal(true);
  };

  const totalPayrollCost = useMemo(() => users.reduce((acc, u) => acc + calculateNetPay(u), 0), [users]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic">Personal & Nómina Digital</h1>
          <p className="text-slate-500 text-sm">Libro de Sueldos Digital (ARCA) y control de haberes.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
             <button onClick={() => setActiveView('staff')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'staff' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Staff</button>
             <button onClick={() => setActiveView('payroll')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'payroll' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Nómina ARCA</button>
          </div>
          <button onClick={() => openUserModal(null)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg"><UserPlus className="w-5 h-5 text-orange-500" /> Nuevo Colaborador</button>
        </div>
      </header>

      {activeView === 'payroll' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
           <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Costo Operativo Nómina</p>
              <h3 className="text-3xl font-black">${totalPayrollCost.toLocaleString()}</h3>
              <CloudLightning className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5" />
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Neto Estimado</p>
                <h3 className="text-2xl font-black text-slate-800">${totalPayrollCost.toLocaleString()}</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ShieldCheckIcon className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Certificados ARCA</p>
                <h3 className="text-2xl font-black text-slate-800">{users.length}</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><TrendingDown className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total Vales/Adel.</p>
                <h3 className="text-2xl font-black text-red-600">${users.reduce((acc, u) => acc + calculateTotalAdvances(u), 0).toLocaleString()}</h3>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Colaborador</th>
              {activeView === 'staff' ? (
                <>
                  <th className="px-8 py-5">Rol / Función</th>
                  <th className="px-8 py-5">Sucursal</th>
                  <th className="px-8 py-5 text-center">Estado</th>
                </>
              ) : (
                <>
                  <th className="px-8 py-5 text-right">Sueldo Base</th>
                  <th className="px-8 py-5 text-right">Descuentos/Vales</th>
                  <th className="px-8 py-5 text-right font-black text-slate-900">Neto a Liquidar</th>
                  <th className="px-8 py-5 text-center">Sincro ARCA</th>
                </>
              )}
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => {
              const netToPay = calculateNetPay(user);
              const isProcessing = processingLiquidations[String(user.id)];
              const isSyncing = isArcaSyncing === String(user.id);
              
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.role}</p>
                      </div>
                    </div>
                  </td>

                  {activeView === 'staff' ? (
                    <>
                      <td className="px-8 py-6 font-bold text-slate-600 text-xs">{user.role}</td>
                      <td className="px-8 py-6 font-bold text-slate-600 text-xs">{user.branchName}</td>
                      <td className="px-8 py-6 text-center">
                         <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${user.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {user.status}
                         </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-8 py-6 text-right font-bold text-slate-500">${(user.salary || 0).toLocaleString()}</td>
                      <td className="px-8 py-6 text-right font-bold text-red-500">-${calculateTotalAdvances(user).toLocaleString()}</td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-lg font-black text-slate-900">${netToPay.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleArcaSync(user)}
                          disabled={isSyncing}
                          className={`p-2 rounded-xl transition-all ${isSyncing ? 'bg-slate-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                        >
                          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudLightning className="w-4 h-4" />}
                        </button>
                      </td>
                    </>
                  )}

                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {activeView === 'payroll' ? (
                        <>
                          <button onClick={() => {
                            setQuickAdvance({ amount: 0, description: '', type: 'adelanto', boxId: boxes.find(b => b.status === 'abierta')?.id || '' });
                            setShowQuickAdvanceModal(user);
                          }} className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm"><Plus className="w-4 h-4" /></button>
                          <button 
                            onClick={() => handlePaySalary(user)}
                            disabled={isProcessing}
                            className={`p-2.5 rounded-xl transition-all shadow-sm ${isProcessing ? 'bg-slate-100' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                          </button>
                        </>
                      ) : (
                        <button onClick={() => openUserModal(user)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-orange-600 shadow-sm"><Edit3 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => deleteUser(String(user.id))} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal with ARCA & Box logic */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6 animate-in zoom-in duration-200">
                <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center shadow-xl ${
                    confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 
                    confirmModal.type === 'arca' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                    {confirmModal.type === 'arca' ? <ShieldCheckIcon className="w-10 h-10" /> : <Banknote className="w-10 h-10" />}
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{confirmModal.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">{confirmModal.message}</p>
                </div>

                {confirmModal.showBoxSelector && (
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origen de Fondos</label>
                    <div className="relative">
                      <select 
                        value={confirmModal.selectedBoxId}
                        onChange={(e) => setConfirmModal(prev => ({ ...prev, selectedBoxId: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                      >
                        {boxes.map(box => (
                          <option key={box.id} value={box.id}>{box.name} (${box.balance.toLocaleString()})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cerrar</button>
                    {confirmModal.showBoxSelector && (
                      <button 
                          onClick={() => {
                            const targetUser = users.find(u => confirmModal.message.includes(u.name));
                            if (targetUser && confirmModal.selectedBoxId) {
                              processLiquidation(targetUser, confirmModal.selectedBoxId);
                            }
                          }}
                          className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                      >
                          Confirmar Pago
                      </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Modal: Quick Advance */}
      {showQuickAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
             <div className="p-8 bg-orange-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
                   <div>
                     <h2 className="text-xl font-black uppercase tracking-tight">Registrar Movimiento</h2>
                     <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest">{showQuickAdvanceModal.name}</p>
                   </div>
                </div>
                <button onClick={() => setShowQuickAdvanceModal(null)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Registro</label>
                   <select value={quickAdvance.type} onChange={e => setQuickAdvance({...quickAdvance, type: e.target.value as any})} className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl font-bold bg-white outline-none">
                     <option value="adelanto">Adelanto (Resta del Sueldo)</option>
                     <option value="bono">Bono / Premio (Suma al Sueldo)</option>
                     <option value="descuento">Inasistencia (Resta del Sueldo)</option>
                   </select>
                </div>

                {quickAdvance.type === 'adelanto' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Caja de Origen (Egreso Físico)</label>
                    <div className="relative">
                      <select 
                        value={quickAdvance.boxId} 
                        onChange={e => setQuickAdvance({...quickAdvance, boxId: e.target.value})} 
                        className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none appearance-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Seleccione una caja...</option>
                        {boxes.map(box => (
                          <option key={box.id} value={box.id}>{box.name} (${box.balance.toLocaleString()})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importe ($)</label>
                   <input type="number" value={quickAdvance.amount || ''} onChange={e => setQuickAdvance({...quickAdvance, amount: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black text-3xl text-center focus:ring-2 focus:ring-orange-500 outline-none text-orange-600" placeholder="0.00" />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Descripción</label>
                   <input type="text" value={quickAdvance.description} onChange={e => setQuickAdvance({...quickAdvance, description: e.target.value})} className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl font-bold bg-white outline-none" placeholder="Ej: Vale para almuerzo, Premio puntualidad..." />
                </div>

                <button onClick={handleSaveQuickAdvance} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"><Save className="w-5 h-5 text-orange-500" /> Guardar Registro</button>
             </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col h-[85vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><UserCog className="w-6 h-6" /></div>
                 <div>
                   <h2 className="text-2xl font-black uppercase tracking-tight">{activeUser ? 'Perfil del Colaborador' : 'Nuevo Ingreso'}</h2>
                   <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest">{userFormData.name || 'Staff FerroGest'}</p>
                 </div>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
               <div className="w-1/4 bg-slate-50 border-r border-slate-100 p-6 space-y-2 shrink-0">
                  <button onClick={() => setActiveModalTab('general')} className={`w-full text-left px-5 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === 'general' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>Datos de Acceso</button>
                  <button onClick={() => setActiveModalTab('financial')} className={`w-full text-left px-5 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === 'financial' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>Finanzas & Sueldo</button>
               </div>
               
               <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
                  {activeModalTab === 'general' && (
                     <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label><input name="name" value={userFormData.name || ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full px-5 py-3.5 border-2 border-slate-50 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold focus:bg-white transition-all" /></div>
                           <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email / Usuario</label><input name="email" value={userFormData.email || ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="w-full px-5 py-3.5 border-2 border-slate-50 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold focus:bg-white transition-all" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sucursal</label>
                              <select name="branchName" value={userFormData.branchName} onChange={e => setUserFormData({...userFormData, branchName: e.target.value})} className="w-full px-5 py-3.5 border-2 border-slate-50 bg-slate-50 rounded-2xl outline-none font-bold">
                                {availableBranches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                              </select>
                           </div>
                           <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Ingreso</label><input name="joiningDate" type="date" value={userFormData.joiningDate || ''} onChange={e => setUserFormData({...userFormData, joiningDate: e.target.value})} className="w-full px-5 py-3.5 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold" /></div>
                        </div>
                     </div>
                  )}

                  {activeModalTab === 'financial' && (
                     <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-orange-50 p-8 rounded-[2.5rem] border-2 border-orange-200 flex items-center justify-between shadow-inner">
                           <div className="flex items-center gap-4">
                              <div className="p-4 bg-white rounded-2xl text-orange-600 shadow-sm"><Wallet className="w-6 h-6" /></div>
                              <div>
                                 <h4 className="font-black text-orange-900 uppercase text-xs tracking-widest italic">Sueldo Base Mensual</h4>
                                 <p className="text-[10px] text-orange-700 font-bold">Importe fijo antes de descuentos/premios.</p>
                              </div>
                           </div>
                           <div className="relative w-48">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                              <input type="number" value={userFormData.salary || ''} onChange={e => setUserFormData({...userFormData, salary: parseFloat(e.target.value) || 0})} className="w-full pl-12 pr-4 py-4 border-2 border-white rounded-2xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-orange-500" />
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Historial de Adelantos del Mes</h3>
                           <div className="border border-slate-100 rounded-3xl overflow-hidden">
                              <table className="w-full">
                                 <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b"><tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Concepto</th><th className="px-6 py-3 text-right">Monto</th></tr></thead>
                                 <tbody className="divide-y divide-slate-100">
                                    {(userFormData.advances || []).map((adv, i) => (
                                       <tr key={i} className="text-xs">
                                          <td className="px-6 py-3 font-bold">{adv.date}</td>
                                          <td className="px-6 py-3 font-medium text-slate-500">{adv.description}</td>
                                          <td className={`px-6 py-3 text-right font-black ${adv.type === 'bono' ? 'text-green-600' : 'text-red-600'}`}>{adv.type === 'bono' ? '+' : '-'}${adv.amount.toLocaleString()}</td>
                                       </tr>
                                    ))}
                                    {(userFormData.advances || []).length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">Sin movimientos registrados este mes.</td></tr>}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowUserModal(false)} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-100 transition-all">Descartar</button>
              <button onClick={async () => {
                setIsSaving(true);
                try {
                  if (activeUser) await updateUser(String(activeUser.id), userFormData);
                  else await addUser(userFormData);
                  setShowUserModal(false);
                } finally { setIsSaving(false); }
              }} disabled={isSaving} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5 text-orange-500" />}
                {activeUser ? 'Guardar Perfil' : 'Dar de Alta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
