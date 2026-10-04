const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const upload = require('../../helpers/uploadImagen');

const FILES_DIR = process.env.FILES_PATH || '/files';

const helperImg = async (filePath, fileName, size = 300) => {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  const squareSize = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - squareSize) / 2);
  const top = Math.floor((metadata.height - squareSize) / 2);

  return image
    .extract({ width: squareSize, height: squareSize, left, top })
    .resize(size, size)
    .jpeg({ quality: 85 })
    .toFile(path.join(FILES_DIR, `${fileName}.jpg`));
};


router.post('/', (req, res, next) => {
    // upload solo acepta JPG o PNG de hasta 2 MB y genera el nombre en el servidor
    upload.single('file')(req, res, (err) => {
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
    if (!req.file) {
        return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
    }

    try {
        await helperImg(req.file.path, `resize-${req.file.filename}`, 300);
        res.send({data:'Imagen Cargada'})
    } catch (error) {
        console.error('Error al procesar la imagen subida:', error.message);
        res.status(422).json({ message: 'No se pudo procesar la imagen.' });
    } finally {
        // Solo se conserva la versión reprocesada por sharp, nunca el archivo original
        fs.unlink(req.file.path).catch(e => console.warn('[upload] No se pudo eliminar temporal:', e.message));
    }
})

module.exports = router;
