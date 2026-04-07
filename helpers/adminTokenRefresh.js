const CryptoJS = require('crypto-js');
const RefreshToken = require('../models/RefreshTokenchema');

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días

const upsertRefreshToken = async (userId, token) => {
  try {
    return await RefreshToken.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          codeInterno: CryptoJS.lib.WordArray.random(16).toString(),
          token,
          state: true,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
          updatedAt: new Date()
        },
        $setOnInsert: {
          user: userId,
          createdAt: new Date()
        }
      },
      {
        upsert: true,
        new: true
      }
    );
  } catch (error) {
    console.error('[RefreshToken] Error upserting token:', error);
    throw new Error('Error generating refresh token');
  }
};

module.exports = upsertRefreshToken;