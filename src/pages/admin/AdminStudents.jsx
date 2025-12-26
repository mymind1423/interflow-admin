import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../api/adminApi";
import { User, Mail, GraduationCap, FileText, Trash2, Search, Download, Filter, XCircle, Briefcase, Calendar, Phone, MapPin, Eye, ExternalLink, ChevronRight, Layers, LayoutList } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDomain, setFilterDomain] = useState("");
    const [filterGrade, setFilterGrade] = useState("");
    const [groupBy, setGroupBy] = useState("none"); // 'none' | 'domaine' | 'grade'

    // Modal state
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentApps, setStudentApps] = useState([]);
    const [studentInterviews, setStudentInterviews] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailTab, setDetailTab] = useState("info"); // 'info' | 'apps' | 'interviews'

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getStudents();
            setStudents(data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement étudiants");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr ? Cette action supprimera définitivement le compte Firebase, toutes les données de profil et tous les documents (CV, Diplôme) de cet étudiant.")) return;

        const loadingToast = toast.loading("Suppression en cours...");
        try {
            await adminApi.deleteUser(id);
            toast.dismiss(loadingToast);
            toast.success("Compte et données supprimés avec succès");
            loadStudents();
            if (selectedStudent?.id === id) setSelectedStudent(null);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Erreur lors de la suppression totale");
        }
    };

    const fetchStudentDetails = async (student) => {
        setSelectedStudent(student);
        setDetailTab("info");
        setLoadingDetails(true);
        try {
            const [apps, interviews] = await Promise.all([
                adminApi.getStudentApplications(student.id),
                adminApi.getStudentInterviews(student.id)
            ]);
            setStudentApps(apps);
            setStudentInterviews(interviews);
        } catch (err) {
            console.error(err);
            toast.error("Erreur chargement détails");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ["Nom complet", "Email", "Domaine", "Grade", "Status"];
        const rows = filteredStudents.map(s => [
            s.fullname || s.displayName,
            s.email,
            s.domaine || "",
            s.grade || "",
            s.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `etudiants_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const domains = useMemo(() => {
        const unique = new Set(students.map(s => s.domaine).filter(Boolean));
        return Array.from(unique).sort();
    }, [students]);

    const grades = useMemo(() => {
        const unique = new Set(students.map(s => s.grade).filter(Boolean));
        return Array.from(unique).sort();
    }, [students]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch =
                (s.fullname || s.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.domaine?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDomain = !filterDomain || s.domaine === filterDomain;
            const matchesGrade = !filterGrade || s.grade === filterGrade;

            return matchesSearch && matchesDomain && matchesGrade;
        });
    }, [students, searchTerm, filterDomain, filterGrade]);

    // Grouping Logic
    const groupedStudents = useMemo(() => {
        if (groupBy === 'none') return { 'Tous': filteredStudents };

        return filteredStudents.reduce((groups, student) => {
            const key = student[groupBy] || 'Non spécifié';
            if (!groups[key]) groups[key] = [];
            groups[key].push(student);
            return groups;
        }, {});
    }, [filteredStudents, groupBy]);

    return (
        <AdminLayout>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <User className="text-indigo-500" size={36} />
                        Gestion Étudiants
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Contrôle et suivi des futurs talents d'InternFlow</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <Download size={18} /> Exporter la liste
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-end bg-slate-900/20 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
                <div className="xl:col-span-4 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Recherche globale</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Nom, email, domaine..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Filtres</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={filterDomain}
                                onChange={(e) => setFilterDomain(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-indigo-500/50 transition-all font-medium cursor-pointer text-sm"
                            >
                                <option value="">Domaine</option>
                                {domains.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <select
                                value={filterGrade}
                                onChange={(e) => setFilterGrade(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-indigo-500/50 transition-all font-medium cursor-pointer text-sm"
                            >
                                <option value="">Niveau</option>
                                {grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-5 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Vue & Groupement</label>
                    <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800/50">
                        <button
                            onClick={() => setGroupBy('none')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${groupBy === 'none' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <LayoutList size={14} /> Liste
                        </button>
                        <button
                            onClick={() => setGroupBy('grade')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${groupBy === 'grade' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Layers size={14} /> Par Niveau
                        </button>
                        <button
                            onClick={() => setGroupBy('domaine')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${groupBy === 'domaine' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Briefcase size={14} /> Par Domaine
                        </button>
                    </div>
                </div>
            </div>

            {/* Main List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-bold animate-pulse">Chargement des étudiants...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800"
                    >
                        <User size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">Aucun étudiant trouvé</h3>
                        <p className="text-slate-500 mt-2">Désolé, nous n'avons trouvé personne correspondant à vos critères.</p>
                        <button onClick={() => { setSearchTerm(""); setFilterDomain(""); setFilterGrade(""); }} className="mt-6 text-indigo-500 font-bold hover:underline">Réinitialiser les filtres</button>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedStudents).map(([groupTitle, groupStudents], idx) => (
                            <StudentGroup
                                key={groupTitle}
                                title={groupTitle}
                                students={groupStudents}
                                idx={idx}
                                isGrouped={groupBy !== 'none'}
                                onDetails={fetchStudentDetails}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>



            {/* Student Details Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStudent(null)}
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
                                    {selectedStudent.photoUrl ? (
                                        <img src={selectedStudent.photoUrl} className="w-full h-full object-cover rounded-[2.2rem]" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900 rounded-[2.2rem]">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-xl font-black text-white text-center">{selectedStudent.fullname || selectedStudent.displayName}</h2>
                                <p className="text-indigo-500 text-sm font-black uppercase tracking-widest mt-1">Étudiant</p>

                                <div className="w-full mt-8 space-y-4">
                                    <DetailItem icon={Mail} label="Email" value={selectedStudent.email} />
                                    <DetailItem icon={GraduationCap} label="Formation" value={selectedStudent.domaine || 'Non spécifié'} />
                                    <DetailItem icon={Calendar} label="Niveau" value={selectedStudent.grade || 'Non spécifié'} />
                                    <DetailItem icon={StatusIcon} label="Statut Compte" value={selectedStudent.status === 'approved' ? 'Actif' : 'En attente'} />
                                </div>


                            </div>

                            {/* Right Side: Content Area */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                                <div className="p-4 sm:p-8 pb-4 flex items-center justify-between border-b border-slate-800/30 shrink-0 gap-4 overflow-x-auto">
                                    <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800/50 shrink-0">
                                        <ModalTab
                                            active={detailTab === 'info'}
                                            onClick={() => setDetailTab('info')}
                                            label="Aperçu Docs"
                                            icon={FileText}
                                        />
                                        <ModalTab
                                            active={detailTab === 'apps'}
                                            onClick={() => setDetailTab('apps')}
                                            label="Candidatures"
                                            icon={Briefcase}
                                            count={studentApps.length}
                                        />
                                        <ModalTab
                                            active={detailTab === 'interviews'}
                                            onClick={() => setDetailTab('interviews')}
                                            label="Entretiens"
                                            icon={Calendar}
                                            count={studentInterviews.length}
                                        />
                                    </div>
                                    <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                                        <XCircle size={28} />
                                    </button>
                                </div>

                                <div className="flex-1 p-5 sm:p-8 overflow-y-auto custom-scrollbar bg-slate-900/10">
                                    {loadingDetails ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Récupération des données...</p>
                                        </div>
                                    ) : detailTab === 'info' ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div>
                                                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                                    Aperçu Rapide
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <DocPreview label="CV" url={selectedStudent.cvUrl} color="blue" />
                                                    <DocPreview label="Diplôme" url={selectedStudent.diplomaUrl} color="indigo" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : detailTab === 'apps' ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {studentApps.length === 0 ? (
                                                <div className="text-center py-20 bg-slate-950/20 rounded-3xl border-2 border-dashed border-slate-800">
                                                    <Briefcase size={32} className="mx-auto text-slate-800 mb-4" />
                                                    <p className="text-slate-500 font-bold">Aucune candidature pour le moment.</p>
                                                </div>
                                            ) : (
                                                studentApps.map(app => (
                                                    <div key={app.id} className="p-5 bg-slate-950 border border-slate-800 rounded-[1.5rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all"><Briefcase size={20} /></div>
                                                            <div>
                                                                <h4 className="font-black text-white">{app.jobTitle}</h4>
                                                                <p className="text-xs text-slate-500 font-bold">{app.companyName} • {new Date(app.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${app.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {studentInterviews.length === 0 ? (
                                                <div className="text-center py-20 bg-slate-950/20 rounded-3xl border-2 border-dashed border-slate-800">
                                                    <Calendar size={32} className="mx-auto text-slate-800 mb-4" />
                                                    <p className="text-slate-500 font-bold">Aucun entretien programmé.</p>
                                                </div>
                                            ) : (
                                                studentInterviews.map(item => (
                                                    <div key={item.id} className="p-5 bg-slate-950 border border-slate-800 rounded-[1.5rem] flex items-center justify-between group hover:border-rose-500/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all"><Calendar size={20} /></div>
                                                            <div>
                                                                <h4 className="font-black text-white">{item.title}</h4>
                                                                <p className="text-xs text-slate-500 font-bold">{item.company} • {new Date(item.date).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-3 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-full text-[10px] font-black uppercase">{item.status}</span>
                                                            {item.meetLink && <a href={item.meetLink} target="_blank" rel="noreferrer" className="p-2 bg-blue-600 rounded-xl text-white shadow-lg"><ExternalLink size={14} /></a>}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}

function StudentGroup({ title, students, idx, isGrouped, onDetails, onDelete }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isGrouped) {
        return (
            <AnimatePresence mode="popLayout">
                {students.map((student, i) => (
                    <StudentCard key={student.id} student={student} idx={i} onDetails={onDetails} onDelete={onDelete} />
                ))}
            </AnimatePresence>
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
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-500">
                    <Layers size={20} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                    {title}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                    {students.length} Étudiants
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
                        className="overflow-hidden space-y-4 pb-4"
                    >
                        {students.map((student, i) => (
                            <StudentCard key={student.id} student={student} idx={i} onDetails={onDetails} onDelete={onDelete} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function StudentCard({ student, idx, onDetails, onDelete }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-[2rem] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900 shadow-xl hover:shadow-indigo-500/5 transition-all border-l-4 border-l-transparent hover:border-l-indigo-500"
        >
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center p-0.5 border border-slate-800 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                        {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.fullname} className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} className="text-slate-700" />
                        )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#020617] ${student.status === 'approved' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">{student.fullname || student.displayName}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Mail size={14} className="text-blue-500" />
                            <span className="font-medium">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <GraduationCap size={14} className="text-indigo-500" />
                            <span className="font-medium">{student.domaine || 'N/A'} {student.grade ? `• ${student.grade}` : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => onDetails(student)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <Eye size={18} /> Détails
                    </button>
                    <button
                        onClick={() => onDelete(student.id)}
                        className="w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-90"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function DetailItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 group">
            <div className="mt-0.5 p-2 bg-slate-900 rounded-xl text-slate-500 group-hover:text-indigo-400 transition-colors">
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
                <p className="text-xs font-bold text-slate-300 truncate">{value}</p>
            </div>
        </div>
    );
}

function StatusIcon() {
    return <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500"></div>;
}

function ModalTab({ active, onClick, label, icon: Icon, count }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${active ? "bg-slate-800 text-white shadow-xl" : "text-slate-500 hover:text-slate-300"
                }`}
        >
            <Icon size={14} />
            {label}
            {(count !== undefined && count > 0) && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-indigo-500 text-white rounded-full text-[9px]">
                    {count}
                </span>
            )}
            {active && <motion.div layoutId="modal-active-tab" className="absolute inset-0 border border-white/5 rounded-xl" />}
        </button>
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
                <a href={url} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 px-6 py-2 bg-white text-slate-950 rounded-xl text-xs font-black uppercase hover:bg-indigo-500 hover:text-white transition-all`}>
                    Consulter
                </a>
            ) : (
                <span className="mt-2 text-[10px] font-black text-slate-700 uppercase italic">Non téléchargé</span>
            )}
        </div>
    );
}
