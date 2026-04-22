const express = require('express');
const router = express.Router();
const Post = require('../../models/PostSchema');
const SharedLink = require('../../models/SharedLinkSchema');

router.get('/:id', async (req, res) => {
    try {
        const appUrl   = process.env.FRONTEND_URL || 'http://localhost:8100';
        // FILES_URL must be the Railway public domain — req.get('host') returns
        // the Vercel domain when proxied, which doesn't serve /files/
        const filesUrl = process.env.FILES_URL || 'https://api-mylistys-production.up.railway.app/files/';
        let post, postUrl;

        // SharedLink tokens are 48 hex chars; MongoDB ObjectIds are 24
        if (req.params.id.length === 48) {
            const link = await SharedLink.findOne({ token: req.params.id, enabled: true }).lean();
            if (!link) return res.redirect(appUrl);
            post = await Post.findById(link.postId).lean();
            postUrl = `${appUrl}/shared/${req.params.id}`;
        } else {
            post = await Post.findById(req.params.id).lean();
            postUrl = `${appUrl}/adminlist?id=${req.params.id}`;
        }

        if (!post) {
            return res.redirect(appUrl);
        }

        const rawImg    = post.imagen?.[0]?.large ?? post.imagen?.[0]?.medium;
        const imageUrl  = rawImg
            ? (rawImg.startsWith('http') ? rawImg : filesUrl + rawImg)
            : `${appUrl}/assets/logo/logoMyllistys.png`;

        const title       = post.name || 'mylistys';
        const description = (post.description || post.typePostName || 'Descubre contenido en mylistys').slice(0, 200);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title} | mylistys</title>
  <meta property="og:site_name"   content="mylistys" />
  <meta property="og:type"        content="article" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image"            content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type"       content="image/jpeg" />
  <meta property="og:image:width"      content="1200" />
  <meta property="og:image:height"     content="630" />
  <meta property="og:url"              content="${postUrl}" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${imageUrl}" />
  <meta http-equiv="refresh" content="0; url=${postUrl}" />
</head>
<body>
  <a href="${postUrl}">Ver en mylistys</a>
  <script>window.location.replace('${postUrl}');</script>
</body>
</html>`);

    } catch (err) {
        console.error('[share] error:', err.message);
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:8100');
    }
});

module.exports = router;
