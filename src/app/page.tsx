import SpreadsheetClient from './_components/SpreadsheetClient';
import { getSheetData } from '@/lib/sheets';

export default async function Home() {
  // 最新のNext.js推奨であるサーバーコンポーネント側でデータを取得してからクライアントに引き渡す
  const data = await getSheetData();
  return <SpreadsheetClient initialData={data} />;
}
