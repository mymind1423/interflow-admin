import { Link, useLocation } from "react-router-dom";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronRight,
  FileText,
  Calendar,
  Video,
  Activity,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Entreprises", icon: Building2 },
  { to: "/students", label: "Étudiants", icon: Users },
  { to: "/applications", label: "Candidatures", icon: FileText },
  { to: "/live-manager", label: "Live Manager", icon: Video },
  { to: "/planning", label: "Planning", icon: Calendar },
  { to: "/logs", label: "Journal Humain", icon: Activity },
  { to: "/reports", label: "Rapports", icon: BarChart3 },
  { to: "/settings", label: "Paramètres", icon: SettingsIcon },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-72 min-h-screen bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex-col sticky top-0 shrink-0 transition-colors duration-300">
        <SidebarContent location={location} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent location={location} onItemClick={onClose} />
      </div>
    </>
  );
}

function SidebarContent({ location, onItemClick }) {
  const { notifications } = useAdminNotifications();

  const getBadgeCount = (label) => {
    if (!notifications) return 0;
    switch (label) {
      case "Entreprises":
        return notifications.filter(n => !n.isRead && n.type === 'company_signup').length;
      case "Étudiants":
        return notifications.filter(n => !n.isRead && n.type === 'student_signup').length;
      case "Candidatures":
        return notifications.filter(n => !n.isRead && n.type === 'new_application_admin').length;
      case "Planning":
        return notifications.filter(n => !n.isRead && n.type === 'interview_scheduled_admin').length;
      default:
        return 0;
    }
  };

  return (
    <>
      <div className="p-8">
        <Link to="/dashboard" onClick={onItemClick} className="flex items-center gap-3 group">
          <img src="/logo.png" alt="AdminFlow" className="w-10 h-10 object-contain drop-shadow-lg group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Admin<span className="text-blue-500">Flow</span></span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onItemClick}
              className={`relative flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive
                ? "text-blue-600 dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="flex items-center gap-3 relative z-10">
                <link.icon size={20} className={isActive ? "text-blue-600 dark:text-blue-500" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"} />
                <span className="font-medium">{link.label}</span>
              </div>
              {isActive && <ChevronRight size={16} className="text-blue-600 dark:text-blue-500 relative z-10" />}
              {/* Badge */}
              {getBadgeCount(link.label) > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-20">
                  {getBadgeCount(link.label)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-500 text-xs font-bold">
              A
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">Mode Admin</p>
              <p className="text-[10px] text-slate-500">Système opérationnel</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
