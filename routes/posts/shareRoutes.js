const express = require('express');
const router = express.Router();
const Post = require('../../models/PostSchema');
const SharedLink = require('../../models/SharedLinkSchema');

const CRAWLER_RE = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|vkShare|W3C_Validator|bot|crawler|spider/i;

router.get('/:id', async (req, res) => {
    const appUrl    = process.env.FRONTEND_URL || 'https://www.mylistys.com';
    const filesUrl  = process.env.FILES_URL    || 'https://api-mylistys-production.up.railway.app/files/';
    const isCrawler = CRAWLER_RE.test(req.headers['user-agent'] || '');

    try {
        let post, redirectUrl;

        if (req.params.id.length === 48) {
            const link = await SharedLink.findOne({ token: req.params.id, enabled: true }).lean();
            if (!link) return res.redirect(302, appUrl);
            post = await Post.findById(link.postId).lean();
            redirectUrl = `${appUrl}/shared/${req.params.id}`;
        } else {
            post = await Post.findById(req.params.id).lean();
            redirectUrl = `${appUrl}/shared/${req.params.id}`;
        }

        if (!post) return res.redirect(302, appUrl);

        if (!isCrawler) {
            return res.redirect(302, redirectUrl);
        }

        const rawImg   = post.imagen?.[0]?.large ?? post.imagen?.[0]?.medium;
        const imageUrl = rawImg
            ? (rawImg.startsWith('http') ? rawImg : filesUrl + rawImg)
            : `${appUrl}/assets/logo/logoCompartir.jpg`;
        const imgWidth  = rawImg ? '1200' : '737';
        const imgHeight = rawImg ? '630'  : '314';

        const title       = (post.name || 'mylistys').replace(/"/g, '&quot;');
        const description = (post.description || post.typePostName || 'Descubre contenido en mylistys').slice(0, 200).replace(/"/g, '&quot;');
        const canonicalUrl = `${appUrl}/share/${req.params.id}`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title} | mylistys</title>
  <meta property="og:url"              content="${canonicalUrl}" />
  <meta property="og:site_name"        content="mylistys" />
  <meta property="og:type"             content="article" />
  <meta property="og:title"            content="${title}" />
  <meta property="og:description"      content="${description}" />
  <meta property="og:image"            content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type"       content="image/jpeg" />
  <meta property="og:image:width"      content="${imgWidth}" />
  <meta property="og:image:height"     content="${imgHeight}" />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${imageUrl}" />
</head>
<body></body>
</html>`);

    } catch (err) {
        console.error('[share] error:', err.message);
        res.redirect(302, appUrl);
    }
});

module.exports = router;
