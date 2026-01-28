import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, AlertCircle, ArrowUp, ArrowDown, 
  CheckCircle2, History, RotateCcw, Save 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const StockAdjust = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [reason, setReason] = useState('Conteo Físico');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 1. Cargar productos
  const loadProducts = async () => {
    const q = query(collection(db, 'products'));
    const qSnap = await getDocs(q);
    setProducts(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { loadProducts(); }, []);

  // 2. Procesar el ajuste
  const handleAdjust = async () => {
    if (!selectedProduct || adjustAmount === 0) return;
    setIsProcessing(true);

    try {
      const newStock = selectedProduct.stock + adjustAmount;
      const productRef = doc(db, 'products', selectedProduct.id);

      // Actualizar Stock
      await updateDoc(productRef, { stock: newStock });

      // Registrar en el historial de ajustes (Auditoría)
      await addDoc(collection(db, 'inventory_logs'), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        previousStock: selectedProduct.stock,
        adjustment: adjustAmount,
        newStock: newStock,
        reason: reason,
        date: serverTimestamp()
      });

      setShowSuccess(true);
      setSelectedProduct(null);
      setAdjustAmount(0);
      loadProducts();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error al ajustar stock:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ajuste de Stock</h1>
        <p className="text-slate-500 font-medium italic">Corrección manual de existencias por rotura, pérdida o conteo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BUSCADOR DE PRODUCTOS */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-[600px]">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar producto a ajustar..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {filtered.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedProduct?.id === p.id ? 'border-orange-500 bg-orange-50' : 'border-slate-50 hover:bg-slate-50'}`}
              >
                <div className="text-left">
                  <p className="font-bold text-slate-800">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase">Stock Actual: {p.stock} u.</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">${p.price}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL DE AJUSTE */}
        <div className="space-y-6">
          {selectedProduct ? (
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/40">
                  <Layers size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl leading-tight">{selectedProduct.name}</h3>
                  <p className="text-orange-400 font-bold text-xs">CÓDIGO: {selectedProduct.code}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-3xl mb-8 border border-slate-700/30">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Stock en Sistema</p>
                  <p className="text-3xl font-black">{selectedProduct.stock} <span className="text-xs">unidades</span></p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad a Ajustar</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setAdjustAmount(adjustAmount - 1)}
                      className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center hover:bg-red-500 transition-colors"
                    ><ArrowDown size={20} /></button>
                    
                    <input 
                      type="number" 
                      className="flex-1 bg-slate-700 border-none rounded-xl p-4 text-center font-black text-2xl outline-none"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    />

                    <button 
                      onClick={() => setAdjustAmount(adjustAmount + 1)}
                      className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center hover:bg-green-500 transition-colors"
                    ><ArrowUp size={20} /></button>
                  </div>
                  <p className="text-center text-[10px] font-bold text-slate-500">Usa números negativos para quitar stock (ej: -2)</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo del Ajuste</label>
                <select 
                  className="w-full bg-slate-800 border-none p-4 rounded-2xl font-bold outline-none text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="Conteo Físico">Conteo Físico / Inventario</option>
                  <option value="Rotura">Producto Roto / Dañado</option>
                  <option value="Perdida">Pérdida / Robo</option>
                  <option value="Error de Entrada">Error en Carga Anterior</option>
                  <option value="Devolución">Devolución de Proveedor</option>
                </select>
              </div>

              <button 
                onClick={handleAdjust}
                disabled={adjustAmount === 0 || isProcessing}
                className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-20"
              >
                {isProcessing ? 'PROCESANDO...' : 'GUARDAR AJUSTE'}
                {!isProcessing && <Save size={20} />}
              </button>
            </div>
          ) : (
            <div className="h-full bg-slate-100 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 text-center text-slate-400">
               <RotateCcw size={48} className="mb-4 opacity-20" />
               <p className="font-bold italic">Selecciona un producto de la lista para realizar el ajuste manual.</p>
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-10 right-10 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 size={24} />
          <p className="font-black uppercase text-sm tracking-widest">¡Stock Actualizado!</p>
        </div>
      )}
    </div>
  );
};

export default StockAdjust;