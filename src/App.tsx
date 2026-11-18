import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  LayoutDashboard, 
  History, 
  Settings,
  DollarSign,
  Percent,
  Target,
  AlertCircle,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Cloud,
  CloudOff,
  LogOut,
  Database,
  Sparkles,
  Award,
  Activity,
  Calendar,
  Flame,
  ArrowUpRight,
  Layers,
  Lock,
  Unlock,
  Info,
  Search,
  Filter
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  Legend
} from 'recharts';
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
import { cn } from './lib/utils';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout,
  saveUserConfigToFirestore,
  getUserConfigFromFirestore,
  saveTradeToFirestore,
  deleteTradeFromFirestore,
  getTradesFromFirestore,
  saveAllTradesToFirestore
} from './lib/firebase';
import { 
  createSpreadsheet, 
  checkSpreadsheetAccess, 
  writeTradesToSheet, 
  readTradesFromSheet 
} from './lib/sheets';

// --- Sub-components (Redesigned & Modularized) ---
import TradeMap from './components/TradeMap';
import StrategyAssistant from './components/StrategyAssistant';
import SheetsSync from './components/SheetsSync';
import LevelsLedger from './components/LevelsLedger';

// --- Types ---

export interface Trade {
  id: string;
  date: string;
  result: number;
  level: number;
  type: 'win' | 'loss';
}

interface LevelConfig {
  level: number;
  percentage: number;
}

// --- Constants ---

const INITIAL_LEVELS: LevelConfig[] = [
  { level: 1, percentage: 2.03 },
  { level: 2, percentage: 2.84 },
  { level: 3, percentage: 3.97 },
  { level: 4, percentage: 5.56 },
  { level: 5, percentage: 7.79 },
  { level: 6, percentage: 10.91 },
  { level: 7, percentage: 15.29 },
  { level: 8, percentage: 21.40 },
  { level: 9, percentage: 30.17 },
];

const RISK_REWARD_RATIO = 2.5;

// --- App Entry Point ---

export default function App() {
  const [capital, setCapital] = useState<number>(() => {
    const saved = localStorage.getItem('trader_capital');
    return saved ? Number(saved) : 5000;
  });
  const [profitTarget, setProfitTarget] = useState<number>(() => {
    const saved = localStorage.getItem('trader_profit_target');
    return saved ? Number(saved) : 10000;
  });
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(() => {
    const saved = localStorage.getItem('trader_risk_reward');
    return saved ? Number(saved) : 2.5;
  });
  const [feesPercentage, setFeesPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('trader_fees_percentage');
    return saved ? Number(saved) : 0.5;
  });
  const [cycleLength, setCycleLength] = useState<number>(() => {
    const saved = localStorage.getItem('trader_cycle_length');
    return saved ? Number(saved) : 3;
  });
  const [levels, setLevels] = useState<LevelConfig[]>(() => {
    const saved = localStorage.getItem('trader_levels');
    return saved ? JSON.parse(saved) : INITIAL_LEVELS;
  });
  const [isEditingLevels, setIsEditingLevels] = useState(false);
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('trader_trades');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTradeResult, setNewTradeResult] = useState<string>('');
  const [newTradeLevel, setNewTradeLevel] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'map'>('dashboard');
  const [levelsView, setLevelsView] = useState<'table' | 'chart'>('table');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // States for History filtering on the dedicated page
  const [historyResultFilter, setHistoryResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [historyLevelFilter, setHistoryLevelFilter] = useState<number | 'all'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Sync state to localStorage whenever they change to prevent data loss on refresh/reload
  useEffect(() => {
    localStorage.setItem('trader_capital', capital.toString());
  }, [capital]);

  useEffect(() => {
    localStorage.setItem('trader_profit_target', profitTarget.toString());
  }, [profitTarget]);

  useEffect(() => {
    localStorage.setItem('trader_risk_reward', riskRewardRatio.toString());
  }, [riskRewardRatio]);

  useEffect(() => {
    localStorage.setItem('trader_fees_percentage', feesPercentage.toString());
  }, [feesPercentage]);

  useEffect(() => {
    localStorage.setItem('trader_cycle_length', cycleLength.toString());
  }, [cycleLength]);

  useEffect(() => {
    localStorage.setItem('trader_levels', JSON.stringify(levels));
  }, [levels]);

  useEffect(() => {
    localStorage.setItem('trader_trades', JSON.stringify(trades));
  }, [trades]);

  // Google Sheets integration state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Save auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync data with Firestore on user sign in
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsSyncing(true);
      try {
        const firestoreConfig = await getUserConfigFromFirestore(user.uid);
        const firestoreTrades = await getTradesFromFirestore(user.uid);

        if (firestoreConfig) {
          // A config document already exists in Firestore! Load it
          setCapital(firestoreConfig.capital);
          setProfitTarget(firestoreConfig.profitTarget);
          setRiskRewardRatio(firestoreConfig.riskRewardRatio);
          setFeesPercentage(firestoreConfig.feesPercentage);
          setCycleLength(firestoreConfig.cycleLength);
          
          if (firestoreConfig.levels) {
            const convertedLevels = levels.map(lvl => {
              const customPercentage = firestoreConfig.levels[lvl.level.toString()];
              return customPercentage !== undefined ? { ...lvl, percentage: customPercentage } : lvl;
            });
            setLevels(convertedLevels);
          }

          if (firestoreConfig.spreadsheetId !== undefined) {
            setSpreadsheetId(firestoreConfig.spreadsheetId);
          }
          if (firestoreConfig.spreadsheetTitle !== undefined) {
            setSpreadsheetTitle(firestoreConfig.spreadsheetTitle);
          }
          if (firestoreConfig.spreadsheetUrl !== undefined) {
            setSpreadsheetUrl(firestoreConfig.spreadsheetUrl);
          }
          if (firestoreConfig.autoSync !== undefined) {
            setAutoSync(firestoreConfig.autoSync);
          }
          
          if (firestoreTrades && firestoreTrades.length > 0) {
            const mappedTrades: Trade[] = firestoreTrades.map(t => ({
              id: t.id,
              date: t.date,
              level: t.level,
              result: t.result,
              type: t.type
            }));
            // Sort by date descending
            mappedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTrades(mappedTrades);
          }
          toast.success("Dados de operações carregados da Nuvem Firestore!");
          setLastSaved(new Date());
        } else {
          // First time logging in: save defaults to cloud
          toast.info("Configurando sua conta na nuvem...");
          
          const levelsMap: { [key: string]: number } = {};
          levels.forEach(lvl => {
            levelsMap[lvl.level.toString()] = lvl.percentage;
          });

          await saveUserConfigToFirestore(user.uid, {
            capital,
            profitTarget,
            riskRewardRatio,
            feesPercentage,
            cycleLength,
            levels: levelsMap,
            spreadsheetId,
            spreadsheetTitle,
            spreadsheetUrl,
            autoSync
          });

          if (trades.length > 0) {
            const firebaseTrades = trades.map(t => ({
              id: t.id,
              userId: user.uid,
              date: t.date,
              result: t.result,
              level: t.level,
              type: t.type
            }));
            await saveAllTradesToFirestore(user.uid, firebaseTrades);
          }
          toast.success("Sincronização com o Banco de Dados Cloud ativada com sucesso!");
          setLastSaved(new Date());
        }
      } catch (err: any) {
        console.error("Erro Firestore ao sincronizar:", err);
        toast.error("Erro ao sincronizar com banco de dados em nuvem.");
      } finally {
        setIsSyncing(false);
      }
    };

    loadData();
  }, [user]);

  // Debounced user config save to Firestore
  useEffect(() => {
    if (!user) return;

    const handler = setTimeout(async () => {
      try {
        const levelsMap: { [key: string]: number } = {};
        levels.forEach(lvl => {
          levelsMap[lvl.level.toString()] = lvl.percentage;
        });

        await saveUserConfigToFirestore(user.uid, {
          capital,
          profitTarget,
          riskRewardRatio,
          feesPercentage,
          cycleLength,
          levels: levelsMap,
          spreadsheetId,
          spreadsheetTitle,
          spreadsheetUrl,
          autoSync
        });
        setLastSaved(new Date());
      } catch (err: any) {
        console.error("Erro ao atualizar config no Firestore:", err);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [capital, profitTarget, riskRewardRatio, feesPercentage, cycleLength, levels, user, spreadsheetId, spreadsheetTitle, spreadsheetUrl, autoSync]);

  // Google authentication actions
  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        toast.success("Conectado com sucesso com a sua Conta Google!");
      }
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
        toast.info("A janela de login foi fechada antes de concluir a autenticação.");
      } else {
        console.error(error);
        toast.error("Erro ao conectar com a Google");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setIsSyncing(true);
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      // Reset all states back to default values for clean visual privacy
      setCapital(5000);
      setProfitTarget(10000);
      setRiskRewardRatio(2.5);
      setFeesPercentage(0.5);
      setCycleLength(3);
      setLevels(INITIAL_LEVELS);
      setTrades([]);
      setSpreadsheetId('');
      setSpreadsheetTitle('');
      setSpreadsheetUrl('');
      setAutoSync(false);
      toast.success("Sessão Google encerrada e dados locais limpos");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao encerrar sessão");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      toast.error("Você precisa estar conectado à sua conta Google");
      return;
    }
    setIsSyncing(true);
    try {
      const metadata = await createSpreadsheet(accessToken);
      setSpreadsheetId(metadata.id);
      setSpreadsheetTitle(metadata.title);
      setSpreadsheetUrl(metadata.url);
      
      // Auto write immediate backup
      await writeTradesToSheet(accessToken, metadata.id, trades);
      toast.success("Nova planilha 'Trader Dashboard Pro - Operações' criada!");
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao criar planilha: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLinkExistingSheet = async (id: string) => {
    if (!accessToken) {
      toast.error("Você precisa estar conectado à sua conta Google");
      return;
    }
    const cleanId = id.trim();
    if (!cleanId) return;
    
    // Extract ID from URL if full URL is passed
    let finalId = cleanId;
    if (cleanId.includes('docs.google.com/spreadsheets')) {
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        finalId = match[1];
      }
    }

    setIsSyncing(true);
    try {
      const title = await checkSpreadsheetAccess(accessToken, finalId);
      setSpreadsheetId(finalId);
      setSpreadsheetTitle(title);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${finalId}/edit`);
      toast.success(`Planilha vinculada com sucesso: "${title}"`);
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao vincular: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportToSheet = async () => {
    if (!accessToken || !spreadsheetId) {
      toast.error("Planilha ou conta Google não configurada");
      return;
    }
    
    const confirmed = window.confirm(
      `Isso irá SOBRESCREVER todos os dados da planilha da Google com as operações do seu painel local (${trades.length} trades). Deseja continuar?`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      await writeTradesToSheet(accessToken, spreadsheetId, trades);
      toast.success("Operações exportadas e salvas no Google Sheets!");
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao exportar dados: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromSheet = async () => {
    if (!accessToken || !spreadsheetId) {
      toast.error("Planilha ou conta Google não configurada");
      return;
    }

    const confirmed = window.confirm(
      `Isso irá SUBSTITUIR as operações locais de hoje pelas operações registradas na planilha. Deseja continuar?`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      const sheetTrades = await readTradesFromSheet(accessToken, spreadsheetId);
      setTrades(sheetTrades);
      
      if (user) {
        const firebaseTrades = sheetTrades.map(t => ({
          id: t.id,
          userId: user.uid,
          date: t.date,
          result: t.result,
          level: t.level,
          type: t.type
        }));
        await saveAllTradesToFirestore(user.uid, firebaseTrades);
      }
      
      toast.success(`${sheetTrades.length} operações importadas com sucesso!`);
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao importar: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = async (checked: boolean) => {
    setAutoSync(checked);
    if (checked && accessToken && spreadsheetId) {
      setIsSyncing(true);
      try {
        await writeTradesToSheet(accessToken, spreadsheetId, trades);
        toast.success("Sincronização automática de planilhas decolou!");
      } catch (err: any) {
        console.error(err);
        toast.error(`Erro no auto-sync: ${err.message}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleRemoveSpreadsheetLink = () => {
    setSpreadsheetId('');
    setSpreadsheetTitle('');
    setSpreadsheetUrl('');
    setAutoSync(false);
    toast.success("Vínculo com a planilha removido!");
  };



  const exportData = () => {
    const data = {
      trades,
      capital,
      levels,
      profitTarget,
      riskRewardRatio,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trader-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentBalance = useMemo(() => {
    return capital + trades.reduce((acc, trade) => acc + trade.result, 0);
  }, [capital, trades]);

  const chartData = useMemo(() => {
    let runningBalance = capital;
    const chronologicalTrades = [...trades].reverse();
    return [
      { name: 'Início', balance: capital },
      ...chronologicalTrades.map((trade) => {
        runningBalance += trade.result;
        return {
          name: format(new Date(trade.date), 'dd/MM'),
          balance: runningBalance,
        };
      })
    ];
  }, [capital, trades]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { name: string; profit: number; date: Date }> = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM/yy', { locale: ptBR });
      
      if (!months[monthKey]) {
        months[monthKey] = { name: monthName, profit: 0, date: startOfMonth(date) };
      }
      months[monthKey].profit += trade.result;
    });
    
    return Object.values(months).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [trades]);

  const levelCalculations = useMemo(() => {
    let cumulativeNet = 0;
    return levels.map(config => {
      const stop = (currentBalance * config.percentage) / 100;
      const take = stop * riskRewardRatio;
      const netPerTrade = take * (1 - (feesPercentage / 100));
      cumulativeNet += netPerTrade;
      
      // Calculate how many wins at this level to reach target
      const remaining = profitTarget - currentBalance;
      const winsNeeded = (remaining > 0 && netPerTrade > 0) ? Math.ceil(remaining / netPerTrade) : 0;
      
      // Fixed stop and take based on initial capital
      const stopInitial = (capital * config.percentage) / 100;
      const takeInitial = stopInitial * riskRewardRatio;
      
      return {
        ...config,
        stop,
        take,
        stopInitial,
        takeInitial,
        netResult: cumulativeNet,
        winsNeeded,
        isHighRisk: config.percentage > 10
      };
    });
  }, [currentBalance, capital, levels, riskRewardRatio, profitTarget, feesPercentage]);

  const nextRecommendedTrade = useMemo(() => {
    if (trades.length === 0) return { level: 1, reason: 'Início de jornada' };
    
    const lastTrade = trades[0]; // Trades are unshifted (newest first)
    const isWin = lastTrade.result > 0;
    
    if (!isWin) return { level: 1, reason: 'Recuperação de Capital' };
    
    // If it was a win, check if we should continue the cycle or reset
    if (lastTrade.level < cycleLength) {
      return { level: lastTrade.level + 1, reason: `Continuação do Ciclo (${lastTrade.level}/${cycleLength})` };
    }
    
    return { level: 1, reason: 'Ciclo Concluído (Lucro no Bolso)' };
  }, [trades, cycleLength]);

  const strategyDetails = useMemo(() => {
    const details: Record<number, { name: string; description: string; risk: string; color: string }> = {
      2: { 
        name: 'Conservador', 
        description: 'Foca na preservação de capital. Ciclos curtos reduzem a exposição ao mercado.', 
        risk: 'Baixo',
        color: 'text-blue-400'
      },
      3: { 
        name: 'Equilibrado', 
        description: 'O padrão ouro. Oferece boa recuperação sem arriscar demais o lucro acumulado.', 
        risk: 'Moderado',
        color: 'text-emerald-400'
      },
      4: { 
        name: 'Agressivo', 
        description: 'Busca crescimento rápido. Exige maior taxa de acerto para manter a consistência.', 
        risk: 'Alto',
        color: 'text-amber-400'
      },
      9: { 
        name: 'Soros Full', 
        description: 'Alavancagem extrema. Um único erro em níveis altos reseta todo o progresso do ciclo.', 
        risk: 'Altíssimo',
        color: 'text-rose-400'
      }
    };
    return details[cycleLength] || details[3];
  }, [cycleLength]);

  const winRate = useMemo(() => {
    if (trades.length === 0) return 0;
    return (trades.filter(t => t.result >= 0).length / trades.length) * 100;
  }, [trades]);

  const streak = useMemo(() => {
    if (trades.length === 0) return { type: 'none', count: 0 };
    let count = 0;
    const isFirstWin = trades[0].result >= 0;
    for (const t of trades) {
      const isWin = t.result >= 0;
      if (isWin === isFirstWin) {
        count++;
      } else {
        break;
      }
    }
    return { type: isFirstWin ? 'win' : 'loss', count };
  }, [trades]);

  const handleNewTradeLevelChange = (level: number) => {
    setNewTradeLevel(level);
    
    if (level > nextRecommendedTrade.level) {
      const plannedRisk = levels.find(l => l.level === level)?.percentage || 0;
      const recRisk = levels.find(l => l.level === nextRecommendedTrade.level)?.percentage || 0;
      
      toast(
        <div className="flex flex-col gap-1.5 font-sans">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <span>Alerta de Risco Excedido!</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            O nível planejado <strong className="text-slate-900 font-extrabold">{level}º Nível ({plannedRisk}%)</strong> supera o recomendado pela estratégia {strategyDetails.name} <strong className="text-emerald-600 font-extrabold">({nextRecommendedTrade.level}º Nível • {recRisk}%)</strong>.
          </p>
          <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider font-mono bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
            Motivo da Recomendação: {nextRecommendedTrade.reason}
          </div>
        </div>,
        {
          duration: 6000,
          className: "rounded-2xl border-amber-200/80 bg-amber-50/50 shadow-xl",
        }
      );
    }
  };

  const stats = useMemo(() => {
    const winsCount = trades.filter(t => t.result >= 0).length;
    const lossesCount = trades.length - winsCount;
    const avgResult = trades.length > 0 
      ? trades.reduce((acc, t) => acc + t.result, 0) / trades.length 
      : 0;
    const roiPercent = capital > 0 
      ? ((currentBalance - capital) / capital) * 100 
      : 0;
    const targetProfit = profitTarget - capital;
    const currentProfit = currentBalance - capital;
    const progressPercent = targetProfit > 0 && currentProfit > 0
      ? Math.min(100, (currentProfit / targetProfit) * 100)
      : 0;
    return { winsCount, lossesCount, avgResult, roiPercent, progressPercent };
  }, [trades, capital, currentBalance, profitTarget]);

  // Compute filtered trades for the dedicated history view
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      // Result filter
      if (historyResultFilter === 'win' && t.result < 0) return false;
      if (historyResultFilter === 'loss' && t.result >= 0) return false;
      
      // Level filter
      if (historyLevelFilter !== 'all' && t.level !== historyLevelFilter) return false;
      
      // Search filter
      if (historySearchQuery) {
        const query = historySearchQuery.toLowerCase();
        
        // Format date same as in render
        let dateStr = "";
        try {
          dateStr = format(new Date(t.date), "dd 'de' MMMM, HH:mm", { locale: ptBR }).toLowerCase();
        } catch (e) {
          dateStr = new Date(t.date).toLocaleDateString().toLowerCase();
        }
        
        const resultStr = t.result.toString().toLowerCase();
        const levelStr = `${t.level}º nível`.toLowerCase();
        
        return dateStr.includes(query) || resultStr.includes(query) || levelStr.includes(query);
      }
      
      return true;
    });
  }, [trades, historyResultFilter, historyLevelFilter, historySearchQuery]);

  const handleAddTrade = (e: React.FormEvent | null, manualResult?: number, manualLevel?: number) => {
    if (e) e.preventDefault();
    
    const resultStr = manualResult !== undefined ? manualResult.toString() : newTradeResult;
    const level = manualLevel !== undefined ? manualLevel : newTradeLevel;
    
    if (!resultStr && manualResult === undefined) return;

    // Normalize: replace comma with dot for parsing
    const normalizedResult = resultStr.replace(',', '.');
    const result = parseFloat(normalizedResult);
    
    if (isNaN(result)) return;

    const newTrade: Trade = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      result,
      level: level,
      type: result >= 0 ? 'win' : 'loss'
    };

    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);
    setNewTradeResult('');

    // Firebase Firestore Sync
    if (user) {
      saveTradeToFirestore(user.uid, {
        id: newTrade.id,
        userId: user.uid,
        date: newTrade.date,
        result: newTrade.result,
        level: newTrade.level,
        type: newTrade.type
      }).then(() => {
        setLastSaved(new Date());
      }).catch(err => {
        console.error("Erro ao salvar trade no Firestore:", err);
      });
    }

    // Google Sheets Auto Sync
    if (autoSync && accessToken && spreadsheetId) {
      writeTradesToSheet(accessToken, spreadsheetId, updatedTrades)
        .then(() => toast.success("Sincronizado automaticamente com Google Sheets!", { duration: 1500 }))
        .catch(err => {
          console.error(err);
          toast.error(`Falha no auto-sync: ${err.message}`);
        });
    }

    // Show notification
    const isWin = newTrade.type === 'win';
    const isExceeding = newTrade.level > nextRecommendedTrade.level;
    toast(
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isWin ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}>
          {isWin ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        </div>
        <div>
          <p className="text-sm font-bold flex items-center gap-2">
            <span>Trade Registrado!</span>
            {isExceeding && (
              <span className="text-[9px] bg-amber-100 border border-amber-200 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono animate-pulse shrink-0">
                Risco Excedido
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {isWin ? 'WIN' : 'LOSS'} • Nível {newTrade.level} • 
            <span className={cn("ml-1 font-mono", isWin ? "text-emerald-600" : "text-rose-600")}>
              {isWin ? '+' : ''}R$ {newTrade.result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>,
      {
        duration: 3000,
        className: "rounded-2xl border-black/5 shadow-xl",
      }
    );
  };

  const deleteTrade = (id: string) => {
    const updatedTrades = trades.filter(t => t.id !== id);
    setTrades(updatedTrades);

    // Firebase Firestore Sync
    if (user) {
      deleteTradeFromFirestore(user.uid, id).then(() => {
        setLastSaved(new Date());
      }).catch(err => {
        console.error("Erro ao deletar trade do Firestore:", err);
      });
    }

    // Google Sheets Auto Sync
    if (autoSync && accessToken && spreadsheetId) {
      writeTradesToSheet(accessToken, spreadsheetId, updatedTrades)
        .then(() => toast.success("Sincronizado automaticamente com Google Sheets!", { duration: 1500 }))
        .catch(err => {
          console.error(err);
          toast.error(`Falha no auto-sync: ${err.message}`);
        });
    }
  };

  const clearAllTrades = async () => {
    const confirm1 = window.confirm("Deseja realmente EXCLUIR TODO o seu histórico de operações? Esta ação é irreversível.");
    if (!confirm1) return;
    const confirm2 = window.confirm("Aviso final! Você perderá todos os registros de trades permanentemente. Confirmar exclusão total?");
    if (!confirm2) return;

    setTrades([]);

    if (user) {
      try {
        await saveAllTradesToFirestore(user.uid, []);
        setLastSaved(new Date());
      } catch (err) {
        console.error("Erro ao limpar trades do Firestore:", err);
      }
    }

    if (autoSync && accessToken && spreadsheetId) {
      try {
        await writeTradesToSheet(accessToken, spreadsheetId, []);
        toast.success("Sincronizado e limpo no Google Sheets!");
      } catch (err) {
        console.error("Erro ao sincronizar limpeza com Google Sheets:", err);
      }
    }

    toast.success("Histórico de operações limpo com sucesso!");
  };

  const updateLevelPercentage = (level: number, percentage: string) => {
    const val = parseFloat(percentage) || 0;
    setLevels(prev => prev.map(l => l.level === level ? { ...l, percentage: val } : l));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 antialiased relative">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="bg-white/85 border-b border-slate-200/50 sticky top-0 z-30 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex flex-col md:flex-row items-center justify-between py-2 md:py-0 gap-3 md:gap-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/10">
              <TrendingUp size={18} />
            </div>
            <div className="flex items-center">
              <h1 className="font-extrabold text-slate-800 text-sm md:text-lg tracking-tight whitespace-nowrap">
                Trader Dashboard
              </h1>
              <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-black font-mono ml-2">PRO</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
            <nav className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border border-transparent",
                  activeTab === 'dashboard' ? "bg-white shadow-xs text-emerald-600 font-extrabold border-slate-200/30" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border border-transparent",
                  activeTab === 'history' ? "bg-white shadow-xs text-emerald-600 font-extrabold border-slate-200/30" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <History size={14} />
                Histórico
              </button>
              <button 
                onClick={() => setActiveTab('map')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border border-transparent",
                  activeTab === 'map' ? "bg-white shadow-xs text-emerald-600 font-extrabold border-slate-200/30" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Target size={14} />
                Mapa
              </button>
            </nav>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={exportData}
                className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 rounded-xl transition-all cursor-pointer shadow-3xs"
                title="Exportar Backup Local"
              >
                <Plus size={18} className="rotate-45" />
              </button>
              <button 
                onClick={() => setIsEditingLevels(!isEditingLevels)}
                className={cn(
                  "p-2.5 rounded-xl transition-all shrink-0 cursor-pointer shadow-3xs border",
                  isEditingLevels ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 border-transparent"
                )}
                title="Configurar Níveis de Risco"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative z-10">
        {activeTab === 'dashboard' ? (
          <>
            {/* Top Stats Cards (Bento style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              
              {/* Card 1: Capital Inicial */}
              <div 
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-2 group hover:border-emerald-500/20 hover:scale-[1.01] transition-all cursor-text duration-300"
                onClick={() => (document.getElementById('capital-input-field') as any)?.focus()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 group/tooltip relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Capital Inicial</span>
                    <Info size={12} className="text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
                    
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-0 mb-2.5 w-64 p-3.5 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl shadow-slate-950/25 border border-slate-800/60 z-50 opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto transition-all duration-200 translate-y-1 group-hover/tooltip:translate-y-0 font-sans leading-relaxed">
                      <div className="font-bold text-slate-200 mb-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider">
                        <Info size={11} className="text-emerald-400" />
                        Como é calculado?
                      </div>
                      <p className="text-slate-300 font-medium">
                        Banca de partida inserida manualmente pelo usuário. Todos os limites de ganho, perda máxima e cálculos de níveis de risco utilizam este valor como referência inicial do ciclo.
                      </p>
                      <div className="absolute top-full left-4 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-800/60" />
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                    <Settings size={14} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-slate-400 font-mono">R$</span>
                  <input 
                    id="capital-input-field"
                    type="number" 
                    value={capital || ''}
                    onChange={(e) => setCapital(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="text-2xl font-black bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-slate-200 font-mono text-slate-800"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold font-sans">Banca inicial de operação</p>
              </div>

              {/* Card 2: Meta de Lucro */}
              <div 
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-2 group hover:border-emerald-500/20 hover:scale-[1.01] transition-all cursor-text duration-300"
                onClick={() => (document.getElementById('target-input-field') as any)?.focus()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 group/tooltip relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Meta de Lucro</span>
                    <Info size={12} className="text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
                    
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-0 mb-2.5 w-64 p-3.5 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl shadow-slate-950/25 border border-slate-800/60 z-50 opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto transition-all duration-200 translate-y-1 group-hover/tooltip:translate-y-0 font-sans leading-relaxed">
                      <div className="font-bold text-slate-200 mb-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider">
                        <Info size={11} className="text-emerald-400" />
                        Progresso da Meta
                      </div>
                      <p className="text-slate-300 font-medium">
                        Objetivo financeiro definido para o ciclo atual. O progresso é calculated pela relação: <code className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold">(Resultado Líquido / Meta) * 100</code>. Indica a porcentagem concluída rumo ao seu alvo.
                      </p>
                      <div className="absolute top-full left-4 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-800/60" />
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                    <Target size={14} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-emerald-600/60 font-mono">R$</span>
                  <input 
                    id="target-input-field"
                    type="number" 
                    value={profitTarget || ''}
                    onChange={(e) => setProfitTarget(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="text-2xl font-black bg-transparent border-none p-0 focus:ring-0 w-full text-emerald-600 placeholder:text-emerald-200 font-mono"
                    placeholder="0"
                  />
                </div>
                {/* Achievement progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${stats.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                    <span>PROGRESSO</span>
                    <span>{stats.progressPercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Saldo Atual */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-2 group hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 group/tooltip relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Saldo Atual</span>
                    <Info size={12} className="text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
                    
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-0 mb-2.5 w-64 p-3.5 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl shadow-slate-950/25 border border-slate-800/60 z-50 opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto transition-all duration-200 translate-y-1 group-hover/tooltip:translate-y-0 font-sans leading-relaxed">
                      <div className="font-bold text-slate-200 mb-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider">
                        <Info size={11} className="text-emerald-400" />
                        Fórmula do Saldo
                      </div>
                      <p className="text-slate-300 font-medium">
                        O montante total disponível na sua banca neste momento. É calculado pela equação: <code className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold">Capital Inicial + Somatório de todas as operações (Wins/Losses) registradas</code>.
                      </p>
                      <div className="absolute top-full left-4 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-800/60" />
                    </div>
                  </div>
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shadow-3xs",
                    currentBalance >= capital ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                  )}>
                    <Activity size={14} />
                  </div>
                </div>
                <p className={cn(
                  "text-2xl font-black font-mono tracking-tight",
                  currentBalance >= capital ? "text-emerald-600" : "text-rose-600"
                )}>
                  R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold font-sans">Banca acumulada com trades</p>
              </div>

              {/* Card 4: Resultado Total (ROI) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-2 group hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 group/tooltip relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resultado Líquido</span>
                    <Info size={12} className="text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
                    
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full md:right-0 md:left-auto left-0 mb-2.5 w-64 p-3.5 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl shadow-slate-950/25 border border-slate-800/60 z-50 opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto transition-all duration-200 translate-y-1 group-hover/tooltip:translate-y-0 font-sans leading-relaxed">
                      <div className="font-bold text-slate-200 mb-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider">
                        <Info size={11} className="text-emerald-400" />
                        Retorno & ROI
                      </div>
                      <p className="text-slate-300 font-medium">
                        O lucro ou prejuízo real acumulado no ciclo, já descontadas as taxas. Calculado como: <code className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold">Saldo Atual - Capital Inicial</code>. O ROI representa o retorno percentual: <code className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold">(Resultado Líquido / Capital Inicial) * 100</code>.
                      </p>
                      <div className="absolute top-full md:right-4 md:left-auto left-4 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-800/60" />
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full border shadow-3xs font-mono",
                    currentBalance - capital >= 0 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  )}>
                    {currentBalance - capital >= 0 ? '+' : ''}{stats.roiPercent.toFixed(1)}% ROI
                  </span>
                </div>
                <p className={cn(
                  "text-2xl font-black font-mono tracking-tight",
                  currentBalance - capital >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {currentBalance - capital >= 0 ? '+' : ''}
                  R$ {(currentBalance - capital).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold font-sans">Lucro real descontando taxas</p>
              </div>

            </div>

            {/* Command Workspace: Strategy Assistant & Perf Stats */}
            <StrategyAssistant 
              nextRecommendedTrade={nextRecommendedTrade}
              cycleLength={cycleLength}
              setCycleLength={setCycleLength}
              strategyDetails={strategyDetails}
              levelCalculations={levelCalculations}
              handleAddTrade={handleAddTrade}
              winRate={winRate}
              streak={streak}
              stats={stats}
              levels={levels}
              newTradeResult={newTradeResult}
              setNewTradeResult={setNewTradeResult}
              newTradeLevel={newTradeLevel}
              setNewTradeLevel={handleNewTradeLevelChange}
              tradesCount={trades.length}
            />

            {/* Google Sheets Sync Section */}
            <SheetsSync 
              user={user}
              isAuthLoading={isAuthLoading}
              isSyncing={isSyncing}
              spreadsheetId={spreadsheetId}
              spreadsheetTitle={spreadsheetTitle}
              spreadsheetUrl={spreadsheetUrl}
              autoSync={autoSync}
              handleGoogleSignIn={handleGoogleSignIn}
              handleGoogleSignOut={handleGoogleSignOut}
              handleCreateNewSheet={handleCreateNewSheet}
              handleLinkExistingSheet={handleLinkExistingSheet}
              handleExportToSheet={handleExportToSheet}
              handleImportFromSheet={handleImportFromSheet}
              handleToggleAutoSync={handleToggleAutoSync}
              handleRemoveSpreadsheetLink={handleRemoveSpreadsheetLink}
              tradesCount={trades.length}
            />

            {/* Levels Management Ledger */}
            <LevelsLedger 
              isEditingLevels={isEditingLevels}
              levelsView={levelsView}
              setLevelsView={setLevelsView}
              feesPercentage={feesPercentage}
              setFeesPercentage={setFeesPercentage}
              riskRewardRatio={riskRewardRatio}
              setRiskRewardRatio={setRiskRewardRatio}
              levelCalculations={levelCalculations}
              updateLevelPercentage={updateLevelPercentage}
              handleAddTrade={handleAddTrade}
              capital={capital}
              currentBalance={currentBalance}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-lg tracking-tight">Evolução do Capital</h2>
                    <p className="text-xs text-slate-400 font-medium">Banca acumulada ao longo do tempo</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Saldo Atual
                  </div>
                </div>
                <div className="h-[220px] md:h-[320px] w-full font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        tickFormatter={(value) => `R$ ${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: '1px solid #f1f5f9', 
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                          fontSize: '12px',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Add */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <h2 className="font-extrabold text-slate-800 text-lg tracking-tight">Registrar Lançamento</h2>
                  <p className="text-xs text-slate-400 font-medium">Lançamento manual de operação avulsa</p>
                </div>

                <form onSubmit={handleAddTrade} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Nível Utilizado</label>
                    <select 
                      value={newTradeLevel}
                      onChange={(e) => handleNewTradeLevelChange(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all cursor-pointer"
                    >
                      {levels.map(l => (
                        <option key={l.level} value={l.level}>{l.level}º Nível ({l.percentage}%)</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resultado Líquido (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        value={newTradeResult}
                        onChange={(e) => setNewTradeResult(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-mono font-bold"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold italic">💡 Use sinal negativo (-) para prejuízos</p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 text-xs cursor-pointer tracking-wider uppercase font-mono"
                  >
                    <Plus size={16} />
                    Adicionar Operação
                  </button>
                </form>

                <div className="pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">Taxa de Acerto</span>
                    <span className="font-black text-emerald-600 font-mono">
                      {trades.length > 0 
                        ? ((trades.filter(t => t.result > 0).length / trades.length) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${trades.length > 0 ? (trades.filter(t => t.result > 0).length / trades.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Performance Chart */}
              <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-lg tracking-tight">Resultado Mensal</h2>
                    <p className="text-xs text-slate-400 font-medium">Balanço consolidado por mês de competência</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono font-bold">
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Lucro</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>Prejuízo</span>
                    </div>
                  </div>
                </div>
                <div className="h-[220px] md:h-[300px] w-full font-mono">
                  {monthlyData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-1">
                      <Activity size={24} className="text-slate-300 animate-pulse" />
                      <p className="font-semibold text-xs font-sans">Sem histórico suficiente</p>
                      <p className="text-[10px] font-sans">Adicione operações para visualizar o fechamento mensal.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                          tickFormatter={(value) => `R$ ${value}`}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid #f1f5f9', 
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                            fontSize: '12px',
                            fontFamily: 'JetBrains Mono, monospace'
                          }}
                          formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Resultado']}
                        />
                        <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                          {monthlyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'history' ? (
          /* Dedicated History Tab */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header and Quick Stats */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-slate-800 text-2xl tracking-tight">Histórico de Operações</h2>
                <p className="text-xs text-slate-400 font-semibold">Consulte, filtre e gerencie detalhadamente todos os registros de trades do seu ciclo.</p>
              </div>
              <button
                onClick={clearAllTrades}
                disabled={trades.length === 0}
                className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer border border-rose-200/40 flex items-center gap-1.5 shadow-sm hover:shadow-inner"
              >
                <Trash2 size={14} />
                Limpar Todo o Histórico
              </button>
            </div>

            {/* Micro Stats Grid for History */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Stat 1: Total Trades */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total de Lançamentos</span>
                  <p className="text-2xl font-black font-mono text-slate-800">{trades.length}</p>
                </div>
                <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
                  <Activity size={18} />
                </div>
              </div>

              {/* Stat 2: Total Net Result */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Balanço Líquido</span>
                  <p className={cn(
                    "text-2xl font-black font-mono",
                    (currentBalance - capital) >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {(currentBalance - capital) >= 0 ? '+' : ''}
                    R$ {(currentBalance - capital).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  (currentBalance - capital) >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                )}>
                  <DollarSign size={18} />
                </div>
              </div>

              {/* Stat 3: Win Rate */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Taxa de Acerto</span>
                  <p className="text-2xl font-black font-mono text-emerald-600">{winRate.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Percent size={18} />
                </div>
              </div>

              {/* Stat 4: Streaks */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Sequência Atual</span>
                  <p className={cn(
                    "text-lg font-black font-mono flex items-center gap-1",
                    streak.type === 'win' ? "text-emerald-600" : streak.type === 'loss' ? "text-rose-600" : "text-slate-400"
                  )}>
                    {streak.type === 'win' && <Flame size={16} className="text-amber-500" />}
                    {streak.count} {streak.type === 'win' ? 'WINS' : streak.type === 'loss' ? 'LOSS' : 'Sem registros'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                  <Flame size={18} />
                </div>
              </div>
            </div>

            {/* Filter Bar Panel */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por data, valor ou nível..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold text-slate-700"
                />
              </div>

              {/* Filters Controls Group */}
              <div className="flex flex-wrap items-center gap-3.5">
                {/* Result Status Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setHistoryResultFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                      historyResultFilter === 'all' ? "bg-white text-slate-800 shadow-3xs" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setHistoryResultFilter('win')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                      historyResultFilter === 'win' ? "bg-white text-emerald-600 shadow-3xs" : "text-slate-400 hover:text-emerald-500"
                    )}
                  >
                    Wins
                  </button>
                  <button
                    onClick={() => setHistoryResultFilter('loss')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                      historyResultFilter === 'loss' ? "bg-white text-rose-600 shadow-3xs" : "text-slate-400 hover:text-rose-500"
                    )}
                  >
                    Losses
                  </button>
                </div>

                {/* Level Selection Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                    <Filter size={10} />
                    Nível:
                  </span>
                  <select
                    value={historyLevelFilter}
                    onChange={(e) => setHistoryLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="all">Todos os Níveis</option>
                    {levels.map(l => (
                      <option key={l.level} value={l.level}>{l.level}º Nível</option>
                    ))}
                  </select>
                </div>

                {/* Clear filters shortcut */}
                {(historySearchQuery || historyResultFilter !== 'all' || historyLevelFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setHistorySearchQuery('');
                      setHistoryResultFilter('all');
                      setHistoryLevelFilter('all');
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight font-sans">Operações Filtradas</h3>
                  <p className="text-xs text-slate-400 font-semibold font-sans">Tabela contendo os registros selecionados pelos filtros</p>
                </div>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold font-mono">
                  {filteredTrades.length} de {trades.length} {trades.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold font-mono border-b border-slate-100">
                      <th className="px-6 py-4">Data da Operação</th>
                      <th className="px-6 py-4">Nível de Risco</th>
                      <th className="px-6 py-4">Resultado Bruto</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
                              <Search size={20} className="text-slate-400" />
                            </div>
                            <p className="font-bold text-sm text-slate-700">Nenhuma operação encontrada</p>
                            <p className="text-xs text-slate-400 leading-relaxed font-semibold">Tente ajustar seus filtros ou realizar outra busca.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((trade) => (
                        <tr key={trade.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 font-mono">
                            {format(new Date(trade.date), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black font-mono">
                              {trade.level}º NÍVEL
                            </span>
                          </td>
                          <td className={cn(
                            "px-6 py-4 font-mono font-bold text-sm",
                            trade.result >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {trade.result >= 0 ? '+' : ''}
                            R$ {trade.result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            {trade.result >= 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black font-mono">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                WIN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black font-mono">
                                <span className="w-1 h-1 rounded-full bg-rose-500" />
                                LOSS
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => deleteTrade(trade.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center shadow-3xs hover:shadow-inner"
                              title="Excluir Registro"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Map Tab (Calendar) */
          <TradeMap trades={trades} />
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-xs space-y-3 relative z-10">
        <p className="font-semibold">© {new Date().getFullYear()} Trader Dashboard Pro • Gestão de Risco Progressiva Matemática</p>
        {lastSaved && (
          <p className="inline-flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Nuvem Sincronizada: {format(lastSaved, 'HH:mm:ss')}
          </p>
        )}
      </footer>
    </div>
  );
}
