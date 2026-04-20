const express = require('express');
const path = require('path');
const session = require("express-session");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require("dotenv");
const morgan = require('morgan');
const winston = require('winston');
const http = require('http');
const { Server } = require("socket.io");
const initSockets = require("./libs/socket/orquestador.socket");

// Variables de entorno
const envFile = process.env.NODE_ENV === 'production' ? '.env' : `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: `./${envFile}` });
// Conexión a base de datos
require("./config/database");

// Middleware personalizado
const validaToken = require("./middlewares/validaToken");
const verifyRecaptcha = require("./middlewares/verifyRecaptcha");
const validaAdmin = require("./middlewares/validaAdmin");
const { recuperarPendientes, iniciarPoller } = require("./helpers/mailLibs");

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,
    message: { error: 'Demasiados registros desde esta IP. Intenta de nuevo en una hora.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 30,
    message: { error: 'Demasiadas solicitudes de refresco de sesión.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// App principal
const app = express();
app.use(helmet());

const httpServer = http.createServer(app);
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:8100', 'http://localhost:4200'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

const io = new Server(httpServer, {
  cors: { ...corsOptions, origin: allowedOrigins },
});

// Guardar io en app para usarlo en rutas
app.set('socketio', io);
initSockets(io);

// --- Middlewares globales ---
app.use(cookieParser());
app.use(cors(corsOptions));
app.use((req, res, next) => {
    if (req.is('application/json')) {
        express.json()(req, res, next);
    } else {
        next();
    }
});
app.use(express.urlencoded({ extended: true }));
app.use('/files', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, "files")));

app.use(session({
    secret: process.env.SESSION_SECRET || "salida en codigo",
    resave: true,
    saveUninitialized: false
}));

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({ format: winston.format.simple() }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

app.use(morgan('combined', { stream: { write: message => logger.info(message) } }));

const apiVersion = "/api/v1";

// ── Rutas admin ───────────────────────────────────────────────────────────────
app.use(apiVersion + "/admin/mail-queue", validaAdmin, require('./routes/admin/mailQueueRoutes'));

// ── Rutas públicas sin reCAPTCHA ──────────────────────────────────────────────
app.use(apiVersion + "/activacion",   require('./routes/auth/activacionRoutes'));
app.use(apiVersion + "/refresh",      refreshLimiter, require('./routes/auth/refreshTokenRoute'));
app.use(apiVersion + "/getpost",      require('./routes/posts/getPostRoutes'));
app.use(apiVersion + "/getonepost",   require('./routes/posts/getOnePostRoutes'));
app.use(apiVersion + "/getpostid",    require('./routes/posts/getPostIdRoutes'));
app.use(apiVersion + "/getprofile",   require('./routes/profile/getProfileRoutes'));
app.use(apiVersion + "/getfollow",    require('./routes/social/GetFollowRoutes'));
app.use(apiVersion + "/profilelikes", require('./routes/social/LikeProfileRoutes').router || require('./routes/social/LikeProfileRoutes'));
app.use(apiVersion + "/getLikes",     require('./routes/social/getLikeStatusRoutes'));
app.use(apiVersion + "/postsbytag",   require('./routes/posts/getPostsByTagRoutes'));
app.use(apiVersion + "/trendingtags", require('./routes/posts/getTrendingTagsRoutes'));
app.use(apiVersion + "/search",       require('./routes/posts/getPostsBySearchRoutes'));
app.use(apiVersion + "/getviewpost",  require('./routes/posts/getViewPostRoutes'));

// ── Rutas públicas con reCAPTCHA ──────────────────────────────────────────────
app.use(apiVersion + "/register",   registerLimiter, verifyRecaptcha, require('./routes/auth/registerRoutes'));
app.use(apiVersion + "/login",      loginLimiter,    verifyRecaptcha, require('./routes/auth/loginRoutes'));
app.use(apiVersion + "/recovery",   verifyRecaptcha, require('./routes/auth/recoveryRoutes'));

// ── Middleware de autenticación global ────────────────────────────────────────
app.use(apiVersion, validaToken);

// ── Rutas protegidas (requieren sesión válida) ────────────────────────────────
const protectedRoutes = [
    // Auth
    { path: apiVersion + "/changepassword",     router: require('./routes/auth/changePasswordRoutes') },

    // Posts
    { path: apiVersion + "/posted",             router: require('./routes/posts/postRoutes') },
    { path: apiVersion + "/newpost",            router: require('./routes/posts/createPostRoutes') },
    { path: apiVersion + "/getpost",            router: require('./routes/posts/getPostRoutes') },
    { path: apiVersion + "/getonepost",         router: require('./routes/posts/getOnePostRoutes') },
    { path: apiVersion + "/getpostid",          router: require('./routes/posts/getPostIdRoutes') },
    { path: apiVersion + "/updatepost",         router: require('./routes/posts/updatePostRoutes') },
    { path: apiVersion + "/deletepost",         router: require('./routes/posts/deletePostRoutes') },
    { path: apiVersion + "/deletecontent",      router: require('./routes/posts/deletePostContentRoutes') },
    { path: apiVersion + "/createtag",          router: require('./routes/posts/createTagRoutes') },
    { path: apiVersion + "/postsbytag",         router: require('./routes/posts/getPostsByTagRoutes') },
    { path: apiVersion + "/trendingtags",       router: require('./routes/posts/getTrendingTagsRoutes') },
    { path: apiVersion + "/search",             router: require('./routes/posts/getPostsBySearchRoutes') },
    { path: apiVersion + "/viewpost",           router: require('./routes/posts/viewPostRoutes') },
    { path: apiVersion + "/getviewpost",        router: require('./routes/posts/getViewPostRoutes') },

    // Contenido redes sociales
    { path: apiVersion + "/content/socialid1/", router: require('./routes/content/createtwitterPostContentRoutes') },
    { path: apiVersion + "/content/socialid2/", router: require('./routes/content/createPostContentFacebookRoutes') },
    { path: apiVersion + "/content/socialid3/", router: require('./routes/content/createInstagramPostContentRoutes') },
    { path: apiVersion + "/content/socialid4/", router: require('./routes/content/createPostContenttiktokRoutes') },
    { path: apiVersion + "/content/socialid5/", router: require('./routes/content/createYoutubePostContentRoutes') },
    { path: apiVersion + "/content/socialid6/", router: require('./routes/content/createLinkeidPostContentRoutes') },
    { path: apiVersion + "/content/socialid7/", router: require('./routes/content/createTelegramPostContentRoutes') },

    // Social
    { path: apiVersion + "/likes",              router: require('./routes/social/LikePostRoutes') },
    { path: apiVersion + "/getLikes",           router: require('./routes/social/getLikeStatusRoutes') },
    { path: apiVersion + "/profilelikes",       router: require('./routes/social/LikeProfileRoutes') },
    { path: apiVersion + "/addfollow",          router: require('./routes/social/FollowAddRoutes') },
    { path: apiVersion + "/getfollow",          router: require('./routes/social/GetFollowRoutes') },
    { path: apiVersion + "/fallowers",          router: require('./routes/social/SubscribeUserRoutes') },

    // Perfil
    { path: apiVersion + "/profile",            router: require('./routes/profile/profileRoutes') },
    { path: apiVersion + "/getprofile",         router: require('./routes/profile/getProfileRoutes') },
    { path: apiVersion + "/updateprofile",      router: require('./routes/profile/updateProfileRoutes') },
    { path: apiVersion + "/updateprofileimage", router: require('./routes/profile/updateProfileIMagenRoutes') },
    { path: apiVersion + "/profileimage",       router: require('./routes/profile/upploadImageProfile') },
    { path: apiVersion + "/upload",             router: require('./routes/profile/upploadImage') },
    { path: apiVersion + "/getuser",            router: require('./routes/profile/getUserRoutes') },
];
protectedRoutes.forEach(route => app.use(route.path, route.router));

httpServer.listen(process.env.PORT || 3000, () => {
    console.log('Servidor iniciado en el puerto:' + (process.env.PORT || 3000));
    recuperarPendientes();
    iniciarPoller();
});
