import React, { useState } from 'react';
import { 
  Search, Scale, ArrowUpRight, ArrowDownRight, 
  User, Truck, Filter, Download, History
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

export const Balances: React.FC = () => {
  const { clients, suppliers } = useFirebase();
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const data = activeTab === 'clients' ? clients : suppliers;
  const filteredData = data.filter(item => 
    item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item?.cuit?.includes(searchTerm)
  );

  const totalBalance = filteredData.reduce((acc, item) => acc + (item?.balance || 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cuentas Corrientes</h1>
          <p className="text-slate-500 text-sm font-medium">Saldos pendientes de cobro y pago.</p>
        </div>
        <div className="flex bg-white border p-1 rounded-xl shadow-sm">
          <button onClick={() => { setActiveTab('clients'); setSelectedItem(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'clients' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
            <User className="w-4 h-4" /> Clientes
          </button>
          <button onClick={() => { setActiveTab('suppliers'); setSelectedItem(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'suppliers' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
            <Truck className="w-4 h-4" /> Proveedores
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o CUIT..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredData.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedItem?.id === item.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="text-left">
                    <p className={`font-bold text-sm ${selectedItem?.id === item.id ? 'text-white' : 'text-slate-800'}`}>{item?.name || 'Sin nombre'}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${selectedItem?.id === item.id ? 'text-slate-400' : 'text-slate-400'}`}>{item?.cuit}</p>
                  </div>
                  <p className={`font-black ${item?.balance > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                    ${Math.abs(item?.balance || 0).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {selectedItem ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
              <div className={`p-10 flex justify-between items-center text-white ${activeTab === 'clients' ? 'bg-orange-600' : 'bg-blue-600'}`}>
                <div className="flex items-center gap-6">
                  {/* CORRECCIÓN LÍNEA 148 */}
                  <div className="w-20 h-20 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black">
                    {selectedItem?.name?.charAt(0) || '?'}
                  </div>
                  {/* CORRECCIÓN LÍNEA 149 */}
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedItem?.name || 'Sin nombre'}</h2>
                    <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-xs">{selectedItem?.cuit || 'Sin CUIT'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Saldo Pendiente</p>
                  {/* CORRECCIÓN LÍNEA 153 */}
                  <h3 className="text-5xl font-black">${Math.abs(selectedItem?.balance || 0).toLocaleString()}</h3>
                </div>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="flex gap-4">
                  <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <History className="w-4 h-4" /> Ver Historial
                  </button>
                  <button className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Descargar Resumen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
              <Scale className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-black uppercase text-xs tracking-[0.2em]">Selecciona un {activeTab === 'clients' ? 'cliente' : 'proveedor'} para ver su saldo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};