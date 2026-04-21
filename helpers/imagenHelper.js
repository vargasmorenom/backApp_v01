
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs/promises');
const path = require('path');

const FILES_DIR = process.env.FILES_PATH || '/files';


const helperImg = async (filePath, fileName, sizeType = 'medium',modo,ratioType) => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
  //  const absoluteFilePath = path.resolve(filePath);
    const { width, height } = metadata;
    const ratios = {
      square: 1 / 1,       // 1:1
      landscape: 4 / 3,    // 4:3
      widescreen: 16 / 9,  // 16:9
      photo: 6 / 4,        // 6:4 o 3:2
      portrait: 3 / 4      // 3:4
    };

    const targetRatio = ratios[ratioType] || ratios.photo;;
    let newWidth = width;
    let newHeight = Math.round(newWidth / targetRatio);

    if (newHeight > height) {
      newHeight = height;
      newWidth = Math.round(newHeight * targetRatio);
    }

    const left = Math.floor((width - newWidth) / 2);
    const top = Math.floor((height - newHeight) / 2);

   
    const sizes = {
      square: { small: { width: 640, height: 640 }, medium: { width: 1280, height: 1280 }, large: { width: 1920, height: 1920 } },
      landscape: { small: { width: 640, height: 480 }, medium: { width: 1280, height: 960 }, large: { width: 1920, height: 1440 } },
      widescreen: { small: { width: 640, height: 360 }, medium: { width: 1280, height: 720 }, large: { width: 1920, height: 1080 } },
      photo: { small: { width: 600, height: 400 }, medium: { width: 1200, height: 800 }, large: { width: 1800, height: 1200 } },
      portrait: { small: { width: 480, height: 640 }, medium: { width: 960, height: 1280 }, large: { width: 1440, height: 1920 } }
    };
    
    const namePicture = fileName.replace(/\.[^/.]+$/, "");

    const outputSize = (sizes[ratioType] && sizes[ratioType][sizeType]) || sizes.photo.medium;

    const outputFilePath = path.join(FILES_DIR, `${namePicture}.jpg`);


    // Asegurar que el directorio existe
    const outputDir = path.dirname(outputFilePath);
    await fs.mkdir(outputDir, { recursive: true });

    if(modo === 'fit'){
        await image
        .resize(outputSize.width, outputSize.height, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 85 })
        .toFile(outputFilePath);

    }
     if(modo === 'width'){

    await image
      .extract({ width: newWidth, height: newHeight, left, top })
      .resize(outputSize.width, outputSize.height, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toFile(outputFilePath);
     }


    return outputFilePath;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

module.exports = helperImg;

