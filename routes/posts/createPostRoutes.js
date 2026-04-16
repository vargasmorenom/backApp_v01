const express = require('express');
const upload = require('../../helpers/uploadImagen');
const helperImg = require('../../helpers/imagenHelper');
const cutTitle = require('../../helpers/limpiarTituloImagenes');
const fs = require('fs/promises');

const Post = require('../../models/PostSchema');
const TagsPost = require('../../models/TagsPost');


const router = express.Router();


router.post("/", (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
        if (err) {
            const msg = err.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen no debe superar 2 MB.'
                : err.code === 'LIMIT_FILE_TYPE'
                ? 'Solo se permiten imágenes JPG o PNG.'
                : 'Error al procesar la imagen.';
            return res.status(400).json({ message: msg });
        }
        next();
    });
}, async (req, res) => {

    try {

      const {
        name,
        description,
        typePost,
        tags,
        access,
        profileId,
        userName,
        chanelName,
        profilepic,
        postedBy,
        forKids,
      } = req.body;

      if (!name || !typePost || !access || !postedBy) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
    
      const postName = await Post.findOne({name:name});

      //validacion que el nombre no exista en el contendio del mismo creador
      if (postName) {
        return res.status(207).json({ message: "Ya tienes un contenido con este nombre"});
      }
     
      // validacion de los tags
      let newdatarag = [];
      if(tags){
        let tagsList = tags;
        
        // Si viene como string (JSON o separado por comas)
        if (typeof tags === 'string') {
            try {
                tagsList = JSON.parse(tags);
            } catch (e) {
                tagsList = tags.split(',').map(t => t.trim());
            }
        }
 
        if (Array.isArray(tagsList)) {
            for (const tagName of tagsList) {
                const nameClean = tagName.toString().toLowerCase().trim();
                if (!nameClean) continue;

                const slug = nameClean.replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');

                let tag = await TagsPost.findOne({ $or: [{ slug }, { name: nameClean }] });

                if (!tag) {
                    tag = await TagsPost.create({ name: nameClean, slug, count: 1 });
                } else {
                    await TagsPost.findByIdAndUpdate(tag._id, { $inc: { count: 1 } });
                }
                newdatarag.push({id: tag._id, name: tag.name});
            }
        }
      }

       
    // manejo de las imagenes
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    let imagenes;

    if (req.file) {
      const filePath = req.file.path;
      const namePicture = cutTitle(req.file.filename);

      await Promise.all([
        helperImg(filePath, `640-${namePicture}`, 'small', 'fit', 'landscape'),
        helperImg(filePath, `1280-${namePicture}`, 'medium', 'fit', 'landscape'),
        helperImg(filePath, `1920-${namePicture}`, 'large', 'fit', 'landscape'),
      ]);

      fs.unlink(filePath).catch(e => console.warn('[upload] No se pudo eliminar temporal:', e.message));

      imagenes = {
        small:  `${baseUrl}/files/640-${namePicture}.png`,
        medium: `${baseUrl}/files/1280-${namePicture}.png`,
        large:  `${baseUrl}/files/1920-${namePicture}.png`,
      };
    } else {
      imagenes = {
        small:  `${baseUrl}/files/640-default.png`,
        medium: `${baseUrl}/files/1280-default.png`,
        large:  `${baseUrl}/files/1920-default.png`,
      };
    }

    // Crear el Post
      await Post.create({
        name,
        description,
        typePost,
        typePostName: typePost == 1 ? "Twitter or X" : typePost == 2 ? "Facebook" : typePost == 3 ? "Instagram" : typePost == 4 ? "TikTok" : typePost == 5 ? "Youtube" : "Linkedin",
        imagen : [imagenes],
        tags : newdatarag,
        access,
        profileId,
        userName,
        chanelName,
        profilepic,
        postedBy,
        forKIds: forKids === true || forKids === 'true',
      });

      return res.status(200).json({
        message: "Post creado correctamente"
      });
  
    } catch (error) {
      console.error("Error al crear el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });

module.exports = router;
