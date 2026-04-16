const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Post = require('../models/PostSchema');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const defaultImagen = [{
  small:  `${BASE_URL}/files/640-default.png`,
  medium: `${BASE_URL}/files/1280-default.png`,
  large:  `${BASE_URL}/files/1920-default.png`,
}];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const result = await Post.updateMany(
    { $or: [{ imagen: { $exists: false } }, { imagen: { $size: 0 } }] },
    { $set: { imagen: defaultImagen } }
  );

  console.log(`Posts actualizados: ${result.modifiedCount}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
