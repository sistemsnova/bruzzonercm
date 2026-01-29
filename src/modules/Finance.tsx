import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Brain, Loader2, 
  Scale, Calculator, ArrowUpRight, Activity,
  PieChart as PieChartIcon, FileText, Landmark, ShieldCheck,
  Calendar, RefreshCw, Clock
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useFirebase } from '../context/FirebaseContext';

type FinanceTab = 'overview' | 'cashflow' | 'breakeven' | 'accounting';

export const Finance: React.FC = () => {
  const { products, clients, suppliers } = useFirebase();
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Datos para gráficas
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
    { name: 'Otros', value: 7, color: '#94a3b8' },
  ];

  const dueDates = [
    { id: 1, date: '2024-06-05', concept: 'Sueldos Personal', amount: 1450000, status: 'urgent' },
    { id: 2, date: '2024-06-10', concept: 'Alquiler Local', amount: 350000, status: 'pending' },
    { id: 3, date: '2024-06-15', concept: 'IVA Mayo', amount: 254100, status: 'pending' },
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

  // Función IA corregida para Vite
  const askAi = async () => {
    setIsAiLoading(true);
    try {
      // IMPORTANTE: En Vite se usa import.meta.env.VITE_API_KEY
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "TU_KEY_AQUI";
      const genAI = new GoogleGenAI(API_KEY);
      
      // Corregido el nombre del modelo a uno existente
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Analiza estos datos de mi negocio: 
      Activos: $${totalAssets}, Pasivos: $${totalLiabilities}, Patrimonio: $${equity}. 
      Dame 3 consejos breves para mejorar la liquidez.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiResponse(response.text());
    } catch (e) {
      console.error(e);
      setAiResponse("Para usar la IA, configura VITE_GEMINI_API_KEY en tu archivo .env");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 italic">Inteligencia Financiera</h1>
          <p className="text-slate-500 text-sm font-medium">Patrimonio y Flujos de Fondo.</p>
        </div>
        <div className="flex bg-white border p-1 rounded-2xl shadow-sm overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${activeTab === 'overview' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>Patrimonio</button>
          <button onClick={() => setActiveTab('cashflow')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${activeTab === 'cashflow' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>Cash Flow</button>
          <button onClick={() => setActiveTab('breakeven')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${activeTab === 'breakeven' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>Equilibrio</button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Activos (Lo que tengo)</p>
          <h3 className="text-2xl font-black text-slate-800">${totalAssets.toLocaleString()}</h3>
          <Landmark className="absolute -bottom-4 -right-4 w-20 h-20 text-slate-50 group-hover:scale-110 transition-transform" />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pasivos (Lo que debo)</p>
          <h3 className="text-2xl font-black text-red-600">${totalLiabilities.toLocaleString()}</h3>
          <TrendingDown className="absolute -bottom-4 -right-4 w-20 h-20 text-slate-50 group-hover:scale-110 transition-transform" />
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
          <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Patrimonio Neto</p>
          <h3 className="text-2xl font-black">${equity.toLocaleString()}</h3>
          <DollarSign className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm h-80">
                <h3 className="text-lg font-black text-slate-800 uppercase mb-4">Flujo de Resultados</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="ingresos" stroke="#f97316" fill="#fef3c7" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                <h3 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" /> Próximos Pagos
                </h3>
                <div className="space-y-3">
                    {dueDates.map(due => (
                        <div key={due.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-center">
                            <div><p className="font-bold text-sm">{due.concept}</p><p className="text-[10px] text-slate-400">{due.date}</p></div>
                            <p className="font-black text-slate-900">${due.amount.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="lg:col-span-4">
             <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl">
                 <div className="flex items-center gap-3">
                   <Brain className="w-8 h-8 text-orange-500 animate-pulse" />
                   <h4 className="text-lg font-black uppercase">Estrategia AI</h4>
                 </div>
                 <button 
                  onClick={askAi}
                  disabled={isAiLoading}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                   Sugerencias de IA
                 </button>
                 {aiResponse && (
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-slate-300 italic max-h-40 overflow-y-auto">
                     {aiResponse}
                   </div>
                 )}
             </section>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="bg-white p-10 rounded-[3rem] border h-96">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[10, 10, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'breakeven' && (
        <div className="bg-white p-10 rounded-[3rem] border text-center space-y-4">
           <Calculator className="w-12 h-12 text-orange-600 mx-auto" />
           <h3 className="text-2xl font-black text-slate-800">Punto de Equilibrio</h3>
           <p className="text-slate-500">Debes vender <strong>$2.428.571</strong> para cubrir costos fijos.</p>
        </div>
      )}
    </div>
  );
};