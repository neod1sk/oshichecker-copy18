# スプレッドシート設計（推奨）

このプロジェクトは最終的に `data/*.json` を読み込みます。  
運用は「スプレッドシート編集 -> CSV書き出し -> JSON生成」を推奨します。

---

## 1) シート一覧

1. `groups`
2. `members`
3. `member_tags`
4. `member_scores`
5. `member_covers`
6. `jp_artists`
7. `questions`
8. `question_options`

---

## 2) 各シート列定義

### `groups`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| id | yes | KOKOIYA | グループID（重複不可） |
| name | yes | KOKOIYA | 表示名（既定） |
| nameJa | no | KOKOIYA | 日本語名（任意） |
| nameKo | no | 코코이야 | 韓国語名（任意） |
| nameEn | no | KOKOIYA | 英語名（任意） |
| color | no | #FF6B9D | テーマカラー（任意） |
| blogUrl | no | https://... | 紹介記事URL（任意） |

### `members`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| id | yes | member-01 | メンバーID（重複不可） |
| name | yes | ハルナ | 表示名（既定） |
| nameKo | no | 하루나 | 韓国語名 |
| nameEn | no | HARUNA | 英語名 |
| groupId | yes | KOKOIYA | `groups.id` を参照 |
| xUrl | no | https://x.com/... | X URL |
| photoUrl | yes | https://...jpg | 写真URL |
| jpSupport | yes | ok / some / unknown / no | 日本語対応 |

### `member_tags`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| memberId | yes | member-01 | `members.id` を参照 |
| tag | yes | sexy | タグ1件ずつ |

### `member_scores`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| memberId | yes | member-01 | `members.id` を参照 |
| scoreKey | yes | genre_denpa | スコアキー |
| score | yes | 2 | 数値（整数推奨） |

### `member_covers`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| memberId | yes | member-01 | `members.id` を参照 |
| artistKey | yes | artist_bish | `artist_` で始まるキー |
| score | yes | 1 | カバー強度 |

### `jp_artists`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| id | yes | bish | 表示用ID |
| label | yes | BiSH | 表示ラベル |
| key | yes | artist_bish | アプリ内部キー |

### `questions`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| id | yes | q_cover_artist | 質問ID |
| type | no | single / multi | 未指定時は single 扱い |
| minSelect | no | 1 | multi の最小選択数 |
| maxSelect | no | 5 | multi の最大選択数 |
| text | yes | 好きな... | 日本語表示文 |
| textKo | no | 좋아하는... | 韓国語表示文 |
| textEn | no | Favorite... | 英語表示文 |
| sortOrder | no | 20 | 質問順（小さい順） |

### `question_options`

| 列名 | 必須 | 例 | 説明 |
|---|---|---|---|
| questionId | yes | q_cover_artist | `questions.id` を参照 |
| optionId | no | artist_bish | 選択肢ID（任意） |
| text | yes | BiSH | 日本語表示文 |
| textKo | no | BiSH | 韓国語表示文 |
| textEn | no | BiSH | 英語表示文 |
| scoreKey | yes | artist_bish | 単一加点キー |
| scoreValue | no | 1 | 単一加点値 |
| scoresJson | no | {"artist_bish":1} | 複数キー加点する場合 |
| sortOrder | no | 100 | 選択肢順（小さい順） |

`scoresJson` が空なら、`scoreKey` + `scoreValue` を使います。

---

## 3) 生成コマンド

```bash
npm run build:data:csv
```

実行すると以下が更新されます。

- `data/groups.json`
- `data/members.json`
- `data/jpArtists.json`
- `data/questions.json`

---

## 4) 運用ルール（事故防止）

- IDは絶対に再利用しない（rename時も新規ID推奨）
- `memberId`, `groupId`, `questionId` の参照先を消すときは先に参照側を整理
- `artistKey` は `jp_artists.key` と同一語彙を使う
- 文字列の前後スペースを入れない
- 変更後は必ず `npm run build:data:csv` を通して差分確認
