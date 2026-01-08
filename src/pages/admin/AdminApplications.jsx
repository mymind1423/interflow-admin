import { useState, useEffect, useMemo } from "react";
import { exportToExcel } from "../../utils/excelExporter";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../api/adminApi";
import { FileText, Search, Building2, User, Clock, CheckCircle, XCircle, Download, Calendar, ExternalLink, Briefcase, ChevronRight, Mail, GraduationCap, Loader2, LayoutGrid, List } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonTable } from "../../components/common/Skeletons";
import { calculateAge } from "../../utils/dateUtils";

export default function AdminApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'accepted' | 'rejected'
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
    const [selectedApp, setSelectedApp] = useState(null);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getApplications();
            setApplications(data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement candidatures");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const columns = [
            { header: "Entreprise", key: "company", width: 25 },
            { header: "Étudiant", key: "student", width: 25 },
            { header: "Poste", key: "job", width: 30 },
            { header: "Age", key: "age", width: 10 },
            { header: "Statut", key: "status", width: 15 },
            { header: "Date", key: "date", width: 15 },
        ];

        const data = filteredApps.map(app => ({
            company: app.companyName,
            student: app.applicantName,
            job: app.jobTitle,
            age: app.applicantDateOfBirth ? calculateAge(app.applicantDateOfBirth) : "",
            status: app.status === 'ACCEPTED' ? 'Acceptée' : app.status === 'REJECTED' ? 'Refusée' : 'En cours',
            date: new Date(app.createdAt).toLocaleDateString()
        }));

        exportToExcel(`Candidatures_${new Date().toISOString().split('T')[0]}`, "Candidatures", columns, data, `Candidatures (${activeTab === 'all' ? 'Toutes' : activeTab})`);
    };

    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch =
                app.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTab =
                activeTab === "all" ||
                (activeTab === "pending" && (app.status === 'APPLIED' || app.status === 'REVIEWING')) ||
                (activeTab === "accepted" && app.status === 'ACCEPTED') ||
                (activeTab === "rejected" && app.status === 'REJECTED');

            return matchesSearch && matchesTab;
        });
    }, [applications, searchTerm, activeTab]);

    // Grouping by company
    const groupedApps = useMemo(() => {
        return filteredApps.reduce((groups, app) => {
            const name = app.companyName;
            if (!groups[name]) groups[name] = [];
            groups[name].push(app);
            return groups;
        }, {});
    }, [filteredApps]);

    return (
        <AdminLayout>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <FileText className="text-purple-500" size={36} />
                        Gestion Candidatures
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Surveillance des flux de recrutement InternFlow</p>
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                    <Download size={18} /> Exporter Excel
                </button>
            </div>

            {/* Navbar & Filter */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                <div className="xl:col-span-8 flex bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-x-auto">
                    <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="Toutes" count={applications.length} />
                    <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} label="En cours" count={applications.filter(a => !['ACCEPTED', 'REJECTED'].includes(a.status)).length} color="blue" />
                    <TabButton active={activeTab === 'accepted'} onClick={() => setActiveTab('accepted')} label="Acceptées" count={applications.filter(a => a.status === 'ACCEPTED').length} color="emerald" />
                    <TabButton active={activeTab === 'rejected'} onClick={() => setActiveTab('rejected')} label="Rejetées" count={applications.filter(a => a.status === 'REJECTED').length} color="rose" />
                </div>
                <div className="xl:col-span-4 flex gap-3">
                    <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800/50 backdrop-blur-sm shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-purple-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Vue Carte"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-purple-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Vue Liste"
                        >
                            <List size={20} />
                        </button>
                    </div>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Entreprise, candidat, poste..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Application Content */}
            <div className="space-y-12 pb-20">
                {loading ? (
                    <SkeletonTable />
                ) : Object.keys(groupedApps).length === 0 ? (
                    <div className="text-center py-24 bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-800">
                        <FileText size={48} className="mx-auto text-slate-800 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">Aucune candidature trouvée</h3>
                        <p className="text-slate-500 mt-2">Aucun dossier ne correspond à vos filtres actuels.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    Object.entries(groupedApps).map(([companyName, apps], groupIdx) => (
                        <CompanyGroup
                            key={companyName}
                            companyName={companyName}
                            apps={apps}
                            groupIdx={groupIdx}
                            onOpenApp={setSelectedApp}
                        />
                    ))
                ) : (
                    <div className="bg-slate-900/40 rounded-[2rem] border border-slate-800/50 overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="p-6 font-black">Candidat</th>
                                        <th className="p-6 font-black">Entreprise</th>
                                        <th className="p-6 font-black">Poste</th>
                                        <th className="p-6 font-black">Date</th>
                                        <th className="p-6 font-black">Statut</th>
                                        <th className="p-6 font-black text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredApps.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                                                        {app.applicantPhoto ? (
                                                            <img src={app.applicantPhoto} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={16} /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white group-hover:text-purple-400 transition-colors">{app.applicantName}</p>
                                                        <p className="text-xs text-slate-500">{calculateAge(app.applicantDateOfBirth)} ans</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white p-1 flex-shrink-0">
                                                        {app.companyLogo ? <img src={app.companyLogo} className="w-full h-full object-contain" /> : <Building2 size={16} className="text-black" />}
                                                    </div>
                                                    <span className="font-bold text-slate-300">{app.companyName}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="font-medium text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                                                    {app.jobTitle}
                                                </span>
                                            </td>
                                            <td className="p-6 text-sm text-slate-500 font-medium">
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-6">
                                                <StatusPulse status={app.status} />
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => setSelectedApp(app)}
                                                    className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>



            {/* Student Details Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedApp(null)}
                            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] h-full md:h-auto"
                        >
                            {/* Left Side: Profile Sidebar */}
                            <div className="w-full md:w-80 bg-slate-950/50 border-r border-slate-800 p-6 sm:p-8 flex flex-col items-center overflow-y-auto md:overflow-visible shrink-0">
                                <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-1 mb-6 relative group overflow-hidden">
                                    {selectedApp.applicantPhoto ? (
                                        <img src={selectedApp.applicantPhoto} className="w-full h-full object-cover rounded-[2.2rem]" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900 rounded-[2.2rem]">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-xl font-black text-white text-center">{selectedApp.applicantName}</h2>
                                <p className="text-purple-500 text-sm font-black uppercase tracking-widest mt-1">Candidat</p>

                                <div className="w-full mt-8 space-y-4">
                                    <DetailItem icon={Mail} label="Email" value={selectedApp.applicantEmail || 'Non disponible'} />
                                    <DetailItem icon={GraduationCap} label="Formation" value={selectedApp.applicantDomaine || 'Non spécifié'} />
                                    <DetailItem icon={Calendar} label="Niveau" value={selectedApp.applicantGrade || 'Non spécifié'} />
                                    {selectedApp.applicantDateOfBirth && <DetailItem icon={Calendar} label="Âge" value={`${calculateAge(selectedApp.applicantDateOfBirth)} ans`} />}
                                </div>
                            </div>

                            {/* Right Side: Content Area */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                                <div className="p-4 sm:p-8 pb-4 flex items-center justify-end border-b border-slate-800/30 shrink-0">
                                    <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                                        <XCircle size={28} />
                                    </button>
                                </div>

                                <div className="flex-1 p-5 sm:p-8 overflow-y-auto custom-scrollbar bg-slate-900/10">
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div>
                                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                                <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                                                Documents du Candidat
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <DocPreview label="CV" url={selectedApp.cvUrl} color="blue" />
                                                <DocPreview label="Diplôme" url={selectedApp.diplomaUrl} color="indigo" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}

function CompanyGroup({ companyName, apps, groupIdx, onOpenApp }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
            className="space-y-6"
        >
            <div
                className="flex items-center gap-4 px-2 cursor-pointer group select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl border border-slate-800 overflow-hidden">
                    {apps[0].companyLogo ? (
                        <img src={apps[0].companyLogo} alt={companyName} className="w-full h-full object-contain" />
                    ) : (
                        <Building2 className="text-slate-950" size={24} />
                    )}
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">{companyName}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                    {apps.length} Candidatures
                </span>
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
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-4">
                            {apps.map((app, idx) => (
                                <ApplicationCard key={app.id} app={app} delay={idx} onOpen={() => onOpenApp(app)} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

}

function DetailItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 group">
            <div className="mt-0.5 p-2 bg-slate-900 rounded-xl text-slate-500 group-hover:text-purple-400 transition-colors">
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
                <p className="text-xs font-bold text-slate-300 truncate">{value}</p>
            </div>
        </div>
    );
}

function DocPreview({ label, url, color }) {
    const bgColor = color === 'blue' ? 'bg-blue-600/5' : 'bg-indigo-600/5';
    const borderColor = color === 'blue' ? 'border-blue-500/20' : 'border-indigo-500/20';
    const iconColor = color === 'blue' ? 'text-blue-500' : 'text-indigo-500';

    return (
        <div className={`p-6 ${bgColor} border ${borderColor} rounded-[2rem] flex flex-col items-center justify-center text-center gap-4 group transition-all hover:bg-slate-900`}>
            <div className={`w-16 h-16 ${iconColor} bg-slate-950 rounded-[1.5rem] flex items-center justify-center border border-white/5 shadow-2xl group-hover:scale-110 transition-transform`}>
                <FileText size={32} />
            </div>
            <div>
                <h4 className="font-black text-white">{label}</h4>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest px-2">Document Officiel</p>
            </div>
            {url ? (
                <a href={url} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 px-6 py-2 bg-white text-slate-950 rounded-xl text-xs font-black uppercase hover:bg-purple-500 hover:text-white transition-all`}>
                    Consulter
                </a>
            ) : (
                <span className="mt-2 text-[10px] font-black text-slate-700 uppercase italic">Non téléchargé</span>
            )}
        </div>
    );
}

function ApplicationCard({ app, delay, onOpen }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay * 0.05 }}
            whileHover={{ y: -5 }}
            className="group bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl hover:bg-slate-900 transition-all hover:border-purple-500/30"
        >
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-5 sm:p-6 border-b border-slate-800/30 relative">
                <div className="flex justify-between items-start mb-6">
                    <StatusPulse status={app.status} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-950 rounded-2xl p-0.5 border border-slate-800 shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform">
                        {app.applicantPhoto ? (
                            <img src={app.applicantPhoto} alt={app.applicantName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700"><User size={32} /></div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Candidat Principal</h4>
                        <h3 className="text-xl font-black text-white leading-tight group-hover:text-purple-400 transition-colors">{app.applicantName}</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                            Postule pour <span className="text-slate-300">{app.jobTitle}</span>
                            {app.applicantDateOfBirth && <span className="text-slate-400"> • {calculateAge(app.applicantDateOfBirth)} ans</span>}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 bg-slate-950/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-900 rounded-xl text-slate-400"><Briefcase size={16} /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase">Division</p>
                            <p className="text-xs font-bold text-white">Technologie</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-700 group-hover:text-purple-500 translate-x-0 group-hover:translate-x-1 transition-all" size={20} />
                </div>

                {app.status === 'ACCEPTED' && app.interviewDate ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-emerald-500" />
                            <div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Entretien fixé</p>
                                <p className="text-xs font-black text-white">{new Date(app.interviewDate).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ) : app.status === 'ACCEPTED' ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-emerald-500 uppercase">En attente de slot</p>
                    </div>
                ) : null}

                <button
                    onClick={onOpen}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                    Ouvrir le dossier <ExternalLink size={14} />
                </button>
            </div>
        </motion.div>
    );
}

function TabButton({ active, onClick, label, count, color }) {
    const activeColors = {
        all: "bg-white text-slate-950",
        blue: "bg-blue-600 text-white",
        emerald: "bg-emerald-600 text-white",
        rose: "bg-rose-600 text-white"
    };

    const countColors = {
        all: "bg-slate-200 text-slate-950",
        blue: "bg-blue-900/50 text-blue-200",
        emerald: "bg-emerald-900/50 text-emerald-200",
        rose: "bg-rose-900/50 text-rose-200"
    };

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${active
                ? (activeColors[color] || activeColors.all)
                : "text-slate-500 hover:text-white"
                }`}
        >
            {label}
            {count > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] ${active ? (countColors[color] || countColors.all) : "bg-slate-800 text-slate-500"}`}>
                    {count}
                </span>
            )}
            {active && <motion.div layoutId="appTab" className="absolute -bottom-2 inset-x-4 h-1 bg-current rounded-full blur-[2px] opacity-20" />}
        </button>
    );
}

function StatusPulse({ status }) {
    const configs = {
        ACCEPTED: { color: "bg-emerald-500", label: "Acceptée", icon: CheckCircle },
        REJECTED: { color: "bg-rose-500", label: "Rejetée", icon: XCircle },
        REVIEWING: { color: "bg-blue-500", label: "En examen", icon: Clock },
        APPLIED: { color: "bg-amber-500", label: "Nouvelle", icon: Clock }
    };
    const cfg = configs[status] || configs.APPLIED;
    return (
        <div className="flex items-center gap-2">
            <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.color} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.color}`}></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{cfg.label}</span>
        </div>
    );
}
