import React, { useState, useEffect } from 'react';
import { 
  Banknote, CreditCard, ArrowUpCircle, ArrowDownCircle, 
  History, Search, Plus, Filter, Calculator, Trash2 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

const Cash = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Totales
  const [totals, setTotals] = useState({ cash: 0, card: 0, expenses: 0 });

  // Nuevo movimiento
  const [entry, setEntry] = useState({
    type: 'ingreso', // ingreso o egreso
    method: 'efectivo',
    amount: '',
    description: ''
  });

  const loadTransactions = async () => {
    setLoading(true);
    const q = query(collection(db, 'cash_flow'), orderBy('date', 'desc'));
    const qSnap = await getDocs(q);
    const data = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    let cash = 0, card = 0, exp = 0;
    data.forEach((t: any) => {
      if (t.type === 'ingreso') {
        if (t.method === 'efectivo') cash += t.amount;
        else card += t.amount;
      } else {
        exp += t.amount;
      }
    });

    setTotals({ cash, card, expenses: exp });
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { loadTransactions(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.amount || !entry.description) return;

    await addDoc(collection(db, 'cash_flow'), {
      ...entry,
      amount: Number(entry.amount),
      date: serverTimestamp()
    });

    setShowModal(false);
    setEntry({ type: 'ingreso', method: 'efectivo', amount: '', description: '' });
    loadTransactions();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cajas y Pagos</h1>
          <p className="text-slate-500 font-medium italic">Control de flujo de caja diario y métodos de pago.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl transition-all"
        >
          <Plus size={20} />
          Nuevo Movimiento
        </button>
      </div>

      {/* TARJETAS DE SALDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-500 text-white p-8 rounded-[2.5rem] shadow-lg shadow-green-500/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Banknote /></div>
            <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full">Efectivo en Caja</span>
          </div>
          <p className="text-3xl font-black">${totals.cash.toLocaleString()}</p>
        </div>

        <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-lg shadow-blue-600/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><CreditCard /></div>
            <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full">Cobros con Tarjeta</span>
          </div>
          <p className="text-3xl font-black">${totals.card.toLocaleString()}</p>
        </div>

        <div className="bg-red-500 text-white p-8 rounded-[2.5rem] shadow-lg shadow-red-500/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><ArrowDownCircle /></div>
            <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full">Gastos / Egresos</span>
          </div>
          <p className="text-3xl font-black">-${totals.expenses.toLocaleString()}</p>
        </div>
      </div>

      {/* LISTADO DE MOVIMIENTOS */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
            <History size={16} className="text-orange-500" /> Historial de Movimientos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 text-slate-400 font-bold">Cargando movimientos...</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-xs text-slate-400 font-mono">
                      {t.date?.toDate().toLocaleString() || 'Reciente'}
                    </td>
                    <td className="px-8 py-5">
                       <p className="font-bold text-slate-700">{t.description}</p>
                       <p className={`text-[9px] font-black uppercase ${t.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                         {t.type}
                       </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{t.method}</span>
                    </td>
                    <td className={`px-8 py-5 text-right font-black text-lg ${t.type === 'ingreso' ? 'text-slate-900' : 'text-red-500'}`}>
                      {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO MOVIMIENTO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-800 mb-8">Registrar Movimiento</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setEntry({...entry, type: 'ingreso'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs ${entry.type === 'ingreso' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}
                >INGRESO</button>
                <button 
                  type="button"
                  onClick={() => setEntry({...entry, type: 'egreso'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs ${entry.type === 'egreso' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}
                >EGRESO</button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Monto ($)</label>
                <input required type="number" value={entry.amount} onChange={(e)=>setEntry({...entry, amount: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Descripción</label>
                <input required type="text" value={entry.description} onChange={(e)=>setEntry({...entry, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ej: Pago de flete, Venta mostrador..." />
              </div>

              <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-600/30 hover:bg-orange-700 transition-all">
                Confirmar Movimiento
              </button>
              <button type="button" onClick={()=>setShowModal(false)} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest py-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cash;