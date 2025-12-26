import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { Search, Filter, RefreshCw, Video, User, Clock, CheckCircle, AlertCircle, Calendar, Building, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const LiveManager = () => {
    const [data, setData] = useState({ stats: { active: 0, queue: 0, completed: 0 }, interviews: [], lastUpdated: null });
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);

    // Filters
    const [companyId, setCompanyId] = useState('');
    const [status, setStatus] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setIsRefreshing(true);
        try {
            const res = await adminApi.getLiveManagerData({ companyId, status });
            setData(res);
        } catch (err) {
            console.error("Failed to fetch live data", err);
            toast.error("Erreur actualisation live");
        } finally {
            if (showLoading) setLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const res = await adminApi.getCompanies();
            setCompanies(res);
        } catch (e) { console.error(e) }
    };

    useEffect(() => {
        fetchFilters();
    }, []);

    // Poll every 30 seconds
    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData(false);
        }, 30000);
        return () => clearInterval(interval);
    }, [companyId, status]);

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Video className="text-indigo-500" size={36} />
                        Live Manager
                        <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest animate-pulse">Temps Réel</span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Vue d'ensemble des entretiens en cours et de la file d'attente</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Dernière maj: <span className="text-slate-300">{data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '-'}</span>
                    </div>
                    <button
                        onClick={() => fetchData(false)}
                        className={`p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
                        title="Rafraîchir"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="En Cours"
                    value={data.stats.active}
                    icon={Video}
                    color="emerald"
                    subtext="Entretiens actifs maintenant"
                />
                <StatCard
                    label="En Attente"
                    value={data.stats.queue}
                    icon={Clock}
                    color="blue"
                    subtext="Prochains entretiens"
                />
                <StatCard
                    label="Terminés (1h)"
                    value={data.stats.completed}
                    icon={CheckCircle}
                    color="slate"
                    subtext="Dernière heure"
                />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-5 relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <select
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium cursor-pointer"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                    >
                        <option value="">Toutes les entreprises</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="lg:col-span-5 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <select
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium cursor-pointer"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="ACCEPTED">Confirmé</option>
                        <option value="COMPLETED">Terminé</option>
                        <option value="CANCELLED">Annulé</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading && data.interviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-bold animate-pulse">Chargement du planning...</p>
                    </div>
                ) : data.interviews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800"
                    >
                        <Calendar size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">Aucun entretien prévu</h3>
                        <p className="text-slate-500 mt-2">Le planning est vide pour le moment.</p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {data.interviews.map((item, idx) => (
                            <InterviewCard key={item.id} item={item} idx={idx} />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </AdminLayout>
    );
};

const StatCard = ({ label, value, icon: Icon, color, subtext }) => {
    const colors = {
        emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
        blue: "text-blue-400 bg-blue-500/5 border-blue-500/10",
        slate: "text-slate-200 bg-slate-800/20 border-slate-700/30"
    };

    return (
        <div className={`p-6 rounded-3xl border ${colors[color]} relative overflow-hidden backdrop-blur-sm`}>
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
                    <p className="text-3xl font-black">{value}</p>
                    <p className="text-xs mt-2 opacity-50 font-medium">{subtext}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-white/5`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

const InterviewCard = ({ item, idx }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className={`group relative bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-[2rem] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900 shadow-xl hover:shadow-indigo-500/5 transition-all border-l-4 ${item.liveStatus === 'active' ? 'border-l-emerald-500' : 'border-l-transparent'}`}
        >
            <div className="flex items-center gap-6">
                {/* Avatar / Time */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center p-1 border border-slate-800 shadow-inner overflow-hidden">
                        {item.studentPhoto ? (
                            <img src={item.studentPhoto} className="w-full h-full object-cover rounded-xl" alt="" />
                        ) : (
                            <User className="text-slate-700" size={24} />
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-white">{item.studentName}</h3>
                        <StatusBadge liveStatus={item.liveStatus} />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 text-sm text-slate-400 mt-2">
                        <div className="flex items-center gap-2">
                            <Building size={14} className="text-indigo-500" />
                            <span className="font-medium text-slate-300">{item.companyName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-blue-500" />
                            <span className="font-medium">
                                {new Date(item.dateTime).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className={item.liveStatus === 'active' ? "text-emerald-500 animate-pulse" : "text-slate-500"} />
                            <span className={`font-bold ${item.liveStatus === 'active' ? "text-emerald-400" : "text-slate-400"}`}>
                                {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-2">{item.title}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {item.meetLink && (
                    <a
                        href={item.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                            px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95
                            ${item.liveStatus === 'active'
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                            }
                        `}
                    >
                        <Video size={16} />
                        Rejoindre
                        {item.liveStatus === 'active' && <ExternalLink size={12} />}
                    </a>
                )}
            </div>
        </motion.div>
    );
};

const StatusBadge = ({ liveStatus }) => {
    if (liveStatus === 'active') {
        return (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-lg shadow-emerald-500/5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                En Cours
            </span>
        );
    }
    if (liveStatus === 'queue') {
        return (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                À venir
            </span>
        );
    }
    return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800/50 text-slate-500 border border-slate-700 flex items-center gap-1.5">
            Terminé
        </span>
    );
};

export default LiveManager;
