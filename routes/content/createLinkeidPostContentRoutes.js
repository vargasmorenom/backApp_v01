const express = require('express');
const { Types } = require('mongoose');
const Post = require('../../models/PostSchema');

const router = express.Router();

function extractLinkedInPostId(url) {
  // Buscar el patrón "activity-" seguido de números
  const match = url.match(/activity-(\d+)/);
  return match ? match[1] : null;
}

router.put("/", async (req, res) => {
   
    try {


    const { postId, url, typePost, titulo } = req.body;

     const linkidRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/;

 
      // Validar que se recibieron los datos necesarios
      if (!postId || !url || !typePost) {
        return res.status(400).json({ message: "Datos incompletos" });

      }
      
    
      if(!linkidRegex.test(url)){

        return res.status(201).json({ message: "el contenido no corresponde a tiktok" });
        
      }

 
      const consultaPost = await Post.findById(postId);

      if (!consultaPost) {
        return res.status(404).json({ message: "Post no encontrado" });
      }


      const arrayDeCadenas = extractLinkedInPostId(url);


      if(consultaPost.contentVal.includes(arrayDeCadenas)){
        return res.status(201).json({ message: "El post ya contiene este contenido" });
      }
    
      const dataContent = {
          platform: 'linkedin',
          shareId: new Types.ObjectId().toString(),
          url: url,
          idpost: arrayDeCadenas,
          titulo: titulo || null
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

  