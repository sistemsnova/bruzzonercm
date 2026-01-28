
import React from 'react';
import { 
  Users, TrendingUp, Package, AlertTriangle, 
  ArrowUpRight, DollarSign, CheckCircle2, ListTodo, Clock, Sparkles,
  PlusCircle, BadgeDollarSign, ClipboardList, MessageSquareText,
  Calculator, UserPlus, FileUp, Boxes, Zap, ArrowUpCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Lun', ventas: 4000, compras: 2400 },
  { name: 'Mar', ventas: 3000, compras: 1398 },
  { name: 'Mie', ventas: 2000, compras: 9800 },
  { name: 'Jue', ventas: 2780, compras: 3908 },
  { name: 'Vie', ventas: 1890, compras: 4800 },
  { name: 'Sab', ventas: 2390, compras: 3800 },
  { name: 'Dom', ventas: 3490, compras: 4300 },
];

interface DashboardProps {
  openTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ openTab }) => {
  const quickActions = [
    { id: 'sales', label: 'Nueva Venta', icon: BadgeDollarSign, color: 'bg-orange-600', trend: 'Alt', desc: 'Abrir mostrador' },
    { id: 'cashier', label: 'Registrar Gasto', icon: ArrowUpCircle, color: 'bg-red-600', trend: 'Pagos', desc: 'Sueldos, impuestos, servicios' },
    { id: 'missing-items', label: 'Faltantes', icon: AlertTriangle, color: 'bg-orange-500', trend: 'Crít', desc: 'Reponer stock' },
    { id: 'inventory', label: 'Nuevo Producto', icon: Boxes, color: 'bg-blue-600', trend: 'Cát', desc: 'Alta mercadería' },
  ];

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Control General</h1>
          <p className="text-slate-500 font-medium">Estado actual de tu ferretería en tiempo real.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all uppercase text-[10px] tracking-widest">Hoy</button>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg uppercase text-[10px] tracking-widest">Últimos 7 días</button>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ventas Totales', value: '$1.284.500', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', trend: '+12.5%' },
          { label: 'Nuevos Clientes', value: '48', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+5.2%' },
          { label: 'Stock Crítico', value: '12 Items', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', trend: '-2' },
          { label: 'Caja del Día', value: '$245.300', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+8.1%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
          </div>
        ))}
      </div>

      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500 fill-orange-500" /> Accesos Directos
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones Críticas</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => openTab(action.id)}
              className="group p-6 rounded-3xl border border-slate-100 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 transition-all text-left bg-white relative overflow-hidden"
            >
              <div className={`p-4 rounded-2xl ${action.color} text-white w-fit mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight mb-1">{action.label}</h4>
              <p className="text-[10px] font-medium text-slate-400 leading-tight">{action.desc}</p>
              <ArrowUpRight className="absolute top-6 right-6 w-5 h-5 text-slate-200 group-hover:text-orange-500 transition-colors" />
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Rendimiento Operativo</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                 <div className="w-3 h-3 rounded-full bg-orange-500"></div> Ventas
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                 <div className="w-3 h-3 rounded-full bg-slate-300"></div> Compras
               </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorVentas)" />
                <Area type="monotone" dataKey="compras" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                   <ListTodo className="w-6 h-6 text-orange-500" />
                   <h3 className="text-lg font-black uppercase tracking-tight">Requisitos del Sistema</h3>
                </div>
                <div className="space-y-4">
                   {[
                     { task: 'Módulo de Facturación AFIP', status: 'pending' },
                     { task: 'Gestión de Cuentas Corrientes', status: 'done' },
                     { task: 'Escáner de Facturas con IA', status: 'done' },
                     { task: 'Sincronización con Andreani', status: 'pending' },
                   ].map((t, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all cursor-default">
                        <span className="text-xs font-bold text-slate-300">{t.task}</span>
                        {t.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-orange-500" />
                        )}
                     </div>
                   ))}
                </div>
                <button className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
                   <PlusCircle className="w-4 h-4" /> Añadir Requisito
                </button>
             </div>
             <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 -rotate-12" />
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" /> Alertas Críticas
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
                 <Package className="w-5 h-5 text-orange-600 shrink-0" />
                 <div>
                    <p className="text-xs font-black text-orange-900 uppercase">Sin Stock: Cemento Avellaneda</p>
                    <p className="text-[10px] text-orange-700 font-medium">Reponer urgente para evitar pérdida de ventas.</p>
                 </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
