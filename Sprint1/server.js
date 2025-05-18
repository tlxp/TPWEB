require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/loginDB';

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado ao MongoDB com Mongoose');

    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true, trim: true },
      email: { type: String, required: true, unique: true, trim: true },
      password: { type: String, required: true },
      role: { type: String, required: true, enum: ['admin', 'user', 'Cliente', 'Técnico'] }
    }, { collection: 'users' });
    const User = mongoose.model('User', userSchema);

    app.use('/auth', authRoutes(User));

    app.use((err, req, res, next) => {
      console.error('Server Error:', err);
      res.status(500).json({ message: 'Erro interno do servidor.', error: err.message });
    });

    app.listen(PORT, () => {
      console.log(`Servidor a correr em http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });