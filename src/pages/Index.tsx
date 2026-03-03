import { Link } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { Smartphone, MapPin, Zap, Share2, ShieldCheck, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

const Index = () => {
  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Entrada Inteligente",
      description: "Cole sua lista de endereços ou use sua localização atual. Suportamos diversos formatos de texto.",
      image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Algoritmo Avançado",
      description: "Cálculos precisos que consideram a melhor sequência lógica para reduzir quilometragem.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Foco em Mobilidade",
      description: "Interface otimizada para uso em movimento, com botões grandes e navegação intuitiva.",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30 group-hover:scale-110 transition-transform">
              <Logo className="w-8 h-8" />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              ROTEIRIZADOR
            </span>
          </div>
          <Link 
            to="/route" 
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all backdrop-blur-md"
          >
            Abrir App
          </Link>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              Otimização em Tempo Real
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
              Entregue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                mais rápido.
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
              A ferramenta essencial para quem vive nas ruas. Economize combustível, tempo e paciência com rotas inteligentes geradas em segundos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/route"
                className="group inline-flex items-center justify-center px-8 py-5 bg-blue-600 text-white text-lg font-black rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all transform hover:-translate-y-1"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 px-6 py-5">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <img 
                      key={i}
                      src={`https://i.pravatar.cc/100?img=${i+10}`} 
                      className="w-10 h-10 rounded-full border-2 border-[#020617]" 
                      alt="User"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-white">+2.000 usuários</p>
                  <p className="text-slate-500">confiam na gente</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transform lg:rotate-3 hover:rotate-0 transition-transform duration-700">
              <img 
                src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=1200" 
                alt="App Preview" 
                className="w-full h-full object-cover aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Status da Rota</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">OTIMIZADO</span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">Economia estimada: 14.2km (28%)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Tudo o que você precisa</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Desenvolvido para ser simples, rápido e eficiente. Sem cadastros complexos ou telas desnecessárias.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden hover:bg-white/[0.04] hover:border-blue-500/30 transition-all"
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof / Benefits */}
        <section className="bg-white/[0.02] border-y border-white/5 py-24">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: "Tempo Médio Salvo", value: "45 min", sub: "por dia" },
              { label: "Combustível", value: "15%", sub: "de economia" },
              { label: "Endereços", value: "1M+", sub: "processados" },
              { label: "Satisfação", value: "99%", sub: "dos usuários" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-5xl font-black text-blue-500 mb-2">{stat.value}</p>
                <p className="text-white font-bold">{stat.label}</p>
                <p className="text-slate-500 text-sm">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900 p-12 md:p-24 text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                Pronto para transformar sua rotina?
              </h2>
              <p className="text-xl text-blue-100 mb-12 leading-relaxed">
                Junte-se a milhares de profissionais que já otimizaram suas entregas e visitas. É grátis e sempre será.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  to="/route"
                  className="px-10 py-5 bg-white text-blue-600 text-xl font-black rounded-2xl shadow-2xl hover:scale-105 transition-transform"
                >
                  Começar Agora
                </Link>
                <div className="flex flex-col items-center sm:items-start justify-center text-left">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => <CheckCircle2 key={i} className="w-4 h-4 text-blue-200" />)}
                  </div>
                  <p className="text-sm font-bold text-blue-100">Sem necessidade de cartão</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <Logo className="w-6 h-6 opacity-50" />
              <span className="font-bold text-slate-500">© 2024 Roteirizador</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
          </div>
          <div className="mt-12">
            <MadeWithDyad />
          </div>
        </footer>
      </div>
      
      <PWAInstallButton />
    </div>
  );
};

export default Index;