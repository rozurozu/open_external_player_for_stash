# Open External Player for Stash

Stash のシーン詳細ページにある「Path」をクリックしたとき、サーバーではなく“ブラウザを開いている macOS 側”で IINA を起動して再生します。サーバーが Raspberry Pi/Docker でも利用可能。追加ライブラリ不要。

## 前提
- macOS に IINA がインストールされていること
- `iina://` スキームが有効であること
- クライアント(macOS)から動画ファイルへ到達できること（Finder のマウント `file:///Volumes/...` もしくは `smb://...`）。

## 導入手順
1) フォルダを配置
- `open-external-player-for-stash/` を Stash の `plugins` ディレクトリに配置（Docker なら該当パスをコンテナにマウント）。

2) プラグインを有効化
- Stash の Settings → Plugins で「Open External Player for Stash」を有効化。

3) 設定（重要）
- Server Path Prefix（サーバ側の実パスの先頭）
  - Path リンクの実際の表記で決める。
    - 「file://data/video/...」型 → `/video`
    - 「file:///data/video/...」型 → `/data/video`
  - 迷ったら、Path を右クリック→リンクアドレスをコピーして確認。
- Client Path Prefix（macOS から到達可能な URL 先頭）
  - Finder マウント利用例: `file:///Volumes/utatane/video`
  - 直接 SMB 利用例: `smb://192.168.1.11/utatane/video`

## 使い方
- シーン詳細ページで「Path」をクリック → IINA が起動して該当ファイルを再生。

## 動作確認のコツ
- ブラウザのアドレスバーで次を実行し、IINA が起動するか確認:
  - `iina://open?url=file:///Volumes/utatane/video/test.mp4`
- DevTools で Path 要素を確認:
  - `document.querySelector("dt + dd a.open-in-iina")` が要素を返せばプラグインが動作中。

## よくあるつまずき
- IINA が起動しない: プラグインが有効化されていない、またはブラウザがスキーム起動をブロック。上の手動テストで動くか確認。
- パス変換が合わない: Server/Client Prefix の前方一致置換が想定どおりか再確認（`/video` と `/data/video` の違いに注意）。
- SMB 認証: IINA(mpv) が共有へアクセスできる必要あり。Finder で事前にマウントすると安定。

## 仕様メモ
- クライアントサイドのみで動作。サーバー側でプロセスは起動しない。
- 追加の Userscript ライブラリに依存しない。
