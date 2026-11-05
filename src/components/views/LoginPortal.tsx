import React, { useState } from "react";
import { signInWithGoogle } from "../../lib/firebase";
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface LoginPortalProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginPortal({ onLoginSuccess }: LoginPortalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error("Erreur d'authentification Google :", err);
      // Messages d'erreurs en ligne (sans fenêtres d'alertes ou de popups d'erreur) conforme aux règles
      if (err.code === "auth/popup-blocked") {
        setErrorMsg("⚠️ Bloqueur de popup détecté ! Veuillez autoriser les fenêtres popups pour ce site afin de vous connecter avec Google.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("⚠️ Fenêtre de connexion fermée avant la fin. Veuillez réessayer.");
      } else {
        setErrorMsg(`⚠️ Échec de connexion : ${err.message || "Erreur réseau ou configuration."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8f2] flex flex-col justify-center items-center p-6 relative overflow-hidden select-none selection:bg-yellow-300">
      {/* Formes décoratives abstraites de style Memphis rétro */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300 rounded-full border-4 border-black -rotate-6 shadow-[4px_4px_0px_0px_#000] -z-10 opacity-60 animate-pulse" />
      <div className="absolute bottom-16 right-10 w-40 h-40 bg-sky-305 bg-sky-300 border-4 border-black shadow-[4px_4px_0px_0px_#000] -z-10 opacity-50 rotate-12" />
      <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-yellow-300 border-4 border-black -z-10 opacity-60 rotate-45" />

      {/* Cœur du portail */}
      <div className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center relative z-10 transition-transform hover:scale-[1.01]">
        {/* Logo rotatif ludique */}
        <div className="mb-8 rotate-[-3deg]">
          <img 
            src="https://amac.neocities.org/todologomenphis.png" 
            alt="ᵗ°ᵈ°" 
            referrerPolicy="no-referrer"
            className="h-20 object-contain" 
          />
        </div>

        {/* Titre et accroche */}
        <h1 className="font-mono font-black text-2xl text-center text-black mb-3 leading-tight">
          VOTRE MONDE EN SYNCHRO
        </h1>
        <p className="font-mono text-center text-xs text-gray-600 mb-8 max-w-sm leading-relaxed">
          Rejoignez l'écosystème de productivité somatique et de gamification. Vos tâches, habitudes et scores sont synchronisés de manière transparente et sécurisée sur tous vos écrans en temps réel.
        </p>

        {/* Alerte Erreur en ligne (sans popup) */}
        {errorMsg && (
          <div className="w-full bg-red-100 border-2 border-black p-3 mb-6 font-mono text-xs text-red-700 font-bold leading-snug">
            {errorMsg}
          </div>
        )}

        {/* Bouton de Connexion Google stylisé */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black border-4 border-black py-4 px-6 font-mono font-black text-sm uppercase flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin font-black">⏳ CONNEXION...</span>
          ) : (
            <>
              <Sparkles size={18} className="animate-bounce" />
              <span>Se connecter avec Google</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Avantages de sécurité */}
        <div className="mt-8 border-t-2 border-black w-full pt-6 flex flex-col gap-3 font-mono text-[10.5px] text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
            <span>Sécurisé à 100% par Google Firebase Cloud Security.</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-blue-500 shrink-0" />
            <span>Aucun stockage de mot de passe requis. Vos données n'appartiennent qu'à vous.</span>
          </div>
        </div>
      </div>

      {/* Note de confidentialité en bas de portail */}
      <div className="mt-8 text-center max-w-xs px-4">
        <p className="font-mono text-[9px] text-gray-400 leading-normal">
          En vous connectant, vous acceptez le stockage persistant et l'affichage de vos tâches et préférences personnelles sur les serveurs sécurisés Cloud Firestore.
        </p>
      </div>
    </div>
  );
}
