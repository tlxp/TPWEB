const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

module.exports = function(User) {
  const authorize = (roles = []) => {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Token não fornecido.' });
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        if (roles.length && !roles.includes(decoded.role)) {
          return res.status(403).json({ message: 'Acesso não autorizado.' });
        }
        next();
      } catch (err) {
        console.error('Erro ao verificar token:', err);
        return res.status(401).json({ message: 'Token inválido.' });
      }
    };
  };

  router.post('/register', async (req, res) => {
    const { username, email, password, role = 'Cliente' } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Nome de utilizador, e-mail e palavra-passe são obrigatórios.' });
    }
    try {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === username ? 'Nome de utilizador já existe.' : 'E-mail já está em uso.'
        });
      }
      const user = new User({ username, email, password, role });
      await user.save();
      console.log(`Usuário ${username} (${email}) registado com sucesso.`);
      return res.status(201).json({ message: 'Usuário registado com sucesso.' });
    } catch (err) {
      console.error('Erro ao registar usuário:', err);
      return res.status(500).json({ message: 'Erro interno do servidor.', error: err.message });
    }
  });

  router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Nome de utilizador ou e-mail e palavra-passe são obrigatórios.' });
  }
  try {
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return res.status(401).json({ message: 'Nome de utilizador ou e-mail não encontrado.' });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({
      message: `Login bem-sucedido. Bem-vindo, ${user.username}!`,
      token,
      role: user.role
    });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

  router.get('/protected', authorize(['admin']), (req, res) => {
    res.json({ message: `Acesso permitido para ${req.user.role} com ID ${req.user.id}` });
  });

  module.exports.authorize = authorize;
  return router;
};