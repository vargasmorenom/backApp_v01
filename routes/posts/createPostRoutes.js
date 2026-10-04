const express = require('express');
const upload = require('../../helpers/uploadImagen');
const helperImg = require('../../helpers/imagenHelper');
const cutTitle = require('../../helpers/limpiarTituloImagenes');
const fs = require('fs/promises');

const Post = require('../../models/PostSchema');
const TagsPost = require('../../models/TagsPost');
const esUsuarioSesion = require('../../helpers/esUsuarioSesion');


const router = express.Router();


router.post("/", (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ message: 'La imagen no debe superar 2 MB.' });
            }
            if (err.code === 'LIMIT_FILE_TYPE') {
                return res.status(400).json({ message: 'Solo se permiten imágenes JPG o PNG.' });
            }
            return res.status(400).json({ message: 'Error al procesar la imagen.' });
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

      const camposFaltantes = [];
      if (!name) camposFaltantes.push("name");
      if (!typePost) camposFaltantes.push("typePost");
      if (!access) camposFaltantes.push("access");
      if (!postedBy) camposFaltantes.push("postedBy");
      if (!chanelName) camposFaltantes.push("chanelName");

      if (camposFaltantes.length > 0) {
        return res.status(400).json({
          message: `Faltan campos obligatorios: ${camposFaltantes.join(", ")}`,
          camposFaltantes,
        });
      }

      // Solo se puede publicar a nombre del usuario de la sesión
      if (!esUsuarioSesion(req, postedBy)) {
        if (req.file) fs.unlink(req.file.path).catch(() => {});
        return res.status(403).json({ message: "No autorizado" });
      }

      const postName = await Post.findOne({ name: name });

      //validacion que el nombre no exista en el contendio del mismo creador
      if (postName) {
        return res.status(409).json({ message: "Ya tienes un contenido con este nombre" });
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
    let imagenes;

    if (req.file) {
      const filePath = req.file.path;
      const namePicture = cutTitle(req.file.filename);

      try {
        await Promise.all([
          helperImg(filePath, `640-${namePicture}`, 'small', 'fit', 'landscape'),
          helperImg(filePath, `1280-${namePicture}`, 'medium', 'fit', 'landscape'),
          helperImg(filePath, `1920-${namePicture}`, 'large', 'fit', 'landscape'),
        ]);
      } catch (imgError) {
        console.error("Error al procesar la imagen del post:", imgError);
        fs.unlink(filePath).catch(e => console.warn('[upload] No se pudo eliminar temporal:', e.message));
        return res.status(422).json({ message: "No se pudo procesar la imagen. Probá con otro archivo." });
      }

      fs.unlink(filePath).catch(e => console.warn('[upload] No se pudo eliminar temporal:', e.message));

      imagenes = {
        small:  `640-${namePicture}.jpg`,
        medium: `1280-${namePicture}.jpg`,
        large:  `1920-${namePicture}.jpg`,
      };
    } else {
      imagenes = {
        small:  `640-default.jpg`,
        medium: `1280-default.jpg`,
        large:  `1920-default.jpg`,
      };
    }

    // Crear el Post
      const nuevoPost = await Post.create({
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

      return res.status(201).json({
        message: "Post creado correctamente",
        post: nuevoPost,
      });

    } catch (error) {
      if (error.name === "ValidationError") {
        const errores = Object.values(error.errors).map(e => e.message);
        console.error("Error de validación al crear el Post:", errores);
        return res.status(400).json({ message: "Datos inválidos para crear el post", errores });
      }
      if (error.code === 11000) {
        console.error("Error de duplicado al crear el Post:", error.keyValue);
        return res.status(409).json({ message: "Ya existe un post con esos datos" });
      }
      console.error("Error al crear el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });

module.exports = router;
