import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Zap, 
  Award, 
  Activity, 
  Flame, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Trade } from '../App';

interface LevelConfig {
  level: number;
  percentage: number;
}

interface StrategyAssistantProps {
  nextRecommendedTrade: { level: number; reason: string };
  cycleLength: number;
  setCycleLength: (len: number) => void;
  strategyDetails: { name: string; description: string; risk: string; color: string };
  levelCalculations: any[];
  handleAddTrade: (e: React.FormEvent | null, manualResult?: number, manualLevel?: number) => void;
  winRate: number;
  streak: { type: string; count: number };
  stats: {
    winsCount: number;
    lossesCount: number;
    avgResult: number;
    roiPercent: number;
    progressPercent: number;
  };
  levels: LevelConfig[];
  newTradeResult: string;
  setNewTradeResult: (val: string) => void;
  newTradeLevel: number;
  setNewTradeLevel: (val: number) => void;
  tradesCount: number;
}

export default function StrategyAssistant({
  nextRecommendedTrade,
  cycleLength,
  setCycleLength,
  strategyDetails,
  levelCalculations,
  handleAddTrade,
  winRate,
  streak,
  stats,
  levels,
  newTradeResult,
  setNewTradeResult,
  newTradeLevel,
  setNewTradeLevel,
  tradesCount,
}: StrategyAssistantProps) {
  
  // SVG progress circle variables
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  const currentLevelCalc = levelCalculations[nextRecommendedTrade.level - 1] || { stop: 0, take: 0 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* 1. Cockpit Central (2 Cols on large screens) */}
      <div className="lg:col-span-2 bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
        {/* Abstract background glowing shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col justify-between h-full gap-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2.5 rounded-2xl text-slate-950 shadow-lg shadow-emerald-500/10 shrink-0">
                <Zap size={20} className="fill-current animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Cockpit Matemático</span>
                <h3 className="text-xl font-extrabold tracking-tight">Assistente de Ciclos</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/50 self-start sm:self-auto">
              <span className="text-[10px] text-slate-400 font-bold uppercase pl-2.5 tracking-wider font-mono">Modo de Ciclos</span>
              <select 
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="bg-slate-950 border-none rounded-xl text-xs font-extrabold text-emerald-400 focus:ring-2 focus:ring-emerald-500/50 py-1.5 px-3"
              >
                <option value={2}>2 Níveis</option>
                <option value={3}>3 Níveis</option>
                <option value={4}>4 Níveis</option>
                <option value={9}>9 Níveis (Soros)</option>
              </select>
            </div>
          </div>

          {/* Central status card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-xs">
            <div className="md:col-span-4 flex flex-col justify-center space-y-1 md:border-r border-slate-800/80 pr-4">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">Próxima Recomendação</span>
              <h4 className="text-2xl font-black text-emerald-400 font-mono">NÍVEL {nextRecommendedTrade.level}</h4>
              <p className="text-xs text-slate-400 italic font-medium">{nextRecommendedTrade.reason}</p>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Prejuízo Controlado (Stop)</p>
                <p className="text-lg font-bold text-rose-400 font-mono mt-1">
                  - R$ {currentLevelCalc.stop.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Alvo Recomendado (Take)</p>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  + R$ {currentLevelCalc.take.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Core Click-to-register Operations */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleAddTrade(null, -currentLevelCalc.stop, nextRecommendedTrade.level)}
                className="flex-1 px-6 py-4.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/10 cursor-pointer"
              >
                <TrendingDown size={18} />
                <span>LANÇAR LOSS (NÍVEL {nextRecommendedTrade.level})</span>
              </button>
              <button 
                onClick={() => handleAddTrade(null, currentLevelCalc.take, nextRecommendedTrade.level)}
                className="flex-1 px-6 py-4.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                <TrendingUp size={18} />
                <span>LANÇAR WIN (NÍVEL {nextRecommendedTrade.level})</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center font-semibold">
              Um único clique registra o resultado e atualiza a estratégia imediatamente na nuvem.
            </p>
          </div>

          {/* Strategy Profile description */}
          <div className="border-t border-slate-800/80 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Estratégia Ativa:</span>
              <span className="font-extrabold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">{strategyDetails.name}</span>
              <span className={cn("text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded", "bg-slate-800/50", strategyDetails.color)}>
                Risco {strategyDetails.risk}
              </span>
            </div>
            <p className="text-slate-400 max-w-md text-left md:text-right leading-relaxed font-sans">
              {strategyDetails.description}
            </p>
          </div>

        </div>
      </div>

      {/* 2. Painel de Performance & Registro Manual (1 Col) */}
      <div className="flex flex-col gap-8">
        
        {/* Performance Win Rate Gauge */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center justify-between gap-4">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Métrica de Assertividade</span>
            <div>
              <p className="text-3xl font-black text-slate-800 font-mono tracking-tight">{winRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 font-medium">Taxa de Acertos</p>
            </div>
            
            {/* Streak indicator */}
            {streak.type !== 'none' && (
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-3xs",
                streak.type === 'win' 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-500/10" 
                  : "bg-rose-50 text-rose-700 border border-rose-500/10"
              )}>
                <Flame size={14} className={streak.type === 'win' ? "text-emerald-500 fill-current" : "text-rose-500 fill-current"} />
                <span>Racha: {streak.count} {streak.type === 'win' ? 'WINS' : 'LOSSES'}</span>
              </div>
            )}
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Back Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 fill-none"
                strokeWidth="8"
              />
              {/* Active Arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={cn(
                  "fill-none transition-all duration-1000 stroke-emerald-500",
                  winRate < 45 ? "stroke-rose-500" : winRate < 55 ? "stroke-amber-500" : "stroke-emerald-500"
                )}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Award size={20} className={cn(
                winRate < 45 ? "text-rose-500" : winRate < 55 ? "text-amber-500" : "text-emerald-500"
              )} />
            </div>
          </div>
        </div>

        {/* Registro Manual Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers size={16} className="text-slate-500" />
            <h4 className="font-extrabold text-slate-800 text-sm">Registro Personalizado</h4>
          </div>

          <form onSubmit={handleAddTrade} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nível</label>
                <select 
                  value={newTradeLevel}
                  onChange={(e) => setNewTradeLevel(Number(e.target.value))}
                  className="w-full bg-slate-50 hover:bg-slate-100/70 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  {levels.map(l => (
                    <option key={l.level} value={l.level}>{l.level}º Nível ({l.percentage}%)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resultado (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={newTradeResult}
                    onChange={(e) => setNewTradeResult(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/70 border-none rounded-xl pl-8 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Adicionar Operação</span>
            </button>
          </form>

          {/* Quick Stats list */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-slate-500 text-[10px] font-semibold">
            <div className="flex justify-between border-r border-slate-100 pr-3">
              <span>Total Operações</span>
              <span className="font-bold text-slate-700">{tradesCount}</span>
            </div>
            <div className="flex justify-between pl-1">
              <span>Média p/ Trade</span>
              <span className={cn("font-bold font-mono", stats.avgResult >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {stats.avgResult >= 0 ? '+' : ''}
                {stats.avgResult.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
