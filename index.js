const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cheerio = require('cheerio');

const app = express();

app.use('/proxy/:targetUrl(*)', (req, res, next) => {
    const targetUrl = req.params.targetUrl;
    const origin = new URL(targetUrl).origin;

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        onProxyReq: (proxyReq) => {
            // 【偽装】ブラウザのフリをする
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept-Language', 'ja,en-US;q=0.9,en;q=0.8');
        },
        selfHandleResponse: true, // レスポンスを自分で加工する
        onProxyRes: async (proxyRes, req, res) => {
            let body = Buffer.from([]);
            proxyRes.on('data', (data) => { body = Buffer.concat([body, data]); });
            proxyRes.on('end', () => {
                const contentType = proxyRes.headers['content-type'];
                if (contentType && contentType.includes('text/html')) {
                    // 【改造】HTMLを書き換えて「別タブ移動」などを阻止する
                    let html = body.toString();
                    const $ = cheerio.load(html);
                    
                    // リンクをすべてプロキシ経由に書き換える（力技）
                    $('a').each((i, el) => {
                        const href = $(el).attr('href');
                        if (href && href.startsWith('http')) {
                            $(el).attr('href', `/proxy/${href}`);
                        }
                    });

                    // セキュリティヘッダーを無効化するスクリプトを注入
                    $('head').append('<script>window.onbeforeunload = null; Object.defineProperty(navigator, "webdriver", {get: () => undefined});</script>');
                    
                    res.send($.html());
                } else {
                    res.end(body);
                }
            });
        }
    })(req, res, next);
});

app.get('/', (req, res) => res.send('最強版プロキシ起動中！'));
app.listen(process.env.PORT || 10000);
