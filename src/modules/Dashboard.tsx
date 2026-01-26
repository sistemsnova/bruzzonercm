import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Package, Users, AlertTriangle,
  ArrowUpRight, ShoppingCart, DollarSign, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Datos de ejemplo para el gráfico (puedes conectarlos a Firebase después)
const chartData = [
  { name: 'Lun', ventas: 4000 },
  { name: 'Mar', ventas: 3000 },
  { name: 'Mie', ventas: 5000 },
  { name: 'Jue', ventas: 2780 },
  { name: 'Vie', ventas: 1890 },
  { name: 'Sab', ventas: 2390 },
  { name: 'Dom', ventas: 3490 },
];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    sales: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        const cSnap = await getDocs(collection(db, 'customers'));
        const sSnap = await getDocs(collection(db, 'sales'));

        const products = pSnap.docs.map(d => d.data());
        const lowStock = products.filter((p: any) => p.stock <= 5);

        setStats({
          products: pSnap.size,
          customers: cSnap.size,
          sales: sSnap.size,
          lowStockCount: lowStock.length
        });
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
        <p className="text-slate-500 font-medium italic">Resumen general de Ferretería Bruzzone en tiempo real.</p>
      </div>

      {/* TARJETAS DE ESTADO RAPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Productos" value={stats.products} icon={<Package />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Clientes" value={stats.customers} icon={<Users />} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Ventas Hoy" value={stats.sales} icon={<ShoppingCart />} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Stock Crítico" value={stats.lowStockCount} icon={<AlertTriangle />} color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRÁFICO DE TENDENCIA */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Flujo de Ventas Semanal</h3>
            </div>
            <span className="flex items-center gap-1 text-green-500 font-black text-[10px] bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <ArrowUpRight size={12} /> +12.5%
            </span>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#ea580c"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE / ALERTAS */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <Activity size={16} className="text-orange-500" /> Alertas del Sistema
          </h3>
          <div className="space-y-4">
            {stats.lowStockCount > 0 ? (
              <div className="p-5 bg-red-50 rounded-[2rem] border border-red-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-black text-red-600 text-xs uppercase tracking-tight">Atención: Stock Bajo</p>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
                    Tienes {stats.lowStockCount} productos con menos de 5 unidades. Revisa el inventario pronto.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center opacity-30">
                <Activity size={48} className="mx-auto mb-4" />
                <p className="font-bold text-sm italic">Sin alertas pendientes</p>
              </div>
            )}

            <div className="p-5 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="font-black text-blue-600 text-xs uppercase tracking-tight">Cierre de Caja</p>
                <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
                  Recuerda realizar el arqueo de caja al finalizar la jornada.
                </p>
              </div>
            </div>
          </div>

          <button className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-900/10">
            Ver Todos los Reportes
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-componente para las tarjetas
const StatCard = ({ title, value, icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:scale-[1.02]">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-sm`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);