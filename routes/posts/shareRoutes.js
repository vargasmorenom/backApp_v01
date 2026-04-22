const express = require('express');
const router = express.Router();
const Post = require('../../models/PostSchema');

router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).lean();

        if (!post) {
            return res.redirect(process.env.FRONTEND_URL || 'http://localhost:8100');
        }

        const appUrl    = process.env.FRONTEND_URL || 'http://localhost:8100';
        const backUrl   = process.env.API_BASE_URL  || 'http://localhost:8080';
        const filesUrl  = `${backUrl}/files/`;
        const postUrl   = `${appUrl}/adminlist?id=${post._id}`;

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
  <meta property="og:image"       content="${imageUrl}" />
  <meta property="og:url"         content="${postUrl}" />
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
