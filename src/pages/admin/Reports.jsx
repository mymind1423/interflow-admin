import { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { Loader2, TrendingUp, Users, Award, Download, AlertTriangle, Target, Filter, Calendar } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        try {
            setLoading(true);
            const report = await adminApi.getAnalyticsReport();
            setData(report);
        } catch (err) {
            console.error(err);
            toast.error("Erreur de chargement du rapport");
        } finally {
            setLoading(false);
        }
    };

    const conversionRate = data?.funnel?.total ? ((data.funnel.retained / data.funnel.total) * 100).toFixed(1) : 0;
    const interviewConversion = data?.funnel?.interviewed ? ((data.funnel.retained / data.funnel.interviewed) * 100).toFixed(1) : 0;
    const qualificationRate = data?.funnel?.total ? ((data.funnel.interviewed / data.funnel.total) * 100).toFixed(1) : 0;

    const generatePDF = () => {
        if (!data) return;
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Title and Header
        doc.setFillColor(31, 41, 55); // Dark Gray
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("RAPPORT ANALYTICS", 14, 25);
        doc.setFontSize(10);
        doc.text(`Généré le: ${timestamp}`, 14, 33);

        // Section: KPIs Summary
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Résumé de Performance", 14, 50);

        const kpiTable = [
            ["Volume Global d'Inscriptions", data.funnel.total, "Total Étudiants"],
            ["Nombre d'Entretiens", data.funnel.interviewed, "Étudiants interviewés"],
            ["Étudiants Retenus", data.funnel.retained, "Succès Final"],
            ["Taux de Conversion Global", `${conversionRate}%`, "Inscrits -> Retenus"],
            ["Taux de Succès Entretien", `${interviewConversion}%`, "Entretiens -> Retenus"]
        ];

        doc.autoTable({
            startY: 55,
            head: [['Indicateur', 'Valeur', 'Description']],
            body: kpiTable,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
        });

        // Section: Status Distribution
        doc.text("Distribution des Statuts d'Entretiens", 14, doc.lastAutoTable.finalY + 15);
        const statusTable = data.statusDistribution.map(s => [s.name, s.value]);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Statut', 'Nombre']],
            body: statusTable,
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234] }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} sur ${pageCount} - InternFlow Admin Analytics`, 105, 285, { align: 'center' });
        }

        doc.save(`Rapport_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Rapport PDF généré !");
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        </AdminLayout>
    );

    const funnelData = [
        { name: 'Inscrits', value: data?.funnel?.total || 0, fill: '#6366f1', label: 'Volume Global' },
        { name: 'Entretiens', value: data?.funnel?.interviewed || 0, fill: '#8b5cf6', label: 'Qualifiés' },
        { name: 'Retenus', value: data?.funnel?.retained || 0, fill: '#10b981', label: 'Admis' }
    ];

    const pieData = [
        { name: 'Retenus', value: data?.funnel?.retained || 0, fill: '#10b981' },
        { name: 'Non Retenus', value: Math.max(0, (data?.funnel?.interviewed || 0) - (data?.funnel?.retained || 0)), fill: '#f43f5e' }
    ];

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            Rapport Analytics
                        </h1>
                        <p className="text-slate-500 font-medium">Performance du processus de recrutement</p>
                    </div>
                    <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 transition-colors text-sm font-bold text-white shadow-lg shadow-indigo-900/20">
                        <Download size={16} /> Exporter PDF
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Inscrits</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{data?.funnel?.total}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-4 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <Target size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Qualifiés %</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{qualificationRate}%</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <Award size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Succès %</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{interviewConversion}%</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Conversion Globale</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{conversionRate}%</p>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Monthly Trend Chart */}
                    <div className="lg:col-span-12 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl lg:col-span-12">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Calendar size={18} /> Évolution des Inscriptions (6 derniers mois)
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.monthlyTrend || []}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Funnel Chart */}
                    <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Filter size={18} /> Tunnel d'Acquisition
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} width={80} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <TrendingUp size={18} /> Distribution des Statuts
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.statusDistribution || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(data?.statusDistribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {(data?.statusDistribution || []).map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Strategic Recommendations */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/30">
                    <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                        <AlertTriangle className="text-yellow-300" /> Recommandations Stratégiques
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <p className="font-bold text-indigo-100 mb-2 uppercase text-xs tracking-wider">Point de friction détecté</p>
                            <p className="text-xl font-medium leading-relaxed">
                                {interviewConversion < 30
                                    ? "Le taux de conversion après entretien est faible (<30%). Les candidats arrivent en entretien mais ne sont pas retenus."
                                    : "Le taux de conversion après entretien est sain. Le goulot d'étranglement se situe principalement en amont (Inscription -> Entretien)."
                                }
                            </p>
                        </div>
                        <div>
                            <p className="font-bold text-indigo-100 mb-2 uppercase text-xs tracking-wider">Action Suggérée</p>
                            <ul className="list-disc list-inside space-y-2 text-indigo-50 font-medium">
                                {interviewConversion < 30 ? (
                                    <>
                                        <li>Revoir les critères de présélection avant entretien.</li>
                                        <li>Former les recruteurs/entreprises à mieux cibler les profils.</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Augmenter le volume d'inscriptions qualifiées.</li>
                                        <li>Simplifier le processus de candidature pour encourager plus d'entretiens.</li>
                                    </>
                                )}
                                <li>Analyser les motifs de rejet les plus fréquents (Competences vs Soft Skills).</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
