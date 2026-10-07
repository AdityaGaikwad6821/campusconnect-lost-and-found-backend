const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT || 3000);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json({ limit: "10mb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

// =====================================================
// DATABASE
// =====================================================


    const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    family: 4,
    connectTimeout: 15000,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// =====================================================
// DATABASE SSL
// =====================================================

if (
    process.env.DB_SSL === "true" ||
    process.env.DB_SSL === "1"
) {
    db.config.connectionConfig.ssl = {
        rejectUnauthorized: false
    };
}

// =====================================================
// TEST DATABASE CONNECTION
// =====================================================

db.getConnection((err, connection) => {

    if (err) {

        console.error(
            "Lost & Found database connection failed:",
            err.message
        );

        return;
    }

    console.log(
        "Lost & Found database connected successfully!"
    );

    connection.release();
});

// =====================================================
// LOST & FOUND ROUTES
// =====================================================

const lostFoundRoutes = require(
    "./routes/lostfound"
);

app.use(
    "/api/lost-found",
    (req, res, next) => {

        req.db = db;

        next();

    },
    lostFoundRoutes
);

// =====================================================
// LOST & FOUND FRONTEND
// =====================================================

// This assumes your new backend folder is:
// Campus-Connect/lost_and_found_backend
//
// and your frontend is:
// Campus-Connect/lost_and_found

const projectRoot = path.join(
    __dirname,
    ".."
);

const lostFoundFrontend = path.join(
    projectRoot,
    "lost_and_found"
);

const uploadsFolder = path.join(
    lostFoundFrontend,
    "uploads"
);

// Create uploads folder if it doesn't exist

if (!fs.existsSync(uploadsFolder)) {

    fs.mkdirSync(
        uploadsFolder,
        {
            recursive: true
        }
    );
}

// =====================================================
// STATIC FILES
// =====================================================

app.use(
    "/lost_and_found",
    express.static(lostFoundFrontend)
);
app.use(express.static(lostFoundFrontend));
app.use(
    "/uploads",
    express.static(uploadsFolder)
);

app.use(
    "/lost_and_found/uploads",
    express.static(uploadsFolder)
);

// =====================================================
// MAIN LOST & FOUND PAGE
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                lostFoundFrontend,
                "lost.html"
            )
        );

    }
);

app.get(
    "/lost_and_found/lost.html",
    (req, res) => {

        res.sendFile(
            path.join(
                lostFoundFrontend,
                "lost.html"
            )
        );

    }
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
    "/health",
    (req, res) => {

        res.json({
            status: "ok",
            service: "CampusConnect Lost & Found",
            timestamp: new Date().toISOString()
        });

    }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Lost & Found backend running on http://localhost:${PORT}`
        );

    }
);