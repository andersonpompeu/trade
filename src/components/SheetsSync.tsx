import React from 'react';
import { 
  FileSpreadsheet, 
  LogOut, 
  Sparkles, 
  Database, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

interface SheetsSyncProps {
  user: User | null;
  isAuthLoading: boolean;
  isSyncing: boolean;
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  autoSync: boolean;
  handleGoogleSignIn: () => void;
  handleGoogleSignOut: () => void;
  handleCreateNewSheet: () => void;
  handleLinkExistingSheet: (id: string) => void;
  handleExportToSheet: () => void;
  handleImportFromSheet: () => void;
  handleToggleAutoSync: (checked: boolean) => void;
  handleRemoveSpreadsheetLink: () => void;
  tradesCount: number;
}

export default function SheetsSync({
  user,
  isAuthLoading,
  isSyncing,
  spreadsheetId,
  spreadsheetTitle,
  spreadsheetUrl,
  autoSync,
  handleGoogleSignIn,
  handleGoogleSignOut,
  handleCreateNewSheet,
  handleLinkExistingSheet,
  handleExportToSheet,
  handleImportFromSheet,
  handleToggleAutoSync,
  handleRemoveSpreadsheetLink,
  tradesCount
}: SheetsSyncProps) {

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      
      {/* Sync Header */}
      <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <FileSpreadsheet size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-base md:text-lg tracking-tight">Sincronização Google Planilhas</h2>
            <p className="text-[10px] md:text-xs text-slate-400 font-semibold font-sans">
              Armazene e espelhe suas operações em tempo real na nuvem do Google Drive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-3xs border",
            user 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : isAuthLoading
                ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                : "bg-slate-100 text-slate-500 border-slate-200"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full", 
              user ? "bg-emerald-500" : isAuthLoading ? "bg-amber-500" : "bg-slate-400"
            )} />
            {user ? `Conta: ${user.displayName || user.email}` : isAuthLoading ? "Verificando..." : "Google Desconectado"}
          </span>
          
          {user && (
            <button 
              onClick={handleGoogleSignOut}
              disabled={isSyncing}
              className="p-1.5 px-3 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              title="Sair da Conta Google"
            >
              <LogOut size={13} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Body */}
      <div className="p-5 md:p-6 bg-white/60">
        {!user ? (
          // STEP 1: Connect account
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
            <div className="max-w-xl space-y-1">
              <h4 className="font-extrabold text-sm text-slate-800">Conecte sua conta do Google</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Conecte-se com segurança para criar e sincronizar planilhas de forma integrada. Seus dados continuam privados, hospedados e assegurados sob os servidores oficiais da Google.
              </p>
            </div>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={isSyncing}
              className="px-6 py-3.5 bg-[#4285F4] hover:bg-[#357AE8] text-white font-extrabold rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-3 w-full md:w-auto text-xs shrink-0 whitespace-nowrap cursor-pointer hover:shadow-lg hover:shadow-blue-500/15"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#ffffff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#ffffff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" opacity="0.9"></path>
                <path fill="#ffffff" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" opacity="0.9"></path>
                <path fill="#ffffff" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Conectar com Google</span>
            </button>
          </div>
        ) : !spreadsheetId ? (
          // STEP 2: Bind a spreadsheet
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            
            {/* Create new sheet card */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:border-emerald-200 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Criar Nova Planilha do Zero</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Gera uma nova planilha chamada <strong className="text-slate-700">"Trader Dashboard Pro - Operações"</strong> no seu Google Drive com toda a estrutura e dados sincronizados.
                </p>
              </div>
              <button
                onClick={handleCreateNewSheet}
                disabled={isSyncing}
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md shadow-emerald-600/10"
              >
                {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Criar e Sincronizar Nova Planilha
              </button>
            </div>

            {/* Link existing sheet card */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                  <Database size={16} />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 font-sans">Vincular Planilha Existente</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Insira o link ou o ID de uma planilha Google de operações que você já utiliza para sincronizar os dados.
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <input 
                  type="text"
                  id="existing-sheet-input-id"
                  placeholder="ID ou URL da Planilha"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all flex-1 min-w-0 font-medium"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('existing-sheet-input-id') as HTMLInputElement;
                    if (input && input.value) {
                      handleLinkExistingSheet(input.value);
                    }
                  }}
                  disabled={isSyncing}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl transition-all whitespace-nowrap cursor-pointer"
                >
                  Vincular
                </button>
              </div>
            </div>

          </div>
        ) : (
          // STEP 3: Manage active sync operations
          <div className="space-y-5 py-2">
            {/* Active Link Info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Planilha Vinculada Ativa</p>
                  <h4 className="font-extrabold text-sm text-slate-800 font-sans">{spreadsheetTitle || "Planilha de Operações"}</h4>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-3xs"
                >
                  <ExternalLink size={13} />
                  <span>Abrir no Planilhas</span>
                </a>
                <button
                  onClick={() => {
                    const resetConfirmed = window.confirm("Remover o vínculo com a planilha? Seus dados locais continuarão salvos.");
                    if (resetConfirmed) {
                      handleRemoveSpreadsheetLink();
                    }
                  }}
                  className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Remover Vínculo
                </button>
              </div>
            </div>

            {/* Sync actions tools */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Auto sync control */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3">
                <div>
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    {autoSync ? (
                      <Cloud size={14} className="text-emerald-500 animate-pulse shrink-0" />
                    ) : (
                      <CloudOff size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span>Sincronia Automática</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium font-sans mt-1">
                    Garante que cada alteração seja sincronizada instantaneamente na nuvem em tempo real.
                  </p>
                </div>
                <div className="pt-1.5">
                  <button
                    onClick={() => handleToggleAutoSync(!autoSync)}
                    className={cn(
                      "px-3 py-2 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all w-full cursor-pointer",
                      autoSync 
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10 border border-emerald-600" 
                        : "bg-slate-200 text-slate-600 border border-slate-300"
                    )}
                  >
                    {autoSync ? "ATIVO (Auto-Sync)" : "INATIVO (Manual)"}
                  </button>
                </div>
              </div>

              {/* Force Export */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3">
                <div>
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <RefreshCw size={13} className={cn("text-blue-500", isSyncing && "animate-spin")} />
                    <span>Sobrescrever Planilha</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium font-sans mt-1">
                    Apaga a planilha atual e envia as {tradesCount} operações salvas localmente como novo backup.
                  </p>
                </div>
                <button
                  onClick={handleExportToSheet}
                  disabled={isSyncing}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw size={12} />
                  <span>Enviar Dados Locais</span>
                </button>
              </div>

              {/* Force Import */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3">
                <div>
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <RefreshCw size={13} className="text-emerald-500 rotate-180" />
                    <span>Importar da Planilha</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium font-sans mt-1">
                    Substitui totalmente suas operações locais pelos registros salvos na planilha online.
                  </p>
                </div>
                <button
                  onClick={handleImportFromSheet}
                  disabled={isSyncing}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Database size={12} />
                  <span>Substituir pelo Google</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
      
    </section>
  );
}
