import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Trade } from '../App';

interface TradeMapProps {
  trades: Trade[];
}

export default function TradeMap({ trades }: TradeMapProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getDayResult = (day: Date) => {
    const dayTrades = trades.filter(t => isSameDay(new Date(t.date), day));
    if (dayTrades.length === 0) return null;
    const netResult = dayTrades.reduce((acc, t) => acc + t.result, 0);
    return {
      netResult,
      hasLoss: dayTrades.some(t => t.result < 0),
      hasWin: dayTrades.some(t => t.result > 0),
      tradesCount: dayTrades.length,
    };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg tracking-tight">Mapa de Trades</h2>
            <p className="text-xs text-slate-400 font-medium font-sans">
              Visão geral do desempenho diário
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-slate-500">
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Lucro</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-500/10">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Prejuízo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-500/10">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Misto</span>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-white hover:shadow-sm text-slate-600 rounded-xl transition-all cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 text-xs font-bold min-w-[120px] text-center capitalize text-slate-700">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-white hover:shadow-sm text-slate-600 rounded-xl transition-all cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday Labels */}
          {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map((day, idx) => (
            <div 
              key={idx} 
              className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day) => {
            const result = getDayResult(day);
            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
            
            let dayStyle = "bg-white text-slate-700 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-2xs";
            
            if (result) {
              if (result.hasWin && result.hasLoss) {
                dayStyle = "bg-amber-500/10 text-amber-700 border border-amber-500/25 hover:bg-amber-500/15";
              } else if (result.hasWin) {
                dayStyle = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 hover:bg-emerald-500/15";
              } else if (result.hasLoss) {
                dayStyle = "bg-rose-500/10 text-rose-700 border border-rose-500/25 hover:bg-rose-500/15";
              }
            } else if (!isCurrentMonth) {
              dayStyle = "bg-slate-50/40 text-slate-300 border border-slate-100/30";
            } else if (isToday(day)) {
              dayStyle = "bg-emerald-50/50 text-emerald-700 border border-emerald-500/20 shadow-xs ring-2 ring-emerald-500/5";
            }

            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "min-h-[70px] md:min-h-[110px] p-2.5 rounded-2xl transition-all duration-300 flex flex-col justify-between relative group",
                  dayStyle
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[11px] font-extrabold font-mono",
                    isToday(day) && !result && "text-emerald-600 bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {result && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/60 text-slate-600 shadow-3xs">
                      {result.tradesCount} op
                    </span>
                  )}
                </div>
                
                {result && (
                  <div className="mt-2 animate-fade-in">
                    <p className="text-[10px] md:text-xs font-mono font-extrabold tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {result.netResult >= 0 ? '+' : ''}
                      {result.netResult.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>
                )}

                {isToday(day) && (
                  <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
