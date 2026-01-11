import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, GraduationCap, Briefcase, Calendar, XCircle, FileText, ExternalLink, Loader2 } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { calculateAge } from "../../utils/dateUtils";
import toast from "react-hot-toast";

export default function StudentDetailModal({ student, onClose }) {
    const [detailTab, setDetailTab] = useState("info"); // 'info' | 'apps' | 'interviews'
    const [studentApps, setStudentApps] = useState([]);
    const [studentInterviews, setStudentInterviews] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (student) {
            fetchDetails();
        }
    }, [student]);

    const fetchDetails = async () => {
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

    if (!student) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
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
                            {student.photoUrl || student.studentPhoto ? (
                                <img src={student.photoUrl || student.studentPhoto} className="w-full h-full object-cover rounded-[2.2rem]" alt="Profile" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-700 bg-slate-100 dark:bg-slate-900 rounded-[2.2rem]">
                                    <User size={64} />
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white text-center">{student.fullname || student.displayName || student.studentName}</h2>
                        <p className="text-indigo-600 dark:text-indigo-500 text-sm font-black uppercase tracking-widest mt-1">Étudiant</p>

                        <div className="w-full mt-8 space-y-4">
                            <DetailItem icon={Mail} label="Email" value={student.email || 'N/A'} />
                            <DetailItem icon={GraduationCap} label="Formation" value={student.domaine || 'Non spécifié'} />
                            <DetailItem icon={Calendar} label="Niveau" value={student.grade || 'Non spécifié'} />
                            {(student.dateOfBirth || student.studentDateOfBirth) && <DetailItem icon={Calendar} label="Âge" value={`${calculateAge(student.dateOfBirth || student.studentDateOfBirth)} ans`} />}
                            {student.status && <DetailItem icon={StatusIcon} label="Statut Compte" value={student.status === 'approved' ? 'Actif' : 'En attente'} />}
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
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
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
                                            <DocPreview label="CV" url={student.cvUrl} color="blue" />
                                            <DocPreview label="Diplôme" url={student.diplomaUrl} color="indigo" />
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
                                                        <p className="text-xs text-slate-500 font-bold">{app.companyName} • {new Date(app.createdAt).toLocaleDateString()}</p>
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
                                                        <p className="text-xs text-slate-500 font-bold">{item.company} • {new Date(item.date).toLocaleString()}</p>
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
        </AnimatePresence>
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
