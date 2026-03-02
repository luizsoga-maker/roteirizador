"use client";

import { History, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryItem {
  id: string;
  date: string;
  addresses: string;
  count: number;
}

interface RouteHistoryProps {
  history: HistoryItem[];
  onSelect: (addresses: string) => void;
  onClear: () => void;
}

export const RouteHistory = ({ history, onSelect, onClear }: RouteHistoryProps) => {
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
          <History className="w-4 h-4" /> Histórico Recente
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
          Limpar
        </Button>
      </div>
      <ScrollArea className="h-[150px] rounded-md border border-slate-100 bg-white p-2">
        <div className="space-y-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.addresses)}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors group flex items-center justify-between border border-transparent hover:border-slate-200"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {item.count} endereços
                </p>
                <p className="text-[10px] text-slate-400">{item.date}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};