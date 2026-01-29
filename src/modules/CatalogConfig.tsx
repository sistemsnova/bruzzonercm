import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tags, Layers, Plus, Search, Edit3, Trash2, X, Save, Info, Loader2, RefreshCw,
  LayoutGrid, Package, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Brand, Category } from '../types';

type CatalogEntityType = 'brands' | 'categories';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: CatalogEntityType;
  initialData: Brand | Category | null;
  onSave: (entity: Brand | Category) => Promise<void>;
  isSaving: boolean;
}

const AddEditModal: React.FC<AddEditModalProps> = ({ isOpen, onClose, entityType, initialData, onSave, isSaving }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }
    await onSave({ ...(initialData || {}), name: name.trim(), description: description.trim() || undefined } as Brand | Category);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              {entityType === 'brands' ? <Tags className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Editar' : 'Nueva'} {entityType === 'brands' ? 'Marca' : 'Rubro'}</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Configuración del catálogo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre {entityType === 'brands' ? 'de Marca' : 'de Rubro'}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Stanley" className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción (Opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descripción..." className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none h-24 resize-none font-medium" />
          </div>
          <div className="p-8 bg-slate-50 border-t flex gap-4 -mx-8 -mb-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white border rounded-2xl font-black text-slate-500 text-xs">CANCELAR</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl hover:bg-orange-500 flex items-center justify-center gap-2 text-xs">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />} GUARDAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CatalogConfig: React.FC = () => {
  const { brands, categories, loading, error, addBrand, updateBrand, deleteBrand, addCategory, updateCategory, deleteCategory } = useFirebase();
  const [activeTab, setActiveTab] = useState<CatalogEntityType>('brands');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Brand | Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredBrands = useMemo(() => brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())), [brands, searchQuery]);
  const filteredCategories = useMemo(() => categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())), [categories, searchQuery]);

  const handleSaveItem = async (item: Brand | Category) => {
    setIsSaving(true);
    try {
      if (activeTab === 'brands') {
        if (item.id) await updateBrand(item.id, item as Partial<Brand>);
        else await addBrand(item as Omit<Brand, 'id'>);
      } else {
        if (item.id) await updateCategory(item.id, item as Partial<Category>);
        else await addCategory(item as Omit<Category, 'id'>);
      }
      setShowModal(false);
    } catch (e) { alert('Error al guardar'); }
    finally { setIsSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-[10px]">Cargando catálogo...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-xl"><Tags className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-slate-800">Marcas & Rubros</h1><p className="text-sm text-slate-500">Gestión de categorías maestras.</p></div>
        </div>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-orange-700">
          <Plus className="w-5 h-5" /> Nuevo {activeTab === 'brands' ? 'Marca' : 'Rubro'}
        </button>
      </header>

      <div className="flex gap-2 border-b overflow-x-auto">
        <button onClick={() => setActiveTab('brands')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'brands' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>MARCAS</button>
        <button onClick={() => setActiveTab('categories')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'categories' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>RUBROS</button>
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b">
            <Search className="inline-block w-5 h-5 text-slate-400 mr-2" />
            <input type="text" placeholder={`Buscar ${activeTab}...`} className="bg-transparent outline-none font-bold text-sm w-full max-w-md" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
            <tr><th className="px-8 py-5">Nombre</th><th className="px-8 py-5">Descripción</th><th className="px-8 py-5 text-center">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(activeTab === 'brands' ? filteredBrands : filteredCategories).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6 font-bold">{item.name}</td>
                <td className="px-8 py-6 text-sm text-slate-500">{item.description || '-'}</td>
                <td className="px-8 py-6 text-center space-x-2">
                  <button onClick={() => { setEditingItem(item); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => activeTab === 'brands' ? deleteBrand(item.id) : deleteCategory(item.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddEditModal isOpen={showModal} onClose={() => setShowModal(false)} entityType={activeTab} initialData={editingItem} onSave={handleSaveItem} isSaving={isSaving} />
    </div>
  );
};

export default CatalogConfig;