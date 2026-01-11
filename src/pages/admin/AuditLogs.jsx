import { useState, useEffect, useRef } from "react";
import { adminApi } from "../../api/adminApi";
import { Loader, Play, Pause, AlertCircle, FileText, CheckCircle, XCircle, User, Briefcase, Activity, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);
    const scrollRef = useRef(null);

    const fetchLogs = async () => {
        try {
            const data = await adminApi.getLogs();
            setLogs(data);
            if (loading) setLoading(false);
        } catch (err) {
            setError("Impossible de charger les logs");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (isLive) {
            intervalRef.current = setInterval(fetchLogs, 5000);
        } else {
            clearInterval(intervalRef.current);
        }
    }, [isLive]);

    const humanizeLog = (log) => {
        const { action, actorName, actorType, details } = log;
        const name = <span className="font-black text-slate-800 dark:text-white underline decoration-blue-500/30 decoration-2 underline-offset-2">{actorName || "Système"}</span>;

        let icon = <Activity className="w-5 h-5 text-slate-400" />;
        let text = <>{name} a effectué une action : {action}</>;

        if (action === 'JOB_APPLICATION') {
            icon = <Briefcase className="w-5 h-5 text-blue-500" />;
            text = <>{name} a transmis une candidature pour l'offre {details?.jobTitle || ''}.</>;
        } else if (action === 'APPROVE_COMPANY') {
            icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
            text = <>{name} a <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded mx-1">validé</span> l'entreprise {details?.companyName}.</>;
        } else if (action === 'REJECT_COMPANY') {
            icon = <XCircle className="w-5 h-5 text-rose-500" />;
            text = <>{name} a <span className="text-rose-600 font-bold uppercase text-[10px] tracking-widest px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 rounded mx-1">rejeté</span> l'entreprise {details?.companyName}.</>;
        } else if (action === 'UPDATE_SETTING') {
            icon = <SettingsIcon className="w-5 h-5 text-amber-500" />;
            text = <>{name} a modifié les configurations système.</>;
        } else if (action === 'LOGIN') {
            icon = <ShieldCheck className="w-5 h-5 text-indigo-500" />;
            text = <>{name} s'est authentifié sur la plateforme.</>;
        } else if (action === 'DELETE_USER') {
            icon = <XCircle className="w-5 h-5 text-red-500" />;
            text = <>{name} a supprimé l'utilisateur {details?.email || details?.id}.</>;
        }

        return { icon, text };
    };

    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            Journal de Bord <span className="text-blue-500">Activité</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Traçabilité complète des interventions humaines</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? 'bg-emerald-500/10 text-emerald-500 animate-pulse' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isLive ? 'Live Monitoring Actif' : 'Mode Statique'}
                        </div>
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`p-3 rounded-2xl transition-all shadow-lg ${isLive
                                ? "bg-rose-500 text-white shadow-rose-500/20"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                                }`}
                        >
                            {isLive ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[700px]">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center text-rose-500 font-bold uppercase tracking-widest">{error}</div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" ref={scrollRef}>
                            {logs.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 opacity-50">
                                    <Activity size={64} />
                                    <p className="font-black uppercase text-xs tracking-[0.3em]">Horizon Radieux : Aucun log détecté</p>
                                </div>
                            )}

                            {logs.map((log) => {
                                const { icon, text } = humanizeLog(log);
                                return (
                                    <div key={log.id} className="group relative flex items-start gap-5 p-6 bg-white dark:bg-slate-950/20 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all hover:translate-x-1">
                                        <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                                            {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                                                    {log.actorType || 'ADMIN'}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                                                    {new Date(log.createdAt).toLocaleTimeString()} · {new Date(log.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed">
                                                {text}
                                            </p>

                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <div className="mt-4 p-3 bg-slate-50/50 dark:bg-black/20 rounded-xl border border-dash border-slate-200 dark:border-white/5 overflow-x-auto">
                                                    <pre className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
