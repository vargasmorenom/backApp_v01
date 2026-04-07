
const jwt = require('jsonwebtoken');

const adminTokens = async (userId, time, extras=null,clave) => {
  try {
    return await jwt.sign(
      { _id: userId, valToken:extras },
      clave,
      { expiresIn: time }
    );
  } catch (error) {
    console.error('Create Token:', error);
    throw new Error('Error generating refresh token');
  }
};

module.exports = adminTokens;

