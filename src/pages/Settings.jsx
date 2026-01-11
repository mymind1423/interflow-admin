import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { adminApi } from "../api/adminApi";
import {
  Settings as SettingsIcon,
  Workflow,
  Users as UsersIcon,
  Bell,
  ShieldCheck,
  Save,
  RefreshCw,
  ChevronRight,
  Globe,
  Sliders,
  Mail,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const SECTIONS = [
  { id: 'general', label: 'Général', icon: Globe, desc: 'Identité et branding' },
  { id: 'workflow', label: 'Workflow', icon: Workflow, desc: 'Automatisations & Seuils' },
  { id: 'team', label: 'Équipe', icon: UsersIcon, desc: 'Rôles & Permissions' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Triggers & Alertes' }
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: { platformName: "", promoName: "", contactEmail: "" },
    workflow: { retentionThreshold: 75, interviewSlotDuration: 30, autoApproveCompanies: false, maxApplicationsPerStudent: 5, validationEnabled: true },
    team: { allowShadowing: true, visibleEvaluations: false },
    notifications: { emailStudentOnStatusChange: true, emailAdminOnNewRegistration: true, emailCompanyOnNewApplication: true }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      // Safe merge with default structure
      setSettings(prev => ({
        ...prev,
        ...data,
        general: { ...prev.general, ...(data.general || {}) },
        workflow: { ...prev.workflow, ...(data.workflow || {}) },
        team: { ...prev.team, ...(data.team || {}) },
        notifications: { ...prev.notifications, ...(data.notifications || {}) }
      }));
    } catch (err) {
      toast.error("Échec du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast.success("Configurations sauvegardées");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex h-[70vh] items-center justify-center">
        <RefreshCw className="animate-spin text-blue-500" size={40} />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <ShieldCheck size={12} /> Console de Configuration
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
              Paramètres <span className="text-blue-500 italic">Système</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">Éditez les variables critiques de votre écosystème</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <><Save size={18} /> Enregistrer</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all text-left group ${activeSection === s.id
                  ? "bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800"
                  : "hover:bg-slate-50 dark:hover:bg-white/5 opacity-60 hover:opacity-100"
                  }`}
              >
                <div className={`p-3 rounded-2xl ${activeSection === s.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500'} transition-all`}>
                  <s.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-black uppercase tracking-tight ${activeSection === s.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{s.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{s.desc}</p>
                </div>
                {activeSection === s.id && <ChevronRight size={16} className="text-slate-300" />}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  {React.createElement(SECTIONS.find(s => s.id === activeSection).icon, { size: 160 })}
                </div>

                {activeSection === 'general' && (
                  <div className="space-y-10 relative z-10">
                    <SectionHeader title="Branding & Identité" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input
                        label="Nom de la Plateforme"
                        value={settings.general.platformName}
                        onChange={v => updateField('general', 'platformName', v)}
                        placeholder="Ex: InternFlow"
                      />
                      <Input
                        label="Nom de la Promotion"
                        value={settings.general.promoName}
                        onChange={v => updateField('general', 'promoName', v)}
                        placeholder="Ex: Promo 2026"
                      />
                      <Input
                        label="Email de Contact"
                        icon={Mail}
                        value={settings.general.contactEmail}
                        onChange={v => updateField('general', 'contactEmail', v)}
                        placeholder="admin@domain.com"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'workflow' && (
                  <div className="space-y-10 relative z-10">
                    <SectionHeader title="Paramétrage de l'Algorithme" />
                    <div className="grid grid-cols-1 gap-12">
                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          <span>Seuil de Rétention Automatique</span>
                          <span className="text-blue-500 bg-blue-500/10 px-2 rounded">{settings.workflow.retentionThreshold}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settings.workflow.retentionThreshold}
                          onChange={e => updateField('workflow', 'retentionThreshold', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-[10px] text-slate-400 italic font-medium">Les candidats ayant un score supérieur à ce seuil seront marqués "Retenus" par le système.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Durée Slot Entretien (min)</label>
                          <select
                            value={settings.workflow.interviewSlotDuration}
                            onChange={e => updateField('workflow', 'interviewSlotDuration', parseInt(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 ring-blue-500/20 appearance-none"
                          >
                            {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} Minutes</option>)}
                          </select>
                        </div>
                        <Input
                          label="Candidatures Max / Étudiant"
                          type="number"
                          value={settings.workflow.maxApplicationsPerStudent}
                          onChange={v => updateField('workflow', 'maxApplicationsPerStudent', parseInt(v))}
                        />
                      </div>

                      <Toggle
                        title="Auto-Approbation Entreprises"
                        desc="Valider automatiquement les entreprises avec un profil complet dès l'inscription."
                        active={settings.workflow.autoApproveCompanies}
                        onToggle={() => updateField('workflow', 'autoApproveCompanies', !settings.workflow.autoApproveCompanies)}
                      />

                      <Toggle
                        title="Validation par les Entreprises"
                        desc="Si désactivé, le système planifie automatiquement les entretiens dès la candidature."
                        active={settings.workflow.validationEnabled}
                        onToggle={() => updateField('workflow', 'validationEnabled', !settings.workflow.validationEnabled)}
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'team' && (
                  <div className="space-y-10 relative z-10">
                    <SectionHeader title="Rôles & Accessibilité" />
                    <div className="space-y-6">
                      <Toggle
                        title="Shadowing Session"
                        desc="Autoriser les administrateurs juniors à observer les entretiens sans pouvoir noter."
                        active={settings.team.allowShadowing}
                        onToggle={() => updateField('team', 'allowShadowing', !settings.team.allowShadowing)}
                      />
                      <Toggle
                        title="Transparence des Notes"
                        desc="Permettre aux entreprises de consulter les évaluations administratives des candidats."
                        active={settings.team.visibleEvaluations}
                        onToggle={() => updateField('team', 'visibleEvaluations', !settings.team.visibleEvaluations)}
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'notifications' && (
                  <div className="space-y-10 relative z-10">
                    <SectionHeader title="Système d'Alertes Mail" />
                    <div className="space-y-6">
                      <Toggle
                        icon={Mail}
                        title="Étudiants : Changement de Statut"
                        desc="Notifier l'étudiant dès qu'il est 'Retenu' ou que son entretien est planifié."
                        active={settings.notifications.emailStudentOnStatusChange}
                        onToggle={() => updateField('notifications', 'emailStudentOnStatusChange', !settings.notifications.emailStudentOnStatusChange)}
                      />
                      <Toggle
                        icon={Zap}
                        title="Admin : Nouvelles Inscriptions"
                        desc="Alerte instantanée lors de l'inscription d'un nouvel étudiant qualifié."
                        active={settings.notifications.emailAdminOnNewRegistration}
                        onToggle={() => updateField('notifications', 'emailAdminOnNewRegistration', !settings.notifications.emailAdminOnNewRegistration)}
                      />
                      <Toggle
                        icon={Globe}
                        title="Entreprises : Nouvelles Candidatures"
                        desc="Notifier les entreprises dès qu'un candidat postule à leurs offres."
                        active={settings.notifications.emailCompanyOnNewApplication}
                        onToggle={() => updateField('notifications', 'emailCompanyOnNewApplication', !settings.notifications.emailCompanyOnNewApplication)}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className="w-1 h-8 bg-blue-500 rounded-full" />
      <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{title}</h3>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", icon: Icon }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pr-6 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 ring-blue-500/20 transition-all ${Icon ? 'pl-12' : 'pl-6'}`}
        />
      </div>
    </div>
  );
}

function Toggle({ title, desc, active, onToggle, icon: Icon }) {
  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-slate-400 group-hover:text-blue-500 transition-colors">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] text-slate-500 font-medium max-w-md mt-1">{desc}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${active ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${active ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
