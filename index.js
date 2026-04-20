const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. メインのプロキシ設定
const proxy = createProxyMiddleware({
    target: 'https://www.google.com', // デフォルト
    changeOrigin: true,
    router: (req) => {
        // URLに /proxy/http... が含まれていたら、そこをターゲットにする
        if (req.url.includes('/proxy/')) {
            const url = req.url.split('/proxy/')[1];
            return url.startsWith('http') ? url : 'https://' + url;
        }
    },
    pathRewrite: (path, req) => {
        // /proxy/http... という文字を消して、相手サイトにリクエストを送る
        return path.replace(/\/proxy\/https?:\/\/[^/]+/, '') || '/';
    },
    onProxyRes: (proxyRes, req, res) => {
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
    }
});

// 2. すべてのリクエストをプロキシに放り込む
app.use('/proxy/:targetUrl(*)', proxy);

// 3. /proxy を通らない「はぐれリクエスト（/search など）」を救済する
app.use((req, res, next) => {
    if (req.url !== '/' && !req.url.startsWith('/proxy/')) {
        console.log("救済リクエスト:", req.url);
        // 直前のページ（Referer）を見て、どこから来たか推測してプロキシし直す
        // ※これが簡易プロキシの限界ですが、検索などはこれで動く確率が上がります
        res.redirect(307, `/proxy/https://www.google.com${req.url}`);
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    res.send('動的プロキシ起動中！末尾に /proxy/https://... を付けてね');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
