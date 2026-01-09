import { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { Users, Building, FileText, Calendar, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SkeletonStatCard } from "../../components/common/Skeletons";

function StatCard({ label, value, icon: Icon, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={64} />
            </div>
            <div className="relative z-10">
                <div className={`p-3 rounded-lg w-fit mb-4 ${color.replace('text-', 'bg-').replace('500', '500/10')} ${color}`}>
                    <Icon size={24} />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                <p className="text-slate-400 text-sm font-medium">{label}</p>
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
        marketingRate: 0,
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
            const matchingRate = apps.length > 0 ? ((acceptedInterviews / apps.length) * 100).toFixed(1) : 0;

            // Students without interviews
            const studentsWithInterviews = new Set(interviews.map(i => i.studentId));
            const studentsWithoutInterviews = students.length - studentsWithInterviews.size;

            setStats({
                ...baseStats,
                matchingRate,
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
        <div className="min-h-screen bg-slate-950 px-4 md:px-8 py-8 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Tableau de Bord Admin</h1>
                        <p className="text-slate-400 mt-1">Vue d'ensemble de la plateforme</p>
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
                                color="text-blue-500"
                                delay={0.1}
                            />
                            <StatCard
                                label="Entreprises Actives"
                                value={stats.activeCompanies}
                                icon={Building}
                                color="text-emerald-500"
                                delay={0.2}
                            />
                            <StatCard
                                label="Entreprises en Attente"
                                value={stats.pendingCompanies}
                                icon={Clock}
                                color="text-orange-500"
                                delay={0.3}
                            />
                            <StatCard
                                label="Candidatures Totales"
                                value={stats.totalApplications}
                                icon={FileText}
                                color="text-purple-500"
                                delay={0.4}
                            />
                            <StatCard
                                label="Entretiens Planifiés"
                                value={stats.totalInterviews}
                                icon={Calendar}
                                color="text-pink-500"
                                delay={0.5}
                            />
                            <StatCard
                                label="Taux de Matching"
                                value={`${stats.matchingRate}%`}
                                icon={CheckCircle}
                                color="text-emerald-500"
                                delay={0.6}
                            />
                            <StatCard
                                label="Total Retenus"
                                value={stats.totalRetained}
                                icon={Users}
                                color="text-blue-500"
                                delay={0.7}
                            />
                            <StatCard
                                label="Étudiants sans entretien"
                                value={stats.studentsWithoutInterviews}
                                icon={Users}
                                color="text-rose-500"
                                delay={0.8}
                            />
                            <StatCard
                                label="Total Entreprises"
                                value={stats.totalCompanies}
                                icon={Building}
                                color="text-slate-500"
                                delay={0.6}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
