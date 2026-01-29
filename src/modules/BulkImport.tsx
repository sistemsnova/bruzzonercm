
import React, { useState, useRef } from 'react';
import { 
  FileUp, Download, CheckCircle2, AlertCircle, 
  ChevronRight, ArrowLeft, Boxes, Users, 
  Truck, Tag, Layers, FileSpreadsheet,
  Settings, Search, Loader2, Info, X,
  MapPin, Image as ImageIcon, Globe, Zap
} from 'lucide-react';
import { Product } from '../types';
import { Client, Supplier } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import * as XLSX from 'xlsx';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importResults, setImportResults] = useState<{ total: number, new: number, updated: number, errors: number, logs: any[] } | null>(null);
  
  const { addProduct, addClient, addSupplier, addBrand, addCategory } = useFirebase();

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
      ];
      case 'clients': return [
        { key: 'name', label: 'Razón Social / Nombre', required: true },
        { key: 'cuit', label: 'CUIT / DNI', required: true },
        { key: 'email', label: 'Email', required: false },
        { key: 'whatsapp', label: 'WhatsApp', required: false },
        { key: 'address', label: 'Dirección', required: false },
        { key: 'locality', label: 'Localidad', required: false },
        { key: 'ivaCondition', label: 'Situación Fiscal', required: false },
      ];
      case 'suppliers': return [
        { key: 'name', label: 'Razón Social / Nombre', required: true },
        { key: 'cuit', label: 'CUIT', required: true },
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
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Importación Masiva de Datos</h1>
          <p className="text-slate-500">Migra tu información desde archivos Excel (.xlsx) de forma rápida.</p>
        </div>
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver
          </button>
        )}
      </header>

      {/* Progress Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mb-8 overflow-x-auto">
        {[
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
            </div>
            {i < 3 && <ChevronRight className="w-5 h-5 text-slate-100" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Entity */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
              <p className="text-xs text-slate-400 font-medium">{entity.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && selectedEntity && (
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
          </div>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step === 3 && selectedEntity && (
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
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </p>
                    <p className="text-sm font-bold text-slate-700">Campo FerroGest</p>
                  </div>
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
                 <h4 className="text-lg font-black uppercase">Resumen de Carga</h4>
                 <p className="text-slate-400 text-sm">Registros encontrados: <span className="text-white font-bold">{parsedData.length}</span></p>
                 <p className="text-slate-400 text-xs italic">Asegúrate de que los tipos de datos (números, fechas) sean correctos en tu Excel.</p>
               </div>
            </div>
            <button 
              onClick={processImport}
              disabled={isAnalyzing}
              className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Procesar e Importar'}
            </button>
          </div>
        </div>
      )}

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
           </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
