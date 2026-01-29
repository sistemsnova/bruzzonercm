import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Brain, Loader2, Landmark, RefreshCw, Clock } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useFirebase } from '../context/FirebaseContext';

export const Finance: React.FC = () => {
  const { products = [], clients = [], suppliers = [] } = useFirebase() || {};
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const cashFlowData = [
    { name: 'Ene', ingresos: 4000000, egresos: 3200000 },
    { name: 'Feb', ingresos: 3500000, egresos: 3100000 },
    { name: 'Mar', ingresos: 5200000, egresos: 3800000 },
    { name: 'Abr', ingresos: 4800000, egresos: 4100000 },
  ];

  const totalAssets = useMemo(() => {
    const stock = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0);
    const debt = clients.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
    return stock + debt + 2500000; 
  }, [products, clients]);

  const totalLiabilities = useMemo(() => suppliers.reduce((acc, s) => acc + Math.abs(s.balance < 0 ? s.balance : 0), 0), [suppliers]);
  const equity = totalAssets - totalLiabilities;

  const askAi = async () => {
    setIsAiLoading(true);
    try {
      const key = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
      if (!key) {
        setAiResponse("Configure VITE_GEMINI_API_KEY en el archivo .env");
        return;
      }
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analiza mis finanzas: Activos $${totalAssets}, Pasivos $${totalLiabilities}. Dame un consejo breve.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiResponse(response.text());
    } catch (e) {
      setAiResponse("Error al conectar con la IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 italic">Inteligencia Financiera</h1>
        <p className="text-sm text-slate-500">Análisis contable y proyecciones</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Activos Totales</p>
          <h3 className="text-2xl font-black text-slate-800">${totalAssets.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pasivos (Deudas)</p>
          <h3 className="text-2xl font-black text-red-600">${totalLiabilities.toLocaleString()}</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white">
          <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Patrimonio Neto</p>
          <h3 className="text-2xl font-black">${equity.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border shadow-sm h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="ingresos" stroke="#f97316" fill="#fff7ed" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
          <div className="flex items-center gap-3">
            <Brain className="text-orange-500 animate-pulse" />
            <h4 className="font-black uppercase">IA Estratégica</h4>
          </div>
          {aiResponse && <div className="text-[11px] text-slate-400 italic bg-white/5 p-4 rounded-xl">{aiResponse}</div>}
          <button 
            onClick={askAi} 
            disabled={isAiLoading}
            className="w-full py-4 bg-orange-600 rounded-2xl font-black text-xs hover:bg-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            CONSULTAR IA
          </button>
        </div>
      </div>
    </div>
  );
};