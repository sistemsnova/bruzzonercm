
import React, { useState } from 'react';
import { 
  UserPlus, Search, Shield, ShieldCheck, Mail, Edit3, Trash2, Layout, CheckCircle2, X, Store, MapPin,
  DollarSign, Calendar, History, ListOrdered, Loader2, FileText, Lock
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { InternalUser } from '../types';

const UsersModule: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, branches: availableBranches } = useFirebase();

  const allModules = [
    { id: 'sales', name: 'Ventas' },
    { id: 'inventory', name: 'Inventario' },
    { id: 'cashier', name: 'Cajas' },
    { id: 'purchases', name: 'Compras' },
    { id: 'finance', name: 'Finanzas' },
    { id: 'ecommerce', name: 'E-Commerce' },
    { id: 'reports', name: 'Informes' }
  ];

  const [showUserModal, setShowUserModal] = useState(false);
  const [activeUser, setActiveUser] = useState<InternalUser | null>(null);
  const [userFormData, setUserFormData] = useState<any>({});
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'financial' | 'modules'>('general');
  const [isSaving, setIsSaving] = useState(false);

  const calculateTotalPaidLastMonth = (user: InternalUser) => {
    return (user.salary || 0) + (user.advances || []).reduce((sum: number, adv: any) => sum + adv.amount, 0);
  };

  const openUserModal = (user: InternalUser | null) => {
    setActiveUser(user);
    if (user) {
      setUserFormData(user);
    } else {
      setUserFormData({ 
        name: '', 
        email: '', 
        password: '', // Campo para login interno
        role: 'Vendedor', 
        status: 'Activo', 
        branchName: availableBranches[0]?.name || 'Central', 
        modules: ['sales'],
        salary: 0,
        advances: [],
        joiningDate: new Date().toISOString().split('T')[0]
      });
    }
    setActiveModalTab('general');
    setShowUserModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleToggleModuleInModal = (moduleId: string) => {
    const currentModules = userFormData.modules || [];
    const hasModule = currentModules.includes(moduleId);
    setUserFormData((prev: any) => ({
      ...prev,
      modules: hasModule ? currentModules.filter((m: string) => m !== moduleId) : [...currentModules, moduleId]
    }));
  };

  const handleSaveUser = async () => {
    if (!userFormData.name || !userFormData.email || !userFormData.password) {
      alert("Por favor, complete todos los campos obligatorios incluyendo la contraseña.");
      return;
    }

    setIsSaving(true);
    try {
      if (activeUser) {
        await updateUser(activeUser.id as string, userFormData);
      } else {
        await addUser(userFormData);
      }
      setShowUserModal(false);
    } catch (error) {
      alert('Error al guardar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este usuario? No podrá volver a ingresar.')) {
      await deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Usuarios Internos</h1>
          <p className="text-slate-500">Gestiona los accesos de tu equipo sin usar consolas externas.</p>
        </div>
        <button 
          onClick={() => openUserModal(null)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" /> Crear Cuenta de Acceso
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Colaborador</th>
              <th className="px-8 py-5">Rol / Acceso</th>
              <th className="px-8 py-5">Sucursal</th>
              <th className="px-8 py-5">Sueldo + Adelantos</th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 text-lg border border-orange-200">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {user.role === 'Administrador' ? <ShieldCheck className="w-4 h-4 text-orange-600" /> : <Shield className="w-4 h-4 text-blue-500" />}
                    <span className="text-xs font-black uppercase text-slate-600">{user.role}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Store className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold">{user.branchName}</span>
                  </div>
                </td>
                <td className="px-8 py-6 font-black text-slate-900">
                  ${calculateTotalPaidLastMonth(user).toLocaleString()}
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openUserModal(user)} className="p-2 text-slate-400 hover:text-orange-600"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(user.id as string)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">{activeUser ? 'Editar Cuenta' : 'Nueva Cuenta de Acceso'}</h2>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex h-[500px]">
               <div className="w-1/3 bg-slate-50 border-r border-slate-100 p-6 space-y-2">
                  {[
                     { id: 'general', label: 'Acceso y Login', icon: Lock },
                     { id: 'financial', label: 'Finanzas', icon: DollarSign },
                     { id: 'modules', label: 'Permisos', icon: Layout },
                  ].map((tab) => (
                     <button 
                        key={tab.id} 
                        onClick={() => setActiveModalTab(tab.id as any)}
                        className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === tab.id ? 'bg-orange-600 text-white' : 'text-slate-500 hover:bg-white'}`}
                     >
                        <tab.icon className="w-4 h-4 inline-block mr-2" />
                        {tab.label}
                     </button>
                  ))}
               </div>
               <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar">
                  {activeModalTab === 'general' && (
                     <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                           <input name="name" value={userFormData.name || ''} onChange={handleInputChange} className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email / Usuario</label>
                           <input name="email" value={userFormData.email || ''} onChange={handleInputChange} className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña del Sistema</label>
                           <input name="password" type="password" value={userFormData.password || ''} onChange={handleInputChange} className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol Operativo</label>
                              <select name="role" value={userFormData.role} onChange={handleInputChange} className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white">
                                 <option value="Vendedor">Vendedor</option>
                                 <option value="Administrador">Administrador</option>
                                 <option value="Contador">Contador</option>
                                 <option value="Depósito">Depósito</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sucursal</label>
                              <select name="branchName" value={userFormData.branchName} onChange={handleInputChange} className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white">
                                 {availableBranches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                              </select>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeModalTab === 'financial' && (
                     <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sueldo Mensual ($)</label>
                           <input name="salary" type="number" value={userFormData.salary || ''} onChange={handleInputChange} className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-600" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Ingreso</label>
                           <input name="joiningDate" type="date" value={userFormData.joiningDate || ''} onChange={handleInputChange} className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" />
                        </div>
                     </div>
                  )}

                  {activeModalTab === 'modules' && (
                     <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-300">
                        {allModules.map(m => (
                           <div key={m.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <input 
                                 type="checkbox" 
                                 className="w-5 h-5 rounded accent-orange-600" 
                                 checked={(userFormData.modules || []).includes(m.id)}
                                 onChange={() => handleToggleModuleInModal(m.id)}
                              />
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{m.name}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowUserModal(false)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
              <button 
                onClick={handleSaveUser}
                disabled={isSaving}
                className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-orange-500 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSaving ? 'Guardando...' : 'Habilitar Acceso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
