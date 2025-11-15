# Google Spreadsheet Web App (Minimum)

GoogleスプレッドシートをDBとして使用するミニマムなWebアプリケーションです。

## 機能

- selectboxで値を選択すると、submitなしでGoogleスプレッドシートが自動更新される
- 既存データの更新と新規データの追加に対応
- サーバーコンポーネントで初期データをSSRし、描画直後から一覧が表示される
- 更新時は既存行の行番号を再利用し、Google Sheets APIへのリクエストを常に1回に抑制

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Google Sheets API v4
- サービスアカウント認証

## アーキテクチャ概要

- `src/app/page.tsx` はサーバーコンポーネントとして `getSheetData` を呼び出し、初回レンダリングで一覧をSSRします。これによりクライアントの`useEffect`による二度描画を防ぎます。
- `src/app/_components/SpreadsheetClient.tsx` はクライアント専用コンポーネントで、SSR結果を初期状態に流し込みます。ユーザー操作時だけクライアント状態を更新します。`_components` のように先頭に `_` を付けているのは、 App Router のルーティング対象から除外されるようにするためです。cf.https://nextjs.org/docs/app/getting-started/project-structure#private-folders
- `src/lib/sheets.ts` では行番号 (`rowNumber`) を付加し、更新時にその番号をAPIへ渡すことで Sheets API を1リクエストで完結させ、読取→書込の競合を回避しています。

## セットアップ手順

### 1. Google Cloud Platformの設定

#### 1-1. プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成

#### 1-2. Google Sheets APIの有効化
1. 「APIとサービス」→「ライブラリ」を開く
2. "Google Sheets API"を検索
3. 「有効にする」をクリック

#### 1-3. サービスアカウントの作成
1. 「APIとサービス」→「認証情報」を開く
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例：spreadsheet-app）
4. 「作成して続行」をクリック
5. ロール選択はスキップ（「続行」をクリック）
6. 「完了」をクリック

#### 1-4. サービスアカウントキーの取得
1. 作成したサービスアカウントをクリック
2. 「鍵」タブを開く
3. 「キーを追加」→「新しい鍵を作成」
4. キーのタイプは「JSON」を選択
5. 「作成」をクリックしてJSONファイルをダウンロード

### 2. Googleスプレッドシートの準備

#### 2-1. スプレッドシートの作成
1. [Google Spreadsheet](https://docs.google.com/spreadsheets/)で新しいスプレッドシートを作成
2. シート名を「Sheet1」にする（デフォルト）
3. ヘッダー行（1行目）に以下を入力：
   - A1: `ID`
   - B1: `Fruit`
   - C1: `UpdatedAt`

#### 2-2. サービスアカウントに権限を付与
1. スプレッドシートの「共有」ボタンをクリック
2. サービスアカウントのメールアドレス（`xxxxx@xxxxx.iam.gserviceaccount.com`）を入力
3. 権限を「編集者」に設定
4. 「送信」をクリック

#### 2-3. スプレッドシートIDの取得
スプレッドシートのURLから取得：
```
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
```

### 3. アプリケーションの設定

#### 3-1. 環境変数の設定
`.env.local.example`を`.env.local`にコピー：
```bash
cp .env.local.example .env.local
```

`.env.local`を編集：
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

**注意**:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: ダウンロードしたJSONファイルの`client_email`
- `GOOGLE_PRIVATE_KEY`: ダウンロードしたJSONファイルの`private_key`（改行コードは`\n`のまま）
- `GOOGLE_SPREADSHEET_ID`: スプレッドシートのURL中のID

#### 3-1-1. GCP設定がどのように機能しているか
- **サービスアカウント認証**: `google.auth.GoogleAuth` に `client_email`/`private_key` を渡すと、OAuth 2.0 のサービスアカウントフローでアクセストークンが自動取得・更新されます。これにより人のログイン無しでアプリがAPIにアクセスできます。
- **シート共有の仕組み**: サービスアカウントをシートの共有に追加すると、そのアカウントが「編集者」として扱われ、Sheets API からのリクエストも同権限で実行されます。鍵を持つアプリだけがセルを変更できます。
- **Sheets API v4 呼び出し**: `google.sheets({version:'v4', auth})` が `spreadsheets.values.get/update/append` などのREST APIをラップしており、内部では `https://sheets.googleapis.com/v4/...` にJSONでリクエストを送信します。本プロジェクトではA2:Cを取得し、既存行は `values.update`、新規は `values.append` で書き込みます。
- **Next.jsとの連携**: サーバーコンポーネントから `getSheetData` を呼ぶと、サーバー上でSheets APIを実行して結果をSSRで埋め込みます。クライアント側では `SpreadsheetClient` がその初期データを受け取りつつ、ユーザー操作時のみ `/api/sheets` を通じて再度Sheets APIを呼びます。これにより秘密鍵はサーバー側に留まり、ブラウザには露出しません。

```
[Browser]
  |  ^                      (SSRで初期データを受け取る)
  |  |
  |  | /api/sheets への fetch
  v  |
[Next.js API Route (src/app/api/...)]
  |
  v
[src/lib/sheets.ts (Google Sheets client)]
  |
  v
[Google Sheets API] -> [Spreadsheet]

※ App Router のサーバーコンポーネント (`src/app/page.tsx`) も `src/lib/sheets.ts` を直接呼び出してSSRしますが、ブラウザからの操作はAPI Routeを経由します。
```

#### 3-1-2. 仕組みを更に理解するためのヒント
- `console.log(await auth.getClient().getAccessToken())` のようにトークンを一度取得してみると、OAuthトークンの存在が確認できます。
- `mitmproxy` などのプロキシでローカルHTTPトラフィックを観察すると、`https://sheets.googleapis.com/v4/spreadsheets/...` へのリクエスト/レスポンスが見えます。
- `curl` + `Authorization: Bearer <token>` で直接 Sheets API を叩くと、サービスアカウントで発行したトークンがREST APIを呼べることが体感できます。
- 同機能を Google Apps Script で作った場合と比べると、サービスアカウント＋Next.js ではCI/CDで鍵を管理してNode.jsから直接シートを制御できる利点が明確になります。

#### 3-2. 依存パッケージのインストール
```bash
npm install
```

#### 3-3. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 使い方

1. **IDを選択**: ドロップダウンからID（1〜5）を選択
2. **フルーツを選択**: ドロップダウンからフルーツ（Apple, Banana, Orange, Grape, Melon）を選択
3. **自動更新**: フルーツ選択後、自動でGoogleスプレッドシートが更新されます
4. **データ確認**: ページ下部のテーブルで現在のデータを確認できます

### 動作
- **新規追加**: 選択したIDが存在しない場合、新しい行が追加されます
- **既存更新**: 選択したIDが存在する場合、そのIDのフルーツと更新日時が更新されます

![デモ動画](./screen.gif)

## トラブルシューティング

### エラー: "Failed to fetch data"
- `.env.local`の設定が正しいか確認
- サービスアカウントにスプレッドシートの権限が付与されているか確認
- Google Sheets APIが有効になっているか確認

### エラー: "Failed to update data"
- スプレッドシートのシート名が「Sheet1」であることを確認
- サービスアカウントの権限が「編集者」であることを確認

## ファイル構成

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── sheets/
│   │   │       └── route.ts      # API Route（GET/POST）
│   │   ├── _components/
│   │   │   └── SpreadsheetClient.tsx  # クライアント専用コンポーネント
│   │   ├── layout.tsx             # レイアウト
│   │   └── page.tsx               # サーバーコンポーネント（初期データ取得）
│   └── lib/
│       └── sheets.ts              # Google Sheets APIヘルパー
├── src/
│   └── types/
│       └── sheets.ts              # スプレッドシート行の型定義（行番号を保持）
├── .env.local                     # 環境変数（gitignore対象）
├── .env.local.example             # 環境変数のサンプル
├── package.json
├── tsconfig.json
└── README.md
```

## 料金について

- Google Sheets API: 無料枠（1日あたり500リクエスト/ユーザー）
- Next.js開発サーバー: 無料
- デプロイ（Vercel等）: 無料枠あり

通常の個人利用であれば完全無料で運用可能です。

## ライセンス

MIT
