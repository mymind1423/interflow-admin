import AdminLayout from "../components/AdminLayout";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../api/adminApi";
import { useState } from "react";
import { useEffect } from "react";
import { SettingsIcon, Terminal, User, Save, Bell, Activity, Shield, Lock, Database, Monitor, RefreshCw, XCircle, Search } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
// ... keep other imports ...

// ... keep SettingItem component ...

export default function Settings() {
  // ... keep state and effects ...
  const { admin, refreshAdmin } = useAdminAuth();
  const [displayName, setDisplayName] = useState(admin?.displayName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, lData] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getLogs()
      ]);
      setSettings(sData);
      setLogs(lData);
    } catch (err) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const lData = await adminApi.getLogs();
      setLogs(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(lData)) {
          return lData;
        }
        return prev;
      });
    } catch (err) { }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await adminApi.updateAdminProfile(displayName);
      await refreshAdmin();
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error("Échec de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = async (key, currentValue) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      await adminApi.updateSetting(key, newValue);
      setSettings(prev => ({ ...prev, [key]: newValue }));
      toast.success("Configuration mise à jour");
      loadLogs();
    } catch (err) {
      toast.error("Erreur serveur");
    }
  };

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.details.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-blue-500" size={32} />
            Centre de Configuration
          </h1>
          <p className="text-slate-400 mt-2 font-medium italic">Accès direct aux variables d'environnement et à la traçabilité système.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl backdrop-blur-md">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest leading-none">Cœur de Système Actif</span>
          </div>
          <button
            onClick={() => setShowLogs(true)}
            className="p-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all shadow-xl group"
          >
            <Terminal size={22} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Admin Profile */}
        <div className="xl:col-span-4 space-y-8">
          <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />

            <div className="relative flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] p-1 shadow-2xl mb-6 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-900 rounded-[2.2rem] flex items-center justify-center text-white text-5xl font-black italic">
                  {admin?.displayName?.[0] || 'A'}
                </div>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Panel d'Identité</h3>
              <div className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase mt-2 border border-blue-500/20">Super-Admin</div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nom d'usage public</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Connecteur Firebase</label>
                <div className="w-full bg-slate-950/20 border border-slate-800/50 rounded-2xl py-3 px-5 text-sm font-bold text-slate-600 select-none">
                  {admin?.email}
                </div>
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="w-full py-4 bg-white text-slate-950 hover:bg-blue-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <><Save size={18} /> Sync Profil</>}
              </button>
            </div>
          </section>

          {/* Status Mini Card */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-[2rem] p-6 flex items-center justify-between group overflow-hidden relative">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Bell size={24} /></div>
              <div>
                <p className="text-xs font-black text-white uppercase">Alerte IA</p>
                <p className="text-[10px] text-slate-500 font-medium">Gemini Pro 1.5 Actif</p>
              </div>
            </div>
            <Activity className="text-slate-800 group-hover:text-blue-500/50 transition-colors relative z-10" size={32} />
          </div>
        </div>

        {/* Right Column: System Toggles */}
        <div className="xl:col-span-8 space-y-8">
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <Shield size={14} className="text-blue-500" /> Protocoles de Sécurité
            </h2>
            <SettingItem
              icon={Lock}
              title="Force MFA"
              desc="Exiger la validation double-facteur pour tout accès au panel admin."
              actionLabel={settings.MFA_FORCED === 'true' ? "Activé" : "Désactivé"}
              active={settings.MFA_FORCED === 'true'}
              onClick={() => toggleSetting('MFA_FORCED', settings.MFA_FORCED)}
            />
            <SettingItem
              icon={Activity}
              title="Live Logs Audit"
              desc="Ouvrir le moniteur de traçabilité en temps réel (Historique SQL)."
              actionLabel="Lancer"
              onClick={() => setShowLogs(true)}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xs font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
              <Database size={14} className="text-indigo-500" /> Infrastructure Node/Oracle
            </h2>
            <SettingItem
              icon={Monitor}
              title="Maintenance Globale"
              desc="Verrouiller l'accès Students/Companies pour les mises à jour structurelles."
              actionLabel={settings.MAINTENANCE_MODE === 'true' ? "DÉSFACTIVER" : "ACTIVER"}
              active={settings.MAINTENANCE_MODE === 'true'}
              onClick={() => toggleSetting('MAINTENANCE_MODE', settings.MAINTENANCE_MODE)}
            />
          </div>
        </div>
      </div>


      {/* Real-time Logs Modal */}
      < AnimatePresence >
        {showLogs && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogs(false)}
              className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Terminal size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-white italic tracking-tight">Audit_Logger.exe</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Traçabilité des Commandes Administrateur</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="Filtrer les logs..."
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500">
                    <XCircle size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-950/20">
                <div className="space-y-px font-mono text-[11px]">
                  {filteredLogs.length === 0 ? (
                    <div className="py-20 text-center text-slate-700 font-bold uppercase tracking-widest italic">Aucune entrée détectée dans le buffer.</div>
                  ) : (
                    filteredLogs.map(log => (
                      <div key={log.id} className="p-4 bg-slate-950/40 border-b border-slate-800/10 flex gap-6 items-start hover:bg-slate-900/50 transition-colors group">
                        <span className="text-blue-500 shrink-0 select-none font-mono text-[10px] pt-1">[{new Date(log.createdAt).toLocaleTimeString()}]</span>

                        <div className="shrink-0 w-32">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${log.action.includes('DELETE') ? 'bg-red-500/10 text-red-500' :
                            log.action.includes('UPDATE') ? 'bg-amber-500/10 text-amber-500' :
                              log.action.includes('NEW') ? 'bg-emerald-500/10 text-emerald-500' :
                                'bg-blue-500/10 text-blue-500'
                            }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-slate-600 font-bold text-[9px] uppercase tracking-widest">BY</span>
                            <span className="text-slate-300 font-bold">{log.adminId}</span>
                          </div>

                          <div className="mt-1">
                            {typeof log.details === 'object' && log.details !== null ? (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(log.details).map(([k, v]) => (
                                  <div key={k} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                                    <span className="text-slate-500 mr-1.5 uppercase tracking-wide">{k}</span>
                                    <span className="text-indigo-300 font-mono truncate max-w-[200px]" title={String(v)}>
                                      {String(v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-indigo-300 italic">{String(log.details)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span>Status: Operational</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span>Total Logs: {logs.length}</span>
              </div>
            </motion.div>
          </div>
        )
        }
      </AnimatePresence >
    </AdminLayout >
  );
}

function SettingItem({ icon: Icon, title, desc, actionLabel, active, onClick }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex items-start justify-between gap-4 group hover:bg-slate-900/60 transition-colors">
      <div className="flex gap-4">
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">{desc}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${active
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
          }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
