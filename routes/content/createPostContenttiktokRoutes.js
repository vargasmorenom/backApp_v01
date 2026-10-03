const express = require('express');
const { Types } = require('mongoose');
const Post = require('../../models/PostSchema');
const resolveTiktokShortUrl = require('../../helpers/resolveTikTokShortUrl');

const router = express.Router();

router.put("/", async (req, res) => {
   
    try {


      const { postId, url, typePost, titulo: tituloFront } = req.body;

      let urlcode = url;
     const tiktokRegex = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/((@[a-zA-Z0-9_.-]+\/(video|photo)\/\d+)|([a-zA-Z0-9]+\/))(\?.*)?$/;


      
      // Validar que se recibieron los datos necesarios
      if (!postId || !url || !typePost) {
        return res.status(400).json({ message: "Datos incompletos" });

      }
      

      if(!tiktokRegex.test(url)){

        return res.status(201).json({ message: "el contenido no corresponde a tiktok" });
      }

     
      const postExists = await Post.exists({ _id: postId });

      if (!postExists) {
        return res.status(404).json({ message: "Post no encontrado" });
      }

      const resolvedUrl = await resolveTiktokShortUrl(url);
      urlcode = resolvedUrl || url;

      // Formatos posibles tras resolver: /@usuario/(video|photo)/ID o m.tiktok.com/v/ID.html
      const canonica = urlcode.match(/tiktok\.com\/@([^/?#]+)\/(video|photo)\/(\d+)/);
      const movil = urlcode.match(/tiktok\.com\/v\/(\d+)\.html/);

      if (!canonica && !movil) {
        return res.status(201).json({ message: "No se pudo obtener el video de TikTok desde el enlace" });
      }

      const usuario = canonica ? canonica[1] : null;
      const tipo = canonica ? canonica[2] : 'video';
      const idvideo = canonica ? canonica[3] : movil[1];
      const urlLimpia = usuario
        ? `https://www.tiktok.com/@${usuario}/${tipo}/${idvideo}`
        : `https://m.tiktok.com/v/${idvideo}.html`;

      const fetch = globalThis.fetch;
      const apiUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(urlLimpia)}`;
      let data = {};
      try {
        const response = await fetch(apiUrl);
        if (response.ok) data = await response.json();
        else console.warn(`oEmbed de TikTok respondió ${response.status} para ${urlLimpia}`);
      } catch (err) {
        console.warn('No se pudo consultar oEmbed de TikTok:', err.message);
      }

      const titulocortado = (data.title || '').slice(0, 60);

      const dataContent = {
        platform: 'tiktok',
        shareId: new Types.ObjectId().toString(),
        id: idvideo,
        urltik: urlLimpia,
        tipo: tipo,
        autor: data.author_name || usuario,
        autorlink: data.author_url || (usuario ? `https://www.tiktok.com/@${usuario}` : undefined),
        titulo: tituloFront,
        titulocortado: titulocortado,
      };

      const updatedPost = await Post.findOneAndUpdate(
        { _id: postId, 'content.id': { $ne: idvideo } },
        { $push: { content: dataContent } },
        { new: true }
      );

      if (!updatedPost) {
        return res.status(201).json({ message: "El post ya contiene este contenido" });
       }

      return res.status(200).json({
        message: "Contenido agregado correctamente al Post",
     
      });

  
    } catch (error) {
      console.error("Error al crear el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;

  