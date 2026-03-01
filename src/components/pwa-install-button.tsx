"use client";

import { useState, useEffect } from "react";
import { Smartphone, Download } from "lucide-react";

export const PWAInstallButton = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Verifica se o navegador suporta PWA
    const isPWA = 'serviceWorker' in navigator && 'manifest' in document;
    setSupportsPWA(isPWA);

    // Captura o evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se o app já foi instalado
    const isInstalled = localStorage.getItem('pwa-installed') === 'true';
    if (isInstalled) {
      setShowInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          localStorage.setItem('pwa-installed', 'true');
          setShowInstall(false);
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (!showInstall || !supportsPWA) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-full shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 animate-pulse"
      >
        <Smartphone className="w-5 h-5" />
        <span>Instalar App</span>
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};