require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./auth');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/loginDB';

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros PDF são permitidos.'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// Middleware
app.use(bodyParser.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] Response: ${res.statusCode} ${res.statusMessage}`);
  });
  next();
});

// MongoDB connection
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado ao MongoDB com Mongoose');

    // Initialize GridFS
    const conn = mongoose.connection;
    const gridFSBucket = new GridFSBucket(conn.db, {
      bucketName: 'certificates'
    });

    // Schemas
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true, trim: true },
      email: { type: String, required: true, unique: true, trim: true },
      password: { type: String, required: true },
      role: { type: String, required: true, enum: ['admin', 'user', 'Cliente', 'Técnico'] }
    }, { collection: 'users' });

    // Middleware para hashear a senha antes de salvar
    userSchema.pre('save', async function (next) {
      if (this.isModified('password')) {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
      }
      next();
    });

    const User = mongoose.model('User', userSchema);

    const solarPanelSchema = new mongoose.Schema({
      panelId: { 
        type: String, 
        required: true, 
        match: /^PANEL\d{3}$/,
        trim: true,
        unique: true
      },
      location: { 
        type: String, 
        required: true, 
        match: /^[A-Za-zÀ-ÿ\s]+,\s*[A-Za-zÀ-ÿ\s]+$/, 
        trim: true 
      },
      technicalSpecs: { 
        type: String, 
        required: true, 
        match: /^\d+W,\s*(Monocristalino|Policristalino|Filme Fino)$/,
        trim: true 
      },
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status: { type: String, enum: ['Pendente', 'Aprovado', 'Rejeitado'], default: 'Pendente' },
      createdAt: { type: Date, default: Date.now }
    }, { collection: 'solarpanels' });
    solarPanelSchema.index({ clientId: 1 });
    const SolarPanel = mongoose.model('SolarPanel', solarPanelSchema);

    const certificateSchema = new mongoose.Schema({
      panelId: { type: mongoose.Schema.Types.ObjectId, ref: 'SolarPanel', required: true },
      technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      certificateFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
      createdAt: { type: Date, default: Date.now }
    }, { collection: 'certificates' });
    certificateSchema.index({ panelId: 1, technicianId: 1 });
    const Certificate = mongoose.model('Certificate', certificateSchema);

    const creditSchema = new mongoose.Schema({
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      kWh: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }, { collection: 'credits' });
    const Credit = mongoose.model('Credit', creditSchema);

    // Routes
    console.log('Registering /auth routes...');
    app.use('/auth', authRoutes(User, SolarPanel, Certificate, Credit, gridFSBucket, upload));
    console.log('Routes registered.');

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server Error:', err);
      res.status(500).json({ message: 'Erro interno do servidor.', error: err.message });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Servidor a correr em http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  console.log('Conexão com MongoDB encerrada.');
});