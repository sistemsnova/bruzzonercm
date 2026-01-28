
import React, { useState, useMemo } from 'react';
import {
  Wallet, ArrowRightLeft, History, Landmark, CreditCard,
  Plus, MoreVertical, TrendingUp, TrendingDown, X, CheckCircle2,
  Banknote, ArrowDownCircle, ArrowUpCircle, Search, Filter,
  Calculator, AlertTriangle, Loader2, Save, Printer, Eye,
  Lock, Unlock, ShieldCheck, DollarSign,
  Users, ChevronRight, Info, ArrowUpRight, Edit3, Trash2
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Transaction, PaymentDetail } from '../types';


interface Box {
  id: string;
  name: string;
  balance: number;
  type: 'efectivo' | 'banco' | 'virtual' | 'cheques';
  status: 'abierta' | 'cerrada';
  lastClosed?: string;
  responsible?: string;
}

interface CashMovement {
  id: string;
  date: string;
  boxId: string;
  type: 'ingreso' | 'egreso' | 'transferencia';
  amount: number;
  method: string;
  category: string;
  description: string;
  user: string;
}

export const Cashier: React.FC = () => {
  const { transactions } = useFirebase();
  const [activeTab, setActiveTab] = useState<'boxes' | 'history' | 'reports'>('boxes');
  const [showMovementModal, setShowMovementModal] = useState<{ show: boolean, type: 'ingreso' | 'egreso' | 'transferencia' | null }>({ show: false, type: null });
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [editingBox, setEditingBox] = useState<Box | null>(null);

  // Estados locales para simular persistencia
  const [boxes, setBoxes] = useState<Box[]>([
    { id: '1', name: 'Caja Mostrador 01', balance: 142500, type: 'efectivo', status: 'abierta', responsible: 'Carlos V.' },
    { id: '2', name: 'Banco Nación (Cta Cte)', balance: 450000, type: 'banco', status: 'abierta', responsible: 'Admin' },
    { id: '3', name: 'Caja Fuerte / Reserva', balance: 1200000, type: 'efectivo', status: 'cerrada', lastClosed: '2024-05-20' },
    { id: '4', name: 'Cartera de Cheques', balance: 85400, type: 'cheques', status: 'abierta' },
  ]);

  const [movements, setMovements] = useState<CashMovement[]>([
    { id: 'm1', date: new Date().toISOString(), boxId: '1', type: 'ingreso', amount: 4500, method: 'efectivo', category: 'Venta', description: 'Ticket #4829', user: 'Carlos V.' },
    { id: 'm2', date: new Date().toISOString(), boxId: '1', type: 'egreso', amount: 1200, method: 'efectivo', category: 'Gastos', description: 'Compra de artículos limpieza', user: 'Carlos V.' },
    { id: 'm3', date: new Date().toISOString(), boxId: '2', type: 'transferencia', amount: 50000, method: 'transferencia', category: 'Interno', description: 'De Caja Mostrador a Banco', user: 'Admin' },
  ]);

  const totalConsolidated = useMemo(() => boxes.reduce((acc, box) => acc + box.balance, 0), [boxes]);
  const cashInHand = useMemo(() => boxes.filter(b => b.type === 'efectivo').reduce((acc, b) => acc + b.balance, 0), [boxes]);

  const handleRegisterMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const boxId = formData.get('boxId') as string;
    const type = showMovementModal.type!;

    const newMov: CashMovement = {
      id: `m${Date.now()}`,
      date: new Date().toISOString(),
      boxId: boxId,
      type: type,
      amount: amount,
      method: formData.get('method') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      user: 'Admin'
    };

    setMovements([newMov, ...movements]);
    setBoxes(prev => prev.map(b => {
      if (b.id === boxId) {
        return { ...b, balance: type === 'egreso' ? b.balance - amount : b.balance + amount };
      }
      return b;
    }));
    setShowMovementModal({ show: false, type: null });
    alert('Movimiento registrado con éxito');
  };

  const handleSaveBox = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const type = formData.get('type') as Box['type'];
    const responsible = formData.get('responsible') as string;
    const initialBalance = parseFloat(formData.get('balance') as string) || 0;

    if (editingBox) {
      setBoxes(prev => prev.map(b => b.id === editingBox.id ? { ...b, name, type, responsible } : b));
      alert('Caja actualizada con éxito');
    } else {
      const newBox: Box = {
        id: `box-${Date.now()}`,
        name,
        type,
        responsible,
        balance: initialBalance,
        status: 'abierta'
      };
      setBoxes(prev => [...prev, newBox]);
      alert('Nueva caja creada con éxito');
    }
    setShowBoxModal(false);
    setEditingBox(null);
  };

  const handleDeleteBox = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este fondo? Solo puedes hacerlo si no tiene movimientos pendientes.')) {
      setBoxes(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tesorería y Control de Cajas</h1>
          <p className="text-slate-500 text-sm font-medium">Gestión de flujo de fondos, arqueos y transferencias bancarias.</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('boxes')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'boxes' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Estado de Fondos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Historial de Movimientos
          </button>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Total Consolidado</p>
            <h3 className="text-3xl font-black">${totalConsolidated.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Auditoría en tiempo real
            </div>
          </div>
          <DollarSign className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><Banknote className="w-8 h-8" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Efectivo en Mano</p>
            <h3 className="text-2xl font-black text-slate-800">${cashInHand.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Landmark className="w-8 h-8" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Saldos Bancarios</p>
            <h3 className="text-2xl font-black text-slate-800">${boxes.filter(b => b.type === 'banco').reduce((acc, b) => acc + b.balance, 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><CreditCard className="w-8 h-8" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total Tarjetas / MP</p>
            <h3 className="text-2xl font-black text-slate-800">$45.820</h3>
          </div>
        </div>
      </div>

      {activeTab === 'boxes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom duration-500">
          {/* Active Boxes Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {boxes.map(box => (
                <div key={box.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${box.status === 'abierta' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                      {box.type === 'banco' ? <Landmark className="w-6 h-6" /> : box.type === 'virtual' ? <CreditCard className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingBox(box); setShowBoxModal(true); }}
                        className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBox(box.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 mb-1">{box.name}</h3>
                  <p className="text-3xl font-black text-slate-900 mb-6">${box.balance.toLocaleString()}</p>

                  {box.status === 'abierta' && (
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>Resp: <span className="text-slate-800">{box.responsible || 'Sistema'}</span></span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => { setSelectedBox(box); setShowCloseModal(true); }}
                          className="py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          <Calculator className="w-4 h-4 text-orange-500" /> Arqueo y Cierre
                        </button>
                        <button
                          onClick={() => setShowMovementModal({ show: true, type: 'transferencia' })}
                          className="py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                          <ArrowRightLeft className="w-4 h-4" /> Transferir
                        </button>
                      </div>
                    </div>
                  )}

                  {box.status === 'cerrada' && (
                    <div className="pt-6 border-t border-slate-50 flex flex-col gap-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase text-center italic">Cerrada el {box.lastClosed}</p>
                      <button
                        onClick={() => setBoxes(prev => prev.map(b => b.id === box.id ? { ...b, status: 'abierta' } : b))}
                        className="w-full py-4 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
                      >
                        <Plus className="w-4 h-4 inline mr-2" /> Apertura de Caja
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => { setEditingBox(null); setShowBoxModal(true); }}
                className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-300 hover:border-orange-200 hover:bg-orange-50/20 transition-all group"
              >
                <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white mb-4"><Plus className="w-8 h-8" /></div>
                <span className="font-black uppercase text-xs tracking-[0.2em]">Nuevo Fondo / Cuenta</span>
              </button>
            </div>
          </div>

          {/* Quick Action Side Panel */}
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" /> Acciones de Tesorería
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setShowMovementModal({ show: true, type: 'ingreso' })}
                  className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-green-50 border border-transparent hover:border-green-200 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-green-600 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-all">
                      <ArrowDownCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Ingreso Manual</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Aporte, Sobrante, Devolución</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>

                <button
                  onClick={() => setShowMovementModal({ show: true, type: 'egreso' })}
                  className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-red-600 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-all">
                      <ArrowUpCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Egreso Manual</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Gastos, Retiro, Pago Varios</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              </div>
            </section>

            <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <Info className="absolute -top-6 -right-6 w-32 h-32 text-white/5 -rotate-12" />
              <div className="relative z-10 space-y-4">
                <h4 className="text-lg font-black uppercase tracking-tight">Consejo de Control</h4>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Realiza cierres de caja al menos una vez al día para detectar desvíos de efectivo. Las transferencias a banco deben registrarse inmediatamente para mantener la conciliación exacta.
                </p>
                <button className="text-orange-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline">
                  Ver Guía de Auditoría <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descripción, caja o usuario..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-white shadow-sm bg-white transition-all">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-5">Fecha / Hora</th>
                  <th className="px-8 py-5">Caja</th>
                  <th className="px-8 py-5">Concepto / Descripción</th>
                  <th className="px-8 py-5">Medio</th>
                  <th className="px-8 py-5 text-right">Importe</th>
                  <th className="px-8 py-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800 text-sm">{new Date(m.date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(m.date).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {boxes.find(b => b.id === m.boxId)?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800 text-sm">{m.category}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{m.description}</p>
                    </td>
                    <td className="px-8 py-5 uppercase font-black text-[10px] text-slate-500">{m.method}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-lg font-black ${m.type === 'egreso' ? 'text-red-600' : m.type === 'ingreso' ? 'text-green-600' : 'text-blue-600'}`}>
                        {m.type === 'egreso' ? '-' : m.type === 'transferencia' ? '⇄' : '+'}${m.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button className="p-2 text-slate-300 hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100"><Eye className="w-5 h-5" /></button>
                      <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"><Printer className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Caja */}
      {showBoxModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{editingBox ? 'Editar Caja' : 'Nueva Caja / Fondo'}</h2>
                  <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuración de activos financieros</p>
                </div>
              </div>
              <button onClick={() => setShowBoxModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveBox} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Caja / Cuenta</label>
                <input
                  name="name"
                  defaultValue={editingBox?.name || ''}
                  required
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                  placeholder="Ej: Caja Chica Mostrador"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Fondo</label>
                  <select
                    name="type"
                    defaultValue={editingBox?.type || 'efectivo'}
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-slate-50"
                  >
                    <option value="efectivo">Efectivo Físico</option>
                    <option value="banco">Cuenta Bancaria</option>
                    <option value="virtual">Billetera Virtual (MP, etc)</option>
                    <option value="cheques">Cartera de Cheques</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsable</label>
                  <input
                    name="responsible"
                    defaultValue={editingBox?.responsible || ''}
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                    placeholder="Nombre del encargado"
                  />
                </div>
              </div>

              {!editingBox && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Inicial ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      name="balance"
                      type="number"
                      step="0.01"
                      className="w-full pl-12 pr-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-xl text-orange-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 -mx-8 -mb-8 mt-4">
                <button type="button" onClick={() => setShowBoxModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 uppercase text-xs tracking-widest hover:bg-orange-500 transition-all">
                  {editingBox ? 'Guardar Cambios' : 'Crear Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Movimiento (Ingreso / Egreso) */}
      {showMovementModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className={`p-8 border-b flex justify-between items-center text-white ${showMovementModal.type === 'ingreso' ? 'bg-green-600' : showMovementModal.type === 'egreso' ? 'bg-red-600' : 'bg-blue-600'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  {showMovementModal.type === 'ingreso' ? <ArrowDownCircle className="w-6 h-6" /> : showMovementModal.type === 'egreso' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowRightLeft className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Registrar {showMovementModal.type}</h2>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">Movimiento de tesorería manual</p>
                </div>
              </div>
              <button onClick={() => setShowMovementModal({ show: false, type: null })} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRegisterMovement} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Caja Origen/Destino</label>
                  <select name="boxId" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-orange-500">
                    {boxes.filter(b => b.status === 'abierta').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importe ($)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-black text-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                  <select name="category" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold bg-slate-50 outline-none">
                    {showMovementModal.type === 'ingreso' ? (
                      <>
                        <option>Aporte Propietario</option>
                        <option>Sobrante de Caja</option>
                        <option>Devolución Proveedor</option>
                        <option>Otros Ingresos</option>
                      </>
                    ) : (
                      <>
                        <option>Gasto Limpieza/Insumos</option>
                        <option>Retiro de Propietario</option>
                        <option>Pago a Cadete/Flete</option>
                        <option>Sueldos / Adelantos</option>
                        <option>Servicios (Luz, Gas, etc)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medio de Pago</label>
                  <select name="method" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold bg-slate-50 outline-none">
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia / QR</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Notas</label>
                <textarea name="description" required className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium text-sm outline-none h-24 resize-none" placeholder="Motivo detallado del movimiento..."></textarea>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 -mx-8 -mb-8">
                <button type="button" onClick={() => setShowMovementModal({ show: false, type: null })} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className={`flex-1 py-4 text-white rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest transition-all ${showMovementModal.type === 'ingreso' ? 'bg-green-600 shadow-green-600/20' : 'bg-red-600 shadow-red-600/20'}`}>
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Arqueo y Cierre de Caja */}
      {showCloseModal && selectedBox && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><Calculator className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Arqueo de Caja</h2>
                  <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest">{selectedBox.name}</p>
                </div>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="p-2 text-slate-400 hover:text-white"><X className="w-7 h-7" /></button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Sistema</p>
                  <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Saldo Inicial:</span>
                      <span>$100.000</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-green-600">
                      <span>Ventas (+):</span>
                      <span>$45.200</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-red-500">
                      <span>Egresos (-):</span>
                      <span>$2.700</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-black text-slate-900 text-lg">
                      <span>Saldo Esperado:</span>
                      <span>${selectedBox.balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteo Físico</p>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Efectivo en Caja ($)</label>
                    <input
                      type="number"
                      placeholder="Ingresa monto contado..."
                      className="w-full px-5 py-4 border-2 border-orange-100 rounded-2xl focus:ring-4 focus:ring-orange-500/20 outline-none font-black text-2xl text-orange-600 shadow-sm"
                    />
                    <p className="text-[9px] text-slate-400 italic">Cuenta cada billete y moneda antes de cerrar.</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-orange-600 shrink-0" />
                <p className="text-xs font-bold text-orange-900 leading-relaxed">
                  Al cerrar la caja, se generará un reporte de arqueo. Si existe diferencia, se registrará como "Faltante/Sobrante" automáticamente para auditar luego.
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button
                onClick={() => {
                  setBoxes(prev => prev.map(b => b.id === selectedBox.id ? { ...b, status: 'cerrada', lastClosed: new Date().toLocaleDateString() } : b));
                  alert('Caja Cerrada con éxito. Reporte impreso.');
                  setShowCloseModal(false);
                }}
                className="flex-[1.5] py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                Confirmar Arqueo y Cerrar Caja <Save className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
