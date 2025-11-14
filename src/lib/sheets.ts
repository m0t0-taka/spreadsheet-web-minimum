import { google } from 'googleapis';

// Google Sheets APIのクライアントを初期化
const getGoogleSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = 'Sheet1'; // スプレッドシートのシート名

export interface FruitRow {
  id: string;
  fruit: string;
  updatedAt: string;
}

// スプレッドシートからデータを取得
export const getSheetData = async (): Promise<FruitRow[]> => {
  const sheets = getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:C`, // A2から開始（ヘッダー行をスキップ）
  });

  const rows = response.data.values || [];
  return rows.map((row) => ({
    id: row[0] || '',
    fruit: row[1] || '',
    updatedAt: row[2] || '',
  }));
};

// スプレッドシートのデータを更新
export const updateSheetData = async (id: string, fruit: string): Promise<void> => {
  const sheets = getGoogleSheetsClient();
  const data = await getSheetData();

  // IDが既存かチェック
  const existingRowIndex = data.findIndex((row) => row.id === id);
  const updatedAt = new Date().toISOString();

  if (existingRowIndex !== -1) {
    // 既存の行を更新（ヘッダー行を考慮してindex+2）
    const rowNumber = existingRowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!B${rowNumber}:C${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[fruit, updatedAt]],
      },
    });
  } else {
    // 新しい行を追加
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, fruit, updatedAt]],
      },
    });
  }
};
