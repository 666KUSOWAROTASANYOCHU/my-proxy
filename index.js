const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ターゲットとなるURLを環境変数から読み込むのが一般的です
const TARGET_URL = process.env.TARGET_URL || 'https://example.com';

app.use('/', createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true, // ターゲットのホストヘッダーをターゲットURLに合わせる
    logLevel: 'debug'
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
