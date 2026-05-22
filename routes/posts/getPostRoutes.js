const express = require('express');
const bodyParser = require('body-parser');
const Posted = require('../../models/PostSchema');
const User = require('../../models/UserSchema');


const app = express();
const router = express.Router();
//app.use(bodyParser.urlencoded( { extended: false } ));


router.get("/", async (req, res) => {

    try {
        let page  = parseInt(req.query.page)  || 1;
        let limit = parseInt(req.query.limit) || 3;
        const sort = req.query.sort;

        if (page < 1)   page  = 1;
        if (limit < 1)  limit = 3;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        // sort=views requiere lookup a la colección viewposts (modelo separado)
        if (sort === 'views') {
            const items = await Posted.aggregate([
                {
                    $lookup: {
                        from: 'viewposts',
                        localField: '_id',
                        foreignField: 'idPost',
                        as: 'viewData',
                    },
                },
                {
                    $addFields: {
                        viewCount: {
                            $ifNull: [{ $arrayElemAt: ['$viewData.viewCount', 0] }, 0],
                        },
                    },
                },
                { $sort: { viewCount: -1, _id: -1 } },
                { $skip: skip },
                { $limit: limit },
                { $unset: 'viewData' },
            ]);
            return res.status(200).json(items);
        }

        const sortField = sort === 'likes'
            ? { likeNumber: -1, _id: -1 }
            : { createdAt: -1, _id: -1 };

        const items = await Posted.find()
            .populate('profileId', 'chanelName profilePic')
            .sort(sortField)
            .skip(skip)
            .limit(limit)
            .exec();

        return res.status(200).json(items);

    } catch (error) {
        console.error("Error in getPost:", error);
        res.status(500).json({ message: "An error occurred while fetching posts." });
    }
});

module.exports = router;