require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./auth');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

mongoose.set('strictQuery', false);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/loginDB';

// Serve static files from the 'public' directory (excluding test-operations.html)
app.use((req, res, next) => {
  if (req.path === '/test-operations.html') {
    return next();
  }
  express.static(path.join(__dirname, 'public'))(req, res, next);
});

// Log static file requests
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    console.log(`[${new Date().toISOString()}] Static file request: ${req.method} ${req.url} - Serving from: ${path.join(__dirname, 'public', req.path)}`);
  }
  next();
});

// Explicit routes for specific HTML files
app.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] Redirecting / to /index.html`);
  res.redirect('/index.html');
});

app.get('/operations.html', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'operations.html');
  console.log(`[${new Date().toISOString()}] Serving /operations.html from: ${filePath}`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    console.log(`[${new Date().toISOString()}] /operations.html content (first 200 chars):`, fileContent.substring(0, 200));
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Error serving /operations.html:`, err.message);
        res.status(404).send('Página não encontrada.');
      }
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error reading /operations.html:`, err.message);
    res.status(404).send('Página não encontrada.');
  }
});

app.get('/test-operations.html', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'test-operations.html');
  console.log(`[${new Date().toISOString()}] Serving /test-operations.html from: ${filePath}`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    console.log(`[${new Date().toISOString()}] /test-operations.html full content:`, fileContent);
    res.set('Content-Type', 'text/html');
    res.send(fileContent);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error reading /test-operations.html:`, err.message);
    res.status(404).send('Página não encontrada.');
  }
});

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros PDF são permitidos.'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// CORS setup
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// Body parser
app.use(bodyParser.json());

// Log all requests and responses
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] Response: ${res.statusCode} ${res.statusMessage}`);
  });
  next();
});

// MongoDB connection and routes
const connectWithRetry = () => {
  mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Conectado ao MongoDB com Mongoose');

      const conn = mongoose.connection;
      const gridFSBucket = new GridFSBucket(conn.db, {
        bucketName: 'certificates'
      });

      const userSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, required: true, enum: ['admin', 'user', 'Cliente', 'Técnico', 'Gestor Operações'] }
      }, { collection: 'users' });

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

      // Mock /auth/credits route for testing
      app.get('/auth/credits', (req, res) => {
        console.log(`[${new Date().toISOString()}] Mock /auth/credits endpoint called for clientId: ${req.query.clientId}`);
        const { clientId } = req.query;
        if (!clientId || !/^[0-9a-fA-F]{24}$/.test(clientId)) {
          return res.status(400).json({ error: 'Invalid clientId' });
        }
        res.json({
          clientId: clientId,
          totalCredits: 42.5,
          lastUpdated: new Date('2025-05-25T03:33:56.011Z').toISOString()
        });
      });

      console.log('Registering /auth routes...');
      app.use('/auth', authRoutes(User, SolarPanel, Certificate, Credit, gridFSBucket, upload));
      console.log('Routes registered.');

      // Error handling middleware
      app.use((err, req, res, next) => {
        console.error(`[${new Date().toISOString()}] Server Error:`, err);
        res.status(500).json({ message: 'Erro interno do servidor.', error: err.message });
      });

      // Start the server only after MongoDB connection is established
      app.listen(PORT, () => {
        console.log(`[${new Date().toISOString()}] Servidor a correr em http://localhost:${PORT}`);
      });
    })
    .catch(err => {
      console.error(`[${new Date().toISOString()}] Erro ao conectar ao MongoDB:`, err.message);
      console.log('Tentando reconectar em 5 segundos...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

mongoose.connection.on('disconnected', () => {
  console.log(`[${new Date().toISOString()}] Conexão com MongoDB encerrada.`);
  connectWithRetry();
});