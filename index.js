const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/proxy/:targetUrl(*)', (req, res, next) => {
    const targetUrl = req.params.targetUrl;
    
    if (!targetUrl || !targetUrl.startsWith('http')) {
        return res.status(400).send('URLは /proxy/https://... の形式で入力してね。');
    }

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        secure: false, // SSL証明書の検証を甘くする
        followRedirects: true,
        cookieDomainRewrite: "", // クッキーを自分のドメインに書き換える
        onProxyRes: (proxyRes, req, res) => {
            // YouTubeなどの「別のタブで開け」「他所で表示するな」という命令を削除
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['content-security-policy-report-only'];
            
            // CORS（違うドメイン同士の通信）を許可する設定を追加
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        },
        pathRewrite: (path) => {
            return ''; 
        }
    })(req, res, next);
});

app.get('/', (req, res) => {
    res.send('動的プロキシ起動中！末尾に /proxy/https://www.youtube.com などを付けてね。');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
