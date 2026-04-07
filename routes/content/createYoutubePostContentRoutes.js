const express = require('express');
const Post = require('../../models/PostSchema');


const router = express.Router();

function extractYouTubeId(url) {
    // Expresión regular para capturar el ID en diferentes formatos
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    
    const match = url.match(regex);
    
    return match ? match[1] : null;
}

router.put("/", async (req, res) => {
   
    try {


    const { postId, url, typePost } = req.body;

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(\?.*)?$/;

 
      // Validar que se recibieron los datos necesarios
      if (!postId || !url || !typePost) {

        return res.status(400).json({ message: "Datos incompletos" });

      }
      
    
      if(!youtubeRegex.test(url)){

        return res.status(201).json({ message: "el contenido no corresponde a Youtube" });
        
      }

 
      const consultaPost = await Post.findById(postId);

      if (!consultaPost) {

        return res.status(404).json({ message: "Post no encontrado" });

      }


      const arrayDeCadenas = extractYouTubeId(url);


      if(consultaPost.contentVal.includes(arrayDeCadenas)){
        return res.status(201).json({ message: "El post ya contiene este contenido" });
      }
    
      const dataContent = {

          url: url,
          id: arrayDeCadenas

        } 
        

       const updatedPost = await Post.findByIdAndUpdate(

        postId,{

                $push:{
                  content: dataContent,
                  contentVal: arrayDeCadenas
                
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

  