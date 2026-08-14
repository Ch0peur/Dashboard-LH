/**
 * Client API pour l'authentification
 * Utilise les endpoints de l'API backend
 */

const API_URL = 'http://localhost:3001/api';

class AuthClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Enregistrement
  async register(email, password, nom, prenom) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nom, prenom })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      return data;
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  }

  // Connexion
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      // Sauvegarde du token
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);

      return data;
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  }

  // Récupération des infos utilisateur
  async getUserInfo() {
    try {
      const response = await fetch(`${API_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des infos');
      }

      return data;
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  }

  // Déconnexion
  async logout() {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la déconnexion');
      }

      // Suppression du token
      this.token = null;
      localStorage.removeItem('auth_token');

      return data;
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  }

  // Vérification si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.token;
  }

  // Récupération du token
  getToken() {
    return this.token;
  }
}

// Export pour utilisation dans les pages
const auth = new AuthClient();
