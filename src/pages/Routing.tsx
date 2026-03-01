"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type AddressState = {
  addresses: string;
  optimizedOrder: string[];
  loading: boolean;
  error: string | null;
};

const initialState: AddressState = {
  addresses: "",
  optimizedOrder: [],
  loading: false,
  error: null,
};

export default function Routing() {
  const [state, setState] = useState<AddressState>(initialState);

  const handleOptimize = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const addresses = state.addresses
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean);
      if (addresses.length < 2) throw new Error("Insira pelo menos dois endereços.");
      const { optimizeRoute } = await import "@/lib/routeOptimizer");
      const ordered = await optimizeRoute(addresses);
      setState((s) => ({ ...s, optimizedOrder: ordered, loading: false }));
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  };

  const handleExportGoogle = () => {
    if (state.optimizedOrder.length === 0) return;
    const waypoints = state.optimizedOrder.map(encodeURIComponent).join("|");
    const url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&waypoints=${waypoints}`;
    window.open(url, "_blank");
  };

  const handleExportApple = () => {
    if (state.optimizedOrder.length === 0) return;
    const first = encodeURIComponent(state.optimizedOrder[0]);
    const rest = state.optimizedOrder.slice(1).map(encodeURIComponent).join("&daddr=");
    const url = `https://maps.apple.com/?q=${first}&daddr=${rest}`;
    window.open(url, "_blank");
  };

  const onChangeAddresses = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((s) => ({ ...s, addresses: e.target.value }));
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Roteirização de Endereços</h1>
        <p className="text-gray-600 mb-4">
          Insira uma lista de endereços (um por linha) e gere a rota otimizada.
        </p>

        <textarea
          value={state.addresses}
          onChange={onChangeAddresses}
          placeholder="Exemplo: Rua X, 123\nAv. Y, 456\n..."
          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
        />

        <Button
          variant="primary"
          onClick={handleOptimize}
          className="mt-4 w-full"
          disabled={state.loading}
        >
          {state.loading ? "Processando..." : "Otimizar Rota"}
        </Button>

        {state.error && (
          <Card className="mt-4">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-600">Erro</CardTitle>
            </CardHeader>
            <CardContent className="text-red-600">{state.error}</CardContent>
          </Card>
        )}

        {state.optimizedOrder.length > 0 && (
          <div className="mt-6">
            <Card className="bg-gray-50">
              <CardHeader className="bg-blue-50">
                <CardTitle>Rota Otimizada</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1">
                  {state.optimizedOrder.map((addr, i) => (
                    <li key={i} className="text-lg">
                      {i + 1}. {addr}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <div className="mt-4 flex gap-2">
              <Button variant="default" onClick={handleExportGoogle}>
                Exportar para Google Maps
              </Button>
              <Button variant="default" onClick={handleExportApple}>
                Exportar para Apple Maps
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}