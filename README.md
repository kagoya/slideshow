# Private Photo Slide — GitHub Pages prototype

## 起動
フォルダーの内容をリポジトリのルートへ配置し、Settings → Pages → Deploy from a branch → main / (root) を選択。
公開後の index.html を開き、デモ専用パスワード `Demo-Photo-2026!` で「開く」→「再生」。サンプル3枚は生成した風景イラストで実写ではありません。
ローカル確認は `python3 -m http.server 8000` → http://localhost:8000 。file:// で直接開かないでください。HTTPSまたはlocalhostが必要です。

## スマホで追加
再生画面の「写真を追加・QR」を押しスマホで読む。初回はユーザー名、リポジトリ、ブランチを入力。
GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens で対象リポジトリだけを選び Contents: Read and write を付与（短い有効期限を推奨）。PATはスマホの入力欄にのみ入力し、チャットやコードへ貼り付けない。
複数写真を選択しアルバムのパスワードを入れて送信。既存の最初の画像の復号でパスワード一致を確認します。サンプルへの追加はデモ用パスワードです。
写真は長辺1920pxのJPEGへ変換し、位置情報等の元メタデータを引き継がず暗号化。HEIC等は端末のブラウザーが読める場合のみ。失敗時はJPEGを選択してください。
送信は直列で、各画像と一覧を別コミットで更新。中断時に一覧未登録の暗号化ファイルが残ることがあります。再送は重複追加になる場合があります。複数端末での同時送信は避けてください。
GitHub Pagesの反映後、再生中のページは60秒ごとに一覧更新。QRにはパスワード・PATを入れません。再生URLへ ?owner=USER&repo=REPO&branch=main を付けるとQRへ公開設定を引き継ぎます。

## 実写真の前に
サンプルをphotosから削除、manifest.jsonのitemsを空配列にして公開してから、12文字以上の強い独自パスフレーズで追加。デモ用パスワードは公開されているので秘密を守れません。
アップロード済み写真と異なるパスワードを混在させない。失念時は復元不可。PATと復号パスワードは別物で、いずれも永続保存しません。
暗号形式 PS01: magic 4 bytes + salt 16 + IV 12 + AES-256-GCM ciphertext/tag。PBKDF2-SHA256 600000回、ファイルごとに独立乱数。ファイル数・容量・更新履歴は公開されます。
復号後画像はブラウザーのメモリー内に保持。ブラウザーが完全に無痕跡であることは保証しません。配信JavaScriptが改ざんされればパスワードを盗めるため、GitHubアカウントと配信コードを保護してください。
Gitは削除しても履歴が残ります。大量写真の保管庫には不向き。写真とサイトを合わせて小規模に抑え、GitHub Pagesの容量・帯域制限に従ってください。

## 検証範囲
暗号化サンプルの復号、誤パスワード拒否、改ざん拒否、JS構文、QR生成を対象。実GitHubへの書き込み・Pages公開・iPhone/Tesla実機の動作は別途確認が必要です。TeslaでWeb Cryptoと画像表示が動くことを停車中に検証してください。

## 外部ライブラリ
vendor/qrcode.js: qrcode-generator 1.4.4, Kazuhiko Arase, MIT License（ファイル内表記参照）。外部CDNへの実行時依存なし。
GitHub API: https://docs.github.com/en/rest/repos/contents
