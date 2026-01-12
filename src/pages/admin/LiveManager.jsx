import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { Video, Clock, CheckCircle, RefreshCw, Filter, Search, Download, FileText, Layers, ChevronRight, Star, User, Building, ExternalLink, Loader2 } from 'lucide-react';
import { SkeletonTable } from '../../components/common/Skeletons';
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { exportToExcel } from "../../utils/excelExporter";
import StudentDetailModal from '../../components/admin/StudentDetailModal';

import { getUTCAsLocal } from "../../utils/dateUtils";

const LiveManager = () => {
    const [activeTab, setActiveTab] = useState("live"); // 'live' | 'history' | 'retained'
    const [data, setData] = useState({ stats: { active: 0, queue: 0, completed: 0 }, interviews: [], lastUpdated: null });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);

    // Modal State
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Filters
    const [companyId, setCompanyId] = useState('');
    const [status, setStatus] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Derived Stats
    const totalRetained = useMemo(() => history.filter(h => h.isRetained).length, [history]);
    const retentionRate = useMemo(() => {
        const completed = history.length;
        if (completed === 0) return 0;
        return ((totalRetained / completed) * 100).toFixed(1);
    }, [history, totalRetained]);

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setIsRefreshing(true);
        try {
            const res = await adminApi.getLiveManagerData({ companyId, status });
            setData(res);

            // Fetch history separately or assume it's part of the data if API supports
            // For now let's assume we fetch all interviews for history and filter client-side or use another endpoint
            const allInterviews = await adminApi.getInterviews(); // Reuse existing endpoint
            // Filter history to COMPLETED or any historical status, include retained
            // Filter history: COMPLETED, or RETAINED, or (ACCEPTED/CONFIRMED and in the past)
            // This ensures we count all "finished" interviews for the retention rate
            const now = new Date();
            const completed = allInterviews.filter(i => {
                const interviewDate = new Date(getUTCAsLocal(i.dateTime));
                const isPast = interviewDate < now;
                const isCancelled = i.status === 'CANCELLED' || i.status === 'REJECTED' || i.status === 'DECLINED';
                const isFinishedStatus = i.status === 'COMPLETED' || i.status === 'CHECKED_IN';

                // Include if:
                // 1. Explicitly marked finished (COMPLETED, CHECKED_IN)
                // 2. Is Retained (always counts)
                // 3. Is in the past and NOT cancelled (covers ACCEPTED/CONFIRMED that weren't updated)
                return (isFinishedStatus || i.isRetained || (isPast && !isCancelled));
            });
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

    const groupedRetained = useMemo(() => {
        const retainedItems = history.filter(i => i.isRetained);
        return retainedItems.reduce((groups, item) => {
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
            { header: "Retenu", key: "isRetained", width: 10 },
        ];

        const exportData = history.map(h => ({
            companyName: h.companyName,
            studentName: h.studentName,
            date: new Date(getUTCAsLocal(h.dateTime)).toLocaleDateString(),
            score: h.score ? `${h.score}/10` : 'N/A',
            remarks: h.remarks || "",
            isRetained: h.isRetained ? "OUI" : "NON"
        }));

        exportToExcel(`Historique_Live_${new Date().toISOString().split('T')[0]}`, "Historique", columns, exportData, "Historique des Entretiens Live");
        toast.success("Historique exporté !");
    };

    const openStudentDetails = (item) => {
        // Construct student object from item details
        setSelectedStudent({
            id: item.studentId,
            fullname: item.studentName,
            photoUrl: item.studentPhoto,
            email: item.email,
            domaine: item.domaine,
            grade: item.grade,
            dateOfBirth: item.studentDateOfBirth,
            cvUrl: item.cvUrl,
            diplomaUrl: item.diplomaUrl
        });
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
                    <p className="text-slate-400 mt-2 font-medium">Vue d'overview des entretiens en cours et de la file d'attente</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-white dark:bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Dernière maj: <span className="text-slate-700 dark:text-slate-300 font-bold">{data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '-'}</span>
                    </div>
                    <button
                        onClick={() => fetchData(false)}
                        className={`p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all`}
                        title="Rafraîchir"
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <RefreshCw size={16} />}
                    </button>
                    {(activeTab === 'history' || activeTab === 'retained') && (
                        <button onClick={handleExportHistory} className="ml-2 p-2 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl transition-all" title="Exporter Excel">
                            <Download size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <StatCard
                    label="En Cours"
                    value={data.stats.active}
                    icon={Video}
                    color="emerald"
                    subtext="Actifs"
                />
                <StatCard
                    label="En Attente"
                    value={data.stats.queue}
                    icon={Clock}
                    color="blue"
                    subtext="Queue"
                />
                <StatCard
                    label="Terminés"
                    value={data.stats.completed}
                    icon={CheckCircle}
                    color="slate"
                    subtext="1 heure"
                />
                {/* New Retention KPIs */}
                <StatCard
                    label="Retenus"
                    value={totalRetained}
                    icon={Star}
                    color="indigo"
                    subtext="Total"
                />
                <StatCard
                    label="Taux Rétention"
                    value={`${retentionRate}%`}
                    icon={CheckCircle}
                    color="purple"
                    subtext="Performance"
                />
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center justify-between">
                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'live' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Video size={16} /> Live
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <FileText size={16} /> Historique
                    </button>
                    <button
                        onClick={() => setActiveTab('retained')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'retained' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Star size={16} /> Retenus <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{totalRetained}</span>
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative group flex-1">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-12 pr-4 text-slate-700 dark:text-white appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium cursor-pointer text-sm"
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                        >
                            <option value="">Toutes les entreprises</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-12 pr-4 text-slate-700 dark:text-white appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium cursor-pointer text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="ACCEPTED">Confirmé</option>
                            <option value="COMPLETED">Terminé</option>
                            <option value="CANCELLED">Annulé</option>
                            {/* <option value="RETAINED">🌟 Retenu</option> - Removed as we have a tab now, or keep for History? Keep for history flexbility */}
                            <option value="RETAINED">🌟 Retenu</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'live' && (
                    loading && data.interviews.length === 0 ? (
                        <SkeletonTable />
                    ) : data.interviews.length === 0 ? (
                        <EmptyState message="Aucun entretien prévu pour le moment." />
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {data.interviews.map((item, idx) => (
                                <InterviewCard key={item.id} item={item} idx={idx} onClick={() => openStudentDetails(item)} />
                            ))}
                        </AnimatePresence>
                    )
                )}

                {activeTab === 'history' && (
                    Object.keys(groupedHistory).length === 0 ? (
                        <EmptyState message="Aucun historique d'entretien disponible." />
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedHistory).map(([companyName, items], idx) => {
                                // Filter by retained if retained is selected in dropdown
                                const filteredItems = status === 'RETAINED' ? items.filter(i => i.isRetained) : items;
                                if (status === 'RETAINED' && filteredItems.length === 0) return null;
                                if (filteredItems.length === 0) return null;

                                return (
                                    <HistoryGroup key={companyName} companyName={companyName} items={filteredItems} idx={idx} onStudentClick={openStudentDetails} />
                                )
                            })}
                        </div>
                    )
                )}

                {activeTab === 'retained' && (
                    Object.keys(groupedRetained).length === 0 ? (
                        <EmptyState message="Aucun profil retenu pour le moment." />
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedRetained).map(([companyName, items], idx) => (
                                <HistoryGroup key={companyName} companyName={companyName} items={items} idx={idx} onStudentClick={openStudentDetails} />
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Student Detail Modal */}
            <StudentDetailModal
                student={selectedStudent}
                onClose={() => setSelectedStudent(null)}
            />
        </AdminLayout>
    );
};

const StatCard = ({ label, value, icon: Icon, color, subtext }) => {
    const colors = {
        emerald: "text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-500/5 border-slate-200 dark:border-emerald-500/10 shadow-sm",
        blue: "text-blue-600 dark:text-blue-400 bg-white dark:bg-blue-500/5 border-slate-200 dark:border-blue-500/10 shadow-sm",
        slate: "text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-700/30 shadow-sm",
        indigo: "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-indigo-500/5 border-slate-200 dark:border-indigo-500/10 shadow-sm",
        purple: "text-purple-600 dark:text-purple-400 bg-white dark:bg-purple-500/5 border-slate-200 dark:border-purple-500/10 shadow-sm"
    };

    return (
        <div className={`p-6 rounded-3xl border relative overflow-hidden backdrop-blur-sm ${colors[color]}`}>
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
                    <p className="text-3xl font-black">{value}</p>
                    <p className="text-xs mt-2 opacity-50 font-medium">{subtext}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-white/5`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

const InterviewCard = ({ item, idx, onClick }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className={`group relative bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/60 rounded-[2rem] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-200 dark:hover:bg-slate-900 shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-indigo-500/5 transition-all border-l-4 ${item.liveStatus === 'active' ? 'border-l-emerald-500 shadow-emerald-500/10' : 'border-l-transparent'}`}
        >
            <div className="flex items-center gap-6 cursor-pointer" onClick={onClick}>
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-1 border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                    {item.studentPhoto ? (
                        <img src={item.studentPhoto} className="w-full h-full object-cover rounded-xl" alt="" />
                    ) : (
                        <User className="text-slate-400 dark:text-slate-700" size={24} />
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">{item.studentName}</h3>
                        <StatusBadge liveStatus={item.liveStatus} />
                        {item.isRetained && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 animate-pulse">
                                🌟 Retenu
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
                        <div className="flex items-center gap-2">
                            <Building size={14} className="text-indigo-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.companyName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className={item.liveStatus === 'active' ? "text-emerald-500 animate-pulse" : "text-slate-400 dark:text-slate-500"} />
                            <span className={`font-bold ${item.liveStatus === 'active' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                                {new Date(getUTCAsLocal(item.dateTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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

const HistoryGroup = ({ companyName, items, idx, onStudentClick }) => {
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
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-500">
                    <Layers size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                    {companyName}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent"></div>
                <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
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
                            <HistoryCard key={item.id} item={item} onClick={() => onStudentClick(item)} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

const HistoryCard = ({ item, onClick }) => (
    <div className={`bg-white dark:bg-slate-900/20 border rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 hover:border-blue-200 dark:hover:bg-slate-900/40 transition-all shadow-sm dark:shadow-none ${item.isRetained ? 'border-indigo-500/30' : 'border-slate-200 dark:border-slate-800/40'}`}>
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 cursor-pointer group" onClick={onClick}>
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    {item.studentPhoto ? <img src={item.studentPhoto} alt="" className="w-full h-full object-cover" /> : <User size={16} className="m-1.5 text-slate-400" />}
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">{item.studentName}</h4>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Clock size={12} /> {new Date(getUTCAsLocal(item.dateTime)).toLocaleDateString()}</span>
                {item.isRetained && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                        🌟 Retenu
                    </span>
                )}
            </div>
            <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-4 ml-11">{item.jobTitle || item.title || "Entretien"}</p>

            <div className={`bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border ${item.isRetained ? 'border-indigo-100 dark:border-indigo-500/10 bg-indigo-50/10' : 'border-slate-100 dark:border-slate-800/50'} ml-11`}>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest mb-2">Feedback & Remarques</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.remarks || "Aucune remarque."}</p>
            </div>
        </div>

        <div className="w-full md:w-32 bg-slate-100 dark:bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0 p-4">
            <Star className={item.score >= 7 ? "text-emerald-500 fill-emerald-500/20" : item.score >= 4 ? "text-orange-500 fill-orange-500/20" : "text-red-500 fill-red-500/20"} size={24} />
            <span className={`text-2xl font-black mt-2 ${item.score >= 7 ? "text-emerald-500 dark:text-emerald-400" : item.score >= 4 ? "text-orange-500 dark:text-orange-400" : "text-red-500 dark:text-red-400"}`}>{item.score || "-"}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest">Note / 10</span>
        </div>
    </div>
)

const StatusBadge = ({ liveStatus }) => {
    if (liveStatus === 'active') {
        return (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 shadow-lg shadow-emerald-500/5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                En Cours
            </span>
        );
    }
    if (liveStatus === 'queue') {
        return (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                À venir
            </span>
        );
    }
    return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            Terminé
        </span>
    );
};

const EmptyState = ({ message }) => (
    <div className="text-center py-24 bg-white dark:bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
        <Video size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-xl font-bold text-slate-400 dark:text-slate-400">Rien à signaler</h3>
        <p className="text-slate-400 dark:text-slate-500 mt-2">{message}</p>
    </div>
);

export default LiveManager;
