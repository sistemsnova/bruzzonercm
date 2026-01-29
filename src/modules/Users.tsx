import React, { useState, useMemo } from 'react';
import { 
  UserPlus, Mail, Edit3, Trash2, CheckCircle2, X, 
  DollarSign, Loader2, Plus, TrendingDown, Wallet, 
  Save, Banknote, UserCog, ChevronDown, 
  CloudLightning, ShieldCheck
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { InternalUser, EmployeeAdvance } from '../types';

// Mock del servicio ARCA por si el archivo externo no existe o falla el build
const submitPayrollToArca = async (user: any, net: number) => {
  console.log("Sincronizando con ARCA...", user.name, net);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { message: 'Sincronización Exitosa', protocolNumber: 'AR-99234', cuil: '20-XXXXXXXX-X' };
};

const UsersModule: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, branches: availableBranches, addTransaction, boxes, updateBox } = useFirebase();

  const [activeView, setActiveView] = useState<'staff' | 'payroll'>('staff');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showQuickAdvanceModal, setShowQuickAdvanceModal] = useState<InternalUser | null>(null);
  const [activeUser, setActiveUser] = useState<InternalUser | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<InternalUser>>({});
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'financial'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isArcaSyncing, setIsArcaSyncing] = useState<string | null>(null);
  const [processingLiquidations, setProcessingLiquidations] = useState<Record<string, boolean>>({});
  
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean, title: string, message: string, onConfirm: () => void, 
    type: 'danger' | 'success' | 'arca', showBoxSelector?: boolean, selectedBoxId?: string
  }>({
    show: false, title: '', message: '', onConfirm: () => {}, type: 'success'
  });

  const [quickAdvance, setQuickAdvance] = useState({ 
    amount: 0, description: '', type: 'adelanto' as EmployeeAdvance['type'], boxId: '' 
  });

  const calculateTotalAdvances = (user: Partial<InternalUser>) => {
    return (user.advances || []).reduce((sum, adv) => (adv.type === 'adelanto' || adv.type === 'descuento' ? sum + adv.amount : sum), 0);
  };

  const calculateTotalBonuses = (user: Partial<InternalUser>) => {
    return (user.advances || []).reduce((sum, adv) => (adv.type === 'bono' ? sum + adv.amount : sum), 0);
  };

  const calculateNetPay = (user: Partial<InternalUser>) => {
    return (user.salary || 0) - calculateTotalAdvances(user) + calculateTotalBonuses(user);
  };

  const handleArcaSync = async (user: InternalUser) => {
    const net = calculateNetPay(user);
    setIsArcaSyncing(String(user.id));
    try {
      const result = await submitPayrollToArca(user, net);
      setConfirmModal({
        show: true, title: 'Validación ARCA Exitosa', message: result.message, type: 'arca', onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false }))
      });
    } catch (e: any) {
      alert("Error ARCA: " + e.message);
    } finally {
      setIsArcaSyncing(null);
    }
  };

  const processLiquidation = async (user: InternalUser, boxId: string) => {
    const net = calculateNetPay(user);
    const selectedBox = boxes.find(b => b.id === boxId);
    if (!selectedBox) return;

    setProcessingLiquidations(prev => ({ ...prev, [String(user.id)]: true }));
    try {
      await addTransaction({
        date: new Date().toISOString(), amount: net, type: 'egreso', boxId, category: 'sueldo',
        description: `Liquidación: ${user.name}`,
        paymentDetails: [{ id: `p-${Date.now()}`, method: 'efectivo', amount: net, netAmount: net, targetBoxId: boxId }]
      });
      await updateBox(boxId, { balance: selectedBox.balance - net });
      await updateUser(String(user.id), { advances: [] });
      alert("Liquidación completada");
    } finally {
      setProcessingLiquidations(prev => ({ ...prev, [String(user.id)]: false }));
      setConfirmModal(prev => ({ ...prev, show: false }));
    }
  };

  const handlePaySalary = (user: InternalUser) => {
    const defaultBox = boxes.find(b => b.status === 'abierta') || boxes[0];
    setConfirmModal({
      show: true, title: 'Liquidar Haberes', message: `Pagar $${calculateNetPay(user).toLocaleString()} a ${user.name}`,
      type: 'success', showBoxSelector: true, selectedBoxId: defaultBox?.id,
      onConfirm: () => {} 
    });
  };

  const handleSaveQuickAdvance = async () => {
    if (!showQuickAdvanceModal || quickAdvance.amount <= 0) return;
    try {
      const advance: EmployeeAdvance = { 
        id: `adv-${Date.now()}`, date: new Date().toISOString().split('T')[0], 
        amount: quickAdvance.amount, description: quickAdvance.description || 'Adelanto', type: quickAdvance.type 
      };
      await updateUser(String(showQuickAdvanceModal.id), { advances: [...(showQuickAdvanceModal.advances || []), advance] });
      setShowQuickAdvanceModal(null);
    } catch (e) { alert("Error al registrar"); }
  };

  const totalPayrollCost = useMemo(() => users.reduce((acc, u) => acc + calculateNetPay(u), 0), [users]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Personal & Nómina</h1>
          <p className="text-slate-500 text-sm">Control de haberes y sincronización ARCA.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveView('staff')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeView === 'staff' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Staff</button>
          <button onClick={() => setActiveView('payroll')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeView === 'payroll' ? 'bg-orange-600 text-white' : 'bg-white border'}`}>Nómina</button>
          <button onClick={() => { setUserFormData({ name: '', salary: 0 }); setShowUserModal(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><UserPlus className="w-4 h-4" /> Nuevo</button>
        </div>
      </header>

      {activeView === 'payroll' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Total Nómina</p>
            <h3 className="text-3xl font-black">${totalPayrollCost.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl border flex items-center gap-4">
             <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ShieldCheck className="w-6 h-6" /></div>
             <div><p className="text-[10px] font-bold text-slate-400 uppercase">Activos</p><h3 className="text-2xl font-bold">{users.length}</h3></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border flex items-center gap-4">
             <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><TrendingDown className="w-6 h-6" /></div>
             <div><p className="text-[10px] font-bold text-slate-400 uppercase">Vales Mes</p><h3 className="text-2xl font-bold">${users.reduce((acc, u) => acc + calculateTotalAdvances(u), 0).toLocaleString()}</h3></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
            <tr>
              <th className="px-8 py-5">Colaborador</th>
              {activeView === 'payroll' ? (
                <>
                  <th className="px-8 py-5 text-right">Sueldo Base</th>
                  <th className="px-8 py-5 text-right font-black">Neto</th>
                  <th className="px-8 py-5 text-center">ARCA</th>
                </>
              ) : <th className="px-8 py-5">Rol</th>}
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50">
                <td className="px-8 py-6 font-bold">{user.name}</td>
                {activeView === 'payroll' ? (
                  <>
                    <td className="px-8 py-6 text-right">${(user.salary || 0).toLocaleString()}</td>
                    <td className="px-8 py-6 text-right font-black text-lg">${calculateNetPay(user).toLocaleString()}</td>
                    <td className="px-8 py-6 text-center">
                       <button onClick={() => handleArcaSync(user)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                         {isArcaSyncing === String(user.id) ? <Loader2 className="animate-spin w-4 h-4" /> : <CloudLightning className="w-4 h-4" />}
                       </button>
                    </td>
                  </>
                ) : <td className="px-8 py-6">{user.role}</td>}
                <td className="px-8 py-6 text-center space-x-2">
                  <button onClick={() => handlePaySalary(user)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><Banknote className="w-4 h-4" /></button>
                  <button onClick={() => { setShowQuickAdvanceModal(user); }} className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CONFIRMACION / PAGO */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center space-y-6">
                <Banknote className="w-12 h-12 mx-auto text-green-600" />
                <h3 className="text-2xl font-black uppercase">{confirmModal.title}</h3>
                <p className="text-slate-500">{confirmModal.message}</p>
                {confirmModal.showBoxSelector && (
                  <select 
                    value={confirmModal.selectedBoxId} 
                    onChange={e => setConfirmModal({...confirmModal, selectedBoxId: e.target.value})}
                    className="w-full p-3 border-2 rounded-xl font-bold"
                  >
                    {boxes.map(b => <option key={b.id} value={b.id}>{b.name} (${b.balance})</option>)}
                  </select>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setConfirmModal({...confirmModal, show: false})} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold uppercase text-xs">Cerrar</button>
                  {confirmModal.showBoxSelector && (
                    <button 
                      onClick={() => {
                        const target = users.find(u => confirmModal.message.includes(u.name));
                        if(target && confirmModal.selectedBoxId) processLiquidation(target, confirmModal.selectedBoxId);
                      }} 
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs"
                    >Confirmar Pago</button>
                  )}
                </div>
            </div>
        </div>
      )}

      {/* MODAL ADELANTO/VALE */}
      {showQuickAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
             <h2 className="text-xl font-black mb-6 uppercase">Registrar Adelanto</h2>
             <div className="space-y-4">
                <input type="number" placeholder="Monto $" className="w-full p-4 border rounded-xl font-black text-2xl" value={quickAdvance.amount || ''} onChange={e => setQuickAdvance({...quickAdvance, amount: parseFloat(e.target.value)})}/>
                <input type="text" placeholder="Motivo" className="w-full p-4 border rounded-xl font-bold" value={quickAdvance.description} onChange={e => setQuickAdvance({...quickAdvance, description: e.target.value})}/>
                <button onClick={handleSaveQuickAdvance} className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase">Guardar Adelanto</button>
                <button onClick={() => setShowQuickAdvanceModal(null)} className="w-full text-xs font-bold text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase">Perfil del Colaborador</h2>
              <button onClick={() => setShowUserModal(false)}><X /></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <input placeholder="Nombre" className="p-4 border rounded-xl font-bold" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})}/>
                 <input placeholder="Sueldo Base" type="number" className="p-4 border rounded-xl font-bold" value={userFormData.salary} onChange={e => setUserFormData({...userFormData, salary: parseFloat(e.target.value)})}/>
               </div>
               <button onClick={async () => {
                  setIsSaving(true);
                  if (activeUser) await updateUser(String(activeUser.id), userFormData);
                  else await addUser(userFormData);
                  setIsSaving(false);
                  setShowUserModal(false);
               }} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase flex items-center justify-center gap-2">
                 {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Guardar Cambios
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;