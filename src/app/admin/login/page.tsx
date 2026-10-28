"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldAlert } from "lucide-react";
import { UnneLogo } from "@/components/UnneLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#071728] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 border border-slate-700/80 shadow-2xl space-y-6 relative z-10">
        <div className="flex justify-center pb-2">
          <UnneLogo variant="dark" className="h-12 w-auto" />
        </div>

        <div className="text-center space-y-1 border-t border-slate-800 pt-4">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Matemática Financiera
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Panel de Administración Docente
          </h1>
          <p className="text-xs text-slate-400">
            Facultad de Ciencias Económicas • UNNE
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-rose-300 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Usuario de Cátedra
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej: admin"
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#0A2540] hover:bg-[#0c3156] border border-amber-400/50 text-white font-semibold text-sm shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500">
          UNNE • Encuestas de Opinión Estudiantil
        </div>
      </div>
    </main>
  );
}
