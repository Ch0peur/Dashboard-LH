const express = require('express');
const pg = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Pool de connexion PostgreSQL
const pool = new pg.Pool({
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'secretpassword',
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard_db',
});

// Middlewares
app.use(cors());
app.use(express.json());

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Route d'enregistrement
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, nom, prenom } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (email, password, nom, prenom)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, nom, prenom, created_at
    `;

    const result = await pool.query(query, [email, hashedPassword, nom, prenom]);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de connexion
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const userQuery = 'SELECT id, email, password, nom, prenom FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = userResult.rows[0];

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Enregistrement de la session
    const sessionQuery = `
      INSERT INTO sessions (user_id, token, user_agent, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
      RETURNING id, token
    `;

    await pool.query(sessionQuery, [
      user.id,
      token,
      req.get('user-agent'),
      req.ip
    ]);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Middleware de vérification du token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalide' });
  }
};

// Route protégée pour récupérer les infos utilisateur
app.get('/api/user', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT id, email, nom, prenom, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de déconnexion
app.post('/api/logout', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    const query = 'DELETE FROM sessions WHERE token = $1';
    await pool.query(query, [token]);

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur API lancé sur le port ${PORT}`);
});
