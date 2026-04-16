/**
 * Script de inicialización para MongoDB Atlas - ListyFy
 *
 * USO:
 *   1. Pon tu connection string en .env: MONGODB_URI=mongodb+srv://...
 *   2. Ejecuta: node scripts/init-mongo-atlas.js
 *
 * Idempotente: si la colección ya existe la omite sin borrar datos.
 */

require('dotenv').config({ path: './.env' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME     = 'Listybdv01';

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI no está definido en .env');
    process.exit(1);
}

async function init() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✓ Conectado a MongoDB Atlas\n');

        const db = client.db(DB_NAME);

        // ── users ──────────────────────────────────────────────────────────
        await createCollection(db, 'users', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['username', 'email', 'password', 'token', 'terms', 'state'],
                    properties: {
                        username:        { bsonType: 'string' },
                        email:           { bsonType: 'string' },
                        password:        { bsonType: 'string' },
                        token:           { bsonType: 'string' },
                        terms:           { bsonType: 'bool' },
                        state:           { bsonType: 'bool' },
                        phoneNumber:     { bsonType: 'string' },
                        phoneCountry:    { bsonType: 'string' },
                        phoneCodCountry: { bsonType: 'string' },
                        resetCode:       { bsonType: ['string', 'null'] },
                        resetCodeExpiry: { bsonType: ['date',   'null'] },
                    }
                }
            }
        });
        await db.collection('users').createIndexes([
            { key: { email:    1 }, unique: true,  name: 'email_unique'    },
            { key: { username: 1 }, unique: true,  name: 'username_unique' },
        ]);
        console.log('✓ users');

        // ── profiles ───────────────────────────────────────────────────────
        await createCollection(db, 'profiles', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['chanelName', 'description', 'userBy'],
                    properties: {
                        chanelName:      { bsonType: 'string' },
                        description:     { bsonType: 'string' },
                        userBy:          { bsonType: 'objectId' },
                        firstName:       { bsonType: 'string' },
                        lastName:        { bsonType: 'string' },
                        email:           { bsonType: 'string' },
                        location:        { bsonType: 'string' },
                        phoneNumber:     { bsonType: 'string' },
                        socialMedia:     { bsonType: 'array' },
                        instantMessages: { bsonType: 'array' },
                        profilePic:      { bsonType: 'array' },
                    }
                }
            }
        });
        await db.collection('profiles').createIndexes([
            { key: { userBy:    1 }, unique: true, name: 'userBy_unique'  },
            { key: { chanelName: 1 },              name: 'chanelName_idx' },
        ]);
        console.log('✓ profiles');

        // ── posts ──────────────────────────────────────────────────────────
        await createCollection(db, 'posts', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['typePostName', 'chanelName'],
                    properties: {
                        typePostName: { bsonType: 'string' },
                        chanelName:   { bsonType: 'string' },
                        name:         { bsonType: 'string' },
                        description:  { bsonType: 'string' },
                        typePost:     { bsonType: 'number' },
                        access:       { bsonType: 'number' },
                        likeNumber:   { bsonType: 'number' },
                        forKIds:      { bsonType: 'bool' },
                        pinned:       { bsonType: 'bool' },
                        content:      { bsonType: 'array' },
                        contentVal:   { bsonType: 'array' },
                        tags:         { bsonType: 'array' },
                        imagen:       { bsonType: 'array' },
                        profileId:    { bsonType: 'objectId' },
                        postedBy:     { bsonType: 'objectId' },
                    }
                }
            }
        });
        await db.collection('posts').createIndexes([
            { key: { postedBy:  1 },                                                       name: 'postedBy_idx'   },
            { key: { profileId: 1 },                                                       name: 'profileId_idx'  },
            { key: { createdAt: -1 },                                                      name: 'createdAt_desc' },
            { key: { name: 'text', description: 'text' },
              weights: { name: 10, description: 5 },
              default_language: 'spanish',                                                  name: 'text_search'    },
        ]);
        console.log('✓ posts');

        // ── likerecords ────────────────────────────────────────────────────
        await createCollection(db, 'likerecords', {});
        await db.collection('likerecords').createIndexes([
            { key: { postId: 1, userId: 1 }, unique: true, name: 'post_user_unique' },
        ]);
        console.log('✓ likerecords');

        // ── likesprofiles ──────────────────────────────────────────────────
        await createCollection(db, 'likesprofiles', {});
        await db.collection('likesprofiles').createIndexes([
            { key: { idProfile: 1, likisbyuser: 1 }, unique: true, name: 'profile_like_unique' },
        ]);
        console.log('✓ likesprofiles');

        // ── followers ──────────────────────────────────────────────────────
        await createCollection(db, 'followers', {});
        await db.collection('followers').createIndexes([
            { key: { idprofile: 1, followedby: 1 }, unique: true, name: 'follow_unique'   },
            { key: { followedby: 1 },                             name: 'followedby_idx'  },
        ]);
        console.log('✓ followers');

        // ── followeds ──────────────────────────────────────────────────────
        await createCollection(db, 'followeds', {});
        await db.collection('followeds').createIndexes([
            { key: { idprofile: 1, following: 1 }, unique: true, name: 'followed_unique' },
            { key: { following: 1 },                             name: 'following_idx'   },
        ]);
        console.log('✓ followeds');

        // ── tagsposts ──────────────────────────────────────────────────────
        await createCollection(db, 'tagsposts', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['name'],
                    properties: {
                        name:  { bsonType: 'string' },
                        slug:  { bsonType: 'string' },
                        count: { bsonType: 'number' },
                    }
                }
            }
        });
        await db.collection('tagsposts').createIndexes([
            { key: { name:  1 }, unique: true, name: 'tag_name_unique' },
            { key: { slug:  1 }, unique: true, name: 'tag_slug_unique' },
            { key: { count: -1 },              name: 'count_desc'      },
        ]);
        console.log('✓ tagsposts');

        // ── refreshtokens ──────────────────────────────────────────────────
        await createCollection(db, 'refreshtokens', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['user', 'token', 'codeInterno', 'state', 'expiresAt'],
                    properties: {
                        user:        { bsonType: 'objectId' },
                        token:       { bsonType: 'string'   },
                        codeInterno: { bsonType: 'string'   },
                        state:       { bsonType: 'bool'     },
                        expiresAt:   { bsonType: 'date'     },
                    }
                }
            }
        });
        await db.collection('refreshtokens').createIndexes([
            { key: { user:        1 }, unique: true,          name: 'user_unique'    },
            { key: { codeInterno: 1 },                        name: 'codeInterno_idx'},
            { key: { expiresAt:   1 }, expireAfterSeconds: 0, name: 'ttl_expiry'    },
        ]);
        console.log('✓ refreshtokens');

        // ── viewposts ──────────────────────────────────────────────────────
        await createCollection(db, 'viewposts', {});
        await db.collection('viewposts').createIndexes([
            { key: { idPost: 1 }, unique: true, name: 'idPost_unique' },
        ]);
        console.log('✓ viewposts');

        // ── emailqueues ────────────────────────────────────────────────────
        await createCollection(db, 'emailqueues', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['to', 'subject', 'html', 'status'],
                    properties: {
                        to:        { bsonType: 'string' },
                        subject:   { bsonType: 'string' },
                        html:      { bsonType: 'string' },
                        status:    { bsonType: 'string', enum: ['pending', 'sent', 'failed'] },
                        attempts:  { bsonType: 'number' },
                        lastError: { bsonType: ['string', 'null'] },
                        sentAt:    { bsonType: ['date',   'null'] },
                    }
                }
            }
        });
        await db.collection('emailqueues').createIndexes([
            { key: { status: 1, createdAt: 1 }, name: 'status_created_idx' },
        ]);
        console.log('✓ emailqueues');

        // ── contents ───────────────────────────────────────────────────────
        await createCollection(db, 'contents', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['postId', 'userId'],
                    properties: {
                        postId:      { bsonType: 'objectId' },
                        userId:      { bsonType: 'objectId' },
                        numcontents: { bsonType: 'number'   },
                        url:         { bsonType: 'array'    },
                    }
                }
            }
        });
        await db.collection('contents').createIndexes([
            { key: { postId: 1 }, name: 'postId_idx' },
        ]);
        console.log('✓ contents');

        // ── resumen ────────────────────────────────────────────────────────
        const cols = await db.listCollections().toArray();
        console.log(`\n=== Base de datos '${DB_NAME}' inicializada ===`);
        console.log(`Colecciones (${cols.length}): ${cols.map(c => c.name).join(', ')}`);
        console.log('\nPróximos pasos:');
        console.log('  1. Agrega la IP de tu servidor en Atlas → Network Access');
        console.log('  2. Actualiza MONGODB_URI en .env con tu connection string');
        console.log('  3. Ejecuta: npm run dev');

    } catch (err) {
        console.error('\nError durante la inicialización:', err.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

async function createCollection(db, name, options) {
    const exists = await db.listCollections({ name }).hasNext();
    if (exists) {
        console.log(`  (omitiendo '${name}' — ya existe)`);
        return;
    }
    await db.createCollection(name, options);
}

init();
