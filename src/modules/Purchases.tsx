
import React, { useState, useRef } from 'react';
import { 
  Sparkles, Loader2, Plus, Trash2, 
  Save, X, Info, PackagePlus, 
  FileText, CheckCircle2, AlertTriangle,
  UploadCloud, ImageIcon, RefreshCw
} from 'lucide-react';
import { analyzeInvoice } from '../lib/geminiService';
import { useFirebase } from '../context/FirebaseContext';
import { Product } from '../types'; // Corrected import path for Product

// Define the PurchaseItem interface
interface PurchaseItem {
  id?: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  matchedProduct?: Product;
}

export const Purchases: React.FC = () => {
  const { updateProduct, fetchProductsPaginatedAndFiltered } = useFirebase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [purchaseMode, setPurchaseMode] = useState<'ia' | 'manual'>('ia');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{name: string, type: string, preview: string} | null>(null);
  
  const [purchaseData, setPurchaseData] = useState<{
    invoiceNumber: string;
    supplierName: string;
    date: string;
    items: PurchaseItem[];
  }>({
    invoiceNumber: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          preview: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const processWithIA = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    try {
      const base64Data = selectedFile.preview.split(',')[1];
      const result = await analyzeInvoice(base64Data, selectedFile.type);
      
      const enrichedItems = await Promise.all(result.items.map(async (item: any) => {
        const { products } = await fetchProductsPaginatedAndFiltered({
          limit: 1,
          searchTerm: item.sku || item.description.split(' ')[0],
          orderByField: 'name'
        });
        return { ...item, matchedProduct: products[0] };
      }));

      setPurchaseData({
        invoiceNumber: result.invoiceNumber || '',
        supplierName: result.supplierName || '',
        date: result.date || new Date().toISOString().split('T')[0],
        items: enrichedItems
      });
    } catch (error) {
      console.error(error);
      alert("Error al procesar el documento con IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinishPurchase = async () => {
    setIsFinishing(true);
    try {
      for (const item of purchaseData.items) {
        if (item.matchedProduct) {
          const newStock = (item.matchedProduct.stock || 0) + item.quantity;
          await updateProduct(item.matchedProduct.id, { 
            costPrice: item.unitPrice,
            stock: newStock
          });
        }
      }
      alert("Compra registrada. Inventario y costos actualizados.");
      setPurchaseData({ invoiceNumber: '', supplierName: '', date: '', items: [] });
      setSelectedFile(null);
    } finally {
      setIsFinishing(false);
    }
  };

  const subtotal = purchaseData.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compras e Ingreso de Mercadería</h1>
          <p className="text-slate-500">Carga facturas por IA o manualmente para actualizar tu stock.</p>
        </div>
        <div className="flex bg-white border p-1 rounded-xl shadow-sm">
          <button onClick={() => setPurchaseMode('ia')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${purchaseMode === 'ia' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Sparkles className="w-4 h-4" /> IA Scan
          </button>
          <button onClick={() => setPurchaseMode('manual')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${purchaseMode === 'manual' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Plus className="w-4 h-4" /> Manual
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {purchaseMode === 'ia' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-orange-600" /> Cargar Documento
              </h3>
              
              {!selectedFile ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-200 hover:bg-orange-50/20 transition-all group"
                >
                  <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white transition-colors mb-4">
                    <FileText className="w-10 h-10 text-slate-300 group-hover:text-orange-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 group-hover:text-slate-600">PDF, JPG o PNG</p>
                  <p className="text-[10px] text-slate-300 uppercase font-black mt-1">Haz clic para buscar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                    {selectedFile.type.includes('image') ? (
                      <img src={selectedFile.preview} className="w-full h-full object-cover opacity-80" alt="Preview" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white p-6">
                        <FileText className="w-16 h-16 mb-4 text-orange-500" />
                        <p className="font-bold text-center text-sm">{selectedFile.name}</p>
                      </div>
                    )}
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-500 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    onClick={processWithIA}
                    disabled={isAnalyzing}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isAnalyzing ? 'Analizando...' : 'Analizar con Gemini IA'}
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} />
            </div>
          )}

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" /> Cabecera de Factura
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
                <input 
                  value={purchaseData.supplierName} 
                  onChange={e => setPurchaseData({...purchaseData, supplierName: e.target.value})}
                  placeholder="Ej: Sinteplast S.A."
                  className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">N° Comprobante</label>
                  <input 
                    value={purchaseData.invoiceNumber} 
                    onChange={e => setPurchaseData({...purchaseData, invoiceNumber: e.target.value})}
                    placeholder="0001-000482"
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                  <input 
                    type="date"
                    value={purchaseData.date} 
                    onChange={e => setPurchaseData({...purchaseData, date: e.target.value})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-orange-600" /> Artículos Detectados
              </h3>
              <span className="px-3 py-1 bg-white border rounded-full text-[10px] font-black text-slate-400 uppercase">{purchaseData.items.length} Items</span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-4">Descripción / Matcheo</th>
                    <th className="px-4 py-4 text-center">Cant.</th>
                    <th className="px-6 py-4 text-right">Costo Unit.</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseData.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <ImageIcon className="w-12 h-12" />
                          <p className="font-black uppercase text-xs">Sin items cargados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    purchaseData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-4">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.description}</p>
                            {item.matchedProduct ? (
                              <div className="flex items-center gap-1.5 text-green-600 mt-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Vinculado: {item.matchedProduct.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-orange-500 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sin vincular (Nuevo producto)</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-black text-slate-700">{item.quantity}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">${item.unitPrice.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black text-orange-600">${item.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button className="p-2 text-slate-300 hover:text-red-500 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-10 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal Neto</p>
                  <p className="text-3xl font-black">${subtotal.toLocaleString()}</p>
                </div>
                <div className="h-10 w-px bg-slate-800 hidden md:block"></div>
                <div>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Total con IVA</p>
                  <p className="text-3xl font-black text-orange-500">${(subtotal * 1.21).toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={handleFinishPurchase}
                disabled={isFinishing || purchaseData.items.length === 0}
                className="w-full md:w-auto px-12 py-5 bg-orange-600 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
              >
                {isFinishing ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                {isFinishing ? 'Ingresando...' : 'Finalizar e Ingresar Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;