# 推しチェッカー（Oshi Checker）

韓国地下アイドルのメンバー個人を推薦する診断サイト

## 🎯 機能

- **アンケート診断**: 6問の質問で好みを分析
- **二択バトル**: 8名の候補から10回の対戦
- **結果発表**: TOP3の推しメンバーを表示
- **シェア機能**: Xでの結果シェア、画像保存

## 🌐 多言語対応

- 🇯🇵 日本語
- 🇰🇷 韓国語
- 🇺🇸 英語

## 🛠 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **i18n**: next-intl

## 🚀 セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 画像保存機能を有効にする場合
npm install html-to-image

# スプレッドシートCSVからデータJSONを生成
npm run build:data:csv

# メンバーデータだけCSVから生成
npm run build:data:members

# members.json から4CSVを自動出力
npm run export:data:members
```

## 📁 プロジェクト構成

```
oshichecker/
├── app/[locale]/      # ページ（i18n対応）
├── components/        # UIコンポーネント
├── context/           # 状態管理
├── data/              # JSON データ
├── lib/               # ユーティリティ
├── messages/          # 翻訳ファイル
└── public/            # 静的ファイル
```

## 📱 スクリーンショット

<!-- スクリーンショットを追加 -->

## 📄 ライセンス

MIT License
