import { useState, useEffect, useMemo } from "react";
import { exportToExcel } from "../../utils/excelExporter";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../api/adminApi";
import { User, Mail, GraduationCap, FileText, Trash2, Search, Download, Filter, XCircle, Briefcase, Calendar, Phone, MapPin, Eye, ExternalLink, ChevronRight, Layers, LayoutList, Loader2 } from "lucide-react";
import { SkeletonTable } from "../../components/common/Skeletons";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { calculateAge, getUTCAsLocal } from "../../utils/dateUtils";
import ConfirmationModal from "../../components/common/ConfirmationModal";

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

    // Action loading states
    const [deletingId, setDeletingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const [studentsData, appsData, interviewsData] = await Promise.all([
                adminApi.getStudents(),
                adminApi.getApplications(),
                adminApi.getInterviews()
            ]);

            const enrichedStudents = studentsData.map(s => {
                const sApps = appsData.filter(a => a.studentId === s.id);
                const sInterviews = interviewsData.filter(i => i.studentId === s.id);
                return {
                    ...s,
                    applicationCount: sApps.length,
                    interviewCount: sInterviews.length
                };
            });

            setStudents(enrichedStudents);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement étudiants");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (student) => {
        setConfirmModal({
            isOpen: true,
            title: "Supprimer cet étudiant ?",
            message: "Cette action supprimera définitivement le compte Firebase, toutes les données de profil et tous les documents (CV, Diplôme).",
            confirmText: "Supprimer définitivement",
            isDangerous: true,
            onConfirm: () => handleDelete(student.id)
        });
    };

    const handleDelete = async (id) => {
        const loadingToast = toast.loading("Suppression en cours...");
        try {
            setDeletingId(id);
            await adminApi.deleteUser(id);
            toast.dismiss(loadingToast);
            toast.success("Compte et données supprimés avec succès");
            loadStudents();
            if (selectedStudent?.id === id) setSelectedStudent(null);
            setConfirmModal({ isOpen: false });
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Erreur lors de la suppression totale");
        } finally {
            setDeletingId(null);
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

    const handleExport = () => {
        const columns = [
            { header: "Nom complet", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Domaine", key: "domaine", width: 25 },
            { header: "Grade", key: "grade", width: 15 },
            { header: "Age", key: "age", width: 10 },
            { header: "Candidatures", key: "apps", width: 10 },
            { header: "Entretiens", key: "interviews", width: 10 },
            { header: "Status", key: "status", width: 15 },
        ];

        const data = filteredStudents.map(s => ({
            name: s.fullname || s.displayName,
            email: s.email,
            domaine: s.domaine || "",
            age: s.dateOfBirth ? calculateAge(s.dateOfBirth) : "",
            grade: s.grade || "",
            apps: s.applicationCount || 0,
            interviews: s.interviewCount || 0,
            status: s.status === 'approved' ? 'Validé' : 'En attente'
        }));

        exportToExcel(`Etudiants_${new Date().toISOString().split('T')[0]}`, "Etudiants", columns, data, "Liste des Étudiants");
        toast.success("Export Excel téléchargé !");
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
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <User className="text-indigo-600 dark:text-indigo-500" size={36} />
                        Gestion Étudiants
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Contrôle et suivi des futurs talents d'InternFlow</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <Download size={18} /> Exporter Excel
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-end bg-white dark:bg-slate-900/20 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm shadow-sm dark:shadow-none">
                <div className="xl:col-span-4 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Recherche globale</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Nom, email, domaine..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
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
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-700 dark:text-white appearance-none focus:outline-none focus:border-indigo-500/50 transition-all font-medium cursor-pointer text-sm"
                            >
                                <option value="">Domaine</option>
                                {domains.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <select
                                value={filterGrade}
                                onChange={(e) => setFilterGrade(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-700 dark:text-white appearance-none focus:outline-none focus:border-indigo-500/50 transition-all font-medium cursor-pointer text-sm"
                            >
                                <option value="">Niveau</option>
                                {grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-5 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Vue & Groupement</label>
                    <div className="flex bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50">
                        <button
                            onClick={() => setGroupBy('none')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${groupBy === 'none' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <LayoutList size={14} /> Liste
                        </button>
                        <button
                            onClick={() => setGroupBy('grade')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${groupBy === 'grade' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <Layers size={14} /> Par Niveau
                        </button>
                        <button
                            onClick={() => setGroupBy('domaine')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${groupBy === 'domaine' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <Briefcase size={14} /> Par Domaine
                        </button>
                    </div>
                </div>
            </div>

            {/* Main List */}
            <div className="space-y-4">
                {loading ? (
                    <SkeletonTable />
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
                                onDelete={confirmDelete}
                                deletingId={deletingId}
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
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] h-full md:h-auto"
                        >
                            {/* Left Side: Profile Sidebar */}
                            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col items-center overflow-y-auto md:overflow-visible shrink-0">
                                <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-slate-200 dark:border-slate-800 p-1 mb-6 relative group overflow-hidden">
                                    {selectedStudent.photoUrl ? (
                                        <img src={selectedStudent.photoUrl} className="w-full h-full object-cover rounded-[2.2rem]" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-700 bg-slate-100 dark:bg-slate-900 rounded-[2.2rem]">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white text-center">{selectedStudent.fullname || selectedStudent.displayName}</h2>
                                <p className="text-indigo-600 dark:text-indigo-500 text-sm font-black uppercase tracking-widest mt-1">Étudiant</p>

                                <div className="w-full mt-8 space-y-4">
                                    <DetailItem icon={Mail} label="Email" value={selectedStudent.email} />
                                    <DetailItem icon={GraduationCap} label="Formation" value={selectedStudent.domaine || 'Non spécifié'} />
                                    <DetailItem icon={Calendar} label="Niveau" value={selectedStudent.grade || 'Non spécifié'} />
                                    {selectedStudent.dateOfBirth && <DetailItem icon={Calendar} label="Âge" value={`${calculateAge(selectedStudent.dateOfBirth)} ans`} />}
                                    <DetailItem icon={StatusIcon} label="Statut Compte" value={selectedStudent.status === 'approved' ? 'Actif' : 'En attente'} />
                                </div>


                            </div>

                            {/* Right Side: Content Area */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-slate-900">
                                <div className="p-4 sm:p-8 pb-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/30 shrink-0 gap-4 overflow-x-auto">
                                    <div className="flex bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50 shrink-0">
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
                                    <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                        <XCircle size={28} />
                                    </button>
                                </div>

                                <div className="flex-1 p-5 sm:p-8 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/10">
                                    {loadingDetails ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest">Récupération des données...</p>
                                        </div>
                                    ) : detailTab === 'info' ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
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
                                                <div className="text-center py-20 bg-white dark:bg-slate-950/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                    <Briefcase size={32} className="mx-auto text-slate-300 dark:text-slate-800 mb-4" />
                                                    <p className="text-slate-400 dark:text-slate-500 font-bold">Aucune candidature pour le moment.</p>
                                                </div>
                                            ) : (
                                                studentApps.map(app => (
                                                    <div key={app.id} className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all"><Briefcase size={20} /></div>
                                                            <div>
                                                                <h4 className="font-black text-slate-800 dark:text-white">{app.jobTitle}</h4>
                                                                <p className="text-xs text-slate-500 font-bold">{app.companyName} • {new Date(getUTCAsLocal(app.createdAt)).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${app.status === 'ACCEPTED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20' :
                                                            app.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-200 dark:border-rose-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-500/20'
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
                                                <div className="text-center py-20 bg-white dark:bg-slate-950/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                    <Calendar size={32} className="mx-auto text-slate-300 dark:text-slate-800 mb-4" />
                                                    <p className="text-slate-400 dark:text-slate-500 font-bold">Aucun entretien programmé.</p>
                                                </div>
                                            ) : (
                                                studentInterviews.map(item => (
                                                    <div key={item.id} className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] flex items-center justify-between group hover:border-rose-500/30 transition-all shadow-sm dark:shadow-none">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all"><Calendar size={20} /></div>
                                                            <div>
                                                                <h4 className="font-black text-slate-800 dark:text-white">{item.title}</h4>
                                                                <p className="text-xs text-slate-500 font-bold">{item.company} • {new Date(getUTCAsLocal(item.date)).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-black uppercase">{item.status}</span>
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

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDangerous={confirmModal.isDangerous}
                onConfirm={confirmModal.onConfirm}
                isLoading={!!deletingId}
            />
        </AdminLayout >
    );
}

function StudentGroup({ title, students, idx, isGrouped, onDetails, onDelete, deletingId }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isGrouped) {
        return (
            <AnimatePresence mode="popLayout">
                {students.map((student, i) => (
                    <StudentCard key={student.id} student={student} idx={i} onDetails={onDetails} onDelete={onDelete} deletingId={deletingId} />
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
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-500">
                    <Layers size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                    {title}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent"></div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                    {students.length} Étudiants
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
                        className="overflow-hidden space-y-4 pb-4"
                    >
                        {students.map((student, i) => (
                            <StudentCard key={student.id} student={student} idx={i} onDetails={onDetails} onDelete={onDelete} deletingId={deletingId} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function StudentCard({ student, idx, onDetails, onDelete, deletingId }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/60 rounded-[2rem] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-200 dark:hover:bg-slate-900 shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-indigo-500/5 transition-all border-l-4 border-l-transparent hover:border-l-indigo-500"
        >
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-0.5 border border-slate-200 dark:border-slate-800 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                        {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.fullname} className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} className="text-slate-400 dark:text-slate-700" />
                        )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#020617] ${student.status === 'approved' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{student.fullname || student.displayName}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Mail size={14} className="text-blue-500" />
                            <span className="font-medium">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <GraduationCap size={14} className="text-indigo-500" />
                            <span className="font-medium">{student.domaine || 'N/A'} {student.grade ? `• ${student.grade}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Briefcase size={14} className="text-emerald-500" />
                            <span className="font-medium">{student.applicationCount || 0} Cands.</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Calendar size={14} className="text-purple-500" />
                            <span className="font-medium">{student.interviewCount || 0} Entretiens</span>
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
                        align="center"
                        onClick={() => onDelete(student)}
                        disabled={deletingId === student.id}
                        className={`w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm dark:shadow-lg active:scale-90 ${deletingId === student.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {deletingId === student.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function DetailItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 group">
            <div className="mt-0.5 p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">{label}</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{value}</p>
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${active ? "bg-slate-800 dark:bg-slate-800 text-white shadow-xl" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
        >
            <Icon size={14} />
            {label}
            {(count !== undefined && count > 0) && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-indigo-500 text-white rounded-full text-[9px]">
                    {count}
                </span>
            )}
            {active && <motion.div layoutId="modal-active-tab" className="absolute inset-0 border border-white/10 dark:border-white/5 rounded-xl" />}
        </button>
    );
}

function DocPreview({ label, url, color }) {
    const bgColor = color === 'blue' ? 'bg-blue-50 dark:bg-blue-600/5' : 'bg-indigo-50 dark:bg-indigo-600/5';
    const borderColor = color === 'blue' ? 'border-blue-200 dark:border-blue-500/20' : 'border-indigo-200 dark:border-indigo-500/20';
    const iconColor = color === 'blue' ? 'text-blue-600 dark:text-blue-500' : 'text-indigo-600 dark:text-indigo-500';

    return (
        <div className={`p-6 ${bgColor} border ${borderColor} rounded-[2rem] flex flex-col items-center justify-center text-center gap-4 group transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm`}>
            <div className={`w-16 h-16 ${iconColor} bg-white dark:bg-slate-950 rounded-[1.5rem] flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-inner dark:shadow-2xl group-hover:scale-110 transition-transform`}>
                <FileText size={32} />
            </div>
            <div>
                <h4 className="font-black text-slate-800 dark:text-white">{label}</h4>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest px-2">Document Officiel</p>
            </div>
            {url ? (
                <a href={url} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-black uppercase hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white dark:hover:text-white transition-all`}>
                    Consulter
                </a>
            ) : (
                <span className="mt-2 text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase italic">Non téléchargé</span>
            )}
        </div>
    );
}
