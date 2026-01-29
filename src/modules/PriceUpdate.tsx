
import React, { useState, useEffect } from 'react';
import { 
  Upload, FileSpreadsheet, Play, CheckCircle2, AlertCircle, 
  FileText, ChevronRight, Settings, Plus, LayoutGrid, 
  ListOrdered, Percent, ArrowDownUp, Edit3, Trash2, X,
  Save, Info, Tags, RefreshCcw, Cloud, Mail, Globe, Clock,
  Loader2, History, Eye
} from 'lucide-react';
import { PriceList, Supplier } from '../types'; // Import Supplier type
import { useFirebase } from '../context/FirebaseContext';
import { SupplierAutomationConfig } from '../types'; // Import SupplierAutomationConfig

type AutomationFrequency = 'diario' | 'semanal' | 'mensual';
type DataSourceType = 'manual' | 'web' | 'email';

// Fix: Defined the missing 'AutomationConfig' interface
interface AutomationConfig {
  enabled: boolean;
  frequency: AutomationFrequency;
  executionTime: string; // e.g., "03:00"
}

// Mock data for automation history
const mockAutomationHistory = [
  { id: 'h1', date: '2024-05-20 08:00', source: 'Sinteplast (Web)', status: 'success', itemsUpdated: 120, itemsAdded: 5, errors: 0, log: 'Proceso completado sin errores.' },
  { id: 'h2', date: '2024-05-19 23:00', source: 'Alba (Email)', status: 'error', itemsUpdated: 0, itemsAdded: 0, errors: 2, log: 'Error: Adjunto no reconocido o malformado.' },
  { id: 'h3', date: '2024-05-18 08:00', source: 'Stanley (Web)', status: 'success', itemsUpdated: 85, itemsAdded: 0, errors: 0, log: 'Proceso completado sin errores.' },
];

const PriceUpdate: React.FC = () => {
  const { priceLists, addPriceList, updatePriceList, deletePriceList, suppliers } = useFirebase(); // Use Firebase context
  const [activeTab, setActiveTab] = useState<'update' | 'lists' | 'automation'>('lists'); // Default to lists for initial user interaction
  const [step, setStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showListModal, setShowListModal] = useState(false);
  
  const [activePriceList, setActivePriceList] = useState<PriceList | null>(null); // State for price list being edited
  const [newListData, setNewListData] = useState<Partial<PriceList>>({ // State for new/edited price list form
    name: '',
    description: '',
    modifierType: 'margin',
    value: 0,
    isBase: false
  });

  // Automation states
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>({
    enabled: false,
    frequency: 'diario',
    executionTime: '03:00',
  });
  const [supplierAutomationConfigs, setSupplierAutomationConfigs] = useState<Record<string, SupplierAutomationConfig>>({});
  const [isSavingAutomation, setIsSavingAutomation] = useState(false);
  const [isTriggeringManual, setIsTriggeringManual] = useState<string | null>(null);

  // Initialize supplier automation configs from fetched suppliers
  useEffect(() => {
    if (suppliers.length > 0) {
      const initialConfigs: Record<string, SupplierAutomationConfig> = {};
      suppliers.forEach(supplier => {
        if (!supplierAutomationConfigs[supplier.id]) { // Only add if not already configured
          // Fix: Ensure supplierId is always present when initializing SupplierAutomationConfig
          initialConfigs[supplier.id] = {
            supplierId: supplier.id, // Added missing supplierId
            sourceType: 'manual',
            enabled: false,
          };
        }
      });
      setSupplierAutomationConfigs(prev => ({ ...prev, ...initialConfigs }));
    }
  }, [suppliers, supplierAutomationConfigs]); // Depend on suppliers array

  const steps = [
    { id: 1, name: 'Seleccionar Proveedor', icon: FileText },
    { id: 2, name: 'Configurar Plantilla', icon: Settings },
    { id: 3, name: 'Cargar Excel', icon: Upload },
    { id: 4, name: 'Previsualización', icon: FileSpreadsheet },
    { id: 5, name: 'Análisis y Ejecución', icon: Play },
  ];

  const handleSavePriceList = async () => {
    if (!newListData.name) {
      alert("El nombre de la lista es obligatorio.");
      return;
    }
    
    try {
      if (newListData.isBase) {
        // Find current base list and update it to not be base
        const currentBaseList = priceLists.find(l => l.isBase && l.id !== activePriceList?.id);
        if (currentBaseList) {
          await updatePriceList(currentBaseList.id, { isBase: false });
        }
      }

      if (activePriceList?.id) {
        await updatePriceList(activePriceList.id, newListData);
        alert('Lista de precios actualizada con éxito!');
      } else {
        await addPriceList(newListData as Omit<PriceList, 'id'>);
        alert('Lista de precios creada con éxito!');
      }
      
      setShowListModal(false);
      setActivePriceList(null);
      setNewListData({ name: '', description: '', modifierType: 'margin', value: 0, isBase: false });
    } catch (error) {
      alert('Error al guardar la lista de precios.');
      console.error(error);
    }
  };

  const handleDeletePriceList = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta lista de precios? Esta acción es irreversible.')) {
      try {
        await deletePriceList(id);
        alert('Lista de precios eliminada con éxito.');
      } catch (error) {
        alert('Error al eliminar la lista de precios.');
        console.error(error);
      }
    }
  };

  const openPriceListModal = (list: PriceList | null) => {
    setActivePriceList(list);
    if (list) {
      setNewListData(list);
    } else {
      setNewListData({ name: '', description: '', modifierType: 'margin', value: 0, isBase: false });
    }
    setShowListModal(true);
  };

  const handleSaveAutomationConfig = () => {
    setIsSavingAutomation(true);
    setTimeout(() => {
      alert('Configuración de automatización guardada.');
      setIsSavingAutomation(false);
    }, 1000);
  };

  const handleSupplierAutomationConfigChange = (supplierId: string, field: keyof SupplierAutomationConfig, value: any) => {
    setSupplierAutomationConfigs(prev => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [field]: value,
      },
    }));
  };

  const handleTriggerManualUpdate = (supplierId: string) => {
    setIsTriggeringManual(supplierId);
    setTimeout(() => {
      alert(`Actualización manual disparada para ${suppliers.find(s => s.id === supplierId)?.name || 'proveedor'}.`);
      // Simulate update status
      setSupplierAutomationConfigs(prev => ({
        ...prev,
        [supplierId]: {
          ...prev[supplierId],
          lastRun: new Date().toLocaleString(),
          lastRunStatus: Math.random() > 0.2 ? 'success' : 'error', // 80% success rate
          lastRunMessage: Math.random() > 0.2 ? 'Proceso completado.' : 'Error: Contactar soporte.',
        },
      }));
      setIsTriggeringManual(null);
    }, 2000);
  };

  const renderUpdateProcess = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">1. ¿Qué proveedor quieres actualizar?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {suppliers.map(s => ( // Use actual suppliers from Firebase
                <button 
                  key={s.id} 
                  onClick={() => { setSelectedSupplier(s.id); setStep(2); }}
                  className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-50">
                    <FileText className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />
                  </div>
                  <span className="font-bold text-slate-700">{s.name}</span>
                </button>
              ))}
              {suppliers.length === 0 && (
                <div className="col-span-full text-center p-10 text-slate-400 italic">
                  No hay proveedores cargados.
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">2. Mapeo de Columnas: {suppliers.find(s => s.id === selectedSupplier)?.name || 'Proveedor'}</h3>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 space-y-6">
              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase">Columna Código</label>
                  <select className="w-full px-4 py-2 border rounded-lg"><option>Columna A</option><option>Columna B</option></select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase">Columna Descripción</label>
                  <select className="w-full px-4 py-2 border rounded-lg"><option>Columna B</option><option>Columna C</option></select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase">Columna Precio Costo</label>
                  <select className="w-full px-4 py-2 border rounded-lg"><option>Columna C</option><option>Columna D</option></select>
                </div>
              </div>
              <div className="pt-6 border-t flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-2 font-bold text-slate-500">Volver</button>
                <button onClick={() => setStep(3)} className="bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20">Guardar y Continuar</button>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Análisis de Impacto</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Items</p>
                <p className="text-3xl font-bold text-blue-900">1.240</p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <p className="text-xs font-bold text-green-600 uppercase mb-1">Actualizados</p>
                <p className="text-3xl font-bold text-green-900">856</p>
              </div>
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <p className="text-xs font-bold text-red-600 uppercase mb-1">Discontinuados</p>
                <p className="text-3xl font-bold text-red-900">12</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <p className="text-xs font-bold text-orange-600 uppercase mb-1">Var. Promedio</p>
                <p className="text-3xl font-bold text-orange-900">+14.2%</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Precio Viejo</th>
                    <th className="px-6 py-4">Precio Nuevo</th>
                    <th className="px-6 py-4">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Martillo Stanley 20oz', old: 4500, new: 5200, diff: '+15.5%' },
                    { name: 'Destornillador Phillips', old: 1200, new: 1350, diff: '+12.5%' },
                  ].map((p, i) => (
                    <tr key={i} className="text-sm">
                      <td className="px-6 py-4 font-semibold">{p.name}</td>
                      <td className="px-6 py-4 text-slate-500">${p.old}</td>
                      <td className="px-6 py-4 font-bold">${p.new}</td>
                      <td className="px-6 py-4 text-orange-600 font-bold">{p.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-2 border rounded-xl font-bold">Cancelar</button>
              <button className="bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20">Aplicar Actualización</button>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-dashed border-slate-200">
            <Upload className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Arrastra el archivo Excel aquí</p>
            <button onClick={() => setStep(5)} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Simular Carga</button>
          </div>
        );
    }
  };

  const renderListsManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <Tags className="w-6 h-6 text-orange-600" /> Estructura de Listas de Venta
        </h3>
        <button 
          onClick={() => openPriceListModal(null)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg"
        >
          <Plus className="w-5 h-5" /> Nueva Lista
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {priceLists.map((list) => (
          <div key={list.id} className={`bg-white rounded-[2rem] border-2 p-6 shadow-sm relative group transition-all ${list.isBase ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-slate-100 hover:border-slate-300'}`}>
            {list.isBase && (
              <span className="absolute -top-3 left-6 bg-orange-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Lista Base (Mostrador)
              </span>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${list.isBase ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                {list.isBase ? <LayoutGrid className="w-6 h-6" /> : <ListOrdered className="w-6 h-6" />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openPriceListModal(list)}
                  className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl"
                  title="Editar Lista"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {!list.isBase && 
                  <button 
                    onClick={() => handleDeletePriceList(list.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    title="Eliminar Lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              </div>
            </div>

            <h4 className="text-lg font-black text-slate-800 mb-1">{list.name}</h4>
            <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed">{list.description}</p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cálculo</span>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">
                  {list.modifierType === 'margin' ? 'Margen s/ Costo' : 'Modificador s/ Lista Base'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-slate-400" />
                <span className="text-2xl font-black text-slate-900">
                  {list.value > 0 ? '+' : ''}{list.value}%
                </span>
              </div>
            </div>

            <button className={`w-full mt-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
              list.isBase ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
              {list.isBase ? 'Configuración Base' : 'Ajustar Modificador'}
            </button>
          </div>
        ))}

        <button 
          onClick={() => openPriceListModal(null)}
          className="border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center p-8 gap-4 text-slate-300 hover:border-orange-200 hover:bg-orange-50/20 hover:text-orange-400 transition-all group"
        >
          <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white transition-colors">
            <Plus className="w-10 h-10" />
          </div>
          <span className="font-black uppercase text-xs tracking-widest">Crear Lista de Precios</span>
        </button>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="flex-1 space-y-4 relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-tight">Sincronización Automática</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Al actualizar los costos de un proveedor, FerroGest recalcula automáticamente los precios de venta en todas las listas (Negocio, Distribuidora, etc.) basándose en las reglas que definas aquí.
          </p>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
               <ArrowDownUp className="w-4 h-4" /> Flujo en tiempo real
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-green-500">
               <CheckCircle2 className="w-4 h-4" /> 0% Error de cálculo
             </div>
          </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Listas Activas</p>
             <p className="text-3xl font-black text-orange-500">{priceLists.length}</p>
           </div>
        </div>
        <Tags className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" />
      </div>
    </div>
  );

  const renderAutomationTab = () => (
    <div className="space-y-8">
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Configuración General de Automatización</h3>
        </div>

        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
          <label htmlFor="enableAutomation" className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              id="enableAutomation"
              checked={automationConfig.enabled}
              onChange={(e) => setAutomationConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <label htmlFor="enableAutomation" className="flex-1 cursor-pointer">
            <p className="text-sm font-black text-slate-800 uppercase">Habilitar Procesamiento Automático</p>
            <p className="text-xs text-slate-500 mt-1">Activa las tareas programadas para actualizar precios de forma recurrente.</p>
          </label>
        </div>

        {automationConfig.enabled && (
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frecuencia de Ejecución</label>
              <select 
                value={automationConfig.frequency}
                onChange={(e) => setAutomationConfig(prev => ({ ...prev, frequency: e.target.value as AutomationFrequency }))}
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horario de Ejecución (Hora Argentina)</label>
              <input 
                type="time" 
                value={automationConfig.executionTime}
                onChange={(e) => setAutomationConfig(prev => ({ ...prev, executionTime: e.target.value }))}
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
              />
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSaveAutomationConfig}
            disabled={isSavingAutomation}
            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSavingAutomation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSavingAutomation ? 'Guardando...' : 'Guardar Configuración General'}
          </button>
        </div>
      </section>

      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-500">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Tags className="w-6 h-6 text-orange-600" /> Fuentes por Proveedor
        </h3>
        <p className="text-slate-500 text-sm">Configura cómo se obtendrán las listas de precios de cada uno de tus proveedores.</p>

        <div className="space-y-6">
          {suppliers.length === 0 ? (
            <div className="text-center p-10 text-slate-400 italic">
              No hay proveedores cargados para configurar.
            </div>
          ) : (
            suppliers.map(supplier => {
              // Cast the config to SupplierAutomationConfig to access its properties safely
              const config: SupplierAutomationConfig = supplierAutomationConfigs[supplier.id] || { supplierId: supplier.id, sourceType: 'manual', enabled: false };
              return (
                <div key={supplier.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 group">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-black text-slate-800">{supplier.name}</h4>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${config.lastRunStatus === 'success' ? 'bg-green-50 text-green-700' : config.lastRunStatus === 'error' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-400'}`}>
                          {config.lastRun ? `${config.lastRunStatus === 'success' ? 'Éxito' : 'Error'}` : 'Sin Ejecución'}
                       </span>
                       <button 
                        onClick={() => handleTriggerManualUpdate(supplier.id)}
                        disabled={isTriggeringManual === supplier.id}
                        className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-orange-500 disabled:opacity-50"
                       >
                         {isTriggeringManual === supplier.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                         Actualizar Ahora
                       </button>
                    </div>
                  </div>
                  
                  {config.lastRun && config.lastRunStatus === 'error' && (
                     <div className="bg-red-100 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Última ejecución ({config.lastRun}): {config.lastRunMessage}</span>
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fuente Principal</label>
                      <select
                        value={config.sourceType}
                        onChange={(e) => handleSupplierAutomationConfigChange(supplier.id, 'sourceType', e.target.value as DataSourceType)}
                        className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
                      >
                        <option value="manual">Manual (Excel)</option>
                        <option value="web">Web (Scraping)</option>
                        <option value="email">Email (Adjunto)</option>
                      </select>
                    </div>

                    {config.sourceType === 'web' && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> URL del Proveedor
                        </label>
                        <input
                          type="url"
                          value={config.url || ''}
                          onChange={(e) => handleSupplierAutomationConfigChange(supplier.id, 'url', e.target.value)}
                          placeholder="https://proveedor.com/listaprecios"
                          className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        />
                      </div>
                    )}
                    {config.sourceType === 'email' && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Email de Origen
                        </label>
                        <input
                          type="email"
                          value={config.emailSource || ''}
                          onChange={(e) => handleSupplierAutomationConfigChange(supplier.id, 'emailSource', e.target.value)}
                          placeholder="listaprecios@proveedor.com"
                          className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                    <label htmlFor={`enable-${supplier.id}`} className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        id={`enable-${supplier.id}`}
                        checked={config.enabled}
                        onChange={(e) => handleSupplierAutomationConfigChange(supplier.id, 'enabled', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                    <label htmlFor={`enable-${supplier.id}`} className="flex-1 cursor-pointer">
                      <p className="text-sm font-black text-slate-800 uppercase">Activar Fuente Automática</p>
                      <p className="text-xs text-slate-500 mt-1">Esta fuente se procesará automáticamente según la configuración general.</p>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <button 
                      onClick={() => alert('Se abriría una interfaz para configurar el mapeo de columnas/campos de esta fuente.')}
                      className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Editar Mapeo de Campos
                    </button>
                    <button 
                      onClick={() => alert('Configuración guardada para ' + supplier.name)}
                      className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4 text-orange-500" /> Guardar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-500">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <History className="w-6 h-6 text-purple-600" /> Historial de Procesos Automáticos
        </h3>
        <p className="text-slate-500 text-sm">Consulta el resultado de las últimas ejecuciones automáticas de precios.</p>

        <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-3 text-left">Fecha/Hora</th>
                <th className="px-6 py-3 text-left">Fuente</th>
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-center">Items Act.</th>
                <th className="px-6 py-3 text-center">Errores</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockAutomationHistory.map((entry) => (
                <tr key={entry.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{entry.date}</td>
                  <td className="px-6 py-4 text-slate-700">{entry.source}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${entry.status === 'success' ? 'bg-green-50 text-green-700 border-green-100' : entry.status === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-400'}`}>
                      {entry.status === 'success' ? 'Éxito' : 'Fallo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-700">{entry.itemsUpdated} / {entry.itemsAdded}</td>
                  <td className="px-6 py-4 text-center text-red-600 font-bold">{entry.errors}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => alert(`Log detallado para ${entry.source}:\n${entry.log}`)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Ver Log"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Actualizador & Listas de Precios</h1>
          <p className="text-slate-500">Gestiona tus costos de proveedores y tus múltiples listas de venta.</p>
        </div>
      </header>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('update')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'update' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCcw className="w-5 h-5" /> Actualizar Costos (Excel)
        </button>
        <button
          onClick={() => setActiveTab('lists')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'lists' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tags className="w-5 h-5" /> Gestión de Listas de Venta
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'automation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-5 h-5" /> Automatización & Fuentes
        </button>
      </div>

      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-100 overflow-x-auto">
        {activeTab === 'update' ? (
          steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-3 shrink-0 ${step === s.id ? 'text-orange-600' : 'text-slate-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= s.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200'}`}>
                  {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-bold uppercase ${step === s.id ? '' : 'hidden md:block'}`}>{s.name}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight className="w-5 h-5 text-slate-100" />}
            </React.Fragment>
          ))
        ) : activeTab === 'lists' ? (
          <div className="flex items-center gap-3 text-orange-600">
            <div className="w-10 h-10 rounded-full border-2 border-orange-500 bg-orange-50 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Definición de Políticas de Precios</span>
          </div>
        ) : ( // Automation Tab
          <div className="flex items-center gap-3 text-blue-600">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Configuración de Fuentes Automáticas</span>
          </div>
        )}
      </div>

      {activeTab === 'update' ? renderUpdateProcess() : activeTab === 'lists' ? renderListsManagement() : renderAutomationTab()}

      {/* Modal: Nueva Lista de Precio */}
      {showListModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activePriceList ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Configuración de política comercial</p>
                </div>
              </div>
              <button onClick={() => setShowListModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Lista</label>
                <input 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                  placeholder="Ej: Distribuidora Mayorista" 
                  value={newListData.name || ''}
                  onChange={(e) => setNewListData({...newListData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                <textarea 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm h-24 resize-none" 
                  placeholder="Explique el uso de esta lista..."
                  value={newListData.description || ''}
                  onChange={(e) => setNewListData({...newListData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Cálculo</label>
                  <select 
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-slate-50"
                    value={newListData.modifierType}
                    onChange={(e) => setNewListData({...newListData, modifierType: e.target.value as any})}
                  >
                    <option value="margin">Margen s/ Costo</option>
                    <option value="percentage_over_base">Modificador s/ Lista Base</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (%)</label>
                  <input 
                    type="number"
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-orange-600 text-xl text-center" 
                    placeholder="0"
                    value={newListData.value || ''}
                    onChange={(e) => setNewListData({...newListData, value: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-orange-50 rounded-[1.5rem] border border-orange-100">
                <input 
                  type="checkbox" 
                  className="w-6 h-6 rounded-lg accent-orange-600 cursor-pointer" 
                  id="isBase"
                  checked={newListData.isBase || false}
                  onChange={(e) => setNewListData({...newListData, isBase: e.target.checked})}
                />
                <label htmlFor="isBase" className="flex-1 cursor-pointer">
                  <p className="text-sm font-black text-orange-900 uppercase">Establecer como Lista Base</p>
                  <p className="text-[10px] text-orange-700 font-medium">Las demás listas podrán referenciar a esta para cálculos automáticos.</p>
                </label>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowListModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button 
                onClick={handleSavePriceList}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                {activePriceList ? 'Actualizar Lista' : 'Crear Lista'} <Save className="w-5 h-5 text-orange-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceUpdate;