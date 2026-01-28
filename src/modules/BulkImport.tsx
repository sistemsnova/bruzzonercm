
import React, { useState, useRef } from 'react';
import { 
  FileUp, Download, CheckCircle2, AlertCircle, 
  ChevronRight, ArrowLeft, Boxes, Users, 
  Truck, Tag, Layers, FileSpreadsheet,
<<<<<<< HEAD
  Settings, Search, Loader2, Info, X,
  MapPin, Image as ImageIcon, Globe, Zap
} from 'lucide-react';
import { Product } from '../types';
import { Client, Supplier } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import * as XLSX from 'xlsx';
=======
  Settings, Search, Loader2, Info, X
} from 'lucide-react';
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b

type EntityType = 'products' | 'clients' | 'suppliers' | 'brands' | 'categories';

interface MappingField {
  key: string;
  label: string;
  required: boolean;
}

const BulkImport: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
<<<<<<< HEAD
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importResults, setImportResults] = useState<{ total: number, new: number, updated: number, errors: number, logs: any[] } | null>(null);
  
  const { addProduct, addClient, addSupplier, addBrand, addCategory } = useFirebase();
=======
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for selected file
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b

  const entities = [
    { id: 'products', label: 'Artículos', icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Precios, stock y códigos' },
    { id: 'clients', label: 'Clientes', icon: Users, color: 'text-green-600', bg: 'bg-green-100', desc: 'CUIT, contactos y saldos' },
    { id: 'suppliers', label: 'Proveedores', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Datos fiscales y descuentos' },
    { id: 'brands', label: 'Marcas', icon: Tag, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Listado maestro de marcas' },
    { id: 'categories', label: 'Rubros', icon: Layers, color: 'text-pink-600', bg: 'bg-pink-100', desc: 'Categorización del catálogo' },
  ];

  const getMappingFields = (entity: EntityType): MappingField[] => {
    switch (entity) {
      case 'products': return [
<<<<<<< HEAD
        { key: 'sku', label: 'Código SKU / Interno', required: true },
        { key: 'name', label: 'Nombre del Producto', required: true },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Categoría / Rubro', required: false },
        { key: 'costPrice', label: 'Precio Costo Neto', required: true },
        { key: 'salePrice', label: 'Precio Venta Final', required: false },
        { key: 'stock', label: 'Stock Actual', required: false },
        { key: 'supplierName', label: 'Nombre Proveedor', required: false },
        { key: 'location', label: 'Ubicación Depósito', required: false },
        { key: 'barcode', label: 'Código de Barras', required: false },
=======
        { key: 'sku', label: 'Código SKU / Interno (CODIGO Propio)', required: true },
        { key: 'name', label: 'Descripción del Producto (Nombre)', required: true },
        { key: 'brand', label: 'Marca (Marca)', required: true },
        { key: 'category', label: 'Rubro / Categoría (Rubro)', required: true },
        { key: 'costPrice', label: 'Precio Costo Neto (Costo)', required: true },
        { key: 'salePrice', label: 'Precio Venta Sugerido', required: false }, // This would be calculated, or mapped if a specific column provides it
        { key: 'stock', label: 'Stock Inicial (Stock)', required: false },
        { key: 'minStock', label: 'Stock Mínimo (StockMinimo)', required: false },
        { key: 'targetStock', label: 'Stock Máximo / Ideal (StockMaximo)', required: false },
        { key: 'reorderPoint', label: 'Punto de Reorden (Punto pedido)', required: false },
        { key: 'supplierName', label: 'Nombre Proveedor (Proveedor)', required: true }, // Used to resolve supplierId
        { key: 'supplierProductCode', label: 'Código de Proveedor (Cod PROV)', required: false },
        { key: 'purchaseCurrency', label: 'Moneda de Compra (MonedaCompra)', required: false },
        { key: 'saleCurrency', label: 'Moneda de Venta (MonedaVenta)', required: false },
        { key: 'markupPercentage', label: 'Margen de Ganancia (%) (Porcentaje ganancia)', required: false },
        { key: 'barcode', label: 'Código de Barras (Codigo de Barras)', required: false },
        { key: 'purchaseUnitName', label: 'Unidad de Medida Compra (1DeMedidaCompra)', required: false },
        { key: 'discount1', label: 'Descuento Proveedor 1 (%) (descuento 1)', required: false },
        { key: 'discount2', label: 'Descuento Proveedor 2 (%) (descuento 2)', required: false },
        { key: 'discount3', label: 'Descuento Proveedor 3 (%) (descuento 3)', required: false },
        { key: 'listCost', label: 'Costo de Lista (COSTOS LISTA)', required: false },
        { key: 'otherCode1', label: 'Otro Código (OtrosCodigos1)', required: false },
        { key: 'otherCode2', label: 'Otro Código (OtrosCodigos2)', required: false },
        { key: 'otherCode3', label: 'Otro Código (OtrosCodigos3)', required: false },
        // 'PrecioConTasaBonificadoView' and 'Tasa' are likely derived/calculated fields, not direct mappings for input.
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      ];
      case 'clients': return [
        { key: 'name', label: 'Razón Social / Nombre', required: true },
        { key: 'cuit', label: 'CUIT / DNI', required: true },
        { key: 'email', label: 'Email', required: false },
<<<<<<< HEAD
        { key: 'whatsapp', label: 'WhatsApp', required: false },
        { key: 'address', label: 'Dirección', required: false },
        { key: 'locality', label: 'Localidad', required: false },
        { key: 'ivaCondition', label: 'Situación Fiscal', required: false },
=======
        { key: 'phone', label: 'WhatsApp / Tel', required: false },
        { key: 'balance', label: 'Saldo Inicial', required: false },
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      ];
      case 'suppliers': return [
        { key: 'name', label: 'Razón Social / Nombre', required: true },
        { key: 'cuit', label: 'CUIT', required: true },
<<<<<<< HEAD
        { key: 'supplierCode', label: 'N° / Código Proveedor', required: false },
        { key: 'email', label: 'Email', required: false },
        { key: 'phone', label: 'Teléfono', required: false },
        { key: 'address', label: 'Dirección', required: false },
        { key: 'locality', label: 'Localidad', required: false },
        { key: 'ivaCondition', label: 'Situación Fiscal', required: false },
      ];
      case 'brands': return [
        { key: 'name', label: 'Nombre de Marca', required: true },
        { key: 'description', label: 'Descripción', required: false },
      ];
      case 'categories': return [
        { key: 'name', label: 'Nombre de Rubro', required: true },
        { key: 'description', label: 'Descripción', required: false },
      ];
      default: return [];
=======
        { key: 'email', label: 'Email', required: false },
        { key: 'phone', label: 'Teléfono', required: false },
        { key: 'discount1', label: 'Descuento 1 (%)', required: false },
        { key: 'discount2', label: 'Descuento 2 (%)', required: false },
        { key: 'discount3', label: 'Descuento 3 (%)', required: false },
        { key: 'balance', label: 'Saldo Inicial', required: false },
      ];
      case 'brands': return [
        { key: 'name', label: 'Nombre de Marca', required: true },
        { key: 'origin', label: 'País de Origen', required: false },
      ];
      case 'categories': return [
        { key: 'name', label: 'Nombre de Categoría', required: true },
        { key: 'description', label: 'Descripción', required: false },
      ];
      default: return [{ key: 'name', label: 'Nombre / Descripción', required: true }];
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
<<<<<<< HEAD
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length > 0) {
          const headers = (data[0] as string[]).map(h => h?.toString().trim());
          setFileHeaders(headers);
          
          // Parse all rows as objects using headers
          const rows = XLSX.utils.sheet_to_json(ws);
          setParsedData(rows);

          // Auto-mapping logic: try to find exact or similar matches
          const initialMappings: Record<string, string> = {};
          const fields = getMappingFields(selectedEntity!);
          fields.forEach(field => {
            const match = headers.find(h => h.toLowerCase() === field.label.toLowerCase() || h.toLowerCase() === field.key.toLowerCase());
            if (match) initialMappings[field.key] = match;
          });
          setMappings(initialMappings);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleMappingChange = (fieldKey: string, headerValue: string) => {
    setMappings(prev => ({ ...prev, [fieldKey]: headerValue }));
  };

  const processImport = async () => {
    if (!selectedEntity || parsedData.length === 0) return;
    
    // Check required fields
    const fields = getMappingFields(selectedEntity);
    const missing = fields.filter(f => f.required && !mappings[f.key]);
    if (missing.length > 0) {
      alert(`Por favor mapea los campos requeridos: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setIsAnalyzing(true);
    let success = 0;
    let errors = 0;
    const logs: any[] = [];

    try {
      for (const row of parsedData) {
        try {
          const data: any = {};
          fields.forEach(f => {
            const excelHeader = mappings[f.key];
            if (excelHeader && row[excelHeader] !== undefined) {
              data[f.key] = row[excelHeader].toString().trim();
            }
          });

          // Entity-specific data cleaning
          if (selectedEntity === 'products') {
            data.costPrice = parseFloat(data.costPrice?.replace('$', '') || '0');
            data.salePrice = data.salePrice ? parseFloat(data.salePrice.toString().replace('$', '')) : data.costPrice * 1.3;
            data.stock = parseInt(data.stock?.toString() || '0');
            data.primaryUnit = data.primaryUnit || 'unidad';
            data.saleUnit = data.saleUnit || 'unidad';
            await addProduct(data);
          } else if (selectedEntity === 'clients') {
            data.balance = 0;
            data.priceListId = 'price-list-base';
            data.authorizedPersons = [];
            await addClient(data);
          } else if (selectedEntity === 'suppliers') {
            data.balance = 0;
            data.discounts = [];
            await addSupplier(data);
          } else if (selectedEntity === 'brands') {
            await addBrand(data);
          } else if (selectedEntity === 'categories') {
            await addCategory(data);
          }
          
          success++;
        } catch (err) {
          errors++;
          logs.push({ row, error: "Error de formato o conexión" });
        }
      }

      setImportResults({
        total: parsedData.length,
        new: success,
        updated: 0,
        errors: errors,
        logs: logs
      });
      setStep(4);
    } catch (globalErr) {
      alert("Error crítico durante la importación.");
    } finally {
      setIsAnalyzing(false);
    }
=======
    } else {
      setSelectedFile(null);
    }
  };

  const startAnalysis = () => {
    if (!selectedFile) return; // Should be disabled by button state, but good to have
    setIsAnalyzing(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsAnalyzing(false);
        setStep(4);
      }
    }, 200);
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Importación Masiva de Datos</h1>
<<<<<<< HEAD
          <p className="text-slate-500">Migra tu información desde archivos Excel (.xlsx) de forma rápida.</p>
        </div>
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver
=======
          <p className="text-slate-500">Migra tu información desde archivos Excel de forma rápida y segura.</p>
        </div>
        {step > 1 && (
          <button 
            onClick={() => { 
              setStep(step - 1); 
              setSelectedFile(null); // Clear selected file if going back
              setIsAnalyzing(false);
              setUploadProgress(0);
            }}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver al paso anterior
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          </button>
        )}
      </header>

      {/* Progress Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mb-8 overflow-x-auto">
        {[
<<<<<<< HEAD
          { id: 1, label: 'Tipo' },
          { id: 2, label: 'Archivo' },
          { id: 3, label: 'Mapeo' },
          { id: 4, label: 'Resultado' },
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-3 shrink-0 ${step === s.id ? 'text-orange-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${
                step >= s.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100'
              }`}>
                {s.id}
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
=======
          { id: 1, label: 'Seleccionar Tipo', icon: Settings },
          { id: 2, label: 'Cargar Archivo', icon: FileUp },
          { id: 3, label: 'Mapear Columnas', icon: Search },
          { id: 4, label: 'Análisis y Carga', icon: CheckCircle2 },
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-3 shrink-0 ${step === s.id ? 'text-orange-600' : 'text-slate-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
                step >= s.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100'
              }`}>
                {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.id}
              </div>
              <span className="text-xs font-black uppercase tracking-widest hidden md:block">{s.label}</span>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
            </div>
            {i < 3 && <ChevronRight className="w-5 h-5 text-slate-100" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Entity */}
      {step === 1 && (
<<<<<<< HEAD
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
=======
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-in slide-in-from-bottom duration-300">
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          {entities.map(entity => (
            <button
              key={entity.id}
              onClick={() => { setSelectedEntity(entity.id as EntityType); setStep(2); }}
              className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 transition-all flex flex-col items-center text-center group"
            >
              <div className={`p-5 ${entity.bg} ${entity.color} rounded-[1.5rem] mb-6 group-hover:scale-110 transition-transform`}>
                <entity.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{entity.label}</h3>
<<<<<<< HEAD
              <p className="text-xs text-slate-400 font-medium">{entity.desc}</p>
=======
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{entity.desc}</p>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && selectedEntity && (
<<<<<<< HEAD
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12 text-center space-y-8">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase">Cargar archivo de {entities.find(e => e.id === selectedEntity)?.label}</h2>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 hover:border-orange-200 hover:bg-orange-50/20 transition-all cursor-pointer"
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="w-12 h-12 text-orange-600" />
                  <p className="font-bold text-slate-800">{selectedFile.name}</p>
                </div>
              ) : (
                <>
                  <FileUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-bold text-slate-400">Selecciona o arrastra el archivo Excel (.xlsx)</p>
                </>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx" onChange={handleFileChange} />
            </div>
            {selectedFile && (
              <button 
                onClick={() => setStep(3)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl"
              >
                Continuar al Mapeo
              </button>
            )}
=======
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12 text-center space-y-8 animate-in zoom-in duration-300">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
              <FileSpreadsheet className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cargar archivo de {entities.find(e => e.id === selectedEntity)?.label}</h2>
            <p className="text-slate-500">Arrastra tu archivo Excel (.xlsx) o CSV aquí para comenzar el proceso de importación.</p>
            
            <div 
              onClick={() => fileInputRef.current?.click()} // Trigger hidden input click
              className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 hover:border-orange-200 hover:bg-orange-50/20 transition-all cursor-pointer group"
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4">
                  <FileSpreadsheet className="w-12 h-12 text-orange-600 mx-auto" />
                  <p className="font-bold text-slate-800 text-lg">{selectedFile.name}</p>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); // Prevent triggering parent div's onClick
                      setSelectedFile(null); 
                      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
                  >
                    <X className="w-4 h-4" /> Cambiar Archivo
                  </button>
                </div>
              ) : (
                <>
                  <FileUp className="w-12 h-12 text-slate-300 mx-auto mb-4 group-hover:text-orange-400" />
                  <p className="font-bold text-slate-400 group-hover:text-orange-600">Haz clic o arrastra el archivo aquí</p>
                </>
              )}
              <input 
                ref={fileInputRef} 
                type="file" 
                className="hidden" 
                accept=".xlsx,.csv" 
                onChange={handleFileChange} 
              />
            </div>

            <div className="flex justify-center gap-4">
               <button className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">
                 <Download className="w-4 h-4" /> Descargar Plantilla Modelo
               </button>
            </div>

            <button 
              onClick={() => setStep(3)}
              disabled={!selectedFile} // Disable if no file is selected
              className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar al Mapeo
            </button>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          </div>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step === 3 && selectedEntity && (
<<<<<<< HEAD
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 bg-slate-50/50 border-b">
               <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                 <Settings className="w-6 h-6 text-orange-600" /> Vincular Columnas
               </h3>
               <p className="text-slate-500 text-sm">Empareja los campos de FerroGest con los de tu archivo.</p>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {getMappingFields(selectedEntity).map(field => (
                <div key={field.key} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
=======
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-300">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                 <Settings className="w-6 h-6 text-orange-600" /> Mapeo de Columnas
               </h3>
               <p className="text-slate-500 text-sm mt-1">Vincula los campos del sistema con las columnas de tu archivo Excel.</p>
            </div>
            
            <div className="p-8 space-y-6">
              {getMappingFields(selectedEntity).map(field => (
                <div key={field.key} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </p>
                    <p className="text-sm font-bold text-slate-700">Campo FerroGest</p>
                  </div>
<<<<<<< HEAD
                  <ChevronRight className="hidden md:block w-5 h-5 text-slate-200" />
                  <div className="flex-1">
                    <select 
                      value={mappings[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                    >
                       <option value="">-- No Mapear --</option>
                       {fileHeaders.map((header, idx) => (
                         <option key={idx} value={header}>{header}</option>
                       ))}
=======
                  <ChevronRight className="hidden md:block w-5 h-5 text-slate-200 group-hover:text-orange-400 transition-colors" />
                  <div className="flex-1">
                    <select className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white appearance-none">
                       <option>Seleccionar Columna Excel...</option>
                       <option>Columna A (Dato 1)</option>
                       <option>Columna B (Dato 2)</option>
                       <option>Columna C (Dato 3)</option>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
               <Info className="absolute -top-6 -right-6 w-32 h-32 text-white/5 -rotate-12" />
               <div className="relative z-10 space-y-4">
<<<<<<< HEAD
                 <h4 className="text-lg font-black uppercase">Resumen de Carga</h4>
                 <p className="text-slate-400 text-sm">Registros encontrados: <span className="text-white font-bold">{parsedData.length}</span></p>
                 <p className="text-slate-400 text-xs italic">Asegúrate de que los tipos de datos (números, fechas) sean correctos en tu Excel.</p>
               </div>
            </div>
            <button 
              onClick={processImport}
              disabled={isAnalyzing}
              className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
=======
                 <h4 className="text-lg font-black uppercase tracking-tight">Consejos de Importación</h4>
                 <ul className="space-y-3 text-sm text-slate-400">
                   <li className="flex gap-2">
                     <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                     <span>Asegúrate de que no haya filas vacías al inicio.</span>
                   </li>
                   <li className="flex gap-2">
                     <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                     <span>Los montos deben ser numéricos sin símbolos de moneda.</span>
                   </li>
                   <li className="flex gap-2">
                     <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                     <span>El CUIT debe ser solo números (20334445551).</span>
                   </li>
                 </ul>
               </div>
            </div>

            <button 
              onClick={startAnalysis}
              className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95"
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Procesar e Importar'}
            </button>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Step 4: Results */}
      {step === 4 && importResults && (
        <div className="space-y-8 animate-in zoom-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Procesado</p>
                <h3 className="text-4xl font-black text-slate-800">{importResults.total}</h3>
              </div>
              <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Importados con Éxito</p>
                <h3 className="text-4xl font-black text-green-800">{importResults.new}</h3>
              </div>
              <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Registros con Error</p>
                <h3 className="text-4xl font-black text-red-800">{importResults.errors}</h3>
              </div>
           </div>

           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
              <p className="text-sm font-medium text-slate-500 mb-6">La importación ha finalizado. Puedes revisar tus datos en el módulo correspondiente.</p>
              <button 
                onClick={() => { setStep(1); setSelectedFile(null); setImportResults(null); }}
                className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
              >
                Finalizar
              </button>
=======
      {/* Step 4: Analysis & Results */}
      {step === 4 && (
        <div className="space-y-8 animate-in zoom-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registros</p>
                <h3 className="text-4xl font-black text-slate-800">1.248</h3>
              </div>
              <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Nuevos</p>
                <h3 className="text-4xl font-black text-green-800">952</h3>
              </div>
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Actualizados</p>
                <h3 className="text-4xl font-black text-blue-800">284</h3>
              </div>
              <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Errores</p>
                <h3 className="text-4xl font-black text-red-800">12</h3>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vista Previa del Análisis</h3>
                <button className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Ver Solo Errores</button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <tr>
                        <th className="px-8 py-5">Identificador</th>
                        <th className="px-8 py-5">Nombre / Descripción</th>
                        <th className="px-8 py-5">Estado</th>
                        <th className="px-8 py-5">Motivo / Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       <tr className="text-sm">
                         <td className="px-8 py-5 font-bold">77912345678</td>
                         <td className="px-8 py-5">MARTILLO STANLEY 20OZ</td>
                         <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">Actualización</span></td>
                         <td className="px-8 py-5 text-slate-400 italic font-medium">Actualiza precio de $4500 a $5200</td>
                       </tr>
                       <tr className="text-sm">
                         <td className="px-8 py-5 font-bold">20-44555666-1</td>
                         <td className="px-8 py-5">FERRETERIA SAN CARLOS</td>
                         <td className="px-8 py-5"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Nuevo</span></td>
                         <td className="px-8 py-5 text-slate-400 italic font-medium">Alta de nuevo registro</td>
                       </tr>
                       <tr className="text-sm bg-red-50/30">
                         <td className="px-8 py-5 font-bold text-red-600">ERROR-404</td>
                         <td className="px-8 py-5 text-red-400 italic">SIN NOMBRE</td>
                         <td className="px-8 py-5"><span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest">Error crítico</span></td>
                         <td className="px-8 py-5 text-red-600 font-bold flex items-center gap-2">
                           <AlertCircle className="w-4 h-4" /> Falta campo requerido (Nombre)
                         </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-slate-500">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium leading-relaxed max-w-lg">
                  Se encontraron 12 registros con errores que no podrán ser importados. Puedes corregirlos en tu Excel y re-intentar, o continuar ignorando esos registros.
                </p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button onClick={() => setStep(1)} className="flex-1 md:flex-none py-4 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Descartar todo</button>
                <button 
                  onClick={() => { alert('¡Carga completada con éxito!'); setStep(1); }}
                  className="flex-1 md:flex-none py-4 px-12 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                >
                  Confirmar y Cargar Datos <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
           </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
<<<<<<< HEAD
=======
    
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
