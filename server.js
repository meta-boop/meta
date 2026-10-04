const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

const app = express();

// ========================================
// MIDDLEWARES
// ========================================

app.use(cors());
app.use(express.json());


// ========================================
// PAGE D'ACCUEIL
// ========================================

// Quand quelqu'un ouvre :
// http://localhost:3000
// ou ton URL Render
// Express affiche inscription.html

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "inscription.html"));
});


// ========================================
// FICHIERS STATIQUES
// ========================================

// Permet d'accéder à :
// index.html
// style.css
// images
// fichiers JavaScript, etc.

app.use(express.static(__dirname));


// ========================================
// CONNEXION À NEONDB
// ========================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


// ========================================
// TEST DE CONNEXION À NEONDB
// ========================================

pool.query("SELECT NOW()")
    .then(() => {
        console.log("Connexion à Neon PostgreSQL réussie !");
    })
    .catch((error) => {
        console.error("Erreur Neon :", error.message);
    });


// ========================================
// CRÉER LA TABLE PARTICIPANTS
// ========================================

async function creerTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id SERIAL PRIMARY KEY,
                telephone TEXT NOT NULL,
                code TEXT NOT NULL,
                date_participation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Table participants prête !");

    } catch (error) {
        console.error("Erreur table :", error.message);
    }
}

creerTable();


// ========================================
// ENREGISTRER UN PARTICIPANT
// ========================================

app.post("/api/participant", async (req, res) => {

    const { telephone, code } = req.body;

    // Vérification des champs
    if (!telephone || !code) {
        return res.status(400).json({
            success: false,
            message: "Numéro/e-mail et code obligatoires."
        });
    }

    try {

        // Enregistrer dans NeonDB
        await pool.query(
            `
            INSERT INTO participants (telephone, code)
            VALUES ($1, $2)
            `,
            [telephone, code]
        );

        // Afficher dans le terminal
        console.log("==============================");
        console.log("NOUVEAU PARTICIPANT");
        console.log("Identifiant :", telephone);
        console.log("Code du jeu :", code);
        console.log("==============================");

        // Réponse au frontend
        res.json({
            success: true,
            message: "Participation enregistrée !"
        });

    } catch (error) {

        console.error("Erreur :", error.message);

        res.status(500).json({
            success: false,
            message: "Erreur lors de l'enregistrement."
        });
    }
});


// ========================================
// DÉMARRER LE SERVEUR
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("================================");
    console.log(`SERVEUR ACTIF SUR LE PORT ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log("================================");
});