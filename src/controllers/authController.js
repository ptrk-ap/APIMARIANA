const authService = require('../services/authService');

class AuthController {
  async login(req, res) {
    try {
      const { usuario, senha } = req.body;

      if (!usuario || !senha) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
      }

      const result = await authService.login(usuario, senha);
      
      return res.json(result);
    } catch (error) {
      // Retorna 401 para falhas de credenciais e 500 para outros erros
      if (error.message === 'Credenciais inválidas') {
        return res.status(401).json({ error: error.message });
      }
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new AuthController();
