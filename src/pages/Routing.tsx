"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Route, Loader2, Copy, Check, 
  Smartphone, Trash2, Map as MapIcon, 
  Navigation, AlertCircle, Printer, RotateCcw,
  MessageCircle, Share2, ArrowLeft, MapPin,
  RefreshCw, Edit3, ListOrdered
} from "lucide-react";
import { OfflineIndicator } from "@/components/offline-indicator";
import { optimizeRoute, calculateTotalDistance, Location } from "@/lib/routeOptimizer";
import MapComponent from "@/components/MapComponent";
import { RouteHistory } from "@/components/RouteHistory";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Logo from "@/components/Logo";

export default function Routing() {
  const [destinations, setDestinations] = useState("");
  const [startLocation, setStartLocation] = useState<string | null>(null);
  const [manualStart, setManualStart] = useState("");
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [returnToStart, setReturnToStart] = useState(false);
  const [optimizedLocations, setOptimizedLocations] = useState<Location[]>([]);
  const [failedAddresses, setFailedAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Processa a string de destinos para identificar endereços individuais
  const processedDestinations = useMemo(() => {
    if (!destinations.trim()) return [];
    
    // Divide por quebra de linha, ponto e vírgula ou ponto final seguido de espaço
    // Também remove numerações comuns no início da linha (ex: "1. ", "2- ", "(3) ")
    return destinations
      .split(/\n|;|(?<=\D)\.(?=\s|$)/) 
      .map(addr => addr.replace(/^\s*[\d\(\)\-\.\s]+/, '').trim())
      .filter(addr => addr.length > 5); // Filtra entradas muito curtas que provavelmente não são endereços
  }, [destinations]);

  const handleFetchLocation = useCallback((highAccuracy = true) => {
    if (!navigator.geolocation) {
      const msg = "Seu navegador não suporta geolocalização.";
      setLocationError(msg);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: highAccuracy,
      timeout: 20000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        setStartLocation(coords);
        setManualStart("");
        setIsEditingStart(false);
        setIsLocating(false);
        setLocationError(null);
        toast.success("Localização detectada!");
      },
      (error) => {
        console.error("Erro de localização:", error);
        if (highAccuracy) {
          handleFetchLocation(false);
          return;
        }
        setIsLocating(false);
        let errorMsg = "Não conseguimos detectar sua posição automaticamente.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Acesso à localização negado. Por favor, autorize nas configurações.";
        }
        setLocationError(errorMsg);
        setIsEditingStart(true);
      },
      options
    );
  }, []);

  useEffect(() => {
    handleFetchLocation(true);
    const savedDestinations = localStorage.getItem("roteirizador_destinations");
    if (savedDestinations) setDestinations(savedDestinations);
    const savedHistory = localStorage.getItem("roteirizador_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [handleFetchLocation]);

  useEffect(() => {
    localStorage.setItem("roteirizador_destinations", destinations);
  }, [destinations]);

  const saveToHistory = (destList: string) => {
    const newItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('pt-BR'),
      addresses: destList,
      count: processedDestinations.length
    };
    const newHistory = history.filter(h => h.addresses !== destList).slice(0, 9);
    const updatedHistory = [newItem, ...newHistory];
    setHistory(updatedHistory);
    localStorage.setItem("roteirizador_history", JSON.stringify(updatedHistory));
  };

  const handleOptimize = async () => {
    const finalStart = isEditingStart ? manualStart : startLocation;

    if (!finalStart || finalStart.trim().length < 3) {
      toast.error("Por favor, informe um ponto de partida válido.");
      setIsEditingStart(true);
      return;
    }

    if (processedDestinations.length < 1) {
      toast.error("Insira pelo menos um destino válido.");
      return;
    }

    const fullList = [finalStart, ...processedDestinations];

    setLoading(true);
    setProgress(0);
    setFailedAddresses([]);

    try {
      const result = await optimizeRoute(fullList, returnToStart, (p) => setProgress(p));
      setOptimizedLocations(result.locations);
      setFailedAddresses(result.failed);
      setTotalDistance(calculateTotalDistance(result.locations));
      
      if (result.locations.length > 0) saveToHistory(destinations);

      if (result.failed.length > 0) {
        toast.warning(`${result.failed.length} endereço(s) não encontrados.`);
      } else {
        toast.success("Rota otimizada com sucesso!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar a rota.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'google' | 'apple' | 'whatsapp') => {
    if (optimizedLocations.length === 0) return;

    if (type === 'whatsapp') {
      const text = `*Minha Rota Otimizada*\n\n` + 
        optimizedLocations.map((l, i) => `${i + 1}. ${l.addr}`).join("\n") +
        `\n\n*Distância total:* ${totalDistance?.toFixed(1)} km\n` +
        `Gerado por Roteirizador de Endereços`;
      
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
      return;
    }

    const origin = encodeURIComponent(optimizedLocations[0].addr);
    const destination = encodeURIComponent(optimizedLocations[optimizedLocations.length - 1].addr);
    const waypoints = optimizedLocations.slice(1, -1).map(l => encodeURIComponent(l.addr)).join("|");

    const url = type === 'google' 
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`
      : `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <OfflineIndicator />
      
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-4 py-3 print:hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </a>
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-lg text-slate-900 hidden sm:inline-block">Roteirizador</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDestinations("")} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
              <Trash2 className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Limpar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <div className="h-1.5 bg-blue-600" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Configurar Rota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ponto de Partida */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ponto de Partida</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditingStart(!isEditingStart)}
                    className="h-6 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                  >
                    {isEditingStart ? "Usar GPS" : "Digitar Endereço"}
                  </Button>
                </div>

                {isEditingStart ? (
                  <div className="relative">
                    <Input 
                      value={manualStart}
                      onChange={(e) => setManualStart(e.target.value)}
                      placeholder="Ex: Rua Exemplo, 123, São Paulo"
                      className="h-12 pl-10 rounded-2xl border-slate-100 bg-white focus-visible:ring-blue-500"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${locationError ? 'bg-red-50 border-red-100' : 'bg-blue-50/50 border-blue-100/50'}`}>
                    <div className={`p-2 rounded-xl ${isLocating ? 'bg-blue-100 animate-pulse' : locationError ? 'bg-red-500' : 'bg-blue-600'}`}>
                      <MapPin className={`w-4 h-4 ${isLocating ? 'text-blue-600' : 'text-white'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${locationError ? 'text-red-700' : 'text-slate-700'}`}>
                        {isLocating ? "Obtendo localização..." : startLocation ? "Sua Localização Atual" : "Localização não disponível"}
                      </p>
                      <p className={`text-[10px] truncate ${locationError ? 'text-red-500' : 'text-slate-500'}`}>
                        {locationError || startLocation || "Clique no botão ao lado para tentar novamente"}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleFetchLocation(true)}
                      disabled={isLocating}
                      className={`rounded-full ${locationError ? 'hover:bg-red-100 text-red-600' : 'hover:bg-blue-100 text-blue-600'}`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                )}
              </div>

              {/* Destinos */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destinos (Paradas)</Label>
                  {processedDestinations.length > 0 && (
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-in zoom-in">
                      {processedDestinations.length} {processedDestinations.length === 1 ? 'ENDEREÇO' : 'ENDEREÇOS'} DETECTADOS
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <Textarea
                    value={destinations}
                    onChange={(e) => setDestinations(e.target.value)}
                    placeholder="Cole sua lista aqui (um por linha, ou separados por vírgula/ponto)"
                    className="min-h-[200px] font-mono text-sm resize-none focus-visible:ring-blue-500 border-slate-100 bg-slate-50/50 group-hover:bg-white transition-all rounded-2xl"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl z-10">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {progress}%
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 mt-3">Otimizando sua rota...</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 italic px-1">
                  Dica: Você pode colar endereços do Excel, WhatsApp ou Bloco de Notas.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <Label htmlFor="return-start" className="text-sm font-bold text-slate-700 cursor-pointer">Viagem de Ida e Volta</Label>
                    <p className="text-[11px] text-slate-500">Retornar à sua localização</p>
                  </div>
                </div>
                <Switch id="return-start" checked={returnToStart} onCheckedChange={setReturnToStart} />
              </div>

              <Button 
                onClick={handleOptimize} 
                disabled={loading || processedDestinations.length === 0 || isLocating} 
                className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98] rounded-2xl"
              >
                {loading ? "Calculando..." : "Gerar Rota Otimizada"}
              </Button>

              <RouteHistory 
                history={history} 
                onSelect={(addr) => setDestinations(addr)} 
                onClear={() => { setHistory([]); localStorage.removeItem("roteirizador_history"); }} 
              />
            </CardContent>
          </Card>

          {failedAddresses.length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-none shadow-sm rounded-2xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Atenção</AlertTitle>
              <AlertDescription className="text-xs opacity-90">
                Não conseguimos localizar {failedAddresses.length} endereço(s). Verifique a grafia:
                <div className="mt-2 space-y-1">
                  {failedAddresses.map((addr, i) => <div key={i} className="bg-white/50 p-1.5 rounded-xl truncate border border-red-100/50">{addr}</div>)}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column: Map & Results */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="overflow-hidden border-none shadow-sm rounded-3xl print:hidden">
            <div className="bg-slate-100 h-[400px] relative">
              <MapComponent locations={optimizedLocations} />
            </div>
          </Card>

          {optimizedLocations.length > 0 ? (
            <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-5 bg-white">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Sua Rota</CardTitle>
                  {totalDistance && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                        {totalDistance.toFixed(1)} km total
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{optimizedLocations.length} paradas</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 print:hidden">
                  <Button variant="outline" size="icon" className="rounded-full border-slate-100" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="rounded-full border-slate-100" onClick={() => {
                    navigator.clipboard.writeText(optimizedLocations.map((l, i) => `${i + 1}. ${l.addr}`).join("\n"));
                    setCopied(true);
                    toast.success("Copiado para área de transferência!");
                    setTimeout(() => setCopied(false), 2000);
                  }}>{copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {optimizedLocations.map((loc, i) => (
                    <div key={i} className="flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-colors group">
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm
                        ${i === 0 ? 'bg-emerald-500 text-white' : 
                          i === optimizedLocations.length - 1 ? 'bg-rose-500 text-white' : 
                          'bg-white border border-slate-100 text-slate-600 group-hover:border-blue-200 group-hover:text-blue-600'}
                      `}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-semibold leading-tight mb-1">{loc.addr}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-lg ${
                            i === 0 ? 'bg-emerald-50 text-emerald-600' : 
                            i === optimizedLocations.length - 1 ? 'bg-rose-50 text-rose-600' : 
                            'bg-slate-50 text-slate-400'
                          }`}>
                            {i === 0 ? 'Ponto de Partida' : i === optimizedLocations.length - 1 ? 'Destino Final' : `Parada ${i}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 bg-slate-50/30 border-t border-slate-50 space-y-3 print:hidden">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Abrir navegação em</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button onClick={() => handleExport('google')} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-100 shadow-sm h-12 font-bold rounded-2xl">
                      <img src="https://www.google.com/images/branding/product/ico/maps15_b_64dp.png" className="w-5 h-5 mr-2" alt="" />
                      Google Maps
                    </Button>
                    <Button onClick={() => handleExport('apple')} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-100 shadow-sm h-12 font-bold rounded-2xl">
                      <Smartphone className="w-5 h-5 mr-2 text-slate-400" />
                      Apple Maps
                    </Button>
                    <Button onClick={() => handleExport('whatsapp')} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/30 h-12 font-bold rounded-2xl">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-white/50">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <MapIcon className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sua rota aparecerá aqui</h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Insira os destinos no formulário ao lado e clique em gerar para ver o melhor caminho a partir da sua posição.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}