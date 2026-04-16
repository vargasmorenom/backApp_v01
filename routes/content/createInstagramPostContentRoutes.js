const express = require('express');
const Post = require('../../models/PostSchema');


const router = express.Router();

function extractInstagramId(url) {
    // Expresión regular más completa
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/(?:p|reel|tv)\/|instagr\.am\/(?:p|reel|tv)\/)([a-zA-Z0-9_-]+)(?:\/.*)?(?:\?.*)?$/;
    
    const match = url.match(regex);
    
    if (match && match[1]) {
        return match[1];
    }
    
    return null;
}

router.put("/", async (req, res) => {
   
    try {


    const { postId, url, typePost, titulo } = req.body;

    const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com\/(p|reel|stories|tv)\/[\w-]+\/?(?:\?.*)?|instagr\.am\/(p|reel|stories|tv)\/[\w-]+\/?(?:\?.*)?)$/

 
      // Validar que se recibieron los datos necesarios
      if (!postId || !url || !typePost) {

        return res.status(400).json({ message: "Datos incompletos" });

      }
      
    
      if(!instagramRegex.test(url)){

        return res.status(201).json({ message: "el contenido no corresponde a Instagram" });
        
      }


      const consultaPost = await Post.findById(postId);

      if (!consultaPost) {

        return res.status(404).json({ message: "Post no encontrado" });

      }


      const arrayDeCadenas = extractInstagramId(url);
   

       const existe = consultaPost?.content?.some(
          item => item?.id === arrayDeCadenas
        ) || false;
      
        if (existe){
          return res.status(201).json({ message: "El post ya contiene este contenido" });
        }
    
      const dataContent = {

          url: url,
          id: arrayDeCadenas,
          titulo: titulo || null

        }
        

       const updatedPost = await Post.findByIdAndUpdate(

        postId,{

                $push:{
                  content: dataContent,
                
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

  