"use strict";

const routes = [
    { path: "/register", router: require('./routes/libs/registerRoutes') },
    { path: "/login", router: require('./routes/libs/loginRoutes') },
    { path: "/posted", router: require('./routes/libs/postRoutes') },
    { path: "/upload", router: require('./routes/libs/upploadImage') },
    { path: "/getpost", router: require('./routes/libs/getPostRoutes') },
    { path: "/getpostid", router: require('./routes/libs/getPostIdRoutes') },
    { path: "/getuser", router: require('./routes/libs/getUserRoutes') },
    { path: "/likes", router: require('./routes/libs/LikePostRoutes') },
    { path: "/fallowers", router: require('./routes/libs/SubscribeUserRoutes') },
    { path: "/profile", router: require('./routes/libs/profileRoutes') },
    { path: "/getprofile", router: require('./routes/libs/getProfileRoutes') },
    { path: "/updateprofile", router: require('./routes/libs/updateProfileRoutes') },
    { path: "/updateprofileimage", router: require('./routes/libs/updateProfileIMagenRoutes') },
    { path: "/profileimage", router: require('./routes/libs/upploadImageProfile') },
    { path: "/newpost", router: require('./routes/libs/createPostRoutes') },
    { path: "/deletepost", router: require('./routes/libs/deletePostRoutes') },
    { path: "/activacion", router: require('./routes/libs/activacionRoutes') },
    { path: "/content", router: require('./routes/libs/createPostContentRoutes') },
    { path: "/addcontent", router: require('./routes/libs/addPostContentRoutes') },
    { path: "/deletecontent", router: require('./routes/libs/deletePostContentRoutes') }
];

module.exports = routes;