
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tags, Layers, Plus, Search, Edit3, Trash2, X, Save, Info, Loader2, RefreshCw,
  // Fix: Added missing icons for consistency and future use
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
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre {entityType === 'brands' ? 'de Marca' : 'de Rubro'} <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder={entityType === 'brands' ? 'Ej: Stanley' : 'Ej: Herramientas Manuales'}
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción (Opcional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Ej: Herramientas de mano de alta calidad para profesionales."
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium h-24 resize-none" 
            />
          </div>
          <div className="p-8 bg-slate-50 border-t flex gap-4 -mx-8 -mb-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Guardando...' : 'Guardar'}
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

  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [brands, searchQuery]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  const handleOpenModal = (item: Brand | Category | null) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSaveItem = async (item: Brand | Category) => {
    setIsSaving(true);
    try {
      if (activeTab === 'brands') {
        if (item.id) {
          await updateBrand(item.id, item as Partial<Brand>);
        } else {
          await addBrand(item as Omit<Brand, 'id'>);
        }
      } else { // activeTab === 'categories'
        if (item.id) {
          await updateCategory(item.id, item as Partial<Category>);
        } else {
          await addCategory(item as Omit<Category, 'id'>);
        }
      }
      alert(`${item.name} guardado con éxito.`);
    } catch (e) {
      console.error('Error al guardar:', e);
      alert('Error al guardar. Consulte la consola.');
    } finally {
      setIsSaving(false);
      setShowModal(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm(`¿Estás seguro de eliminar este ${activeTab === 'brands' ? 'marca' : 'rubro'}? Esta acción es irreversible.`)) {
      try {
        if (activeTab === 'brands') {
          await deleteBrand(id);
        } else {
          await deleteCategory(id);
        }
        alert('Elemento eliminado con éxito.');
      } catch (e) {
        console.error('Error al eliminar:', e);
        alert('Error al eliminar. Consulte la consola.');
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Cargando datos del catálogo...</p>
    </div>
  );

  if (error) return (
    <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top duration-300">
      <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-red-900 font-black uppercase text-xs tracking-widest">Error de Sincronización Nube</p>
        <p className="text-red-700 text-sm font-medium">{error}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs uppercase hover:bg-red-50 transition-all flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl">
            <Tags className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Marcas & Rubros</h1>
            <p className="text-slate-500 text-sm">Gestiona el catálogo maestro de tu ferretería.</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5" /> Nuevo {activeTab === 'brands' ? 'Marca' : 'Rubro'}
        </button>
      </header>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => { setActiveTab('brands'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'brands' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tags className="w-5 h-5" /> Marcas
        </button>
        <button
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'categories' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5" /> Rubros
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Buscar ${activeTab === 'brands' ? 'marca' : 'rubro'}...`} 
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Nombre</th>
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5 text-center">Productos Asoc.</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'brands' ? (
                filteredBrands.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No se encontraron marcas.</td></tr>
                ) : (
                  filteredBrands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-800 text-sm">{brand.name}</p>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-600">{brand.description || 'Sin descripción'}</td>
                      <td className="px-8 py-6 text-center font-bold text-slate-600">
                        {/* Placeholder: Real count from products collection */}
                        {Math.floor(Math.random() * 50) + 1}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(brand)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(brand.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : ( // Categories tab
                filteredCategories.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No se encontraron rubros.</td></tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-800 text-sm">{category.name}</p>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-600">{category.description || 'Sin descripción'}</td>
                      <td className="px-8 py-6 text-center font-bold text-slate-600">
                        {/* Placeholder: Real count from products collection */}
                        {Math.floor(Math.random() * 80) + 1}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(category.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
        <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">¿Cómo funcionan?</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Las Marcas y Rubros te permiten organizar tu inventario, generar informes segmentados y agilizar la carga de nuevos productos.
          </p>
        </div>
      </div>

      <AddEditModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        entityType={activeTab}
        initialData={editingItem}
        onSave={handleSaveItem}
        isSaving={isSaving}
      />
    </div>
  );
};

export default CatalogConfig;