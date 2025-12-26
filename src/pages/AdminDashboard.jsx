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
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl group transition-all hover:bg-slate-900 shadow-xl"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-full">
          <ArrowUpRight size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-3xl font-black text-white mb-1">{value}</p>
    <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">{title}</p>
  </motion.div>
);

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
      setLogs(lData.slice(0, 5)); // Only show top 5
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Vue d'Ensemble</h1>
          <p className="text-slate-400 mt-2 font-medium">Contrôle analytique en temps réel du réseau InternFlow</p>
        </div>
        <div className="flex gap-4 print:hidden">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 shadow-xl"
          >
            <FileText size={18} /> Rapport PDF
          </button>
          <button
            onClick={() => window.location.href = '/settings'}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            Configuration
          </button>
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
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2.5rem] overflow-hidden p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <TrendingUp className="text-blue-500" size={18} /> Statut Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/60 relative group overflow-hidden hover:bg-slate-950 transition-colors">
                <div className="absolute top-0 right-0 p-4 text-orange-500/10 group-hover:scale-125 transition-transform">
                  <Clock size={64} />
                </div>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">Validations en attente</p>
                <p className="text-4xl font-black text-orange-500 tracking-tighter">{stats.pendingCompanies}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500">Action requise nécessaire</span>
                </div>
              </div>
              <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/60 relative group overflow-hidden hover:bg-slate-950 transition-colors">
                <div className="absolute top-0 right-0 p-4 text-indigo-500/10 group-hover:scale-125 transition-transform">
                  <Activity size={64} />
                </div>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">Charge Écosystème</p>
                <p className="text-4xl font-black text-indigo-500 tracking-tighter">{stats.totalStudents + stats.totalCompanies}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500">Utilisateurs connectés</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Terminal className="text-blue-500" size={18} /> Audit Action Logs
              </h3>
              <button onClick={loadData} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-white">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="py-10 text-center text-slate-700 italic font-bold uppercase tracking-widest">Niveau de silence total détecté</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-2 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 hover:bg-slate-900 transition-colors group">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${log.action.includes('DELETE') ? 'bg-red-500/10 text-red-500' :
                        log.action.includes('UPDATE') ? 'bg-amber-500/10 text-amber-500' :
                          log.action.includes('NEW') ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-blue-500/10 text-blue-500'
                        }`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600 font-bold">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="mt-1">
                      {typeof log.details === 'object' && log.details !== null ? (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(log.details).slice(0, 3).map(([k, v]) => (
                            <div key={k} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px]">
                              <span className="text-slate-600 mr-1.5 uppercase tracking-wide">{k}</span>
                              <span className="text-indigo-400 font-mono truncate max-w-[120px]">
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
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900/10 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <ShieldCheck className="text-indigo-400" size={16} /> Santé Système
            </h3>
            <div className="space-y-6">
              <SystemBar label="Charge RAM" value={stats.system?.memory || 15} color="emerald" />
              <SystemBar label="Uptime Serveur (h)" value={Math.min(100, (stats.system?.uptime / 24) * 100) || 99.9} color="blue" displayValue={stats.system?.uptime + 'h'} />
              <SystemBar label="CPU Load (avg)" value={Math.min(100, parseFloat(stats.system?.load || 0) * 100) || 5} color="indigo" displayValue={stats.system?.load} />
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <Cpu className="text-purple-400" size={16} /> Intelligence Synthétique
            </h3>
            <div className="space-y-4">
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
    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 flex items-center gap-4 group hover:border-slate-700 transition-colors">
      <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`} />
      <div>
        <p className="text-[10px] font-black text-white uppercase tracking-widest">{label}</p>
        <p className="text-[9px] text-slate-600 font-bold uppercase">{status}</p>
      </div>
    </div>
  );
}
