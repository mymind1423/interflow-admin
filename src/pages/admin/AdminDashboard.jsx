import { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { Users, Building, FileText, Calendar, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SkeletonStatCard } from "../../components/common/Skeletons";

function StatCard({ label, value, icon: Icon, color, bg, border, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`bg-white dark:bg-slate-900 border ${border || 'border-slate-200 dark:border-slate-800'} p-6 rounded-[2rem] relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-xl hover:shadow-md hover:-translate-y-1 duration-300`}
        >
            <div className="relative z-10">
                <div className={`p-3.5 rounded-2xl w-fit mb-4 ${bg} ${color}`}>
                    <Icon size={24} />
                </div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">{value}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wide">{label}</p>
            </div>
        </motion.div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCompanies: 0,
        pendingCompanies: 0,
        activeCompanies: 0,
        totalApplications: 0,
        totalApplications: 0,
        totalInterviews: 0,
        totalRetained: 0,
        studentsWithoutInterviews: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [baseStats, apps, interviews, students] = await Promise.all([
                adminApi.getStats(),
                adminApi.getApplications(),
                adminApi.getInterviews(),
                adminApi.getStudents() // Needed to count students without interviews
            ]);

            // Compute frontend stats
            const acceptedInterviews = interviews.filter(i => i.status === 'ACCEPTED' || i.status === 'COMPLETED').length;
            // Students without interviews
            const studentsWithInterviews = new Set(interviews.map(i => i.studentId));
            const studentsWithoutInterviews = students.length - studentsWithInterviews.size;

            setStats({
                ...baseStats,
                totalRetained: acceptedInterviews,
                studentsWithoutInterviews
            });
        } catch (error) {
            console.error("Failed to load admin stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 md:px-8 py-8 pb-20 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Tableau de Bord Admin</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Vue d'ensemble de la plateforme</p>
                    </div>
                </div>

                {/* Stats Grid */}
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
                                label="Étudiants Inscrits"
                                value={stats.totalStudents}
                                icon={Users}
                                color="text-blue-600 dark:text-blue-500"
                                bg="bg-blue-50 dark:bg-blue-500/10"
                                border="border-blue-200 dark:border-blue-500/20"
                                delay={0.1}
                            />
                            <StatCard
                                label="Entreprises Actives"
                                value={stats.activeCompanies}
                                icon={Building}
                                color="text-emerald-600 dark:text-emerald-500"
                                bg="bg-emerald-50 dark:bg-emerald-500/10"
                                border="border-emerald-200 dark:border-emerald-500/20"
                                delay={0.2}
                            />
                            <StatCard
                                label="Entreprises en Attente"
                                value={stats.pendingCompanies}
                                icon={Clock}
                                color="text-orange-600 dark:text-orange-500"
                                bg="bg-orange-50 dark:bg-orange-500/10"
                                border="border-orange-200 dark:border-orange-500/20"
                                delay={0.3}
                            />
                            <StatCard
                                label="Candidatures Totales"
                                value={stats.totalApplications}
                                icon={FileText}
                                color="text-purple-600 dark:text-purple-500"
                                bg="bg-purple-50 dark:bg-purple-500/10"
                                border="border-purple-200 dark:border-purple-500/20"
                                delay={0.4}
                            />
                            <StatCard
                                label="Entretiens Planifiés"
                                value={stats.totalInterviews}
                                icon={Calendar}
                                color="text-pink-600 dark:text-pink-500"
                                bg="bg-pink-50 dark:bg-pink-500/10"
                                border="border-pink-200 dark:border-pink-500/20"
                                delay={0.5}
                            />
                            <StatCard
                                label="Total Retenus"
                                value={stats.totalRetained}
                                icon={Users}
                                color="text-blue-600 dark:text-blue-500"
                                bg="bg-blue-50 dark:bg-blue-500/10"
                                border="border-blue-200 dark:border-blue-500/20"
                                delay={0.7}
                            />
                            <StatCard
                                label="Étudiants sans entretien"
                                value={stats.studentsWithoutInterviews}
                                icon={Users}
                                color="text-rose-600 dark:text-rose-500"
                                bg="bg-rose-50 dark:bg-rose-500/10"
                                border="border-rose-200 dark:border-rose-500/20"
                                delay={0.8}
                            />
                            <StatCard
                                label="Total Entreprises"
                                value={stats.totalCompanies}
                                icon={Building}
                                color="text-slate-600 dark:text-slate-500"
                                bg="bg-slate-100 dark:bg-slate-800/50"
                                border="border-slate-200 dark:border-slate-800"
                                delay={0.6}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
