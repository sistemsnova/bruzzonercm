
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
<<<<<<< HEAD
  Trash2, UploadCloud, FileUp, Send, Percent, CreditCard,
  TrendingUp
=======
  Trash2, UploadCloud, FileUp, Send
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
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
=======
      [name]: type === 'checkbox' ? checked : value
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
      // Simulamos la llamada a una API de envío de correo
      await new Promise(resolve => setTimeout(resolve, 3000));
=======
      // Simulamos la llamada a una API de envío de correo (ej. SendGrid o un backend propio)
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log(`Backup "${filename}" enviado exitosamente a ${BACKUP_EMAIL_TARGET}`);
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      setEmailSent(true);
    } catch (error) {
      console.error("Error al enviar backup por email:", error);
    } finally {
      setIsSendingEmail(false);
<<<<<<< HEAD
=======
      // Ocultamos el mensaje de éxito después de unos segundos
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
      
<<<<<<< HEAD
=======
      // 1. Descarga local
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
<<<<<<< HEAD
=======
      // 2. Envío automático por email solicitado por el usuario
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      await sendBackupToEmail(data, filename);
      
    } catch (error) {
      console.error('Error al generar backup:', error);
<<<<<<< HEAD
      alert('Error al generar backup.');
=======
      alert('Error al generar backup. Consulte la consola para más detalles.');
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    if (!importFile) return;
    if (deleteConfirmationPassword !== MASTER_DELETE_PASSWORD) {
<<<<<<< HEAD
      alert('Debe ingresar la contraseña de seguridad.');
=======
      alert('Debe ingresar la contraseña de seguridad para confirmar la restauración total.');
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          await importAllData(json);
<<<<<<< HEAD
          alert('¡Sistema restaurado al 100% con éxito!');
          window.location.reload();
        } catch (err) {
          alert('Archivo inválido.');
=======
          alert('¡Sistema restaurado al 100% con éxito! La página se recargará para reflejar los cambios.');
          window.location.reload();
        } catch (err) {
          console.error('Error al procesar JSON de backup:', err);
          alert('El archivo no tiene un formato de respaldo válido.');
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          setIsImporting(false);
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
<<<<<<< HEAD
=======
      console.error('Error al importar:', error);
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      alert('Error al importar backup.');
      setIsImporting(false);
    }
  };

  const handleConfirmDeleteAllData = async () => {
    if (deleteConfirmationPassword !== MASTER_DELETE_PASSWORD) {
<<<<<<< HEAD
      alert('Contraseña incorrecta.');
=======
      alert('Contraseña de seguridad incorrecta.');
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
      alert('Todos los datos han sido eliminados.');
    } catch (error) {
      alert('Error al eliminar datos.');
=======
      alert('Todos los datos han sido eliminados del sistema.');
    } catch (error) {
      console.error('Error al eliminar todos los datos:', error);
      alert('Error al eliminar todos los datos. Consulte la consola para más detalles.');
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationPassword('');
    }
  };

  const getPreviewDimensions = () => {
<<<<<<< HEAD
    let baseW = 210, baseH = 297, scale = 1.2;
    if (!currentPrintConfig) return { width: baseW, height: baseH, scale };
    switch(currentPrintConfig.pageSize) {
      case 'A5': baseW = 148; baseH = 210; scale = 1.6; break;
      case 'A6': baseW = 105; baseH = 148; scale = 2.0; break;
      case '80mm': baseW = 80; baseH = 250; scale = 1.8; break;
    }
    if (currentPrintConfig.orientation === 'landscape') return { width: baseH, height: baseW, scale: scale * 0.8 };
=======
    let baseW = 210;
    let baseH = 297;
    let scale = 1.2;

    if (!currentPrintConfig) return { width: baseW, height: baseH, scale };

    switch(currentPrintConfig.pageSize) {
      case 'A5': 
        baseW = 148; baseH = 210; scale = 1.6;
        break;
      case 'A6': 
        baseW = 105; baseH = 148; scale = 2.0;
        break;
      case '80mm': 
        baseW = 80; baseH = 250; scale = 1.8;
        break;
    }

    if (currentPrintConfig.orientation === 'landscape') {
      return { width: baseH, height: baseW, scale: scale * 0.8 };
    }

>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
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
=======
                  <input name="name" value={companyInfo.name} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT</label>
                  <input name="cuit" value={companyInfo.cuit} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condición IVA</label>
                  <select name="ivaCondition" value={companyInfo.ivaCondition} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none font-bold bg-white">
                    <option>Responsable Inscripto</option>
                    <option>Monotributista</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                  <input name="address" value={companyInfo.address} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
                </div>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
=======
                      <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Certificado:</span>
                            <span className="text-green-400 font-black">VÁLIDO</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Vencimiento:</span>
                            <span className="text-white font-bold">{new Date(companyInfo.arca.crtValidUntil).toLocaleDateString()}</span>
                         </div>
                      </div>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
=======
              <div className="lg:col-span-2">
                <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Punto de Venta</label>
                         <input type="number" name="puntoVenta" value={companyInfo.arca.puntoVenta} onChange={handleArcaChange} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black text-xl" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ingresos Brutos</label>
                         <input name="iibb" value={companyInfo.arca.iibb} onChange={handleArcaChange} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-bold" />
                      </div>
                   </div>
                </section>
              </div>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
           </div>
        </div>
      )}

      {activeTab === 'printing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top duration-500">
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
<<<<<<< HEAD
                <Scissors className="w-4 h-4 text-purple-600" /> Comprobante
=======
                <Scissors className="w-4 h-4 text-purple-600" /> Comprobante a Configurar
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
          </div>

          <div className="lg:col-span-8">
             <section className="bg-slate-100 p-10 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center relative group min-h-[500px]">
=======

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-purple-600" /> Formato de Hoja
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tamaño de Papel</label>
                  <select 
                    value={currentPrintConfig.pageSize}
                    onChange={(e) => handlePrintConfigChange('pageSize', e.target.value)}
                    className="w-full px-5 py-3 border-2 border-slate-100 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="A4">A4 (Oficina)</option>
                    <option value="A5">A5 (Media Hoja)</option>
                    <option value="A6">A6 (1/4 A4 - Folleto)</option>
                    <option value="80mm">Ticket 80mm (Térmica)</option>
                    <option value="58mm">Ticket 58mm (Térmica)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Orientación</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePrintConfigChange('orientation', 'portrait')}
                      className={`flex-1 py-3 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPrintConfig.orientation === 'portrait' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                      Vertical
                    </button>
                    <button 
                      onClick={() => handlePrintConfigChange('orientation', 'landscape')}
                      className={`flex-1 py-3 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPrintConfig.orientation === 'landscape' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                      Horizontal
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <LayoutPanelTop className="w-4 h-4 text-purple-600" /> Márgenes (mm)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {(['top', 'bottom', 'left', 'right'] as const).map((margin) => (
                  <div key={margin} className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest capitalize">{margin}</label>
                    <input 
                      type="number" 
                      value={currentPrintConfig.margins[margin]} 
                      onChange={(e) => handleMarginChange(margin, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border-2 border-slate-50 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-purple-500" 
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                  <Type className="w-6 h-6 text-purple-600" /> Información a Mostrar
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'showLogo', label: 'Logo de Empresa' },
                    { key: 'showCuit', label: 'CUIT y Datos Fiscales' },
                    { key: 'showAddress', label: 'Domicilio Comercial' },
                    { key: 'showLegal', label: 'Leyendas Legales / Pie' },
                    { key: 'showQr', label: 'QR ARCA (Factura E)' },
                    { key: 'showPrices', label: 'Mostrar Precios / Importes' },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600">{field.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(currentPrintConfig as any)[field.key]} 
                          onChange={(e) => handlePrintConfigChange(field.key as keyof PrintSettings, e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Número de Copias</label>
                     <div className="flex items-center gap-4">
                        <input 
                          type="range" min="1" max="5" 
                          value={currentPrintConfig.copies} 
                          onChange={(e) => handlePrintConfigChange('copies', parseInt(e.target.value))}
                          className="flex-1 accent-purple-600" 
                        />
                        <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black">{currentPrintConfig.copies}</span>
                     </div>
                  </div>
                </div>
              </section>

              <section className="bg-slate-100 p-10 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center relative group min-h-[500px]">
                <div className="absolute top-6 left-6 flex items-center gap-2 text-slate-400">
                   <Eye className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest italic">Simulación: {selectedDoc}</span>
                </div>
                
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                <div 
                  className={`bg-white shadow-2xl rounded-sm transition-all duration-500 overflow-hidden flex flex-col p-4 border border-slate-100`}
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `scale(${scale})`,
<<<<<<< HEAD
=======
                    paddingTop: `${currentPrintConfig.margins.top / 3}px`,
                    paddingBottom: `${currentPrintConfig.margins.bottom / 3}px`,
                    paddingLeft: `${currentPrintConfig.margins.left / 3}px`,
                    paddingRight: `${currentPrintConfig.margins.right / 3}px`,
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                  }}
                >
                  <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between">
                    <div className="space-y-1">
                       {currentPrintConfig.showLogo && <div className="w-8 h-8 bg-slate-200 rounded"></div>}
                       {currentPrintConfig.showCuit && <div className="w-12 h-1 bg-slate-100 rounded"></div>}
                    </div>
<<<<<<< HEAD
                  </div>
                </div>
              </section>
=======
                    <div className="text-[6px] font-black text-slate-300">N° {selectedDoc === 'factura' ? '0005-00001234' : 'RE-001234'}</div>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                     <div className="w-full h-2 bg-slate-50 rounded"></div>
                     <div className="grid grid-cols-4 gap-1">
                        <div className="h-1 bg-slate-100 rounded"></div>
                        <div className="h-1 bg-slate-100 rounded col-span-2"></div>
                        {currentPrintConfig.showPrices && <div className="h-1 bg-slate-100 rounded text-right"></div>}
                     </div>
                     {[1,2,3,4,5].map(i => (
                       <div key={i} className="flex justify-between py-0.5 border-b border-slate-50 border-dotted">
                          <div className="w-20 h-1 bg-slate-50 rounded"></div>
                          {currentPrintConfig.showPrices && <div className="w-4 h-1 bg-slate-50 rounded"></div>}
                       </div>
                     ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-1 items-end">
                     {currentPrintConfig.showPrices && (
                        <>
                          <div className="w-12 h-1 bg-slate-100 rounded"></div>
                          <div className="w-16 h-2 bg-purple-100 rounded"></div>
                        </>
                     )}
                     {currentPrintConfig.showQr && (
                       <div className="w-6 h-6 bg-slate-900 self-start mt-1 rounded-sm flex items-center justify-center">
                          <div className="w-3 h-3 bg-white/10 rounded-full animate-pulse"></div>
                       </div>
                     )}
                  </div>
                </div>

                <div className="absolute bottom-6 flex flex-col items-center gap-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{currentPrintConfig.pageSize} • {currentPrintConfig.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}</p>
                   <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                      <Printer className="w-4 h-4" /> Imprimir Prueba
                   </button>
                </div>
              </section>
            </div>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-500">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
<<<<<<< HEAD
              <DownloadCloud className="w-6 h-6 text-green-600" /> Exportar Datos
            </h3>
            <button 
              onClick={handleExportData}
              disabled={isExporting || isSendingEmail}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-green-500 transition-all flex items-center justify-center gap-3"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
              {isExporting ? 'Generando...' : 'Generar Backup & Email'}
=======
              <DownloadCloud className="w-6 h-6 text-green-600" /> Exportar Datos (Backup)
            </h3>
            <p className="text-slate-500 text-sm">Genera un archivo JSON con todos los datos de tu ferretería para guardarlo de forma segura.</p>
            
            {/* Status de Envío de Email */}
            {isSendingEmail && (
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-3xl flex items-center gap-4 animate-pulse">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-black text-blue-900 uppercase">Seguridad Redundante</p>
                  <p className="text-xs text-blue-700">Enviando copia a <span className="font-bold">{BACKUP_EMAIL_TARGET}</span>...</p>
                </div>
              </div>
            )}

            {emailSent && (
              <div className="p-5 bg-green-50 border border-green-200 rounded-3xl flex items-center gap-4 animate-in fade-in duration-300">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm font-black text-green-900 uppercase">Respaldo Protegido</p>
                  <p className="text-xs text-green-700">Backup enviado con éxito a la casilla de soporte.</p>
                </div>
              </div>
            )}

            <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 flex items-start gap-4">
              <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-900">Importante:</p>
                <p className="text-xs text-green-700 mt-1">Este respaldo permite restaurar el sistema al estado actual. Se descargará un archivo y se enviará una copia a su soporte.</p>
              </div>
            </div>
            
            <button 
              onClick={handleExportData}
              disabled={isExporting || isSendingEmail}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-green-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
              {isExporting ? 'Generando Backup...' : 'Generar Backup & Enviar Email'}
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
            </button>
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
<<<<<<< HEAD
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
=======
              <UploadCloud className="w-6 h-6 text-orange-600" /> Importar Backup (Restaurar)
            </h3>
            <p className="text-slate-500 text-sm">Carga un archivo de respaldo para restaurar el sistema al 100%. **Esto sobrescribirá los datos actuales.**</p>
            
            <div 
              onClick={() => backupInputRef.current?.click()}
              className={`border-4 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${importFile ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200 hover:bg-orange-50/20'}`}
            >
              <div className={`p-4 rounded-full mb-4 ${importFile ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                <FileJson className="w-10 h-10" />
              </div>
              <p className={`text-sm font-bold ${importFile ? 'text-orange-900' : 'text-slate-400'}`}>
                {importFile ? importFile.name : 'Haz clic para seleccionar el archivo JSON'}
              </p>
              <input 
                ref={backupInputRef} 
                type="file" 
                className="hidden" 
                accept=".json" 
                onChange={(e) => setImportFile(e.target.files?.[0] || null)} 
              />
            </div>

            {importFile && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar con Contraseña Maestra</label>
                  <input
                    type="password"
                    value={deleteConfirmationPassword}
                    onChange={(e) => setDeleteConfirmationPassword(e.target.value)}
                    placeholder="Escribe 'BORRARTODO' para restaurar"
                    className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-600"
                  />
                </div>
                <button 
                  onClick={handleImportBackup}
                  disabled={isImporting || deleteConfirmationPassword !== MASTER_DELETE_PASSWORD}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5 text-orange-500" />}
                  RESTAURAR TODO EL SISTEMA
                </button>
              </div>
            )}
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 col-span-full">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <Eraser className="w-6 h-6 text-red-600" /> Borrado Total
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex-1 space-y-2">
                 <p className="text-slate-500 text-sm">Esta acción es **IRREVERSIBLE**. Eliminará todos los productos, clientes, proveedores, ventas, etc. de tu sistema.</p>
                 <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900">ADVERTENCIA CRÍTICA:</p>
                    <p className="text-xs text-red-700 mt-1">No hay marcha atrás. Asegúrate de tener un backup reciente antes de proceder.</p>
                  </div>
                </div>
               </div>
               <button 
                onClick={() => setShowDeleteConfirmModal(true)}
                className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-500 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Trash2 className="w-5 h-5" /> Borrar Base de Datos
              </button>
            </div>
          </section>

          {showDeleteConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 text-center">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/10">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">¡ATENCIÓN! Eliminación Irreversible</h2>
                <p className="text-slate-500 font-medium mb-8 px-4">
                  Estás a punto de borrar **TODOS** los datos de tu empresa (productos, clientes, ventas, etc.).
                  Esta acción no se puede deshacer. ¿Estás absolutamente seguro?
                </p>
                <div className="space-y-4">
                  <input
                    type="password"
                    value={deleteConfirmationPassword}
                    onChange={(e) => setDeleteConfirmationPassword(e.target.value)}
                    placeholder="Escribe 'BORRARTODO' para confirmar"
                    className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-600 text-center"
                  />
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleConfirmDeleteAllData}
                      disabled={deleteConfirmationPassword !== MASTER_DELETE_PASSWORD || isDeleting}
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-500 transition-all disabled:opacity-50"
                    >
                      SÍ, ENTIENDO Y QUIERO BORRAR TODO
                    </button>
                    <button 
                      onClick={() => { setShowDeleteConfirmModal(false); setDeleteConfirmationPassword(''); }}
                      className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in slide-in-from-left duration-500">
          {isAdmin ? (
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Layout className="w-5 h-5 text-orange-500" /> Plan de Suscripción Actual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'basic', name: 'Basic', price: '$15.000/mes', color: 'bg-slate-50 border-slate-200' },
                  { id: 'premium', name: 'Premium', price: '$25.000/mes', color: 'bg-orange-50 border-orange-200' },
                  { id: 'enterprise', name: 'Enterprise', price: '$45.000/mes', color: 'bg-purple-50 border-purple-200' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id as any)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all group ${
                      plan === p.id 
                        ? 'ring-4 ring-orange-500/20 border-orange-500 ' + p.color 
                        : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <h4 className="font-bold text-xl text-slate-800">{p.name}</h4>
                    <p className="text-slate-500 mb-4">{p.price}</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      plan === p.id ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {plan === p.id ? 'Activo' : 'Seleccionar'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Control Restringido</h3>
              <p className="text-sm text-slate-500">Solo administradores gestionan el plan.</p>
            </section>
          )}
        </div>
      )}
      
      <div className="flex justify-end pt-10">
        <button 
          onClick={() => alert('Configuración guardada en FerroGest')}
          className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95"
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
        >
          <Save className="w-5 h-5 text-blue-400" /> Guardar Todo
        </button>
      </div>
    </div>
  );
};

export default Settings;
