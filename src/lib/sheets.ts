import { Trade } from '../App';

export interface SheetMetadata {
  id: string;
  title: string;
  url: string;
}

// Create a new Spreadsheet and initialize with headers
export const createSpreadsheet = async (accessToken: string): Promise<SheetMetadata> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Trader Dashboard Pro - Operações`,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const title = data.properties.title;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize spreadsheet with headers
  await writeTradesToSheet(accessToken, spreadsheetId, []);

  return {
    id: spreadsheetId,
    title,
    url: spreadsheetUrl,
  };
};

// Check if spreadsheet ID is valid and accessible
export const checkSpreadsheetAccess = async (accessToken: string, spreadsheetId: string): Promise<string> => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Planilha não encontrada ou inacessível');
  }

  const data = await response.json();
  return data.properties.title || 'Planilha Vinculada';
};

// Clear ranges and write all trades (Overwrite)
export const writeTradesToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  trades: Trade[]
): Promise<void> => {
  // 1. Clear contents first (A1:E5000)
  const clearResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:E5000:clear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!clearResponse.ok) {
    throw new Error('Falha ao limpar a planilha antes de exportar');
  }

  // 2. Format values
  const headers = ['ID', 'Data (ISO)', 'Nível', 'Resultado (R$)', 'Tipo'];
  const rows = trades.map(t => [
    t.id,
    t.date,
    t.level,
    t.result,
    t.type.toUpperCase()
  ]);

  const bodyData = {
    range: 'A1',
    majorDimension: 'ROWS',
    values: [headers, ...rows],
  };

  const writeResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  });

  if (!writeResponse.ok) {
    const errorText = await writeResponse.text();
    throw new Error(`Falha ao salvar dados na planilha: ${errorText}`);
  }
};

// Read all trades from Sheet
export const readTradesFromSheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<Trade[]> => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:E5000`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao importar dados da planilha');
  }

  const data = await response.json();
  const rows = data.values as any[][];

  if (!rows || rows.length === 0) {
    return [];
  }

  const importedTrades: Trade[] = [];

  for (const row of rows) {
    const id = row[0] || crypto.randomUUID();
    const dateStr = row[1];
    const levelVal = parseInt(row[2]) || 1;
    const resultVal = parseFloat(String(row[3]).replace(',', '.')) || 0;
    const typeVal = String(row[4]).toLowerCase() === 'loss' ? 'loss' : 'win';

    // Validate date or default to now
    let parsedDate = new Date().toISOString();
    try {
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          parsedDate = d.toISOString();
        }
      }
    } catch {
      // Keep fallback
    }

    importedTrades.push({
      id,
      date: parsedDate,
      level: levelVal,
      result: resultVal,
      type: typeVal,
    });
  }

  // Sort newest first to keep dashboard look consistent
  return importedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Match and append single trade
export const appendTradeToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  trade: Trade
): Promise<void> => {
  const bodyData = {
    range: 'A2',
    majorDimension: 'ROWS',
    values: [[
      trade.id,
      trade.date,
      trade.level,
      trade.result,
      trade.type.toUpperCase()
    ]],
  };

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) {
    throw new Error('Falha ao adicionar trade na planilha');
  }
};
