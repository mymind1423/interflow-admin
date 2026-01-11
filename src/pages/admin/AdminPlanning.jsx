import { useState, useEffect, useMemo } from "react";
import { exportToExcel } from "../../utils/excelExporter";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../api/adminApi";
import { Calendar, Video, Building, User, Clock, Search, Filter, Bell, CheckCircle, ChevronRight, MoreHorizontal, MapPin, ExternalLink, CalendarDays, History, Layers, LayoutList, Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { SkeletonTable } from "../../components/common/Skeletons";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { calculateAge, getUTCAsLocal } from "../../utils/dateUtils";


export default function AdminPlanning() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("upcoming"); // 'today' | 'upcoming' | 'past'
    const [filterCompany, setFilterCompany] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [groupBy, setGroupBy] = useState("none"); // 'none' | 'date' | 'company'
    const [remindingId, setRemindingId] = useState(null);

    useEffect(() => {
        loadInterviews();
    }, []);

    const loadInterviews = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getInterviews();
            // Map backend keys to frontend expectations
            const mapped = data.map(d => ({
                ...d,
                date: d.dateTime,
                company: d.companyName,
                student: d.studentName,
                studentDateOfBirth: d.studentDateOfBirth
            }));
            setInterviews(mapped);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement planning");
        } finally {
            setLoading(false);
        }
    };

    const handleRemind = async (id) => {
        try {
            setRemindingId(id);
            await adminApi.sendInterviewReminder(id);
            toast.success("Rappel envoyé !");
        } catch (err) {
            toast.error("Échec de l'envoi");
        } finally {
            setRemindingId(null);
        }
    };

    const sortedInterviews = useMemo(() => {
        return [...interviews].sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [interviews]);

    const filteredInterviews = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        return sortedInterviews.filter(i => {
            const iDate = new Date(i.date);
            const matchesSearch =
                i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.student?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCompany = !filterCompany || i.company === filterCompany;

            // Date Filter (YYYY-MM-DD comparison)
            const dateStr = iDate.toISOString().split('T')[0];
            const matchesDate = !filterDate || dateStr === filterDate;

            let matchesTab = true;
            if (activeTab === 'today') {
                matchesTab = iDate >= startOfToday && iDate <= endOfToday;
            } else if (activeTab === 'upcoming') {
                matchesTab = iDate > endOfToday;
            } else if (activeTab === 'past') {
                matchesTab = iDate < startOfToday;
            }

            return matchesSearch && matchesCompany && matchesDate && matchesTab;
        });
    }, [sortedInterviews, searchTerm, activeTab, filterCompany, filterDate]);

    // Grouping Logic
    const groupedInterviews = useMemo(() => {
        if (groupBy === 'none') return { 'Tous': filteredInterviews };

        return filteredInterviews.reduce((groups, item) => {
            let key = item.company;
            if (groupBy === 'date') {
                key = new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                // Capitalize first letter
                key = key.charAt(0).toUpperCase() + key.slice(1);
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
        }, {});
    }, [filteredInterviews, groupBy]);

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Dynamic Title based on filters
        let title = "Planning InternFlow";
        let subTitle = [];
        if (filterCompany) subTitle.push(filterCompany);
        if (filterDate) subTitle.push(new Date(filterDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
        if (activeTab === 'today') subTitle.push("Aujourd'hui");

        const fullTitle = subTitle.length > 0 ? `${title} - ${subTitle.join(' - ')}` : title;

        // Header
        doc.setFillColor(16, 185, 129); // Emerald 500
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text(fullTitle, 14, 13);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Généré le : ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`${filteredInterviews.length} créneaux exportés`, 200, 28, { align: 'right' });

        const tableColumn = ["Date", "Heure", "Entreprise", "Etudiant", "Titre", "Statut", "Lieu"];
        const tableRows = [];

        filteredInterviews.forEach(item => {
            const interviewData = [
                new Date(getUTCAsLocal(item.date)).toLocaleDateString(),
                new Date(getUTCAsLocal(item.date)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                item.company,
                item.student + (item.studentDateOfBirth ? ` (${calculateAge(item.studentDateOfBirth)} ans)` : ""),
                item.title,
                item.status,
                formatLocation(item.meetLink, item.room)
            ];
            tableRows.push(interviewData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255 }, // Slate 900
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [241, 245, 249] } // Slate 100
        });

        const safeName = fullTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${safeName}.pdf`);
        toast.success("PDF téléchargé !");
    };

    const handleExportExcel = () => {
        let titleSuffix = "";
        if (filterCompany) titleSuffix += ` - ${filterCompany}`;
        if (filterDate) titleSuffix += ` - ${new Date(filterDate).toLocaleDateString()}`;

        const columns = [
            { header: "Date", key: "date", width: 15 },
            { header: "Heure", key: "time", width: 10 },
            { header: "Entreprise", key: "company", width: 25 },
            { header: "Etudiant", key: "student", width: 25 },
            { header: "Age", key: "age", width: 10 },
            { header: "Titre", key: "title", width: 30 },
            { header: "Statut", key: "status", width: 15 },
            { header: "Lieu", key: "location", width: 30 },
        ];

        const data = filteredInterviews.map(i => ({
            date: new Date(getUTCAsLocal(i.date)).toLocaleDateString(),
            time: new Date(getUTCAsLocal(i.date)).toLocaleTimeString(),
            company: i.company,
            student: i.student,
            age: i.studentDateOfBirth ? calculateAge(i.studentDateOfBirth) : "",
            title: i.title,
            status: i.status === 'COMPLETED' ? 'Terminé' : i.status === 'SCHEDULED' ? 'Prévu' : i.status,
            location: formatLocation(i.meetLink, i.room)
        }));

        exportToExcel(`Planning_${new Date().toISOString().split('T')[0]}`, "Planning", columns, data, `Planning des Entretiens${titleSuffix}`);
        toast.success("Excel téléchargé !");
    };

    const companies = useMemo(() => {
        const unique = new Set(interviews.map(i => i.company).filter(Boolean));
        return Array.from(unique).sort();
    }, [interviews]);

    const uniqueDays = useMemo(() => {
        const days = new Set(interviews.map(i => new Date(i.date).toISOString().split('T')[0]));
        return Array.from(days).sort();
    }, [interviews]);

    const stats = useMemo(() => {
        const now = new Date();
        const todayCount = interviews.filter(i => {
            const d = new Date(i.date);
            return d.toDateString() === now.toDateString();
        }).length;
        const upcomingCount = interviews.filter(i => new Date(i.date) > now).length;
        return { today: todayCount, upcoming: upcomingCount, total: interviews.length };
    }, [interviews]);

    return (
        <AdminLayout>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3"
                    >
                        <CalendarDays className="text-emerald-500" size={36} />
                        Planning & Entretiens
                    </motion.h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Coordination logistique de toutes les rencontres InternFlow</p>
                </div>

                <div className="flex gap-4">
                    <StatCircle label="Aujourd'hui" value={stats.today} color="emerald" />
                    <StatCircle label="À venir" value={stats.upcoming} color="indigo" />
                </div>
            </div>

            {/* Control Bar - Redesigned to 2 Rows to fix overlapping */}
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/20 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm shadow-sm dark:shadow-none">

                {/* Row 1: Period & Search */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50 shrink-0 w-full xl:w-auto overflow-x-auto no-scrollbar">
                        <TabButton active={activeTab === 'today'} onClick={() => setActiveTab('today')} label="Aujourd'hui" icon={Clock} />
                        <TabButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} label="Prochainement" icon={Calendar} />
                        <TabButton active={activeTab === 'past'} onClick={() => setActiveTab('past')} label="Archives" icon={History} />
                    </div>

                    <div className="relative group w-full xl:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un étudiant, une entreprise..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800/50 w-full"></div>

                {/* Row 2: Filters, Grouping, Exports */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-center">

                    {/* Filters */}
                    <div className="xl:col-span-5 flex gap-2">
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-700 dark:text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-all font-medium cursor-pointer text-xs"
                        >
                            <option value="">Toute Entreprise</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-700 dark:text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-all font-medium cursor-pointer text-xs"
                        >
                            <option value="">Toute Date</option>
                            {uniqueDays.map(d => (
                                <option key={d} value={d}>
                                    {new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grouping */}
                    <div className="xl:col-span-4 flex justify-center">
                        <div className="flex bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800/50">
                            <button
                                onClick={() => setGroupBy('none')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${groupBy === 'none' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                title="Liste simple"
                            >
                                <LayoutList size={16} /> Liste
                            </button>
                            <button
                                onClick={() => setGroupBy('date')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${groupBy === 'date' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                title="Par Jour"
                            >
                                <Calendar size={16} /> Par Jour
                            </button>
                            <button
                                onClick={() => setGroupBy('company')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${groupBy === 'company' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                title="Par Entreprise"
                            >
                                <Building size={16} /> Par Boite
                            </button>
                        </div>
                    </div>

                    {/* Exports */}
                    <div className="xl:col-span-3 flex justify-end gap-2">
                        <button
                            onClick={handleExportPDF}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                        >
                            <FileText size={16} /> PDF
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline View */}
            <div className="space-y-6 pb-20">
                {loading ? (
                    <SkeletonTable />
                ) : filteredInterviews.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold">
                        Aucun entretien correspondant.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedInterviews).map(([groupTitle, groupItems], idx) => (
                            <PlanningGroup
                                key={groupTitle}
                                title={groupTitle}
                                items={groupItems}
                                idx={idx}
                                isGrouped={groupBy !== 'none'}
                                onRemind={handleRemind}
                                remindingId={remindingId}
                            />
                        ))}
                    </div>
                )}
            </div>

        </AdminLayout>
    );
}

function PlanningGroup({ title, items, idx, isGrouped, onRemind, remindingId }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isGrouped) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {items.map((item, i) => (
                    <InterviewRow key={item.id} item={item} onRemind={() => onRemind(item.id)} delay={i} remindingId={remindingId} />
                ))}
            </div>
        );
    }

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
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500">
                    <Layers size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors capitalize">
                    {title}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent"></div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                    {items.length} RDV
                </span>
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
                        className="grid grid-cols-1 gap-4 pb-4"
                    >
                        {items.map((item, i) => (
                            <InterviewRow key={item.id} item={item} onRemind={() => onRemind(item.id)} delay={i} remindingId={remindingId} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function InterviewRow({ item, onRemind, delay, remindingId }) {
    const isToday = new Date(item.date).toDateString() === new Date().toDateString();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * 0.05 }}
            className={`group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-[2rem] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-emerald-200 dark:hover:bg-slate-900 shadow-sm dark:shadow-none transition-all border-l-4 ${isToday ? 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-l-transparent hover:border-l-emerald-500'}`}
        >
            <div className="flex items-center gap-6">
                {/* Date Square */}
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-xl shrink-0 group-hover:scale-105 transition-transform ${isToday ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{new Date(getUTCAsLocal(item.date)).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl font-black">{new Date(getUTCAsLocal(item.date)).getDate()}</span>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">{item.title}</h3>
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20' :
                            'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20'
                            }`}>
                            {item.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500" /> {new Date(getUTCAsLocal(item.date)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1.5"><Building size={14} className="text-indigo-500" /> {item.company}</span>
                        <span className="flex items-center gap-1.5"><User size={14} className="text-purple-500" /> {item.student} {item.studentDateOfBirth ? `(${calculateAge(item.studentDateOfBirth)} ans)` : ""}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onRemind}
                    disabled={remindingId === item.id}
                    className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-500 rounded-xl transition-all border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Envoyer rappel"
                >
                    {remindingId === item.id ? <Loader2 size={20} className="animate-spin" /> : <Bell size={20} />}
                </button>

                {item.meetLink && item.meetLink.startsWith('http') ? (
                    <a
                        href={item.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        <Video size={16} /> Rejoindre
                    </a>
                ) : (
                    <div className="flex flex-col items-end">
                        <div className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-start gap-4 text-right shadow-sm dark:shadow-xl">
                            <span className="flex flex-col gap-0.5">
                                <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none mb-1">
                                    {formatLocation(item.meetLink, item.room).split(' - ')[0]}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                    {formatLocation(item.meetLink, item.room).split(' - ')[1]?.split(',')[0]}
                                </span>
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                                    {formatLocation(item.meetLink, item.room).split(',')[1]?.trim()}
                                </span>
                            </span>
                            <div className="p-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 mt-1">
                                <MapPin size={16} className="text-emerald-600 dark:text-emerald-500 shrink-0" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${active ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xl dark:shadow-none border border-transparent dark:border-slate-700" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}

function StatCircle({ label, value, color }) {
    const colors = {
        emerald: "text-emerald-600 dark:text-emerald-500 bg-white dark:bg-emerald-500/10 border-slate-200 dark:border-emerald-500/20 shadow-sm",
        indigo: "text-indigo-600 dark:text-indigo-500 bg-white dark:bg-indigo-500/10 border-slate-200 dark:border-indigo-500/20 shadow-sm"
    };
    return (
        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-4 dark:bg-slate-900/40 backdrop-blur-md ${colors[color]}`}>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest leading-tight w-20 opacity-70">{label}</div>
        </div>
    );
}

function formatLocation(loc, room) {
    if (loc && loc.startsWith("http")) return "Visio";
    if (room) {
        const cleanRoom = room.replace(/^Salle\s+/i, "").trim();
        return `Salle ${cleanRoom} - Université de Djibouti, Campus Balbala`;
    }
    return "Université de Djibouti, Campus Balbala";
}
