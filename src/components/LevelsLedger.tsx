import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Percent,
  TrendingUp as TrendingUpIcon,
  LayoutGrid,
  BarChart4,
  Briefcase
} from 'lucide-react';
import { 
  RadialBarChart, 
  RadialBar, 
  PolarGrid, 
  Legend, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';

interface LevelCalc {
  level: number;
  percentage: number;
  stop: number;
  take: number;
  stopInitial: number;
  takeInitial: number;
  netResult: number;
  winsNeeded: number;
  isHighRisk: boolean;
}

interface LevelsLedgerProps {
  levelCalculations: LevelCalc[];
  levelsView: 'table' | 'chart';
  setLevelsView: (view: 'table' | 'chart') => void;
  feesPercentage: number;
  setFeesPercentage: (fees: number) => void;
  riskRewardRatio: number;
  setRiskRewardRatio: (ratio: number) => void;
  isEditingLevels: boolean;
  updateLevelPercentage: (level: number, percentage: string) => void;
  handleAddTrade: (e: React.FormEvent | null, manualResult?: number, manualLevel?: number) => void;
  capital: number;
  currentBalance: number;
}

export default function LevelsLedger({
  levelCalculations,
  levelsView,
  setLevelsView,
  feesPercentage,
  setFeesPercentage,
  riskRewardRatio,
  setRiskRewardRatio,
  isEditingLevels,
  updateLevelPercentage,
  handleAddTrade,
  capital,
  currentBalance,
}: LevelsLedgerProps) {

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      
      {/* Header with tools */}
      <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-900 text-white flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-400" />
              <span>Gestão de Níveis Matemáticos</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">Dimensionamento de lotes e progressão de risco</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/60 self-start">
            <button 
              onClick={() => setLevelsView('table')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider transition-all cursor-pointer",
                levelsView === 'table' ? "bg-slate-950 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
            >
              TABELA
            </button>
            <button 
              onClick={() => setLevelsView('chart')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider transition-all cursor-pointer",
                levelsView === 'chart' ? "bg-slate-950 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
            >
              GRÁFICO
            </button>
          </div>
        </div>

        {/* Configurations inline */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-semibold">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Taxas Operacionais</span>
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 rounded-xl">
              <input 
                type="number"
                step="0.01"
                value={feesPercentage}
                onChange={(e) => setFeesPercentage(Number(e.target.value))}
                className="w-12 bg-transparent border-none p-0 text-xs font-bold text-white focus:ring-0"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Proporção Risco:Retorno</span>
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 rounded-xl">
              <span className="text-slate-400">1 :</span>
              <input 
                type="number"
                step="0.1"
                value={riskRewardRatio}
                onChange={(e) => setRiskRewardRatio(Number(e.target.value))}
                className="w-10 bg-transparent border-none p-0 text-xs font-bold text-white focus:ring-0"
              />
            </div>
          </div>

          {isEditingLevels && (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase animate-pulse border border-emerald-500/30">
              <AlertCircle size={12} />
              <span>Modo Edição Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {levelsView === 'table' ? (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4 font-mono font-extrabold w-[200px] border-r border-slate-100">Parâmetro / Nível</th>
                {levelCalculations.map(l => (
                  <th key={l.level} className="px-5 py-4 text-center min-w-[120px] border-r border-slate-100 last:border-none">
                    {l.level}º NÍVEL
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-slate-700">
              
              {/* Risk Percentage Row */}
              <tr className="border-b border-slate-100 bg-slate-50/30 font-mono">
                <td className="px-6 py-4 font-extrabold text-slate-800 border-r border-slate-100">Risco por Trade (%)</td>
                {levelCalculations.map(l => (
                  <td key={l.level} className={cn(
                    "px-5 py-4 text-center border-r border-slate-100 last:border-none",
                    l.isHighRisk && "text-rose-600 bg-rose-500/5"
                  )}>
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {isEditingLevels ? (
                        <div className="flex items-center justify-center gap-1 bg-white border border-slate-200 shadow-3xs px-2 py-1 rounded-lg">
                          <input 
                            type="number"
                            step="0.01"
                            value={l.percentage}
                            onChange={(e) => updateLevelPercentage(l.level, e.target.value)}
                            className="w-12 bg-transparent border-none p-0 text-center text-slate-800 text-xs font-bold focus:ring-0"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {l.isHighRisk && <AlertCircle size={12} className="text-rose-500 animate-pulse" />}
                          <span className="font-bold text-slate-800">{l.percentage.toFixed(2)}%</span>
                        </div>
                      )}
                      {l.isHighRisk && !isEditingLevels && (
                        <span className="text-[8px] uppercase tracking-wide px-1.5 py-0.2 bg-rose-500/10 text-rose-700 rounded-sm font-black">Risco Alto</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Stop Loss Row */}
              <tr className="border-b border-slate-100 hover:bg-rose-500/[0.01] transition-colors group">
                <td className="px-6 py-4 font-extrabold text-rose-600 border-r border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span>Stop Loss (Perda)</span>
                    <span className="text-[9px] font-normal text-rose-400">Clique para lançar perda</span>
                  </div>
                  <TrendingDown size={14} className="text-rose-400" />
                </td>
                {levelCalculations.map(l => (
                  <td key={l.level} className="px-5 py-4 text-center font-mono text-rose-600 border-r border-slate-100 last:border-none relative">
                    <button 
                      onClick={() => handleAddTrade(null, -l.stop, l.level)}
                      className="w-full h-full absolute inset-0 opacity-0 hover:opacity-100 bg-rose-500/5 transition-opacity flex items-center justify-center cursor-pointer font-bold text-[10px] text-rose-600 gap-1"
                      title="Registrar LOSS deste nível"
                    >
                      <TrendingDown size={14} /> Lançar Loss
                    </button>
                    R$ {l.stop.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Take Profit Row */}
              <tr className="border-b border-slate-100 hover:bg-emerald-500/[0.01] transition-colors group">
                <td className="px-6 py-4 font-extrabold text-emerald-600 border-r border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span>Take Profit (Ganho)</span>
                    <span className="text-[9px] font-normal text-emerald-400">Clique para lançar ganho</span>
                  </div>
                  <TrendingUp size={14} className="text-emerald-400" />
                </td>
                {levelCalculations.map(l => (
                  <td key={l.level} className="px-5 py-4 text-center font-mono text-emerald-600 border-r border-slate-100 last:border-none relative">
                    <button 
                      onClick={() => handleAddTrade(null, l.take, l.level)}
                      className="w-full h-full absolute inset-0 opacity-0 hover:opacity-100 bg-emerald-500/5 transition-opacity flex items-center justify-center cursor-pointer font-bold text-[10px] text-emerald-600 gap-1"
                      title="Registrar WIN deste nível"
                    >
                      <TrendingUp size={14} /> Lançar Win
                    </button>
                    R$ {l.take.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Stop / Take Fixo (Capital Inicial) Row */}
              <tr className="border-b border-slate-100 bg-slate-50/40 hover:bg-slate-100/40 transition-colors">
                <td className="px-6 py-4 font-extrabold text-slate-700 border-r border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs">Stop / Take Fixo</span>
                    <span className="text-[9px] font-normal text-slate-400">Ref: Capital Inicial (R$ {capital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                </td>
                {levelCalculations.map(l => (
                  <td key={l.level} className="px-5 py-4 text-center border-r border-slate-100 last:border-none">
                    <div className="flex flex-col gap-1 items-center justify-center font-mono text-[10px]">
                      <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50">
                        S: R$ {l.stopInitial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                        T: R$ {l.takeInitial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Stop / Take Dinâmico (Capital Atual) Row */}
              <tr className="border-b border-slate-100 bg-emerald-50/[0.05] hover:bg-emerald-50/10 transition-colors">
                <td className="px-6 py-4 font-extrabold text-emerald-800 border-r border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs">Stop / Take Dinâmico</span>
                    <span className="text-[9px] font-normal text-slate-500">Ref: Capital Atual (R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                </td>
                {levelCalculations.map(l => (
                  <td key={l.level} className="px-5 py-4 text-center border-r border-slate-100 last:border-none">
                    <div className="flex flex-col gap-1 items-center justify-center font-mono text-[10px]">
                      <span className="font-bold text-rose-700 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200/50">
                        S: R$ {l.stop.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200/50">
                        T: R$ {l.take.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Net Result (Cumulative) */}
              <tr className="border-b border-slate-100 bg-amber-500/[0.02] font-extrabold">
                <td className="px-6 py-4 text-amber-700 border-r border-slate-100">Retorno Líquido Acum.</td>
                {levelCalculations.map(l => (
                  <td key={l.level} className="px-5 py-4 text-center font-mono text-slate-800 border-r border-slate-100 last:border-none">
                    R$ {l.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Wins Needed Row */}
              <tr className="bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-500 border-r border-slate-100 uppercase tracking-tighter text-[9px]">
                  Vitórias p/ Bater Meta
                </td>
                {levelCalculations.map(l => (
                  <td key={l.level} className="px-5 py-4 text-center font-extrabold text-slate-600 border-r border-slate-100 last:border-none">
                    {l.winsNeeded} {l.winsNeeded === 1 ? 'operação' : 'operações'}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 h-[340px] flex items-center justify-center bg-slate-50/30">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="100%" 
              barSize={12} 
              data={levelCalculations.map((l, i) => ({
                name: `${l.level}º Nível`,
                risk: l.percentage,
                fill: l.percentage > 10 ? '#f43f5e' : `hsl(${155 - (i * 14)}, 70%, 48%)`
              }))}
            >
              <PolarGrid stroke="#e2e8f0" />
              <RadialBar
                label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: '800' }}
                background
                dataKey="risk"
              />
              <Legend 
                iconSize={8} 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                formatter={(value: number) => [`${value}%`, 'Exposição ao Risco']}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
