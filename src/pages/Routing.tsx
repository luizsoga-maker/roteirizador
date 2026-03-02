"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Route, Loader2, Copy, Check, Smartphone, RefreshCw, AlertTriangle, Trash2, Map as MapIcon } from "lucide-react";
import { OfflineIndicator } from "@/components/offline-indicator";
import { optimizeRoute, calculateDistance, Location } from "@/lib/routeOptimizer";
import MapComponent from "@/components/MapComponent";

type AddressState = {
  addresses: string;
  optimizedLocations: Location[];
  loading: boolean;
  error: string | null;
  totalDistance: number | null;
  copied: boolean;
  failedAddresses: string[];
  processingProgress: number;
};

const initialState: AddressState = {
  addresses: "",
  optimizedLocations: [],
  loading: false,
  error: null,
  totalDistance: null,
  copied: false,
  failedAddresses: [],
  processingProgress: 0,
};

export default function Routing(): React.ReactElement {
  const [state, setState] = useState<AddressState>(initialState);

  const handleOptimize = async () => {
    const rawAddresses = state.addresses
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);
    
    if (rawAddresses.length < 2) {
      toast.error("Insira pelo menos dois endereços.");
      return;
    }

    setState((s) => ({
      ...s,
      loading: true,
      error: null,
      totalDistance: null,
      failedAddresses: [],
      processingProgress: 10,
    }));

    try {
      const ordered = await optimizeRoute(rawAddresses);
      const distance = calculateDistance(ordered);

      setState((s) => ({
        ...s,
        optimizedLocations: ordered,
        loading: false,
        totalDistance: distance,
        processingProgress: 100,
      }));

      toast.success("Rota otimizada com sucesso!");
      setTimeout(() => setState((s) => ({ ...s, processingProgress: 0 })), 1000);
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err.message,
        processingProgress: 0,
      }));
      toast.error(err.message);
    }
  };

  const handleExportGoogle = () => {
    if (state.optimizedLocations.length === 0) return;
    
    const origin = encodeURIComponent(state.optimizedLocations[0].addr);
    const destination = encodeURIComponent(state.optimizedLocations[state.optimizedLocations.length - 1].addr);
    const waypoints = state.optimizedLocations.slice(1, -1).map(loc => encodeURIComponent(loc.addr)).join("|");

    let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${origin}&destination=${destination}`;
    if (waypoints) url += `&waypoints=${waypoints}`;

    window.open(url, "_blank");
  };

  const handleExportApple = () => {
    if (state.optimizedLocations.length === 0) return;
    const encodedAddresses = state.optimizedLocations.map((loc) => encodeURIComponent(loc.addr));
    const url = `https://maps.apple.com/?q=${encodedAddresses[0]}${encodedAddresses.slice(1).map((addr) => `&daddr=${addr}`).join("")}`;
    window.open(url, "_blank");
  };

  const handleCopyToClipboard = async () => {
    if (state.optimizedLocations.length === 0) return;
    try {
      await navigator.clipboard.writeText(
        state.optimizedLocations.map((loc, i) => `${i + 1}. ${loc.addr}`).join("\n")
      );
      setState((s) => ({ ...s, copied: true }));
      toast.success("Rota copiada!");
      setTimeout(() => setState((s) => ({ ...s, copied: false })), 2000);
    } catch (err) {
      toast.error("Erro ao copiar");
    }
  };

  const handleClear = () => {
    setState(initialState);
  };

  const handleLoadExample = () => {
    const exampleAddresses = `Rua Barreto Leme, 1450 - Centro - Campinas/SP
Av Francisco Glicério, 890 - Centro - Campinas/SP
Rua Regente Feijó, 320 - Centro - Campinas/SP
Rua Conceição, 780 - Centro - Campinas/SP`;
    setState((s) => ({ ...s, addresses: exampleAddresses }));
  };

  const formatDistance = (km: number) => {
    return km >= 1 ? `${km.toFixed(2)} km` : `${(km * 1000).toFixed(0)} m`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <OfflineIndicator />
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Route className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Roteirizador</h1>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Endereços
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleLoadExample} className="flex-1">
                  Exemplo
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
                  Limpar
                </Button>
              </div>

              <Textarea
                value={state.addresses}
                onChange={(e) => setState(s => ({ ...s, addresses: e.target.value }))}
                placeholder="Um endereço por linha..."
                className="min-h-[250px] resize-none focus-visible:ring-blue-500"
              />

              {state.processingProgress > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${state.processingProgress}%` }}
                  ></div>
                </div>
              )}

              <Button
                onClick={handleOptimize}
                disabled={state.loading || !state.addresses.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
              >
                {state.loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Otimizando...</>
                ) : (
                  <><Route className="mr-2 h-5 w-5" /> Otimizar Rota</>
                )}
              </Button>
            </CardContent>
          </Card>

          {state.optimizedLocations.length > 0 && (
            <Card className="bg-blue-600 text-white border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-sm">Distância Estimada</p>
                    <p className="text-3xl font-bold">{formatDistance(state.totalDistance || 0)}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Zap className="w-8 h-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Map & Results */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="overflow-hidden shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-600">
                <MapIcon className="w-4 h-4" />
                Visualização da Rota
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MapComponent locations={state.optimizedLocations} />
            </CardContent>
          </Card>

          {state.optimizedLocations.length > 0 && (
            <Card className="shadow-sm border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Sequência Otimizada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {state.optimizedLocations.map((loc, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <span className="text-sm text-slate-700 leading-tight">{loc.addr}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <Button variant="outline" onClick={handleCopyToClipboard} className="w-full">
                    {state.copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copiar
                  </Button>
                  <Button onClick={handleExportGoogle} className="w-full bg-slate-800 hover:bg-slate-900">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Google
                  </Button>
                  <Button onClick={handleExportApple} className="w-full bg-slate-800 hover:bg-slate-900">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Apple
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}