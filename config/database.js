const mongoose = require("mongoose");

class Database {

    constructor() {
        this.dbUri = process.env.MONGODB_URI;
        this.connect();
    }

    connect() {
        if (!this.dbUri) {
            console.error("ERROR: MONGODB_URI no está definida. Verifica el archivo .env");
            process.exit(1);
        }

        mongoose.connect(this.dbUri, {
            serverSelectionTimeoutMS: 10000,
        })
        .then(() => {
            console.log("Conexión a MongoDB OK");
        })
        .catch((err) => {
            console.error("Error de conexión a MongoDB:", err.message);
            process.exit(1);
        });
    }
}

module.exports = new Database();