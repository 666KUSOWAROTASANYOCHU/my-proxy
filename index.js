const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 使い方: https://自分のURL.onrender.com/proxy/https://google.com みたいな感じ
app.use('/proxy/:targetUrl(*)', (req, res, next) => {
    const targetUrl = req.params.targetUrl;
    
    if (!targetUrl) {
        return res.send('URLの末尾に /proxy/https://〜 を付けてね');
    }

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: {
            [`^/proxy/${targetUrl}`]: '', // 余計なパスを消す
        },
        router: () => targetUrl, // ここで動的にターゲットを決定
        onError: (err, req, res) => {
            res.status(500).send('プロキシエラー: URLが正しいか確認してね');
        }
    })(req, res, next);
});

// トップページにアクセスした時の案内
app.get('/', (req, res) => {
    res.send('動的プロキシ起動中！末尾に /proxy/https://サイト名 を付けてアクセスしてね');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
