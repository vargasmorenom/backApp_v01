const express = require('express');
const mongoose = require('mongoose');
const Post = require('../../models/PostSchema');

const router = express.Router();

router.get("/", async (req, res) => {
  try {

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const { tagId } = req.query;

    if (!tagId) {
      return res.status(400).json({ message: "El parámetro tagId es obligatorio" });
    }

    // Validaciones
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ message: "tagId inválido" });
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const objectId = new mongoose.Types.ObjectId(tagId);

    // Consulta principal
    const posts = await Post.aggregate([
      { $match: { "tags.id": objectId } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "profileId"
        }
      },
      { $unwind: { path: "$profileId", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1, description: 1, typePost: 1, typePostName: 1,
          nameContent: 1, imagen: 1, access: 1, chanelName: 1,
          content: 1, profilepic: 1, tags: 1, pinned: 1,
          createdAt: 1, updatedAt: 1,
          "profileId.chanelName": 1, "profileId.profilePic": 1
        }
      }
    ]);

    return res.status(200).json(posts);

  } catch (error) {
    console.error("Error getPostsByTag:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

module.exports = router;
