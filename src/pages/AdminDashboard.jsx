import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { adminApi } from "../api/adminApi";
import {
  Users,
  Building2,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Briefcase,
  FileText,
  Cpu,
  RefreshCw,
  Terminal,
  Activity,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const gradients = {
    blue: "from-blue-500/20 to-blue-600/5",
    indigo: "from-indigo-500/20 to-indigo-600/5",
    purple: "from-purple-500/20 to-purple-600/5",
    emerald: "from-emerald-500/20 to-emerald-600/5",
    amber: "from-amber-500/20 to-amber-600/5",
  };

  const textColors = {
    blue: "text-blue-400",
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  const bgColors = {
    blue: "bg-blue-500/10",
    indigo: "bg-indigo-500/10",
    purple: "bg-purple-500/10",
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-gradient-to-br from-slate-900 to-slate-900/50 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] group transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-black/20 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 p-16 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none translate-x-1/3 -translate-y-1/3 bg-${color}-500/30`} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3.5 rounded-2xl ${bgColors[color] || 'bg-slate-800'} ${textColors[color] || 'text-slate-400'} ring-1 ring-inset ring-white/5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-sm">
            <ArrowUpRight size={12} strokeWidth={3} /> {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-white tracking-tight mb-1 group-hover:scale-105 transition-transform origin-left">{value}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    activeCompanies: 0,
    totalApplications: 0,
    totalInterviews: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, lData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getLogs()
      ]);
      setStats(sData);
      setLogs(lData.slice(0, 5));
      if (!loading) toast.success("Données actualisées");
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.success("Préparation du PDF...");
    setTimeout(() => window.print(), 500);
  };

  return (
    <AdminLayout>
      <div className="relative mb-12 p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 shadow-2xl overflow-hidden border border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-blue-200 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck size={12} /> Espace Administration
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              Vue Globale
            </h1>
            <p className="text-blue-100/80 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              Contrôle analytique en temps réel de l'écosystème InternFlow.
            </p>
          </div>
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handleExportPDF}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest backdrop-blur-md transition-all flex items-center gap-2"
            >
              <FileText size={18} /> <span className="hidden sm:inline">Rapport</span>
            </button>
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-6 py-3 bg-white text-indigo-950 hover:bg-blue-50 border border-white/20 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-black/20 active:scale-95"
            >
              Config
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Entreprises" value={stats.activeCompanies} icon={Building2} color="blue" trend="+12%" />
        <StatCard title="Etudiants" value={stats.totalStudents} icon={Users} color="indigo" trend="+5%" />
        <StatCard title="Postulations" value={stats.totalApplications} icon={Briefcase} color="purple" trend="+28%" />
        <StatCard title="Entretiens" value={stats.totalInterviews} icon={CheckCircle} color="emerald" trend="+15%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden p-6 sm:p-8 shadow-2xl relative group">
            <div className="absolute top-0 right-0 p-24 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 relative z-10">
              <TrendingUp className="text-blue-500" size={18} /> Statut Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              <div className="p-6 bg-slate-950/30 rounded-3xl border border-white/5 relative group/card overflow-hidden hover:bg-slate-950/50 transition-colors hover:border-white/10 hover:shadow-lg">
                <div className="absolute top-0 right-0 p-4 text-orange-500/10 group-hover/card:scale-125 transition-transform duration-500">
                  <Clock size={64} />
                </div>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">Validations en attente</p>
                <p className="text-4xl font-black text-orange-500 tracking-tighter filter drop-shadow-lg">{stats.pendingCompanies}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                  <span className="text-[10px] font-bold text-slate-500">Action requise nécessaire</span>
                </div>
              </div>
              <div className="p-6 bg-slate-950/30 rounded-3xl border border-white/5 relative group/card overflow-hidden hover:bg-slate-950/50 transition-colors hover:border-white/10 hover:shadow-lg">
                <div className="absolute top-0 right-0 p-4 text-indigo-500/10 group-hover/card:scale-125 transition-transform duration-500">
                  <Activity size={64} />
                </div>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">Charge Écosystème</p>
                <p className="text-4xl font-black text-indigo-500 tracking-tighter filter drop-shadow-lg">{stats.totalStudents + stats.totalCompanies}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-slate-500">Utilisateurs connectés</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Terminal className="text-blue-500" size={18} /> Audit Action Logs
              </h3>
              <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white hover:scale-110 active:scale-95">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              </button>
            </div>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="py-10 text-center text-slate-700 italic font-bold uppercase tracking-widest">Niveau de silence total détecté</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-2 p-4 bg-slate-950/30 rounded-2xl border border-white/5 hover:bg-slate-900/60 transition-colors group hover:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${log.action.includes('DELETE') ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                        log.action.includes('UPDATE') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                          log.action.includes('NEW') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                        }`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600 font-bold group-hover:text-slate-500 transition-colors">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="mt-1">
                      {typeof log.details === 'object' && log.details !== null ? (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(log.details).slice(0, 3).map(([k, v]) => (
                            <div key={k} className="inline-flex items-center px-1.5 py-0.5 rounded bg-black/20 border border-white/5 text-[9px]">
                              <span className="text-slate-600 mr-1.5 uppercase tracking-wide">{k}</span>
                              <span className="text-indigo-300 font-mono truncate max-w-[120px]">
                                {String(v)}
                              </span>
                            </div>
                          ))}
                          {Object.keys(log.details).length > 3 && (
                            <span className="text-[9px] text-slate-600 italic px-1">...</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium truncate italic">{String(log.details)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900/20 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl hover:border-indigo-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors duration-500" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10">
              <ShieldCheck className="text-indigo-400" size={16} /> Santé Système
            </h3>
            <div className="space-y-6 relative z-10">
              <SystemBar label="Charge RAM" value={stats.system?.memory || 15} color="emerald" />
              <SystemBar label="Uptime Serveur (h)" value={Math.min(100, (stats.system?.uptime / 24) * 100) || 99.9} color="blue" displayValue={stats.system?.uptime + 'h'} />
              <SystemBar label="CPU Load (avg)" value={Math.min(100, parseFloat(stats.system?.load || 0) * 100) || 5} color="indigo" displayValue={stats.system?.load} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative group hover:border-white/10 transition-all">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10">
              <Cpu className="text-purple-400" size={16} /> Intelligence Synthétique
            </h3>
            <div className="space-y-4 relative z-10">
              <ServiceStatus label="Gemini AI Engine" status="Opérationnel" color="emerald" />
              <ServiceStatus label="Matching Logic" status="En ligne" color="blue" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SystemBar({ label, value, color, displayValue }) {
  const barColors = {
    emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    blue: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    indigo: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-500">{label}</span>
        <span className={`text-${color}-500`}>{displayValue || (value === 99.9 ? 'Optimal' : `${value}%`)}</span>
      </div>
      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full rounded-full ${barColors[color]}`}
        />
      </div>
    </div>
  );
}

function ServiceStatus({ label, status, color }) {
  return (
    <div className="p-4 bg-slate-950/30 rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-white/10 hover:bg-slate-950/50 transition-all shadow-lg">
      <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse shadow-[0_0_8px_currentColor]`} />
      <div>
        <p className="text-[10px] font-black text-white uppercase tracking-widest">{label}</p>
        <p className="text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-400 transition-colors">{status}</p>
      </div>
    </div>
  );
}
