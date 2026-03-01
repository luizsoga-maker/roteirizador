import { MadeWithDyad } from "@/components/made-with-dyad";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { Route, Smartphone, MapPin, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const Index = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Verifica se o navegador suporta PWA
    const isPWA = 'serviceWorker' in navigator && 'manifest' in document;
    setSupportsPWA(isPWA);

    // Captura o evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Entrada Simples",
      description: "Cole ou digite seus endereços, um por linha"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Otimização Inteligente",
      description: "Algoritmo que calcula a rota mais eficiente"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Exporte para Maps",
      description: "Envie direto para Google Maps ou Apple Maps"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-5 bg-white/10 backdrop-blur-lg rounded-full shadow-2xl border border-white/20">
              <Route className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Roteirizador de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Endereços
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Otimize suas rotas de entrega, visitas ou viagens com um clique. 
            Basta inserir seus endereços e exportar para o Google Maps ou Apple Maps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/route"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <Route className="mr-2 h-5 w-5" />
              Começar Agora
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur text-white text-lg font-semibold rounded-full shadow-lg border border-white/20 hover:bg-white/20 transition-all"
            >
              Como Funciona
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div id="como-funciona" className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/20 transition-all group"
            >
              <div className="text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Insira os endereços</h3>
              <p className="text-gray-300 text-sm">
                Digite ou cole uma lista de endereços, um por linha
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Otimize a rota</h3>
              <p className="text-gray-300 text-sm">
                Nosso algoritmo calcula a sequência mais eficiente
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Exporte para Maps</h3>
              <p className="text-gray-300 text-sm">
                Abra no Google Maps ou Apple Maps e navegue
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/route"
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-full shadow-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105"
          >
            <Route className="mr-3 h-6 w-6" />
            Otimizar Minha Rota Agora
          </a>
        </div>
      </div>
      <MadeWithDyad />
      <PWAInstallButton />
    </div>
  );
};

export default Index;