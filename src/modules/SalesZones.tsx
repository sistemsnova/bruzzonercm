
import React, { useState } from 'react';
import { 
  MapPin, Plus, Search, Users, Store, 
  ChevronRight, Edit3, Trash2, X, Save,
  Layers, Globe, Info, Loader2, CheckCircle2
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { SalesZone } from '../types';

const SalesZones: React.FC = () => {
  const { salesZones, users, branches, addSalesZone, updateSalesZone, deleteSalesZone } = useFirebase();
  const [showModal, setShowModal] = useState(false);
  const [activeZone, setActiveZone] = useState<SalesZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState<Partial<SalesZone>>({
    name: '',
    description: '',
    assignedUserIds: [],
    assignedBranchIds: []
  });

  const filteredZones = (salesZones || []).filter(z => 
    z.name.toLowerCase().includes(search.toLowerCase()) || 
    z.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (zone: SalesZone | null) => {
    setActiveZone(zone);
    if (zone) {
      setFormData(zone);
    } else {
      setFormData({
        name: '',
        description: '',
        assignedUserIds: [],
        assignedBranchIds: []
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("El nombre de la zona es obligatorio.");
      return;
    }
    setIsSaving(true);
    try {
      if (activeZone) {
        await updateSalesZone(activeZone.id, formData);
        alert('Zona actualizada con éxito.');
      } else {
        await addSalesZone(formData as Omit<SalesZone, 'id'>);
        alert('Zona creada con éxito.');
      }
      setShowModal(false);
    } catch (e) {
      console.error("Error al guardar zona:", e);
      alert('Error al procesar la solicitud.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta zona?')) {
      try {
        await deleteSalesZone(id);
      } catch (e) {
        console.error("Error al eliminar:", e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-[1.5rem] shadow-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Zonas de Venta</h1>
            <p className="text-slate-500 text-sm">Gestiona la distribución territorial de tus vendedores y sucursales.</p>
          </div>
        </div>
        <button 
          onClick={() => openModal(null)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" /> Nueva Zona
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar zona por nombre o descripción..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
          {filteredZones.map(zone => (
            <div key={zone.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(zone)} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(zone.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{zone.name}</h3>
              <p className="text-slate-400 text-xs mt-1 mb-4 line-clamp-2">{zone.description || 'Sin descripción'}</p>
              
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Users className="w-3 h-3" /> Vendedores
                  </span>
                  <span className="text-xs font-bold text-slate-700">{(zone.assignedUserIds || []).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Store className="w-3 h-3" /> Sucursales
                  </span>
                  <span className="text-xs font-bold text-slate-700">{(zone.assignedBranchIds || []).length}</span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredZones.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-300">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold uppercase text-xs tracking-[0.2em]">No se encontraron zonas</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{activeZone ? 'Editar Zona' : 'Nueva Zona'}</h2>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">Configuración territorial</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Zona</label>
                <input 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                  placeholder="Ej: Zona Norte GBA"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Notas</label>
                <textarea 
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium h-24 resize-none" 
                  placeholder="Alcance geográfico, objetivos, etc."
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Asignaciones:</p>
                  <p className="text-xs text-blue-700 mt-1">Puedes vincular vendedores y sucursales a esta zona para segmentar reportes de ventas y stock.</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[1.5] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Guardando...' : 'Guardar Zona'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesZones;
