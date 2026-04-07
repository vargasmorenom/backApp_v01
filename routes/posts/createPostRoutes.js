const express = require('express');
const upload = require('../../helpers/uploadImagen');
const helperImg = require('../../helpers/imagenHelper');
const addHashToWords = require('../../helpers/addHashToWords');

const cutTitle = require('../../helpers/limpiarTituloImagenes');
const fs = require('fs/promises');

const Post = require('../../models/PostSchema');
const TagsPost = require('../../models/TagsPost');


const router = express.Router();


router.post("/",upload.single('imagen'), async (req, res) => {

    try {

      const filePath = req.file.path; 
      const namePicture = cutTitle(req.file.filename);
    
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
 
  
      // Validar campos obligatorios
      if (!req.file) {
        return res.status(400).json({ error: 'No se subió ninguna imagen.' });
      }

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
    const imagenes = {
      small: `640-${namePicture}.png`,
      medium: `1280-${namePicture}.png`,
      large: `1920-${namePicture}.png`
    };
   

    // Procesamiento en paralelo
    await Promise.all([
      helperImg(filePath, `640-${namePicture}`, 'small','fit','landscape'),
      helperImg(filePath, `1280-${namePicture}`, 'medium','fit','landscape'),
      helperImg(filePath, `1920-${namePicture}`, 'large','fit','landscape')
    ]);
  
     await fs.unlink(filePath);
  
   //  Crear el Post
      const nuevoPost = await Post.create({
        name,
        description,
        typePost,
        typePostName: typePost == 1 ? "Twitter or X" : typePost == 2 ? "Facebook" : typePost == 3 ? "Instagram" : typePost == 4 ? "TikTok" : typePost == 5 ? "Youtube" : "Linkedin",
        imagen : imagenes,
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
