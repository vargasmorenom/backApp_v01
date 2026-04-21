const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const Profile = require('../../models/ProfileSchema');

const FILES_DIR = process.env.FILES_PATH || '/files';

// Configuración Multer con validación de tipo de archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen no permitido. Usa JPG, PNG o WEBP.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB límite
});

// Función auxiliar para procesar imagen
const helperImg = async (filePath, fileName, size) => {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  const squareSize = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - squareSize) / 2);
  const top = Math.floor((metadata.height - squareSize) / 2);

  const outputPath = path.join(FILES_DIR, `${fileName}.jpg`);
  await image
    .extract({ width: squareSize, height: squareSize, left, top })
    .resize(size, size)
    .jpeg({ quality: 85 })
    .toFile(outputPath);
};

// Ruta POST para subir imagen
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const filePath = req.file.path;
    const userId = req.body.userBy;
    const usuario = req.body.usuario;

    if (!userId || !usuario) {
      return res.status(400).json({ error: 'Faltan datos requeridos: userBy o usuario' });
    }

    const profilePic = {
      small:   `60-${userId}.jpg`,
      medium:  `120-${userId}.jpg`,
      large:   `300-${userId}.jpg`,
      xlarge:  `600-${userId}.jpg`,
    };

    // Eliminar imágenes anteriores del perfil
    const oldProfile = await Profile.findOne({ userBy: userId }).lean();
    if (oldProfile?.profilePic) {
      const oldFiles = Object.values(oldProfile.profilePic);
      await Promise.allSettled(
        oldFiles.map(f => fs.unlink(path.join(FILES_DIR, f)).catch(() => {}))
      );
    }

    // Procesamiento en paralelo
    await Promise.all([
      helperImg(filePath, `60-${userId}`, 60),
      helperImg(filePath, `120-${userId}`, 120),
      helperImg(filePath, `300-${userId}`, 300),
      helperImg(filePath, `600-${userId}`, 600),
    ]);

    fs.unlink(filePath).catch(e => console.warn('[profileImg] No se pudo eliminar temporal:', e.message));

    // Actualizar perfil directamente sin pasar por la ruta protegida
    await Profile.findOneAndUpdate({ userBy: userId }, { profilePic });
    const perfilUpdated = await Profile.findOne({ userBy: userId });

    res.status(200).json({
      message: 'Imagen cargada, procesada y perfil actualizado correctamente',
      perfilCreate: { perfilUpdated }
    });

  } catch (err) {
    console.error('Error en subida de imagen:', err.message);

    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Error de Multer: ${err.message}` });
    }

    res.status(500).json({ error: 'Error interno al procesar la imagen' });
  }
});

module.exports = router;