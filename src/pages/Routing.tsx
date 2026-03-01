"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Route, Loader2, Copy, Check, Smartphone, RefreshCw, AlertTriangle } from "lucide-react";
import { OfflineIndicator } from "@/components/offline-indicator";

type AddressState = {
  addresses: string;
  optimizedOrder: string[];
  loading: boolean;
  error: string | null;
  totalDistance: number | null;
  copied: boolean;
  failedAddresses: string[];
  processingProgress: number;
};

const initialState: AddressState = {
  addresses: "",
  optimizedOrder: [],
  loading: false,
  error: null,
  totalDistance: null,
  copied: false,
  failedAddresses: [],
  processingProgress: 0,
};

export default function Routing() {
  const [state, setState] = useState<AddressState>(initialState);

  const handleOptimize = async () => {
    setState((s) => ({ ...s, loading: true, error: null, totalDistance: null, failedAddresses: [], processingProgress: 0 }));
    try {
      const addresses = state.addresses
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean);
      if (addresses.length < 2) throw new Error("Insira pelo menos dois endereços.");
      
      const { optimizeRoute, calculateTotalDistance } = await import("@/lib/routeOptimizer");
      
      // Process addresses one by one to show progress
      const processedAddresses: string[] = [];
      const failedAddresses: string[] = [];
      
      for (let i = 0; i < addresses.length; i++) {
        const progress = ((i + 1) / addresses.length) * 50; // 50% for geocoding, 50% for optimization
        setState((s) => ({ ...s, processingProgress: Math.round(progress) }));
        
        try {
          const { geocode } = await import("@/lib/routeOptimizer");
          await geocode(addresses[i]);
          processedAddresses.push(addresses[i]);
        } catch (error) {
          failedAddresses.push(addresses[i]);
          console.warn(`Falha no endereço ${i + 1}:`, error);
        }
        
        // Delay de 1 segundo entre cada geocodificação para respeitar rate limit do Nominatim
        if (i < addresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setState((s) => ({ ...s, processingProgress: 75 }));
      
      if (failedAddresses.length > 0) {
        setState((s) => ({ 
          ...s, 
          loading: false, 
          failedAddresses,
          error: `${failedAddresses.length} endereços não puderam ser geocodificados. Verifique os formatos.`,
          processingProgress: 0
        }));
        return;
      }
      
      const ordered = await optimizeRoute(processedAddresses);
      const distance = await calculateTotalDistance(ordered);
      
      setState((s) => ({ 
        ...s, 
        optimizedOrder: ordered, 
        loading: false, 
        totalDistance: distance,
        processingProgress: 100
      }));
      toast.success("Rota otimizada com sucesso!");
      
      // Reset progress after a short delay
      setTimeout(() => setState((s) => ({ ...s, processingProgress: 0 })), 1000);
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message, processingProgress: 0 }));
      toast.error(err.message);
    }
  };

  const handleRetryFailed = async () => {
    if (state.failedAddresses.length === 0) return;
    
    setState((s) => ({ ...s, loading: true, error: null, failedAddresses: [], processingProgress: 0 }));
    
    try {
      const { optimizeRoute, calculateTotalDistance } = await import("@/lib/routeOptimizer");
      
      // Retry geocoding for failed addresses
      const processedAddresses: string[] = [];
      const newFailedAddresses: string[] = [];
      
      for (let i = 0; i < state.failedAddresses.length; i++) {
        const progress = 50 + ((i + 1) / state.failedAddresses.length) * 50;
        setState((s) => ({ ...s, processingProgress: Math.round(progress) }));
        
        try {
          const { geocode } = await import("@/lib/routeOptimizer");
          await geocode(state.failedAddresses[i]);
          processedAddresses.push(state.failedAddresses[i]);
        } catch (error) {
          newFailedAddresses.push(state.failedAddresses[i]);
          console.warn(`Falha no retry do endereço ${i + 1}:`, error);
        }
        
        // Delay entre tentativas
        if (i < state.failedAddresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (newFailedAddresses.length > 0) {
        setState((s) => ({ 
          ...s, 
          loading: false, 
          failedAddresses: newFailedAddresses,
          error: `${newFailedAddresses.length} endereços ainda não puderam ser geocodificados.`,
          processingProgress: 0
        }));
        return;
      }
      
      const ordered = await optimizeRoute(processedAddresses);
      const distance = await calculateTotalDistance(ordered);
      
      setState((s) => ({ 
        ...s, 
        optimizedOrder: ordered, 
        loading: false, 
        totalDistance: distance,
        processingProgress: 100
      }));
      toast.success("Rota otimizada com sucesso!");
      
      setTimeout(() => setState((s) => ({ ...s, processingProgress: 0 })), 1000);
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message, processingProgress: 0 }));
      toast.error(err.message);
    }
  };

  const handleExportGoogle = () => {
    if (state.optimizedOrder.length === 0) return;
    const waypoints = state.optimizedOrder.map(encodeURIComponent).join("|");
    const url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&waypoints=${waypoints}`;
    window.open(url, "_blank");
    toast.success("Abrindo Google Maps...");
  };

  const handleExportApple = () => {
    if (state.optimizedOrder.length === 0) return;
    const first = encodeURIComponent(state.optimizedOrder[0]);
    const rest = state.optimizedOrder.slice(1).map(encodeURIComponent).join("&daddr=");
    const url = `https://maps.apple.com/?q=${first}&daddr=${rest}`;
    window.open(url, "_blank");
    toast.success("Abrindo Apple Maps...");
  };

  const handleCopyToClipboard = async () => {
    if (state.optimizedOrder.length === 0) return;
    try {
      await navigator.clipboard.writeText(
        state.optimizedOrder.map((addr, i) => `${i + 1}. ${addr}`).join("\n")
      );
      setState((s) => ({ ...s, copied: true }));
      toast.success("Rota copiada para a área de transferência!");
      setTimeout(() => setState((s) => ({ ...s, copied: false })), 2000);
    } catch (err) {
      toast.error("Erro ao copiar rota");
    }
  };

  const handleClear = () => {
    setState(initialState);
    toast.info("Campos limpos");
  };

  const handleLoadExample = () => {
    const exampleAddresses = `Av. Paulista, 1000, São Paulo
Rua Augusta, 500, São Paulo
Praça da Sé, São Paulo
Parque Ibirapuera, São Paulo
Museu de Arte de São Paulo (MASP)`;
    setState((s) => ({ ...s, addresses: exampleAddresses }));
    toast.info("Exemplo carregado!");
  };

  const onChangeAddresses = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((s) => ({ ...s, addresses: e.target.value }));
  };

  const formatDistance = (km: number) => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)} km`;
    }
    return `${km.toFixed(0)} m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <OfflineIndicator />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <Route className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Roteirizador de Endereços
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Otimize sua rota com inteligência e exporte para Google Maps ou Apple Maps.
            Ideal para entregas, visitas comerciais e planejamento de viagens.
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>Entrada de Endereços</span>
            </CardTitle>
            <p className="text-blue-100 text-sm mt-2">
              Digite um endereço por linha. A rota será otimizada automaticamente.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={handleLoadExample}
                className="flex-1"
              >
                Carregar Exemplo
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                className="flex-1"
              >
                Limpar Tudo
              </Button>
            </div>

            <Textarea
              value={state.addresses}
              onChange={onChangeAddresses}
              placeholder="Exemplo:&#10;Av. Paulista, 1000, São Paulo&#10;Rua Augusta, 500, São Paulo&#10;Praça da Sé, São Paulo"
              className="min-h-[200px] text-base p-4 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              rows={8}
            />

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{state.addresses.split("\n").filter(a => a.trim()).length} endereços</span>
              {state.totalDistance && (
                <span className="font-medium text-blue-600">
                  Distância total: {formatDistance(state.totalDistance)}
                </span>
              )}
            </div>

            {state.processingProgress > 0 && state.processingProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Processando...</span>
                  <span>{state.processingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.processingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Button
              onClick={handleOptimize}
              disabled={state.loading || !state.addresses.trim()}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Otimizando rota...
                </>
              ) : (
                <>
                  <Route className="mr-2 h-5 w-5" />
                  Otimizar Rota
                </>
              )}
            </Button>

            {state.error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4 text-red-700">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <strong>Erro:</strong> {state.error}
                  </div>
                  {state.failedAddresses.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Endereços com problemas:</p>
                      <ul className="text-xs space-y-1">
                        {state.failedAddresses.map((addr, i) => (
                          <li key={i} className="bg-red-100 p-1 rounded">• {addr}</li>
                        ))}
                      </ul>
                      <Button
                        onClick={handleRetryFailed}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        disabled={state.loading}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Tentar novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {state.optimizedOrder.length > 0 && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Optimized Route Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Rota Otimizada</span>
                </CardTitle>
                <p className="text-green-100 text-sm mt-2">
                  Sequência recomendada para minimizar distância total
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <ol className="space-y-3">
                  {state.optimizedOrder.map((addr, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <span className="text-gray-800 pt-1">{addr}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleCopyToClipboard}
                    variant="outline"
                    className="flex-1"
                  >
                    {state.copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Lista
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportGoogle}
                    variant="default"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Google Maps
                  </Button>
                  <Button
                    onClick={handleExportApple}
                    variant="default"
                    className="flex-1 bg-gray-900 hover:bg-gray-800"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Apple Maps
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Dica para uso móvel:</p>
                    <p>
                      Ao abrir no Google Maps ou Apple Maps, você pode compartilhar a rota 
                      diretamente do seu aplicativo de mapas ou adicionar como destino 
                      manualmente para navegação passo a passo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Desenvolvido com inteligência artificial para otimização de rotas</p>
          <p className="mt-1">Usa OpenStreetMap para geocodificação • Sem armazenamento de dados</p>
        </div>
      </div>
    </div>
  );
}