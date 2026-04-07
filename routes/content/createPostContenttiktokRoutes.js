const express = require('express');
const Post = require('../../models/PostSchema');
const resolveTiktokShortUrl = require('../../helpers/resolveTikTokShortUrl');

const router = express.Router();

router.put("/", async (req, res) => {
   
    try {


      const { postId, url, typePost } = req.body;

      let urlcode = url;
     const tiktokRegex = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/((@[a-zA-Z0-9_.-]+\/video\/\d+)|([a-zA-Z0-9]+\/))(\?.*)?$/;


      
      // Validar que se recibieron los datos necesarios
      if (!postId || !url || !typePost) {
        return res.status(400).json({ message: "Datos incompletos" });

      }
      

      if(!tiktokRegex.test(url)){

        return res.status(201).json({ message: "el contenido no corresponde a tiktok" });
      }

     
      const consultaPost = await Post.findById(postId);

      if (!consultaPost) {
        return res.status(404).json({ message: "Post no encontrado" });
      }

        
      
            
      const resolvedUrl = await resolveTiktokShortUrl(url);
      urlcode = resolvedUrl || url;
                    
        
        const arrayDeCadenas = urlcode.split("/");
        const idvideo = arrayDeCadenas[5].split("?");

           const fetch = globalThis.fetch;
           const apiUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(urlcode)}`;
           const response = await fetch(apiUrl);
           const data = await response.json();

           let titulocortado = data.title;
          
           if(titulocortado.length > 120){

            titulocortado = data.title.slice(0,120);
           }
         
           
       dataContent = {
          id: idvideo[0],
          urltik: urlcode,
          tipo: arrayDeCadenas[4],
          autor: data.author_name,
          autorlink: data.author_url,
          titulo: titulocortado
        } 
        
      
  
       const existe = consultaPost?.content?.some(
          item => item?.id === dataContent.id
        ) || false;
      
        if (existe){
          return res.status(201).json({ message: "El post ya contiene este contenido" });
        }


       const updatedPost = await Post.findByIdAndUpdate(
        postId,{
                $push:{
                  content: dataContent
                }
            },
            {new: true}
       );

      if (!updatedPost) {
        return res.status(404).json({ message: "Post no creado" });
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

  