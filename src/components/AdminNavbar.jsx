import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminApi } from "../api/adminApi";
import { LogOut, Bell, Search, User, Settings, Shield, ChevronDown, CheckCircle2, UserCircle, Building, Briefcase, ExternalLink, Loader2, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminNavbar({ onToggleSidebar }) {
  const { admin } = useAdminAuth() || {};
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Global Search State
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (admin) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [admin]);

  const loadNotifications = async () => {
    try {
      const data = await adminApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications");
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const results = await adminApi.globalSearch(query);
          setSearchResults(results);
        } catch (err) {
          console.error("Search failed");
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for search results
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex-1 max-w-xl relative flex items-center gap-3" ref={searchRef}>
        <button onClick={onToggleSidebar} className="md:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-xl">
          <Menu size={24} />
        </button>
        <div className="relative group flex-1">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${showResults ? 'text-blue-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} size={18} />
          <input
            type="text"
            placeholder="Rechercher étudiant, entreprise ou poste..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-2.5 pl-12 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
          />
          {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={16} />}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden z-50 p-2"
            >
              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                {(!searchResults || (searchResults.students.length === 0 && searchResults.companies.length === 0 && searchResults.jobs.length === 0)) ? (
                  <div className="py-12 text-center text-slate-500 font-bold italic">Aucun résultat pour "{query}"</div>
                ) : (
                  <div className="space-y-4 p-2">
                    {searchResults.students.length > 0 && (
                      <SearchSection title="Étudiants" items={searchResults.students} icon={UserCircle}
                        onClickItem={(id) => { navigate(`/students`); setShowResults(false); }} />
                    )}
                    {searchResults.companies.length > 0 && (
                      <SearchSection title="Entreprises" items={searchResults.companies} icon={Building}
                        onClickItem={(id) => { navigate(`/companies`); setShowResults(false); }} />
                    )}
                    {searchResults.jobs.length > 0 && (
                      <SearchSection title="Offres / Postulations" items={searchResults.jobs} icon={Briefcase}
                        onClickItem={(id) => { navigate(`/applications`); setShowResults(false); }} />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-slate-950"></span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 overflow-hidden z-50"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-bold text-white text-sm">Notifications</h3>
                  {unreadCount > 0 && <button className="text-[10px] font-black text-blue-500 uppercase hover:underline">Marquer tout</button>}
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-[10px] font-black uppercase">Aucune notification</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-2xl border border-transparent hover:border-slate-800 transition-all cursor-pointer group ${!n.isRead ? 'bg-blue-600/5' : 'bg-transparent opacity-60'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-slate-700'}`} />
                          <p className="text-xs text-slate-200 font-medium leading-relaxed">{n.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 block uppercase font-black tracking-tighter pl-4">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-slate-800/50"></div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1.5 pl-3 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all active:scale-95"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none mb-1">{admin?.displayName || "Admin"}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Super Admin</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/10 overflow-hidden">
              {admin?.photoUrl ? (
                <img src={admin.photoUrl} className="w-full h-full object-cover" />
              ) : (
                admin?.displayName?.[0] || <User size={18} />
              )}
            </div>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-2 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-800/50 mb-2">
                  <p className="text-xs font-bold text-white truncate">{admin?.email}</p>
                  <p className="text-[10px] text-emerald-500 font-black uppercase mt-1 flex items-center gap-2">
                    <CheckCircle2 size={10} /> Système Opérationnel
                  </p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-sm font-bold group"
                >
                  <Settings size={18} className="group-hover:rotate-45 transition-transform" />
                  Paramètres
                </button>
                <div className="h-px bg-slate-800/50 my-2 mx-2"></div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all text-sm font-bold"
                >
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function SearchSection({ title, items, icon: Icon, onClickItem }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-2">
        <Icon size={12} /> {title}
      </h4>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onClickItem(item.id)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-all text-left group"
        >
          <div>
            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{item.name || item.title}</p>
            {item.email && <p className="text-[10px] text-slate-500 font-medium">{item.email}</p>}
          </div>
          <ExternalLink size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
        </button>
      ))}
    </div>
  );
}
