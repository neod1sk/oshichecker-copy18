# Spreadsheet CSV Input

`data/sheet-csv` は、Googleスプレッドシートから書き出したCSVを置く場所です。  
以下のファイル名で保存してください。

- `groups.csv`
- `members.csv`
- `member_tags.csv`
- `member_scores.csv`
- `member_covers.csv`
- `jp_artists.csv`
- `questions.csv`
- `question_options.csv`

## 手順

1. スプレッドシートの各シートを CSV でダウンロード
2. このフォルダに上記ファイル名で保存
3. ルートで `npm run build:data:csv` を実行
4. `data/*.json` が更新される

## 列定義

詳しい列定義は `docs/spreadsheet-data-design.md` を参照してください。
