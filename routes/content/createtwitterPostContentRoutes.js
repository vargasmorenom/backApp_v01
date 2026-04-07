const express = require('express');
const Post = require('../../models/PostSchema');


const router = express.Router();

function extractTwitterInfo(url) {

    const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/(\w+)\/status\/(\d+)(\?.*)?$/;
    
    const match = url.match(twitterRegex);
    
    if (!match) {
        return {
            isValid: false,
            id: null,
            username: null,
            platform: null
        };
    }
    
    return {
        isValid: true,
        id: match[5], // El ID del tweet
        username: match[4], // El nombre de usuario
        platform: match[3], // 'twitter.com' o 'x.com'
        fullUrl: url,
        cleanUrl: `https://twitter.com/${match[4]}/status/${match[5]}`
    };
}

router.put("/", async (req, res) => {
   
    try {

    const { postId, url, typePost } = req.body;

    const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/(\w+)\/status\/(\d+)(\?.*)?$/;
 
      // Validar que se recibieron los datos necesarios
      if (!postId || !url || !typePost) {
        return res.status(400).json({ message: "Datos incompletos" });
      }
      
    
      if(!twitterRegex.test(url)){
        return res.status(201).json({ message: "el contenido no corresponde a Twitter" });       
      }
  
      const consultaPost = await Post.findById(postId);

      if (!consultaPost) {
        return res.status(404).json({ message: "Post no encontrado" });
      }

      const arrayDeCadenas = extractTwitterInfo(url);

      const existe = consultaPost?.content?.some(
          item => item?.id === arrayDeCadenas.id
        ) || false;

      
        if (existe){
          return res.status(201).json({ message: "El post ya contiene este contenido" });
        }
      
       const updatedPost = await Post.findByIdAndUpdate(

        postId,{

                $push:{
                  content: arrayDeCadenas
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

  