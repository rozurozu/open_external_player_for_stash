# Repository Guidelines

## Project Structure & Module Organization
- Root-level plugin with two files:
  - `open-external-player-for-stash.yml`: Plugin manifest (name, version, settings, JS entry).
  - `open-external-player-for-stash.js`: UI script injected by Stash.
- No build system, packages, or submodules. Keep logic self-contained in the JS file.

## Build, Test, and Development Commands
- Build: none (plain JavaScript loaded by Stash).
- Run locally: enable the plugin in Stash → Settings → Plugins, ensure `ui.javascript` points to `open-external-player-for-stash.js`.
- Deploy/update: edit the JS, bump `version` in the YAML, then reload the Stash UI (hard refresh) or restart Stash if caching interferes.

## Coding Style & Naming Conventions
- Language: vanilla ES2015+; no external dependencies.
- Indentation: 2 spaces; keep lines concise; use semicolons.
- Prefer `const`/`let`, small pure helpers, and early returns.
- Naming: lowerCamelCase for functions/vars; UPPER_SNAKE_CASE for constants (e.g., `PLUGIN_ID`).
- Keep DOM queries and side effects isolated; avoid globals beyond the IIFE wrapper.

## Testing Guidelines
- Manual verification in the Stash UI:
  - Open a Scene page; click the Path link; IINA should launch.
  - Test path mapping with settings:
    - Server Prefix: `/video`
    - Client Prefix: `file:///Volumes/utatane/video`
    - Example: `/video/movies/foo.mkv` → `file:///Volumes/utatane/video/movies/foo.mkv`.
- Use DevTools (Console/Network) to inspect GraphQL config fetch and URL generation.
- No automated tests; keep changes small and measurable.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject (≤72 chars). Add a brief body if needed. Reference issues.
- PRs must include:
  - What changed and why; before/after behavior.
  - Screenshots or a short screen capture if UI behavior changed.
  - Version bump in `open-external-player-for-stash.yml` when behavior changes.
  - Notes on manual test steps performed.

## Security & Configuration Tips
- The script opens `iina://` URLs. Verify prefixes so generated paths resolve only to expected mounts.
- Do not introduce remote requests beyond Stash’s `/graphql`.
- Avoid storing secrets; settings live in Stash configuration.

## 日本語補足

### ランタイム動作
- ブラウザ側のみで動作（クライアントサイド）。Stash サーバー側でコードは実行しない。
- 7dJx1qP の Userscript Library には依存しない。

### パス変換の注意
- Server Path Prefix は、UIに表示される Path リンクの表記で決める。
  - 表記が「file://data/video/...」なら Server Prefix は「/video」。
  - 表記が「file:///data/video/...」なら Server Prefix は「/data/video」。
- Client Path Prefix は、クライアント（macOS）から実際に到達できるURL形式で指定する。
  - Finderマウントを使う場合は「file:///Volumes/<mount>/...」。
  - 直接 SMB にアクセスする場合は「smb://<host>/<share>/...」。
- 例: 「/data/video/movies/foo.mkv」→「file:///Volumes/utatane/video/movies/foo.mkv」。

### ブラウザとURLスキーム
- スクリプトは「iina://open?url=<URL>」を発行して IINA を起動する。
- 事前確認: ブラウザに「iina://open?url=file:///Volumes/utatane/video/test.mp4」を貼り付け、IINA が起動するか確認する（スキームがブラウザで許可されているかの確認）。

### トラブルシュート
- Stash の Plugins で「Open External Player for Stash」が有効になっているか。
- シーン詳細ページの「Path」リンクに `open-in-iina` クラスが付いているか（DevTools で確認）。
- IINA が起動しない場合:
  - まず URL スキーム（上記の手動テスト）で起動できるか確認。
  - 次に Server/Client Prefix の前方一致置換が正しいか見直す。

### 備考
- ページ遷移検知は `location.href` の変化を 200ms 間隔で監視している（必要ならコード側で調整可能）。
- 仕様変更や挙動変更を行った場合は、YAML の `version` を更新し、Stash UI をリロードする。
