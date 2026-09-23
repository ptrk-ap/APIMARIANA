const db = require('../config/database');

class UserModel {
  async findByUsername(usuario) {
    return db('usuarios').where({ usuario }).first();
  }
}

module.exports = new UserModel();
