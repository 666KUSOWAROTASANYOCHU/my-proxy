const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cheerio = require('cheerio');

const app = express();

app.use('/proxy/:targetUrl(*)', (req, res, next) => {
    const targetUrl = req.params.targetUrl;
    let origin = "";
    try {
        origin = new URL(targetUrl).origin;
    } catch (e) {
        return res.status(400).send('URLが正しくないよ！');
    }

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        onProxyReq: (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        },
        selfHandleResponse: true,
        onProxyRes: async (proxyRes, req, res) => {
            let body = Buffer.from([]);
            proxyRes.on('data', (data) => { body = Buffer.concat([body, data]); });
            proxyRes.on('end', () => {
                const contentType = proxyRes.headers['content-type'];
                if (contentType && contentType.includes('text/html')) {
                    let html = body.toString();
                    
                    // --- ここからが「魔改造」の追加部分 ---
                    // 1. フルURLをプロキシ経由に
                    html = html.replace(/(href|src)="(?!\/proxy\/)(https?:\/\/[^"]+)"/g, ` $1="/proxy/$2"`);
                    // 2. 「/」から始まる相対パスをプロキシ経由に
                    html = html.replace(/(href|src)="\/(?!\/)/g, `$1="/proxy/${origin}/`);
                    // 3. CSS内のurl()をプロキシ経由に
                    html = html.replace(/url\(['"]?(\/[^'"]+)['"]?\)/g, `url(/proxy/${origin}$1)`);
                    // --- ここまで ---

                    const $ = cheerio.load(html);
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
