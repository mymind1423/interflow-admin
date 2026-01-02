import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { adminApi } from "../api/adminApi";
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function login() {
    if (!email || !password) return setError("Veuillez remplir tous les champs");
    setError("");
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      localStorage.setItem("adminToken", token);

      const profile = await adminApi.getProfile();
      const userType = (profile.USER_TYPE || profile.userType || "").toLowerCase();

      if (userType !== "admin") {
        setError("Accès refusé. Droits administrateur requis.");
        localStorage.removeItem("adminToken");
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Email ou mot de passe invalide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden px-4">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -ml-48 -mb-48" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-600/20 mb-4 transform hover:scale-110 transition-transform cursor-pointer">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Admin<span className="text-blue-500">Flow</span></h1>
          <p className="text-slate-400 mt-2 font-medium">Console d'administration sécurisée</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email professionnel</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="admin@internflow.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 font-medium"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  onKeyDown={e => e.key === 'Enter' && login()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 font-medium"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  onKeyDown={e => e.key === 'Enter' && login()}
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm font-medium flex gap-2 items-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-3 sm:py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Se connecter
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>


        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          © 2025 InternFlow. Accès réservé au personnel autorisé uniquement.
          <br />
          IP : 192.168.1.1 (enregistrée)
        </p>
      </motion.div>
    </div>
  );
}
