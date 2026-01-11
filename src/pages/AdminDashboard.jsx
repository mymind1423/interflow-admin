import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { SkeletonStatCard } from "../components/common/Skeletons";
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
  const textColors = {
    blue: "text-blue-600 dark:text-blue-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    purple: "text-purple-600 dark:text-purple-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
  };

  const bgColors = {
    blue: "bg-blue-50 dark:bg-blue-500/10",
    indigo: "bg-indigo-50 dark:bg-indigo-500/10",
    purple: "bg-purple-50 dark:bg-purple-500/10",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10",
    amber: "bg-amber-50 dark:bg-amber-500/10",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] group transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl dark:hover:shadow-black/20 relative overflow-hidden"
    >

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3.5 rounded-2xl ${bgColors[color] || 'bg-slate-100 dark:bg-slate-800'} ${textColors[color] || 'text-slate-600 dark:text-slate-400'} ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <ArrowUpRight size={12} strokeWidth={3} /> {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-1 group-hover:scale-105 transition-transform origin-left">{value}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
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


  const humanizeLog = (log) => {
    const { action, actorName, details } = log;
    const name = actorName || "Système";

    switch (action) {
      case 'JOB_APPLICATION':
        return `${name} a postulé à une offre`;
      case 'APPROVE_COMPANY':
        return `${name} a approuvé ${details?.companyName || 'une entreprise'}`;
      case 'REJECT_COMPANY':
        return `${name} a rejeté ${details?.companyName || 'une entreprise'}`;
      case 'UPDATE_SETTING':
        return `${name} a modifié les paramètres`;
      case 'LOGIN':
        return `${name} s'est connecté`;
      case 'DELETE_USER':
        return `${name} a supprimé un compte`;
      case 'NEW_MESSAGE':
        return `${name} a envoyé un message`;
      default:
        return `${name}: ${action.replace(/_/g, ' ')}`;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, lData, apps, interviews, students] = await Promise.all([
        adminApi.getStats(),
        adminApi.getLogs(),
        adminApi.getApplications(),
        adminApi.getInterviews(),
        adminApi.getStudents()
      ]);

      // Compute frontend stats
      const acceptedInterviews = interviews.filter(i => i.status === 'ACCEPTED' || i.status === 'COMPLETED').length;
      const matchingRate = apps.length > 0 ? ((acceptedInterviews / apps.length) * 100).toFixed(1) : 0;

      // Students without interviews
      const studentsWithInterviews = new Set(interviews.map(i => i.studentId));
      const studentsWithoutInterviews = students.length - studentsWithInterviews.size;

      setStats({
        ...sData,
        matchingRate,
        studentsWithoutInterviews
      });
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
      <div className="relative mb-12 p-8 sm:p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 backdrop-blur-md text-blue-600 dark:text-blue-200 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck size={12} /> Espace Administration
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
              Vue Globale
            </h1>
            <p className="text-slate-500 dark:text-blue-100/80 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              Contrôle analytique en temps réel de l'écosystème InternFlow.
            </p>
          </div>
          <div className="flex gap-3 print:hidden">
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-3 bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest backdrop-blur-md transition-all flex items-center gap-2"
            >
              <FileText size={18} /> <span className="hidden sm:inline">Rapport</span>
            </button>
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-indigo-950 hover:bg-slate-800 dark:hover:bg-blue-50 border border-transparent dark:border-white/20 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-black/20 active:scale-95"
            >
              Config
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              title="Entreprises"
              value={stats.activeCompanies}
              icon={Building2}
              color="blue"
              trend="+12%"
            />
            <StatCard
              title="Etudiants"
              value={stats.totalStudents}
              icon={Users}
              color="indigo"
              trend="+5%"
            />
            <StatCard
              title="Postulations"
              value={stats.totalApplications}
              icon={Briefcase}
              color="purple"
              trend="+28%"
            />
            <StatCard
              title="Entretiens"
              value={stats.totalInterviews}
              icon={CheckCircle}
              color="emerald"
              trend="+15%"
            />
            <StatCard
              title="Étudiants sans entretien"
              value={stats.studentsWithoutInterviews !== undefined ? stats.studentsWithoutInterviews : '-'}
              icon={Users}
              color="amber"
              trend={null}
            />
            <StatCard
              title="Total Retenus"
              value={stats.totalRetained !== undefined ? stats.totalRetained : '-'}
              icon={CheckCircle}
              color="blue"
              trend="+8%"
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden p-6 sm:p-8 shadow-xl dark:shadow-2xl relative group">
            <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 relative z-10">
              <TrendingUp className="text-blue-600 dark:text-blue-500" size={18} /> Statut Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              <div className="p-6 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-white/5 relative group/card overflow-hidden hover:bg-white dark:hover:bg-slate-950/50 transition-colors hover:border-orange-200 dark:hover:border-white/10 hover:shadow-lg">
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
              <div className="p-6 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-white/5 relative group/card overflow-hidden hover:bg-white dark:hover:bg-slate-950/50 transition-colors hover:border-indigo-200 dark:hover:border-white/10 hover:shadow-lg">
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

          <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-xl dark:shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Terminal className="text-blue-600 dark:text-blue-500" size={18} /> Audit Action Logs
              </h3>
              <button onClick={loadData} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-white hover:scale-110 active:scale-95">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              </button>
            </div>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="py-10 text-center text-slate-700 italic font-bold uppercase tracking-widest">Niveau de silence total détecté</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group">
                    <div className={`p-2 rounded-xl shrink-0 ${log.action.includes('DELETE') ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                        log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                          log.action.includes('NEW') || log.action.includes('APPROVE') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}>
                      <Activity size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {humanizeLog(log)}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={14} className="text-slate-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl dark:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-500">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10">
              <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={16} /> Santé Système
            </h3>
            <div className="space-y-6 relative z-10">
              <SystemBar
                label="Stockage Oracle BDD"
                value={Math.min(100, (stats.system?.storage / 500) * 100 || 5)}
                color="blue"
                displayValue={stats.system?.storage !== undefined ? `${stats.system.storage} MB` : '...'}
              />
              <SystemBar
                label="Latence (Ping)"
                value={Math.min(100, (stats.system?.ping / 300) * 100 || 5)}
                color={
                  !stats.system?.ping ? "slate" :
                    stats.system.ping < 100 ? "emerald" :
                      stats.system.ping < 200 ? "blue" :
                        stats.system.ping < 500 ? "amber" : "rose"
                }
                displayValue={stats.system?.ping !== undefined ? `${stats.system.ping} ms` : '...'}
              />
              <SystemBar
                label="Charge RAM"
                value={stats.system?.memory || 0}
                color={
                  !stats.system?.memory ? "slate" :
                    stats.system.memory < 60 ? "emerald" :
                      stats.system.memory < 85 ? "blue" :
                        stats.system.memory < 95 ? "amber" : "rose"
                }
              />
              <SystemBar
                label="Uptime Serveur"
                value={100}
                color="indigo"
                displayValue={stats.system?.uptime !== undefined ? `${stats.system.uptime} h` : '...'}
              />
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-[2rem] relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <h4 className="font-black text-amber-900 dark:text-amber-100 mb-1">Attention Recommandée</h4>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 leading-relaxed">
                  Le stockage BDD augmente rapidement (+15% cette semaine). Pensez à archiver les logs anciens.
                </p>
              </div>
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
    indigo: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]",
    purple: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
    amber: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    rose: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
    slate: "bg-slate-300 dark:bg-slate-700"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold transition-colors ${color === 'rose' ? 'text-rose-600 dark:text-rose-400' :
          color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
            color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
              color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                  color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                    'text-slate-600 dark:text-slate-400'
          }`}>{displayValue || (value === 99.9 ? 'Optimal' : `${value}%`)}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full rounded-full transition-all duration-500 ${barColors[color] || barColors.blue}`}
        />
      </div>
    </div>
  );
}

function ServiceStatus({ label, status, color }) {
  return (
    <div className="p-4 bg-white dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-4 group hover:border-blue-300 dark:hover:border-white/10 hover:shadow-md dark:hover:bg-slate-950/50 transition-all">
      <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse shadow-[0_0_8px_currentColor]`} />
      <div>
        <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{label}</p>
        <p className="text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">{status}</p>
      </div>
    </div>
  );
}
