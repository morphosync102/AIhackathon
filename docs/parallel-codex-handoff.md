# 並列 Codex 受け渡し仕様書

## 目的

タービン・ワードクリッカーを複数の Codex で並列開発するときの作業範囲、固定 API、統合順を揃える。  
プロダクト仕様の正は `docs/turbine-word-clicker-spec.md` とし、この文書は並列作業と受け渡しの正とする。

## 全体方針

- 作業ブランチは `demo`。
- `main` は Markdown 方針リポジトリとして維持する。
- スタックは Vite + React + Express。
- AI API は Gemini API。
- 最初の目標は、30 分以内に「入力 -> energy 増加 -> タービン加速 -> レベル表示」を動かすこと。
- Gemini API が未完成または失敗しても、mock/fallback で UI を止めない。
- 各 Codex は担当ファイルを優先し、他レーンの主担当ファイルを必要なく編集しない。

## 固定 API

```http
POST /api/analyze-word
```

### Request

```json
{
  "text": "ユーザー入力",
  "currentLevel": 1,
  "currentEnergy": 20
}
```

### Response

```json
{
  "summary": "短い要約",
  "energy": 24,
  "type": "発想",
  "reason": "判定理由",
  "comment": "タービン演出用コメント"
}
```

- `energy` は 1 から 50 の整数。
- `type` は `発想`、`感情`、`行動`、`混沌`、`静寂` のいずれか。
- API 失敗時は fallback で `energy: 12`、`type: "混沌"` を返す。
- 空入力は frontend で止め、API には送らない。

## Lane A: App Shell / Game State

### 担当

- Vite + React の土台。
- 入力フォーム。
- 「言葉を流す」ボタン。
- ゲーム状態。
- レベル計算。
- API 呼び出しの接続点。

### 主担当ファイル

- `src/App.jsx`
- `src/gameLogic.js`
- `src/api.js`

### 完了条件

- mock response で文章入力から `energy` 増加まで動く。
- 累計エネルギー、レベル、直近の `type`、`comment` が画面に出る。
- `Turbine` へ `level`、`energy`、`type`、`boosting` を渡せる。
- 空入力でエラーを表示し、API を呼ばない。

### そのまま渡すプロンプト

```txt
demo ブランチで Vite + React アプリの土台を作ってください。
docs/turbine-word-clicker-spec.md と docs/parallel-codex-handoff.md に従い、まず Gemini API なしの mock response で動く状態にしてください。

担当:
- src/App.jsx
- src/gameLogic.js
- src/api.js

優先:
30分以内に、文章入力 -> energy増加 -> レベル表示 -> タービンが速くなる、まで動かしてください。

固定 API は POST /api/analyze-word です。
Response は { summary, energy, type, reason, comment } です。
```

## Lane B: Gemini API

### 担当

- Express server。
- `POST /api/analyze-word`。
- Gemini API 呼び出し。
- JSON response の正規化。
- fallback response。

### 主担当ファイル

- `server.mjs`
- `.env.example`

### 完了条件

- `POST /api/analyze-word` が固定 response shape を返す。
- Gemini API キーは環境変数から読む。
- API キー、環境変数、プロンプト全文をブラウザに返さない。
- Gemini API 失敗時も fallback response を返し、HTTP 500 で UI を止めない。

### そのまま渡すプロンプト

```txt
demo ブランチで Express の POST /api/analyze-word を実装してください。
docs/turbine-word-clicker-spec.md と docs/parallel-codex-handoff.md の固定 API に従ってください。

Request:
{ text, currentLevel, currentEnergy }

Response:
{ summary, energy, type, reason, comment }

type は 発想/感情/行動/混沌/静寂 のいずれかです。
energy は 1-50 の整数です。
Gemini API 失敗時は fallback response を返し、UI を止めないでください。
API キーは環境変数のみで扱い、ブラウザに出さないでください。
```

## Lane C: Turbine Visual / Animation

### 担当

- 中央タービンの見た目。
- CSS 回転アニメーション。
- レベル別サイズ、光、回転速度。
- 入力直後の一瞬加速演出。
- エネルギーゲージ。
- `type` 別カラー。

### 主担当ファイル

- `src/components/Turbine.jsx`
- `src/components/EnergyPanel.jsx`
- `src/styles.css`

### 完了条件

- `Turbine` が `level`、`energy`、`type`、`boosting` を props で受け取る。
- レベルが上がるほどタービンの見た目と回転速度が強くなる。
- `boosting` が true の間、一瞬強く回る。
- `EnergyPanel` がレベル、累計エネルギー、次の成長までのゲージを表示する。

### そのまま渡すプロンプト

```txt
demo ブランチで中央タービンの見た目とアニメーションを作ってください。
docs/turbine-word-clicker-spec.md と docs/parallel-codex-handoff.md に従ってください。

担当:
- src/components/Turbine.jsx
- src/components/EnergyPanel.jsx
- src/styles.css

Turbine は props として level, energy, type, boosting を受け取る想定です。
レベルと type に応じて、サイズ、光、回転速度、色が変わるようにしてください。
最優先は、初見で「言葉を入れるとタービンが育って回る」と分かる見た目です。
```

## Lane D: Demo Safety / Review

### 担当

- サンプル入力。
- ローディング文言。
- エラー文言。
- Chrome とモバイル幅の確認。
- Gemini API 失敗時の確認。
- API キー、環境変数、プロンプト全文の露出確認。
- 審査員目線レビュー。

### 主担当ファイル

- `src/sampleInputs.js`
- 必要なら `docs/demo-checklist.md`

### 完了条件

- サンプル入力が 3 つある。
- ローディング文言が「言葉を風に変換中」になっている。
- 空入力、AI 失敗、通信失敗のエラー文言がある。
- Chrome のシークレットウィンドウで最初に押すボタンが分かる。
- モバイル幅で入力、タービン、結果表示が重ならない。

### そのまま渡すプロンプト

```txt
demo ブランチの実装を審査員目線で確認してください。
docs/turbine-word-clicker-spec.md、docs/parallel-codex-handoff.md、docs/demo-checklist.md、.agents/skills/testing-demo-safety/SKILL.md を参照してください。

担当:
- src/sampleInputs.js
- 必要なら docs/demo-checklist.md

確認:
- サンプル入力3つ
- ローディング文言
- 空入力/AI失敗/通信失敗のエラー文言
- Chrome シークレットウィンドウでの操作性
- モバイル幅
- APIキー/環境変数/プロンプト全文が露出していないこと
```

## 統合順

1. Lane A が mock response でゲーム状態を動かす。
2. Lane C が `Turbine` と `EnergyPanel` を props 接続できる形で渡す。
3. Lane A が Lane C のコンポーネントを画面に接続する。
4. Lane B が `POST /api/analyze-word` を完成させる。
5. Lane A が `src/api.js` から Lane B の API に接続する。
6. Lane D がサンプル入力、ローディング、エラー、Chrome/モバイル確認を行う。
7. 最後に `testing-demo-safety` で提出可否を確認する。

## 60 分時点の判断

- 入力からタービン加速まで動いているなら、この案を継続する。
- Gemini API が不安定でも、fallback でゲームが動くなら継続する。
- タービンの見た目が弱い場合は、別案ではなく演出強化を優先する。
- 入力、タービン、結果表示のどれかが成立していない場合だけ、別案を短期検証する。

## 最終チェック

- 提出 URL が Chrome のシークレットウィンドウで開く。
- サンプル入力から 1 回で結果が出る。
- タービンが加速し、エネルギーとレベルが変わる。
- AI が判定した `type`、`reason`、`comment` が見える。
- Gemini API 失敗時も fallback で遊べる。
- API キーや環境変数が画面やブラウザに出ていない。
