const express = require('express');
const { Types } = require('mongoose');
const resolverFacebookShortUrl = require('../../helpers/resolverFacebookUrl');
const strategies = require('../../helpers/configFacebook');
const Post = require('../../models/PostSchema');

const router = express.Router();

router.put("/", async (req, res) => {

   
    try {
  
      const { postId, url, typePost, titulo } = req.body;
      let urlcode;

      const regex = /^(https?:\/\/)?(www\.|m\.|mobile\.|mbasic\.|mtouch\.|web\.)?(facebook|fb)\.(com|me)(\/.*)?$/;

      // Validar que se recibieron los datos necesarios
      if (!postId || !url || !typePost) {
        return res.status(400).json({ message: "Datos incompletos" });

      }

      // validar que el post exista
      const consultaPost = await Post.findById(postId);
      if (!consultaPost) {
        return res.status(404).json({ message: "Post no encontrado" });
      }

      // Valida si el formato de la URL es correcto
      if(!regex.test(url)){
        return res.status(201).json({ message: "el contenido no corresponde a facebook" });
      }

      const resolvedUrl = await resolverFacebookShortUrl(url);
      urlcode = resolvedUrl || url;

      const matchedKey = Object.keys(strategies).find(key =>
        new RegExp(`\\b${key}\\b`, "i").test(urlcode)
      );
     
      if (!matchedKey) {
        return res.status(400).json({ message: "Tipo de contenido no reconocido" });
      }

      // //Ejecutar la estrategia correspondiente
       const dataContent = await strategies[matchedKey](urlcode);
       console.log('[Facebook] matchedKey:', matchedKey);
       console.log('[Facebook] dataContent:', JSON.stringify(dataContent, null, 2));
       

       const consultaPostContent = await Post.findById(postId);
      
      // // Verificar si el contenido ya existe en el post
      if(dataContent){

      const existe = consultaPostContent?.content?.some(
          item => item?.listas?.id === dataContent.id
        ) || false;
      
        if (existe){
          return res.status(201).json({ message: "El post ya contiene este contenido" });
        }
      

      const contenidoPost = {
            platform: 'facebook',
            shareId: new Types.ObjectId().toString(),
            titulo: titulo || null,
            listas: dataContent,
        };
      
     // Actualizar el post con el nuevo contenido
      const updatedPost = await Post.findByIdAndUpdate(
        postId,{
                $push:{
                  content: contenidoPost
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

      }
    } catch (error) {
      console.error("Error al crear el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
module.exports = router;

  