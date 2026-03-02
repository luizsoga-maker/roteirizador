"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  MapPin, Route, Loader2, Copy, Check, 
  Smartphone, Trash2, Map as MapIcon, 
  Navigation, Save, AlertCircle, Printer
} from "lucide-react";
import { OfflineIndicator } from "@/components/offline-indicator";
import { optimizeRoute, calculateTotalDistance, Location } from "@/lib/routeOptimizer";
import MapComponent from "@/components/MapComponent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Routing() {
  const [addresses, setAddresses] = useState("");
  const [optimizedLocations, setOptimizedLocations] = useState<Location[]>([]);
  const [failedAddresses, setFailedAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Load saved addresses on mount
  useEffect(() => {
    const saved = localStorage.getItem("roteirizador_addresses");
    if (saved) setAddresses(saved);
  }, []);

  // Save addresses on change
  useEffect(() => {
    localStorage.setItem("roteirizador_addresses", addresses);
  }, [addresses]);

  const handleOptimize = async () => {
    const list = addresses.split("\n").map(a => a.trim()).filter(Boolean);
    
    if (list.length < 2) {
      toast.error("Insira pelo menos dois endereços para criar uma rota.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setFailedAddresses([]);

    try {
      const result = await optimizeRoute(list, (p) => setProgress(p));
      
      setOptimizedLocations(result.locations);
      setFailedAddresses(result.failed);
      setTotalDistance(calculateTotalDistance(result.locations));

      if (result.failed.length > 0) {
        toast.warning(`${result.failed.length} endereço(s) não foram encontrados.`);
      } else {
        toast.success("Rota otimizada com sucesso!");
      }
    } catch (err) {
      toast.error("Ocorreu um erro ao processar a rota.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    toast.info("Obtendo sua localização...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        setAddresses(prev => loc + (prev ? "\n" + prev : ""));
        toast.success("Localização adicionada como ponto de partida!");
      },
      () => toast.error("Não foi possível obter sua localização.")
    );
  };

  const handleExport = (type: 'google' | 'apple') => {
    if (optimizedLocations.length === 0) return;
    
    const origin = encodeURIComponent(optimizedLocations[0].addr);
    const destination = encodeURIComponent(optimizedLocations[optimizedLocations.length - 1].addr);
    const waypoints = optimizedLocations.slice(1, -1).map(l => encodeURIComponent(l.addr)).join("|");

    if (type === 'google') {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
      window.open(url, "_blank");
    } else {
      const url = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`;
      window.open(url, "_blank");
    }
  };

  const handleCopy = () => {
    const text = optimizedLocations.map((l, i) => `${i + 1}. ${l.addr}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Lista copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <OfflineIndicator />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 print:hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Route className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Roteirizador</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddresses("")} className="text-slate-500">
              <Trash2 className="w-4 h-4 mr-2" /> Limpar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Lista de Endereços</span>
                <Button variant="outline" size="sm" onClick={handleUseMyLocation} className="h-8 text-xs">
                  <Navigation className="w-3 h-3 mr-1" /> Minha Posição
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                  placeholder="Ex: Rua Exemplo, 123, São Paulo&#10;Av. Paulista, 1000&#10;..."
                  className="min-h-[300px] font-mono text-sm resize-none focus-visible:ring-blue-500 border-slate-200"
                />
                {loading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-md">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                    <span className="text-sm font-medium text-slate-700">Buscando coordenadas...</span>
                    <span className="text-xs text-slate-500 mt-1">{progress}%</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleOptimize} 
                disabled={loading || !addresses.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                {loading ? "Processando..." : "Otimizar Rota"}
              </Button>

              <p className="text-[11px] text-slate-400 text-center">
                Dica: Coloque o ponto de partida na primeira linha.
              </p>
            </CardContent>
          </Card>

          {failedAddresses.length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-red-100">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Endereços não encontrados</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-xs mt-1 opacity-80">
                  {failedAddresses.map((addr, i) => (
                    <li key={i} className="truncate">{addr}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 space-y-6">
          {/* Map Card */}
          <Card className="overflow-hidden border-none shadow-sm print:hidden">
            <div className="bg-slate-100 h-[400px] relative">
              <MapComponent locations={optimizedLocations} />
            </div>
          </Card>

          {/* Route List Card */}
          {optimizedLocations.length > 0 && (
            <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-lg">Sequência da Rota</CardTitle>
                  {totalDistance && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      Distância total aprox: <span className="font-semibold text-blue-600">{totalDistance.toFixed(1)} km</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 print:hidden">
                  <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopy} title="Copiar lista">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {optimizedLocations.map((loc, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                      <div className={`
                        flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                        ${i === 0 ? 'bg-green-100 text-green-700' : 
                          i === optimizedLocations.length - 1 ? 'bg-red-100 text-red-700' : 
                          'bg-blue-100 text-blue-700'}
                      `}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium truncate">{loc.addr}</p>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                          {i === 0 ? 'Início' : i === optimizedLocations.length - 1 ? 'Fim' : `Parada ${i}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3 print:hidden">
                  <Button onClick={() => handleExport('google')} className="bg-slate-900 hover:bg-black text-white">
                    <Smartphone className="w-4 h-4 mr-2" /> Google Maps
                  </Button>
                  <Button onClick={() => handleExport('apple')} className="bg-slate-900 hover:bg-black text-white">
                    <Smartphone className="w-4 h-4 mr-2" /> Apple Maps
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {optimizedLocations.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <MapIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Nenhuma rota gerada</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2">
                Insira os endereços al lado e clique em "Otimizar Rota" para visualizar o trajeto.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}