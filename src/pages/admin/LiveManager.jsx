import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { Video, Clock, CheckCircle, RefreshCw, Filter, Search, Download, FileText, Layers, ChevronRight, Star, User, Building, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { exportToExcel } from "../../utils/excelExporter";

const LiveManager = () => {
    const [activeTab, setActiveTab] = useState("live"); // 'live' | 'history'
    const [data, setData] = useState({ stats: { active: 0, queue: 0, completed: 0 }, interviews: [], lastUpdated: null });
    const [history, setHistory] = useState([]);
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

            // Fetch history separately or assume it's part of the data if API supports
            // For now let's assume we fetch all interviews for history and filter client-side or use another endpoint
            const allInterviews = await adminApi.getInterviews(); // Reuse existing endpoint
            const completed = allInterviews.filter(i => i.status === 'COMPLETED');
            setHistory(completed);

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

    const groupedHistory = useMemo(() => {
        return history.reduce((groups, item) => {
            const key = item.companyName || 'Autre';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
        }, {});
    }, [history]);

    const handleExportHistory = () => {
        const columns = [
            { header: "Entreprise", key: "companyName", width: 25 },
            { header: "Candidat", key: "studentName", width: 25 },
            { header: "Date", key: "date", width: 15 },
            { header: "Note", key: "score", width: 10 },
            { header: "Remarques", key: "remarks", width: 40 },
        ];

        const exportData = history.map(h => ({
            companyName: h.companyName,
            studentName: h.studentName,
            date: new Date(h.dateTime).toLocaleDateString(),
            score: h.score ? `${h.score}/10` : 'N/A',
            remarks: h.remarks || ""
        }));

        exportToExcel(`Historique_Live_${new Date().toISOString().split('T')[0]}`, "Historique", columns, exportData, "Historique des Entretiens Live");
        toast.success("Historique exporté !");
    };

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
                        className={`p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all`}
                        title="Rafraîchir"
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <RefreshCw size={16} />}
                    </button>
                    {activeTab === 'history' && (
                        <button onClick={handleExportHistory} className="ml-2 p-2 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl transition-all" title="Exporter Excel">
                            <Download size={16} />
                        </button>
                    )}
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

            {/* Tabs & Filters */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center justify-between">
                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'live' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Video size={16} /> Live
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <FileText size={16} /> Historique
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative group flex-1">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <select
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-2.5 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium cursor-pointer text-sm"
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                        >
                            <option value="">Toutes les entreprises</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <select
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-2.5 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium cursor-pointer text-sm"
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
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'live' ? (
                    loading && data.interviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={48} className="text-indigo-500 animate-spin" />
                            <p className="text-slate-500 font-bold animate-pulse">Chargement du planning...</p>
                        </div>
                    ) : data.interviews.length === 0 ? (
                        <EmptyState message="Aucun entretien prévu pour le moment." />
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {data.interviews.map((item, idx) => (
                                <InterviewCard key={item.id} item={item} idx={idx} />
                            ))}
                        </AnimatePresence>
                    )
                ) : (
                    // History Tab
                    Object.keys(groupedHistory).length === 0 ? (
                        <EmptyState message="Aucun historique d'entretien disponible." />
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedHistory).map(([companyName, items], idx) => (
                                <HistoryGroup key={companyName} companyName={companyName} items={items} idx={idx} />
                            ))}
                        </div>
                    )
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
                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center p-1 border border-slate-800 shadow-inner overflow-hidden">
                    {item.studentPhoto ? (
                        <img src={item.studentPhoto} className="w-full h-full object-cover rounded-xl" alt="" />
                    ) : (
                        <User className="text-slate-700" size={24} />
                    )}
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
                            <Clock size={14} className={item.liveStatus === 'active' ? "text-emerald-500 animate-pulse" : "text-slate-500"} />
                            <span className={`font-bold ${item.liveStatus === 'active' ? "text-emerald-400" : "text-slate-400"}`}>
                                {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
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

const HistoryGroup = ({ companyName, items, idx }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-4"
        >
            <div
                className="flex items-center gap-4 px-2 cursor-pointer group select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-500">
                    <Layers size={20} />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                    {companyName}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
                <div className={`p-2 rounded-full bg-slate-900 border border-slate-800 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                    <ChevronRight size={20} className="text-slate-400" />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {items.map((item, i) => (
                            <HistoryCard key={item.id} item={item} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

const HistoryCard = ({ item }) => (
    <div className="bg-slate-900/20 border border-slate-800/40 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-900/40 transition-all">
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-bold text-white">{item.studentName}</h4>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Clock size={12} /> {new Date(item.dateTime).toLocaleDateString()}</span>
            </div>
            <p className="text-blue-400 font-bold text-sm mb-4">{item.jobTitle || item.title || "Entretien"}</p>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Feedback & Remarques</p>
                <p className="text-slate-300 text-sm leading-relaxed">{item.remarks || "Aucune remarque."}</p>
            </div>
        </div>

        <div className="w-full md:w-32 bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-slate-800 shrink-0 p-4">
            <Star className={item.score >= 7 ? "text-emerald-500 fill-emerald-500/20" : item.score >= 4 ? "text-orange-500 fill-orange-500/20" : "text-red-500 fill-red-500/20"} size={24} />
            <span className={`text-2xl font-black mt-2 ${item.score >= 7 ? "text-emerald-400" : item.score >= 4 ? "text-orange-400" : "text-red-400"}`}>{item.score || "-"}</span>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Note / 10</span>
        </div>
    </div>
)

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

const EmptyState = ({ message }) => (
    <div className="text-center py-24 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800">
        <Video size={48} className="mx-auto text-slate-700 mb-4" />
        <h3 className="text-xl font-bold text-slate-400">Rien à signaler</h3>
        <p className="text-slate-500 mt-2">{message}</p>
    </div>
);

export default LiveManager;
