import { google } from 'googleapis';
import type { FruitRow } from '@/types/sheets';

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

// スプレッドシートからデータを取得
export const getSheetData = async (): Promise<FruitRow[]> => {
  const sheets = getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:C`, // A2から開始（ヘッダー行をスキップ）
  });

  const rows = response.data.values || [];
  return rows.map((row, index) => ({
    id: row[0] || '',
    fruit: row[1] || '',
    updatedAt: row[2] || '',
    // indexは0スタートなのでヘッダー行を考慮して+2する
    rowNumber: row[0] ? index + 2 : undefined,
  }));
};

interface UpdateSheetDataInput {
  id: string;
  fruit: string;
  rowNumber?: number;
}

// スプレッドシートのデータを更新
export const updateSheetData = async ({
  id,
  fruit,
  rowNumber,
}: UpdateSheetDataInput): Promise<void> => {
  const sheets = getGoogleSheetsClient();

  const updatedAt = new Date().toISOString();

  if (rowNumber) {
    // 既存行はクライアントが持つ行番号を使い、二重リクエストを発生させない
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!B${rowNumber}:C${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[fruit, updatedAt]],
      },
    });
    return;
  }

  // 新しい行を追加
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:C`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, fruit, updatedAt]],
    },
  });
};
