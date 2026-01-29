
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Brain, Loader2, 
  Scale, Calculator, ArrowUpRight, ArrowDownRight, Activity,
  PieChart as PieChartIcon, FileText, Landmark, ShieldCheck,
  ChevronRight, Calendar, Info, RefreshCw, Layers, Percent, Clock, AlertTriangle
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useFirebase } from '../context/FirebaseContext';

type FinanceTab = 'overview' | 'cashflow' | 'breakeven' | 'accounting';

export const Finance: React.FC = () => {
  const { transactions, products, clients, suppliers } = useFirebase();
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Mock data para proyecciones
  const cashFlowData = [
    { name: 'Ene', ingresos: 4000000, egresos: 3200000, balance: 800000 },
    { name: 'Feb', ingresos: 3500000, egresos: 3100000, balance: 400000 },
    { name: 'Mar', ingresos: 5200000, egresos: 3800000, balance: 1400000 },
    { name: 'Abr', ingresos: 4800000, egresos: 4100000, balance: 700000 },
    { name: 'May', ingresos: 5500000, egresos: 4200000, balance: 1300000 },
    { name: 'Jun', ingresos: 6000000, egresos: 4500000, balance: 1500000 },
  ];

  const expensesBreakdown = [
    { name: 'Mercadería', value: 65, color: '#f97316' },
    { name: 'Sueldos', value: 20, color: '#64748b' },
    { name: 'Impuestos', value: 8, color: '#334155' },
    { name: 'Servicios/Alquiler', value: 7, color: '#94a3b8' },
  ];

  const dueDates = [
    { id: 1, date: '2024-06-05', concept: 'Sueldos Personal', amount: 1450000, status: 'urgent' },
    { id: 2, date: '2024-06-10', concept: 'Alquiler Local Central', amount: 350000, status: 'pending' },
    { id: 3, date: '2024-06-15', concept: 'IVA Mayo (AFIP)', amount: 254100, status: 'pending' },
    { id: 4, date: '2024-06-20', concept: 'Luz y Gas (Sucursales)', amount: 85000, status: 'pending' },
  ];

  // Cálculos dinámicos
  const totalAssets = useMemo(() => {
    const stockValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
    const clientDebt = clients.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
    return stockValue + clientDebt + 2500000; 
  }, [products, clients]);

  const totalLiabilities = useMemo(() => {
    return suppliers.reduce((acc, s) => acc + Math.abs(s.balance < 0 ? s.balance : 0), 0);
  }, [suppliers]);

  const equity = totalAssets - totalLiabilities;

  const askAi = async () => {
    setIsAiLoading(true);
    try {
      // @ts-ignore: `process.env.API_KEY` is injected at runtime.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analiza estos datos financieros de mi ferretería: 
      Activos Totales: $${totalAssets}, 
      Pasivos: $${totalLiabilities}, 
      Patrimonio Neto: $${equity}. 
      Dame recomendaciones estratégicas para pagar sueldos y vencimientos.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiResponse(response.text || "No se pudo obtener respuesta.");
    } catch (e) {
      setAiResponse("Error al consultar IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Centro de Inteligencia Financiera</h1>
          <p className="text-slate-500 text-sm font-medium">Contabilidad analítica, flujos de fondo y rentabilidad.</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm overflow-x-auto">
          {[
            { id: 'overview', label: 'Patrimonio', icon: Scale },
            { id: 'cashflow', label: 'Cash Flow', icon: Activity },
            { id: 'breakeven', label: 'Punto de Equilibrio', icon: Calculator },
            { id: 'accounting', label: 'Libro Diario', icon: FileText },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activos Totales</p>
          <h3 className="text-2xl font-black text-slate-800">${totalAssets.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600">
             <ArrowUpRight className="w-3 h-3" /> +4.2% vs mes anterior
          </div>
          <Landmark className="absolute -bottom-4 -right-4 w-20 h-20 text-slate-50 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pasivos (Deudas)</p>
          <h3 className="text-2xl font-black text-red-600">${totalLiabilities.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
             <ShieldCheck className="w-3 h-3 text-blue-500" /> 85% a LP (Largo Plazo)
          </div>
          <TrendingDown className="absolute -bottom-4 -right-4 w-20 h-20 text-slate-50 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Patrimonio Neto</p>
          <h3 className="text-2xl font-black">${equity.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <Activity className="w-3 h-3 text-orange-500" /> Valor de Empresa
          </div>
          <DollarSign className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-orange-600 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
          <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-1">Rentabilidad Final</p>
          <h3 className="text-2xl font-black">16.8%</h3>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-orange-200">
             <TrendingUp className="w-3 h-3" /> Superando meta anual
          </div>
          <PieChartIcon className="absolute -bottom-4 -right-4 w-20 h-20 text-white/10 group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" /> Evolución de Resultados
                </h3>
                </div>
                <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData}>
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="ingresos" name="Ventas" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="egresos" name="Costos" stroke="#64748b" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                </ResponsiveContainer>
                </div>
            </div>

            {/* Próximos Vencimientos Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" /> Próximos Vencimientos (Nómina y Fijos)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dueDates.map(due => (
                        <div key={due.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-indigo-500 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${due.status === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-white text-indigo-600 shadow-sm'}`}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{due.concept}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(due.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-900">${due.amount.toLocaleString()}</p>
                                {due.status === 'urgent' && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Urgente</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3">
                   <Brain className="w-8 h-8 text-orange-500 animate-pulse" />
                   <h4 className="text-lg font-black uppercase tracking-tight">Estrategia IA</h4>
                 </div>
                 <p className="text-slate-400 text-xs leading-relaxed font-medium">
                   ¿Cómo cubrimos los próximos sueldos y el alquiler del local central?
                 </p>
                 <button 
                  onClick={askAi}
                  disabled={isAiLoading}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                   Consultar Plan de Pagos
                 </button>
                 {aiResponse && (
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-slate-300 italic max-h-40 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                     {aiResponse}
                   </div>
                 )}
               </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Distribución de Gastos</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Flujo de Caja Real vs Proyectado</h3>
                  <p className="text-slate-400 text-sm font-medium">Análisis de liquidez para los próximos 30 días.</p>
                </div>
                <div className="flex gap-4">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Fin de Mes</p>
                      <p className="text-2xl font-black text-green-600">+$2.140.000</p>
                   </div>
                </div>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none'}} />
                      <Legend iconType="circle" />
                      <Bar dataKey="ingresos" name="Entradas" fill="#10b981" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="egresos" name="Salidas" fill="#ef4444" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="balance" name="Cash Flow Neto" fill="#6366f1" radius={[10, 10, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'breakeven' && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in zoom-in duration-500">
           <div className="flex flex-col md:flex-row gap-12">
              <div className="flex-1 space-y-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Punto de Equilibrio</h3>
                  <p className="text-slate-400 text-sm font-medium">Cálculo del volumen de venta necesario para no tener pérdidas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costos Fijos Mensuales</label>
                       <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <input type="number" defaultValue={850000} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl outline-none focus:ring-2 focus:ring-orange-500" />
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center space-y-4">
                     <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Debes vender al menos</p>
                     <h4 className="text-5xl font-black text-white">$2.428.571</h4>
                     <p className="text-slate-400 text-xs font-medium">para cubrir todos tus gastos antes de empezar a ganar.</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'accounting' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
           <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <FileText className="w-6 h-6 text-slate-400" />
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Libro Diario / Asientos</h3>
             </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                 <tr>
                   <th className="px-8 py-5">Fecha / Ref</th>
                   <th className="px-8 py-5">Cuenta Contable</th>
                   <th className="px-8 py-5 text-right">Debe (+)</th>
                   <th className="px-8 py-5 text-right">Haber (-)</th>
                   <th className="px-8 py-5 text-center">Estado</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {[
                   { date: '20-05-24', ref: 'AST-120', account: 'Sueldos Pagados', debe: 0, haber: 145000, status: 'Auditado' },
                   { date: '20-05-24', ref: 'AST-121', account: 'Proveedores S.A.', debe: 0, haber: 85200, status: 'Auditado' },
                 ].map((a, i) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-5">
                       <p className="font-bold text-slate-800 text-sm">{a.date}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{a.ref}</p>
                     </td>
                     <td className="px-8 py-5">
                       <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                         {a.account}
                       </span>
                     </td>
                     <td className="px-8 py-5 text-right font-black text-green-600">{a.debe > 0 ? `$${a.debe.toLocaleString()}` : '-'}</td>
                     <td className="px-8 py-5 text-right font-black text-red-600">{a.haber > 0 ? `$${a.haber.toLocaleString()}` : '-'}</td>
                     <td className="px-8 py-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${a.status === 'Auditado' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                          {a.status}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};
