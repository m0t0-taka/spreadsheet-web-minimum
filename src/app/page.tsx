'use client';

import { useState, useEffect } from 'react';

interface FruitRow {
  id: string;
  fruit: string;
  updatedAt: string;
}

const FRUITS = ['Apple', 'Banana', 'Orange', 'Grape', 'Melon'];
const IDS = ['1', '2', '3', '4', '5'];

export default function Home() {
  const [data, setData] = useState<FruitRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedFruit, setSelectedFruit] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // 初回データ取得
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sheets');
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('データの取得に失敗しました');
    }
  };

  // フルーツが選択されたら自動で更新
  const handleFruitChange = async (fruit: string) => {
    setSelectedFruit(fruit);

    if (!selectedId) {
      setMessage('IDを選択してください');
      return;
    }

    setLoading(true);
    setMessage('更新中...');

    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedId, fruit }),
      });

      if (response.ok) {
        setMessage('✓ 更新完了');
        await fetchData(); // データを再取得
      } else {
        setMessage('更新に失敗しました');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      setMessage('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '30px' }}>Google Spreadsheet Web App</h1>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            ID を選択:
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              width: '200px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="">選択してください</option>
            {IDS.map((id) => (
              <option key={id} value={id}>
                ID: {id}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            フルーツを選択:
          </label>
          <select
            value={selectedFruit}
            onChange={(e) => handleFruitChange(e.target.value)}
            disabled={!selectedId || loading}
            style={{
              padding: '10px',
              fontSize: '16px',
              width: '200px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              opacity: !selectedId || loading ? 0.5 : 1,
            }}
          >
            <option value="">選択してください</option>
            {FRUITS.map((fruit) => (
              <option key={fruit} value={fruit}>
                {fruit}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div style={{
            padding: '10px',
            backgroundColor: message.includes('✓') ? '#d4edda' : '#f8d7da',
            color: message.includes('✓') ? '#155724' : '#721c24',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ marginBottom: '15px' }}>現在のデータ</h2>
        {data.length === 0 ? (
          <p style={{ color: '#666' }}>データがありません</p>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Fruit</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{row.id}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{row.fruit}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleString('ja-JP') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
