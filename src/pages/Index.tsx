import { MadeWithDyad } from "@/components/made-with-dyad";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { Route, Smartphone, MapPin, Zap, Share2, ShieldCheck, Clock } from "lucide-react";
import Logo from "@/components/Logo";

const Index = () => {
  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Entrada Simples",
      description: "Cole ou digite seus endereços, um por linha. Sem complicações."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Otimização Inteligente",
      description: "Nosso algoritmo calcula a rota mais curta para economizar seu tempo e combustível."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Navegação Direta",
      description: "Abra sua rota otimizada diretamente no Google Maps ou Apple Maps."
    }
  ];

  const benefits = [
    { icon: <Clock className="w-5 h-5" />, text: "Economize até 30% de tempo" },
    { icon: <ShieldCheck className="w-5 h-5" />, text: "Privacidade total dos dados" },
    { icon: <Share2 className="w-5 h-5" />, text: "Compartilhe via WhatsApp" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Navigation/Header */}
        <nav className="flex justify-between items-center mb-16 md:mb-24">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold tracking-tight">Roteirizador</span>
          </div>
          <a 
            href="/route" 
            className="hidden sm:block text-sm font-medium hover:text-blue-400 transition-colors"
          >
            Entrar no App
          </a>
        </nav>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Novo: Compartilhamento via WhatsApp
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              Suas rotas, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                muito mais rápidas.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
              A ferramenta definitiva para entregadores, vendedores e viajantes. 
              Otimize múltiplos destinos em segundos e economize tempo real.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="/route"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all transform hover:-translate-y-1 active:scale-95"
              >
                Começar Gratuitamente
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/5 backdrop-blur-sm text-white text-lg font-semibold rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
              >
                Ver Recursos
              </a>
            </div>

            <div className="flex flex-wrap gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="text-blue-500">{benefit.icon}</div>
                  {benefit.text}
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-slate-900/50 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-2xl">
              <div className="aspect-[4/3] rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center border border-white/5">
                <div className="text-center p-8">
                  <Route className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
                  <div className="space-y-3">
                    <div className="h-2 w-48 bg-white/10 rounded-full mx-auto" />
                    <div className="h-2 w-32 bg-white/10 rounded-full mx-auto" />
                    <div className="h-2 w-40 bg-white/10 rounded-full mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-3 gap-6 mb-24">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/[0.03] backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">
            Pronto para otimizar seu dia?
          </h2>
          <p className="text-blue-100 mb-10 max-w-xl mx-auto text-lg relative z-10">
            Junte-se a milhares de usuários que já economizam tempo e dinheiro com o nosso roteirizador.
          </p>
          <a
            href="/route"
            className="inline-flex items-center px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-2xl shadow-xl hover:bg-slate-50 transition-all transform hover:scale-105 relative z-10"
          >
            Começar Agora
          </a>
        </div>
      </div>

      <footer className="border-t border-white/5 py-12 text-center text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 grayscale opacity-50" />
            <span>© 2024 Roteirizador de Endereços</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
        <div className="mt-8">
          <MadeWithDyad />
        </div>
      </footer>
      
      <PWAInstallButton />
    </div>
  );
};

export default Index;