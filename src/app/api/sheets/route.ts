import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/sheets';

// GET: スプレッドシートのデータを取得
export async function GET() {
  try {
    const data = await getSheetData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// POST: スプレッドシートのデータを更新
export async function POST(request: NextRequest) {
  try {
    const { id, fruit } = await request.json();

    if (!id || !fruit) {
      return NextResponse.json(
        { error: 'ID and fruit are required' },
        { status: 400 }
      );
    }

    await updateSheetData(id, fruit);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sheet data:', error);
    return NextResponse.json(
      { error: 'Failed to update data' },
      { status: 500 }
    );
  }
}
