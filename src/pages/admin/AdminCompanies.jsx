import { useState, useEffect, useMemo } from "react";
import { exportToExcel } from "../../utils/excelExporter";
import AdminLayout from "../../components/AdminLayout";
import { adminApi } from "../../api/adminApi";
import { Check, X, Trash2, Building, Mail, MapPin, Search, Download, Briefcase, Filter, ChevronRight, XCircle, Users, Clock, Loader2 } from "lucide-react";
import { SkeletonTable } from "../../components/common/Skeletons";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationModal from "../../components/common/ConfirmationModal";

export default function AdminCompanies() {
    const [activeTab, setActiveTab] = useState("all");
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDomain, setFilterDomain] = useState("");

    // Modal state
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyOffers, setCompanyOffers] = useState([]);
    const [loadingOffers, setLoadingOffers] = useState(false);

    // Action loading states
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getCompanies();
            setCompanies(data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement données");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setApprovingId(id);
            await adminApi.approveCompany(id);
            toast.success("Entreprise approuvée");
            loadData();
        } catch (err) {
            toast.error("Erreur lors de l'approbation");
        } finally {
            setApprovingId(null);
        }
    };

    const confirmReject = (company) => {
        setConfirmModal({
            isOpen: true,
            title: "Refuser cette entreprise ?",
            message: "L'entreprise sera notifiée du refus.",
            confirmText: "Refuser l'accès",
            isDangerous: true,
            onConfirm: () => handleReject(company.id)
        });
    };

    const handleReject = async (id) => {
        try {
            setRejectingId(id);
            await adminApi.rejectCompany(id);
            toast.success("Entreprise refusée");
            loadData();
            setConfirmModal({ isOpen: false });
        } catch (err) {
            toast.error("Erreur lors du refus");
        } finally {
            setRejectingId(null);
        }
    };

    const confirmDelete = (company) => {
        setConfirmModal({
            isOpen: true,
            title: "Supprimer cette entreprise ?",
            message: "Cette action supprimera définitivement l'entreprise et toutes ses données (offres, candidatures associées).",
            confirmText: "Supprimer définitivement",
            isDangerous: true,
            onConfirm: () => handleDelete(company.id)
        });
    };

    const handleDelete = async (id) => {
        try {
            setDeletingId(id);
            await adminApi.deleteUser(id);
            toast.success("Entreprise supprimée");
            loadData();
            setConfirmModal({ isOpen: false });
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeletingId(null);
        }
    };

    const fetchCompanyOffers = async (company) => {
        setSelectedCompany(company);
        setLoadingOffers(true);
        try {
            const offers = await adminApi.getCompanyOffers(company.id);
            setCompanyOffers(offers);
        } catch (err) {
            toast.error("Erreur lors du chargement des offres");
        } finally {
            setLoadingOffers(false);
        }
    };

    const handleExport = () => {
        const columns = [
            { header: "Nom", key: "name", width: 30 },
            { header: "Email", key: "email", width: 30 },
            { header: "Domaine", key: "domaine", width: 25 },
            { header: "Adresse", key: "address", width: 30 },
            { header: "Statut", key: "status", width: 15 },
        ];

        const data = filteredCompanies.map(c => ({
            name: c.name,
            email: c.email,
            domaine: c.domaine || "",
            address: c.address || "",
            status: c.status === 'approved' ? 'Validé' : c.status === 'pending' ? 'En attente' : 'Refusé'
        }));

        exportToExcel(`Entreprises_${activeTab}_${new Date().toISOString().split('T')[0]}`, "Entreprises", columns, data, `Liste des Entreprises (${activeTab === 'all' ? 'Toutes' : activeTab})`);
    };

    const counts = useMemo(() => {
        return {
            all: companies.length,
            pending: companies.filter(c => c.status === 'pending').length,
            rejected: companies.filter(c => c.status === 'declined').length
        };
    }, [companies]);

    const domains = useMemo(() => {
        const unique = new Set(companies.map(c => c.domaine).filter(Boolean));
        return Array.from(unique).sort();
    }, [companies]);

    const filteredCompanies = useMemo(() => {
        return companies.filter(c => {
            const matchesTab =
                activeTab === "all" ||
                (activeTab === "pending" && c.status === "pending") ||
                (activeTab === "rejected" && c.status === "declined");

            const matchesSearch =
                c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.domaine?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDomain = !filterDomain || c.domaine === filterDomain;

            return matchesTab && matchesSearch && matchesDomain;
        });
    }, [companies, activeTab, searchTerm, filterDomain]);

    return (
        <AdminLayout>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Building className="text-blue-500" size={36} />
                        Gestion Entreprises
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Contrôle de l'écosystème partenaire d'InternFlow</p>
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

            {/* Filters & Tabs */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-end">
                <div className="xl:col-span-4 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Recherche</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Nom, email, domaine..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Domaine</label>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select
                            value={filterDomain}
                            onChange={(e) => setFilterDomain(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all font-medium cursor-pointer"
                        >
                            <option value="">Tous les domaines</option>
                            {domains.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div className="xl:col-span-5 flex bg-slate-900/30 p-1.5 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-x-auto">
                    <TabButton
                        active={activeTab === 'all'}
                        onClick={() => setActiveTab('all')}
                        label="Toutes"
                        count={counts.all}
                    />
                    <TabButton
                        active={activeTab === 'pending'}
                        onClick={() => setActiveTab('pending')}
                        label="En Attente"
                        count={counts.pending}
                        badgeColor="bg-rose-500"
                    />
                    <TabButton
                        active={activeTab === 'rejected'}
                        onClick={() => setActiveTab('rejected')}
                        label="Rejetées"
                        count={counts.rejected}
                    />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-slate-800/50 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                    <p className="text-2xl font-black text-white">{counts.all}</p>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Actives</p>
                    <p className="text-2xl font-black text-blue-400">{companies.filter(c => c.status === 'approved').length}</p>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">En Attente</p>
                    <p className="text-2xl font-black text-rose-400">{counts.pending}</p>
                </div>
                <div className="bg-slate-800/20 border border-slate-800/50 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Résultats</p>
                    <p className="text-2xl font-black text-slate-200">{filteredCompanies.length}</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <SkeletonTable />
                ) : filteredCompanies.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800"
                    >
                        <Building size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">Aucun résultat trouvé</h3>
                        <p className="text-slate-500 mt-2">Essayez d'ajuster vos filtres ou votre recherche</p>
                        <button onClick={() => { setSearchTerm(""); setFilterDomain(""); setActiveTab("all"); }} className="mt-6 text-blue-500 font-bold hover:underline">Réinitialiser les filtres</button>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredCompanies.map((company, idx) => (
                            <motion.div
                                layout
                                key={company.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-[2rem] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900 shadow-xl hover:shadow-blue-500/5 transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center p-3 border border-slate-800 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                                        {company.logoUrl ? (
                                            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Building size={32} className="text-slate-700" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-white">{company.name}</h3>
                                            {company.status === 'approved' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Mail size={14} className="text-blue-500" />
                                                <span className="font-medium">{company.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Building size={14} className="text-indigo-500" />
                                                <span className="font-medium">{company.domaine || 'Non renseigné'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <MapPin size={14} className="text-rose-500" />
                                                <span className="font-medium">{company.address || 'Non renseignée'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <StatusBadge status={company.status} />
                                            <button
                                                onClick={() => fetchCompanyOffers(company)}
                                                className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5"
                                            >
                                                <Briefcase size={12} /> Voir Offres
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {company.status === "pending" ? (
                                        <div className="flex gap-2">
                                            <ActionButton
                                                onClick={() => handleApprove(company.id)}
                                                icon={Check}
                                                color="emerald"
                                                label="Approuver"
                                                loading={approvingId === company.id}
                                            />
                                            <ActionButton
                                                onClick={() => confirmReject(company)}
                                                icon={X}
                                                color="rose"
                                                label="Refuser"
                                                loading={rejectingId === company.id}
                                            />
                                        </div>
                                    ) : (
                                        <ActionButton
                                            onClick={() => confirmDelete(company)}
                                            icon={Trash2}
                                            color="slate"
                                            hoverColor="rose"
                                            label="Supprimer"
                                            loading={deletingId === company.id}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>



            {/* Offers Modal */}
            < AnimatePresence >
                {selectedCompany && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCompany(null)}
                            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-5 sm:p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                                        <Briefcase className="text-blue-500" />
                                        Offres de {selectedCompany.name}
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-1">Liste des stages et opportunités publiés</p>
                                </div>
                                <button onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                                    <XCircle size={28} />
                                </button>
                            </div>

                            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                                {loadingOffers ? (
                                    <div className="flex flex-col items-center py-12">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="mt-4 font-bold text-slate-500">Chargement des offres...</p>
                                    </div>
                                ) : companyOffers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <XCircle size={48} className="mx-auto text-slate-800 mb-4" />
                                        <p className="text-slate-500 font-bold">Cette entreprise n'a pas encore publié d'offres.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {companyOffers.map(offer => {
                                            const remaining = Math.max(0, (offer.interviewQuota || 10) - (offer.applicationCount || 0));

                                            // Determine display status
                                            let statusLabel = "Fermé";
                                            let statusClass = "bg-slate-700/50 text-slate-400 border-slate-600";

                                            if (remaining) {
                                                if (remaining === 0) {
                                                    statusLabel = "Quota Atteint";
                                                    statusClass = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                                                } else {
                                                    statusLabel = "Ouvert";
                                                    statusClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                                                }
                                            }

                                            return (
                                                <div key={offer.id} className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl group hover:border-blue-500/30 transition-all flex flex-col gap-4 shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 duration-300">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-black text-xl text-white group-hover:text-blue-400 transition-colors">{offer.title}</h4>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-500/20">{offer.type}</span>
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusClass}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end p-2 bg-slate-900 rounded-xl border border-slate-800">
                                                            <span className={`text-2xl font-black ${remaining > 0 ? 'text-white' : 'text-red-500'}`}>{remaining}</span>
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Places Restantes</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{offer.description}</p>

                                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-4 border-t border-slate-800/50 mt-auto">
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <MapPin size={14} className="text-rose-500" />
                                                            {offer.location}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <Users size={14} className="text-indigo-500" />
                                                            {offer.applicationCount || 0} Candidats
                                                        </div>
                                                        <div className="flex items-center gap-1.5 ml-auto text-slate-600">
                                                            <Clock size={14} />
                                                            {new Date(offer.createdAt || Date.now()).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-5 sm:p-8 bg-slate-950/50 border-t border-slate-800 text-right shrink-0">
                                <button
                                    onClick={() => setSelectedCompany(null)}
                                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all shadow-xl w-full sm:w-auto"
                                >
                                    Fermer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDangerous={confirmModal.isDangerous}
                onConfirm={confirmModal.onConfirm}
                isLoading={!!rejectingId || !!deletingId}
            />
        </AdminLayout>
    );
}

function TabButton({ active, onClick, label, count, badgeColor = "bg-blue-600" }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-all relative ${active
                ? "bg-slate-800 text-white shadow-lg border border-white/5"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                }`}
        >
            {label}
            {count > 0 && (
                <span className={`px-2 py-0.5 ${badgeColor || 'bg-slate-700'} text-white text-[10px] rounded-full min-w-[20px] font-bold shadow-lg animate-in zoom-in duration-300`}>
                    {count}
                </span>
            )}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full blur-[1px]"
                />
            )}
        </button>
    );
}

function ActionButton({ onClick, icon: Icon, color, hoverColor, label, loading }) {
    const colors = {
        emerald: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500",
        rose: "bg-rose-500/10 text-rose-500 hover:bg-rose-500",
        blue: "bg-blue-500/10 text-blue-500 hover:bg-blue-500",
        slate: "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
    };

    const finalHoverColor = hoverColor === 'rose' ? 'hover:bg-rose-500 hover:text-white' : 'hover:text-white';

    return (
        <button
            onClick={onClick}
            title={label}
            disabled={loading}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-90 ${colors[color]} ${finalHoverColor} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {loading ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
        </button>
    );
}

function StatusBadge({ status }) {
    const configs = {
        approved: { label: "Validé", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
        pending: { label: "En Attente", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
        declined: { label: "Refusé", class: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    };

    const cfg = configs[status] || configs.pending;

    return (
        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner ${cfg.class}`}>
            {cfg.label}
        </span>
    );
}
