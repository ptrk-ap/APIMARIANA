const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/UserModel');

class AuthService {
  async login(usuario, senha) {
    // Busca o usuário usando o Model (camada de dados separada da regra de negócio)
    const user = await userModel.findByUsername(usuario);

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verifica a senha com o hash bcrypt
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Gera o JWT
    const payload = {
      clientId: user.id || 'bot-client-123', // Ajuste conforme seu banco de dados
      role: 'bot_client'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    return { token };
  }
}

module.exports = new AuthService();
