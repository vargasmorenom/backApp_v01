const express = require('express');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs/promises');

const Post = require('../../models/PostSchema');
const TagsPost = require('../../models/TagsPost');
const cutTitle = require('../../helpers/limpiarTituloImagenes');


const router = express.Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'files/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Validar tipo de archivo
function fileFilter(req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png'];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Tipo de archivo no permitido. Solo JPG o PNG.');
    error.code = 'LIMIT_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const helperImg = async (filePath, fileName, sizeType) => {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  const { width, height } = metadata;
  const targetRatio = 16 / 9;

  let newWidth = width;
  let newHeight = Math.round(newWidth / targetRatio);

  // Ajuste si la altura calculada excede la real
  if (newHeight > height) {
    newHeight = height;
    newWidth = Math.round(newHeight * targetRatio);
  }

  const left = Math.floor((width - newWidth) / 2);
  const top = Math.floor((height - newHeight) / 2);

  // Tamaños de salida predefinidos
  const sizes = {
    small: { width: 640, height: 360 },
    medium: { width: 1280, height: 720 },
    large: { width: 1920, height: 1080 }
  };

  // Si no existe el tamaño, usar 'medium' como predeterminado
  const outputSize = sizes[sizeType] || sizes['medium'];

  const outputFilePath = path.resolve(__dirname, `../../files/${fileName}.jpg`);

  await image
    .extract({ width: newWidth, height: newHeight, left, top })
    .resize(outputSize.width, outputSize.height, {
      fit: 'cover',
      position: 'centre'
    })
    .jpeg({ quality: 85 })
    .toFile(outputFilePath);

  
};



router.put("/",upload.single('imagen'), async (req, res) => {

    try {

      // Extraer datos del cuerpo de la solicitud
      const {
        name,
        description,
        typePost,
        tags,
        access,
        postId,
        forKids,
      } = req.body;

        const namePicture = cutTitle(name);
  
      // Validar campos obligatorios
      if (!name || !typePost || !access || !postId) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
        
      const postData = await Post.findById(postId);
      

      if (!postData) {
        return res.status(204).json({ message: "El post no existe" });
      }

      // Procesamiento de tags (misma lógica que en createPostRoutes)
      let processedTags;
      if (tags) {
        processedTags = [];
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
                processedTags.push({ id: tag._id, name: tag.name });
            }
        }
      }

      if(req.file !== undefined){

            const filePath = req.file.path; 

            // Procesamiento en paralelo
            await Promise.all([
              helperImg(filePath, `640-${namePicture}`, 'small'),
              helperImg(filePath, `1280-${namePicture}`, 'medium'),
              helperImg(filePath, `1920-${namePicture}`, 'large')
            ]);
          
            await fs.unlink(filePath);

      }


      // Actualizar el Post
      const updatedPost = await Post.findByIdAndUpdate(postId, {
        name,
        description,
        typePost,
        imagen: req.file !== undefined ? {
          small: `640-${namePicture}.jpg`,
          medium: `1280-${namePicture}.jpg`,
          large: `1920-${namePicture}.jpg`
        } : postData.imagen,
        tags: processedTags !== undefined ? processedTags : postData.tags,
        access,
        forKIds: forKids === true || forKids === 'true',
      }, { new: true });
     
  
      return res.status(200).json({
        message: "Post actualizado correctamente"
      });
  
    } catch (error) {
      console.error("Error al actualizar el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;
