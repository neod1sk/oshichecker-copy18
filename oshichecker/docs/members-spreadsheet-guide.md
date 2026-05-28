# メンバーデータだけをスプレッドシート管理する手順

初心者向けに、できるだけシンプルにまとめています。  
この手順では `members.json` だけを更新します。

## 全体の流れ

1. 既存データをCSVに自動出力（初回だけ）
2. Googleスプレッドシートで4つのシートを作る
3. CSVを取り込む
4. スプレッドシートで編集する
5. CSVを書き出して `data/sheet-csv/` に置く
6. `npm run build:data:members` を実行

---

## 1. シートを4つ作る（名前はこの通り）

- `members`
- `member_tags`
- `member_scores`
- `member_covers`

---

## 1.5 初回は自動でCSVを作る（手入力ゼロ）

まずプロジェクトで次を実行してください。

```bash
npm run export:data:members
```

これで次の4ファイルが自動生成されます。

- `data/sheet-csv/members.csv`
- `data/sheet-csv/member_tags.csv`
- `data/sheet-csv/member_scores.csv`
- `data/sheet-csv/member_covers.csv`

この4ファイルをGoogleスプレッドシートへインポートすれば、最初の手入力は不要です。

---

## 2. 1行目のヘッダーをコピペする（タブ区切り）

貼り付け前に `Esc` を押して、セルの編集モードを解除してください。  
そのあと A1 を1回クリックして貼ると分割されやすいです。

### `members` シートの1行目

```text
id	name	nameKo	nameEn	groupId	xUrl	photoUrl	jpSupport
```

### `member_tags` シートの1行目

```text
memberId	tag1	tag2	tag3
```

### `member_scores` シートの1行目

```text
memberId	(2列目以降は scoreKey を列名にする)
```

### `member_covers` シートの1行目

```text
memberId	(2列目以降は artistKey を列名にする)
```

---

## 3. 入力例（そのままコピペOK / タブ区切り）

### `members`

```text
id	name	nameKo	nameEn	groupId	xUrl	photoUrl	jpSupport
member-01	ハルナ	하루나	HARUNA	KOKOIYA	https://x.com/kokoiya_haruna	https://example.com/haruna.jpg	some
member-02	まつ	마츠	MATSU	KOKOIYA	https://x.com/kokoiya_matsu	https://example.com/matsu.jpg	no
```

### `member_tags`

```text
memberId	tag1	tag2	tag3
member-01	sexy	kind	facial
member-02	dance	vocal	charming
```

### `member_scores`

```text
memberId	genre_denpa	sexy	genre_orthodox	dance
member-01	1	2		
member-02			2	3
```

### `member_covers`

```text
memberId	artist_chula	artist_nonfict	artist_ilife
member-01	2	1	
member-02			1
```

---

## 4. 入力ルール（ここだけ注意）

- `id` と `memberId` は一致させる（例: `member-01`）
- `member_tags` は `tag1` `tag2` `tag3` に横並びで入力する（空欄OK）
- `member_scores` と `member_covers` も横並びで入力する（空欄OK）
- `groupId` は既存の `data/groups.json` にあるIDを使う
- `jpSupport` は `ok` / `some` / `unknown` / `no` のどれか
- `score` は数字（1,2,3...）
- 同じメンバーにタグやスコアを複数つけるときは、行を増やす

---

## 5. CSV書き出しと配置

各シートを「CSV」でダウンロードして、次の場所に保存します。

- `data/sheet-csv/members.csv`
- `data/sheet-csv/member_tags.csv`
- `data/sheet-csv/member_scores.csv`
- `data/sheet-csv/member_covers.csv`

---

## 6. JSON生成コマンド

```bash
npm run build:data:members
```

成功すると `data/members.json` が更新されます。

---

## よくあるエラー

- `memberId 'xxx' not found`  
  -> `members` シートにその `id` がありません
- `duplicate id`  
  -> `members` シートで `id` が重複しています
- `score is not a valid number`  
  -> `score` 列に文字が入っています
