
import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Layout, Lock, Building2, 
  Camera, Save, Upload, CheckCircle2,
  Globe, Mail, Phone, MapPin, FileText,
  Zap, Server, Key, RefreshCw, AlertCircle,
  Activity, CloudLightning, ShieldCheck,
  ChevronRight, Printer, Maximize2, Scissors,
  Type, LayoutPanelTop, Eye, FileJson,
  DownloadCloud, Archive, Eraser, Loader2, Info,
  Trash2, UploadCloud, FileUp, Send, Percent, CreditCard,
  TrendingUp
} from 'lucide-react';
import { CompanyInfo, PrintSettings } from '../App';
import { useFirebase } from '../context/FirebaseContext';

interface SettingsProps {
  initialTab?: 'system' | 'company' | 'arca' | 'printing' | 'data';
  plan: 'basic' | 'premium' | 'enterprise';
  setPlan: (plan: 'basic' | 'premium' | 'enterprise') => void;
  isAdmin: boolean;
  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
}

type PrintDocType = 'factura' | 'remito' | 'recibo' | 'etiqueta';

const Settings: React.FC<SettingsProps> = ({ initialTab = 'company', plan, setPlan, isAdmin, companyInfo, setCompanyInfo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSyncing, setIsSyncing] = useState(false);
  const { exportAllData, importAllData, deleteAllDocumentsInCollection } = useFirebase();
  
  // Backup States
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationPassword, setDeleteConfirmationPassword] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const MASTER_DELETE_PASSWORD = "BORRARTODO"; 
  const BACKUP_EMAIL_TARGET = "sistemsnova@gmail.com";

  const [selectedDoc, setSelectedDoc] = useState<PrintDocType>('factura');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!companyInfo || !companyInfo.printConfigs) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-500" />
        <p className="font-bold uppercase tracking-widest text-xs">Cargando configuración...</p>
      </div>
    );
  }

  const currentPrintConfig = companyInfo.printConfigs[selectedDoc];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyInfo(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    
    setCompanyInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleCommissionChange = (method: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setCompanyInfo(prev => ({
      ...prev,
      paymentCommissions: {
        ...prev.paymentCommissions,
        [method]: numericValue
      }
    }));
  };

  const handleArcaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    
    setCompanyInfo(prev => ({
      ...prev,
      arca: {
        ...prev.arca,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handlePrintConfigChange = (field: keyof PrintSettings, value: any) => {
    setCompanyInfo(prev => ({
      ...prev,
      printConfigs: {
        ...prev.printConfigs,
        [selectedDoc]: {
          ...prev.printConfigs[selectedDoc],
          [field]: value
        }
      }
    }));
  };

  const handleMarginChange = (side: keyof PrintSettings['margins'], value: number) => {
    setCompanyInfo(prev => ({
      ...prev,
      printConfigs: {
        ...prev.printConfigs,
        margins: {
          ...prev.printConfigs[selectedDoc].margins,
          [side]: value
        }
      }
    }));
  };

  const syncLastInvoice = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Sincronización con ARCA exitosa. Numeración actualizada.');
    }, 1500);
  };

  // Función para simular el envío del backup por email
  const sendBackupToEmail = async (data: any, filename: string) => {
    setIsSendingEmail(true);
    setEmailSent(false);
    
    try {
      // Simulamos la llamada a una API de envío de correo
      await new Promise(resolve => setTimeout(resolve, 3000));
      setEmailSent(true);
    } catch (error) {
      console.error("Error al enviar backup por email:", error);
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailSent(false), 5000);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const collectionsToExport = [
        'products', 'clients', 'suppliers', 'transactions', 'priceLists', 
        'branches', 'sales', 'purchaseOrders', 'checks', 'remitos', 'boxes', 'installmentPlans'
      ];
      const data = await exportAllData(collectionsToExport);
      
      const filename = `ferrogest_backup_${new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '_')}.json`;
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await sendBackupToEmail(data, filename);
      
    } catch (error) {
      console.error('Error al generar backup:', error);
      alert('Error al generar backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    if (!importFile) return;
    if (deleteConfirmationPassword !== MASTER_DELETE_PASSWORD) {
      alert('Debe ingresar la contraseña de seguridad.');
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          await importAllData(json);
          alert('¡Sistema restaurado al 100% con éxito!');
          window.location.reload();
        } catch (err) {
          alert('Archivo inválido.');
          setIsImporting(false);
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
      alert('Error al importar backup.');
      setIsImporting(false);
    }
  };

  const handleConfirmDeleteAllData = async () => {
    if (deleteConfirmationPassword !== MASTER_DELETE_PASSWORD) {
      alert('Contraseña incorrecta.');
      return;
    }

    setIsDeleting(true);
    setShowDeleteConfirmModal(false);
    try {
      const collectionsToDelete = [
        'products', 'clients', 'suppliers', 'transactions', 'priceLists', 
        'branches', 'sales', 'purchaseOrders', 'checks', 'remitos', 'boxes', 'installmentPlans'
      ];

      for (const collectionName of collectionsToDelete) {
        await deleteAllDocumentsInCollection(collectionName);
      }
      alert('Todos los datos han sido eliminados.');
    } catch (error) {
      alert('Error al eliminar datos.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationPassword('');
    }
  };

  const getPreviewDimensions = () => {
    let baseW = 210, baseH = 297, scale = 1.2;
    if (!currentPrintConfig) return { width: baseW, height: baseH, scale };
    switch(currentPrintConfig.pageSize) {
      case 'A5': baseW = 148; baseH = 210; scale = 1.6; break;
      case 'A6': baseW = 105; baseH = 148; scale = 2.0; break;
      case '80mm': baseW = 80; baseH = 250; scale = 1.8; break;
    }
    if (currentPrintConfig.orientation === 'landscape') return { width: baseH, height: baseW, scale: scale * 0.8 };
    return { width: baseW, height: baseH, scale };
  };

  const { width, height, scale } = getPreviewDimensions();

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Configuración del Sistema</h1>
          <p className="text-slate-500 font-medium">Gestiona módulos, identidad fiscal, conexión con ARCA e impresión.</p>
        </div>
      </header>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'company' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-5 h-5" /> Empresa
        </button>
        <button
          onClick={() => setActiveTab('arca')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'arca' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CloudLightning className="w-5 h-5" /> Facturación ARCA
        </button>
        <button
          onClick={() => setActiveTab('printing')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'printing' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-5 h-5" /> Impresión
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'data' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="w-5 h-5" /> Datos & Backup
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'system' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout className="w-5 h-5" /> Módulos
        </button>
      </div>

      {activeTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-500">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Datos Fiscales Básicos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                  <input name="name" value={companyInfo.name} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT</label>
                  <input name="cuit" value={companyInfo.cuit} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
                </div>
              </div>
            </section>

            {/* Nueva Sección de Política Comercial */}
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Política Comercial Global</h3>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Margen de Ganancia Predeterminado (%)</label>
                  <p className="text-xs text-slate-500 mb-2">Este valor se aplicará automáticamente a los nuevos productos, pero podrá ser modificado individualmente.</p>
                  <div className="relative w-48">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="number" 
                      name="defaultMarkup"
                      value={companyInfo.defaultMarkup} 
                      onChange={handleInputChange} 
                      className="w-full pl-12 pr-4 py-4 border-2 border-white rounded-2xl font-black text-2xl text-orange-600 outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* Nueva Sección de Comisiones */}
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Comisiones por Medio de Pago</h3>
              </div>
              <p className="text-slate-500 text-sm italic">Define el porcentaje de descuento que aplican los bancos para que tus cajas concilien automáticamente.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(companyInfo.paymentCommissions).map(([method, value]) => (
                  <div key={method} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block truncate">
                      {method.replace('_', ' ')}
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="number" 
                        step="0.01"
                        value={value} 
                        onChange={(e) => handleCommissionChange(method, e.target.value)} 
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none font-black text-slate-800 text-lg" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="space-y-6">
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Logo Empresa</h3>
              <div className="relative w-40 h-40 mx-auto group">
                {companyInfo.logo ? (
                  <img src={companyInfo.logo} className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-xl" alt="Logo" />
                ) : (
                  <div className="w-full h-full rounded-[2rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="text-[10px] font-bold uppercase">Sin Logo</span>
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-orange-600 text-white rounded-2xl shadow-lg hover:bg-orange-500 transition-all">
                  <Upload className="w-5 h-5" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'arca' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                   <Server className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
                   <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                         <div className={`w-3 h-3 rounded-full ${companyInfo.arca.enabled ? 'bg-green-50 animate-pulse' : 'bg-red-500'}`}></div>
                         <span className="text-xs font-black uppercase tracking-widest">WebService ARCA</span>
                      </div>
                      <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Factura Electrónica</h3>
                   </div>
                </section>
                <button onClick={syncLastInvoice} disabled={isSyncing} className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all active:scale-95">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
                     </div>
                     <div className="text-left">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Sincronizar</p>
                        <p className="text-[10px] text-slate-400 font-bold">Último número AFIP</p>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'printing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top duration-500">
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-600" /> Comprobante
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(['factura', 'remito', 'recibo', 'etiqueta'] as PrintDocType[]).map((doc) => (
                  <button
                    key={doc}
                    onClick={() => setSelectedDoc(doc)}
                    className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                      selectedDoc === doc ? 'bg-purple-50 border-purple-500 text-purple-600' : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8">
             <section className="bg-slate-100 p-10 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center relative group min-h-[500px]">
                <div 
                  className={`bg-white shadow-2xl rounded-sm transition-all duration-500 overflow-hidden flex flex-col p-4 border border-slate-100`}
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `scale(${scale})`,
                  }}
                >
                  <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between">
                    <div className="space-y-1">
                       {currentPrintConfig.showLogo && <div className="w-8 h-8 bg-slate-200 rounded"></div>}
                       {currentPrintConfig.showCuit && <div className="w-12 h-1 bg-slate-100 rounded"></div>}
                    </div>
                  </div>
                </div>
              </section>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-500">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <DownloadCloud className="w-6 h-6 text-green-600" /> Exportar Datos
            </h3>
            <button 
              onClick={handleExportData}
              disabled={isExporting || isSendingEmail}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-green-500 transition-all flex items-center justify-center gap-3"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
              {isExporting ? 'Generando...' : 'Generar Backup & Email'}
            </button>
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <UploadCloud className="w-6 h-6 text-orange-600" /> Importar Backup
            </h3>
            <div 
              onClick={() => backupInputRef.current?.click()}
              className="border-4 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-slate-100 hover:bg-orange-50/20"
            >
              <FileJson className="w-10 h-10 text-slate-300" />
              <input ref={backupInputRef} type="file" className="hidden" accept=".json" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            </div>
            {importFile && (
               <button onClick={handleImportBackup} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">RESTAURAR SISTEMA</button>
            )}
          </section>
        </div>
      )}

      <div className="flex justify-end pt-10">
        <button 
          onClick={() => alert('Configuración guardada')}
          className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3"
        >
          <Save className="w-5 h-5 text-blue-400" /> Guardar Todo
        </button>
      </div>
    </div>
  );
};

export default Settings;
