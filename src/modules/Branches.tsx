import React, { useState, useEffect } from 'react';
import { 
  Store, MapPin, Plus, MoreVertical, 
  TrendingUp, Users, Clock, Phone,
  ChevronRight, ArrowUpRight, X, CheckCircle2,
  Save, Mail, Loader2, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { Branch } from '../types';
import { useFirebase } from '../context/FirebaseContext';

const Branches: React.FC = () => {
  const { branches, loading, error, addBranch, updateBranch, deleteBranch } = useFirebase();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageBranchModal, setShowManageBranchModal] = useState(false);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  
  const [branchFormData, setBranchFormData] = useState<Partial<Branch>>({
    name: '', address: '', manager: '', phone: '', email: '',
    status: 'online', dailySales: 0, staffCount: 0,
  });

  useEffect(() => {
    if (activeBranch) {
      setBranchFormData(activeBranch);
    } else {
      setBranchFormData({
        name: '', address: '', manager: '', phone: '', email: '', 
        status: 'online', dailySales: 0, staffCount: 0,
      });
    }
  }, [activeBranch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setBranchFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveBranch = async () => {
    if (!branchFormData.name || !branchFormData.address || !branchFormData.manager) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }
    try {
      if (activeBranch) {
        await updateBranch(activeBranch.id, branchFormData);
        alert('Sucursal actualizada!');
      } else {
        await addBranch(branchFormData as Omit<Branch, 'id'>);
        alert('Nueva sucursal creada!');
      }
      setShowAddModal(false);
      setShowManageBranchModal(false);
      setActiveBranch(null);
    } catch (e) {
      alert('Error al guardar.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-[10px]">Conectando con sucursales...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl flex items-center gap-6">
      <AlertCircle className="w-8 h-8 text-red-600" />
      <div className="flex-1">
        <p className="text-red-900 font-black uppercase text-xs">Error de Sincronización</p>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
      <button onClick={() => window.location.reload()} className="p-2 bg-white border rounded-xl"><RefreshCw className="w-4 h-4" /></button>
    </div>
  );

  const totalGlobalSales = branches.reduce((acc, b) => acc + (b.dailySales || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 italic">Puntos de Venta y Depósitos</h1>
          <p className="text-slate-500 text-sm">Control operativo de locales físicos.</p>
        </div>
        <button onClick={() => { setActiveBranch(null); setShowAddModal(true); }} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Nueva Sucursal
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden group">
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <div className={`p-3 rounded-2xl ${branch.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Store />
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${branch.status === 'online' ? 'border-green-200 text-green-600' : 'border-slate-200 text-slate-400'}`}>
                  {branch.status}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{branch.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {branch.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div><p className="text-[9px] font-bold text-slate-400 uppercase">Ventas Hoy</p><p className="font-black text-slate-900">${branch.dailySales.toLocaleString()}</p></div>
                <div><p className="text-[9px] font-bold text-slate-400 uppercase">Personal</p><p className="font-black text-slate-900">{branch.staffCount}</p></div>
              </div>
            </div>
            <button onClick={() => { setActiveBranch(branch); setShowManageBranchModal(true); }} className="w-full py-4 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-all text-xs font-black uppercase">
              Gestionar Local
            </button>
          </div>
        ))}
      </div>

      {/* MODAL AGREGAR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
             <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
               <h2 className="text-xl font-black uppercase italic">Registrar Ubicación</h2>
               <button onClick={() => setShowAddModal(false)}><X /></button>
             </div>
             <div className="p-8 space-y-4">
               <input name="name" placeholder="Nombre Comercial" className="w-full p-4 border rounded-2xl font-bold" onChange={handleInputChange} />
               <input name="address" placeholder="Dirección" className="w-full p-4 border rounded-2xl font-bold" onChange={handleInputChange} />
               <input name="manager" placeholder="Responsable" className="w-full p-4 border rounded-2xl font-bold" onChange={handleInputChange} />
               <button onClick={handleSaveBranch} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase shadow-xl">Guardar Sucursal</button>
             </div>
           </div>
        </div>
      )}

      {/* MODAL GESTIONAR */}
      {showManageBranchModal && activeBranch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase">Configurar Local</h2>
              <button onClick={() => setShowManageBranchModal(false)}><X /></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                  <span className="font-bold text-slate-700">Estado de Operatividad</span>
                  <button 
                    onClick={() => setBranchFormData({...branchFormData, status: branchFormData.status === 'online' ? 'offline' : 'online'})}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${branchFormData.status === 'online' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-red-100 border-red-200 text-red-700'}`}
                  >
                    {branchFormData.status}
                  </button>
               </div>
               <div className="space-y-4">
                  <input name="name" value={branchFormData.name} onChange={handleInputChange} className="w-full p-4 border rounded-xl font-bold" />
                  <input name="phone" value={branchFormData.phone} onChange={handleInputChange} placeholder="Teléfono" className="w-full p-4 border rounded-xl font-bold" />
                  <input name="email" value={branchFormData.email} onChange={handleInputChange} placeholder="Email" className="w-full p-4 border rounded-xl font-bold" />
               </div>
               <button onClick={handleSaveBranch} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase">Confirmar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;