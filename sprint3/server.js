require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authRoutes = require("./auth");
const { GridFSBucket } = require("mongodb");
const multer = require("multer");
const fetch = require("node-fetch");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/loginDB";
const ENERGY_SIM_API_URL = "http://localhost:4000/api";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas ficheiros PDF são permitidos."), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

// Middleware
app.use(bodyParser.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    console.log(
      `[${new Date().toISOString()}] Response: ${res.statusCode} ${
        res.statusMessage
      } - ${durationMs.toFixed(2)}ms`
    );
  });
  next();
});

// MongoDB connection
mongoose
  .connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Conectado ao MongoDB com Mongoose");

    const conn = mongoose.connection;
    const gridFSBucket = new GridFSBucket(conn.db, {
      bucketName: "certificates",
    });

    const userSchema = new mongoose.Schema(
      {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        role: {
          type: String,
          required: true,
          enum: ["admin", "user", "Cliente", "Técnico", "Gestor Operações"],
        },
        prod: { type: Number, default: 0 },
        prodMes: { type: Number, default: 0 },
        creditos: { type: Number, default: 0 },
      },
      { collection: "users" }
    );

    userSchema.pre("save", async function (next) {
      if (this.isModified("password")) {
        const bcrypt = require("bcrypt");
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
      }
      next();
    });

    const User = mongoose.model("User", userSchema);

    // Outros Schemas (SolarPanel, Certificate, Credit) mantêm-se como estavam
    const solarPanelSchema = new mongoose.Schema(
      {
        panelId: {
          type: String,
          required: true,
          match: /^PANEL\d{3}$/,
          trim: true,
          unique: true,
        },
        location: {
          type: String,
          required: true,
          match: /^[A-Za-zÀ-ÿ\s]+,\s*[A-Za-zÀ-ÿ\s]+$/,
          trim: true,
        },
        technicalSpecs: {
          type: String,
          required: true,
          match: /^\d+W,\s*(Monocristalino|Policristalino|Filme Fino)$/,
          trim: true,
        },
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["Pendente", "Aprovado", "Rejeitado"],
          default: "Pendente",
        },
        createdAt: { type: Date, default: Date.now },
      },
      { collection: "solarpanels" }
    );
    solarPanelSchema.index({ clientId: 1 });
    const SolarPanel = mongoose.model("SolarPanel", solarPanelSchema);

    const certificateSchema = new mongoose.Schema(
      {
        panelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SolarPanel",
          required: true,
        },
        technicianId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        certificateFileId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
      { collection: "certificates" }
    );
    certificateSchema.index({ panelId: 1, technicianId: 1 });
    const Certificate = mongoose.model("Certificate", certificateSchema);

    const creditSchema = new mongoose.Schema(
      {
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        kWh: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
      { collection: "credits" }
    );
    const Credit = mongoose.model("Credit", creditSchema);

    // Rotas de autenticação
    console.log("Registering /auth routes...");
    app.use(
      "/auth",
      authRoutes(User, SolarPanel, Certificate, Credit, gridFSBucket, upload)
    );
    console.log("Routes registered.");

    // Endpoint para obter a produção de energia em tempo real
    app.get("/api/production/realtime/:username", async (req, res) => {
      const { username } = req.params;
      console.log(`[REALTIME] Requisição para monitorização de: ${username}`);
      try {
        let user = await User.findOne({ username, role: "Cliente" });

        // Validação: Utilizador deve existir e ter a role "Cliente"
        if (!user) {
          console.log(
            `[REALTIME] Utilizador '${username}' não encontrado ou não é um Cliente válido.`
          );
          return res.status(404).json({
            message:
              "Utilizador não encontrado ou não é um Cliente válido. Por favor, insira um username válido.",
          });
        }
        console.log(
          `[REALTIME] Utilizador '${username}' (Cliente) encontrado.`
        );

        // Faz uma requisição ao servidor de simulação para obter a potência atual
        console.log(
          `[REALTIME] Chamando API de simulação: ${ENERGY_SIM_API_URL}/production/realtime/${username}`
        );
        const simResponse = await fetch(
          `${ENERGY_SIM_API_URL}/production/realtime/${username}`
        );
        if (!simResponse.ok) {
          const errorText = await simResponse.text();
          console.error(
            `[REALTIME] ERRO na resposta da API de simulação (${simResponse.status}): ${errorText}`
          );
          throw new Error(
            `Erro na API de simulação: ${simResponse.status} - ${errorText}`
          );
        }
        const simData = await simResponse.json();
        console.log(`[REALTIME] Dados de simulação recebidos:`, simData);

        // Atualiza o campo 'prod' do utilizador com o valor simulado
        user.prod = simData.currentPower;
        await user.save(); // Guarda a alteração no DB
        console.log(
          `[REALTIME] 'prod' para '${username}' atualizado para ${user.prod} e salvo no DB.`
        );

        // Devolve os dados persistidos ao frontend
        res.json({
          username: user.username,
          currentPower: user.prod,
          unit: "kW",
        });
      } catch (error) {
        console.error(
          "[REALTIME] ERRO geral no endpoint /production/realtime:",
          error
        );
        res.status(500).json({ message: "Erro interno do servidor." });
      }
    });

    // Endpoint para obter o histórico mensal de produção de energia
    app.get("/api/production/monthly/:username", async (req, res) => {
      const { username } = req.params;
      console.log(`[MONTHLY] Requisição para histórico mensal de: ${username}`);
      try {
        let user = await User.findOne({ username, role: "Cliente" });

        // Validação: Utilizador deve existir e ter a role "Cliente"
        if (!user) {
          console.log(
            `[MONTHLY] Utilizador '${username}' não encontrado ou não é um Cliente válido.`
          );
          return res.status(404).json({
            message:
              "Utilizador não encontrado ou não é um Cliente válido. Por favor, insira um username válido.",
          });
        }
        console.log(`[MONTHLY] Utilizador '${username}' (Cliente) encontrado.`);

        // Faz uma requisição ao servidor de simulação para obter o histórico
        console.log(
          `[MONTHLY] Chamando API de simulação: ${ENERGY_SIM_API_URL}/production/monthly/${username}`
        );
        const simResponse = await fetch(
          `${ENERGY_SIM_API_URL}/production/monthly/${username}`
        );
        if (!simResponse.ok) {
          const errorText = await simResponse.text();
          console.error(
            `[MONTHLY] ERRO na resposta da API de simulação (${simResponse.status}): ${errorText}`
          );
          throw new Error(
            `Erro na API de simulação: ${simResponse.status} - ${errorText}`
          );
        }
        const simData = await simResponse.json();
        console.log(`[MONTHLY] Dados de simulação recebidos:`, simData);

        user.prodMes = simData.monthlyEnergy; // valorMes
        await user.save(); // Guarda a alteração no DB
        console.log(
          `[MONTHLY] 'prodMes' para '${username}' ATUALIZADO para ${user.prodMes} e salvo no DB.`
        );

        // Devolve os dados ao frontend
        res.json({
          username: user.username,
          monthlyEnergy: user.prodMes,
          unit: "kWh",
          history: simData.history,
        });
      } catch (error) {
        console.error(
          "[MONTHLY] ERRO geral no endpoint /production/monthly:",
          error
        );
        res.status(500).json({ message: "Erro interno do servidor." });
      }
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const sendMonthlyReportEmails = async () => {
      console.log("Dia 1, a mandar mails");

      if (!EMAIL_USER || !EMAIL_PASS) {
        console.error(
          "Erro: As variáveis de ambiente EMAIL_USER e EMAIL_PASS não estão definidas."
        );
        return;
      }

      try {
        const clients = await User.find({ role: "Cliente" });
        console.log(
          `Encontrados ${clients.length} clientes para enviar relatórios agendados.`
        );

        for (const client of clients) {
          const clientEmail = client.email;
          const clientName = client.username;
          const monthlyProduction = client.prodMes;

          if (!clientEmail) {
            console.warn(
              `Cliente ${clientName} (ID: ${client._id}) não tem email. A ignorar envio agendado.`
            );
            continue;
          }

          const mailDetails = {
            from: EMAIL_USER,
            to: clientEmail,
            subject: "Relatório Mensal de Produção de Energia Solar",
            text: `Durante o mês produziu um total de ${monthlyProduction} kWh de energia. Parabéns! *ou não*, Com os melhores cumprimento, Diogo, José e Tiago`,
          };

          try {
            await transporter.sendMail(mailDetails);
            console.log(
              `Relatório mensal agendado enviado para ${clientName} (${clientEmail})`
            );
          } catch (emailError) {
            console.error(
              `Erro ao enviar email agendado para ${clientName} (${clientEmail}):`,
              emailError
            );
          }
        }
      } catch (error) {
        console.error(
          "Erro no processo de envio de relatórios agendado:",
          error
        );
      }
    };

    //manda ás 00:01 de todos os meses
    cron.schedule(
      "1 0 1 * *",
      () => {
        console.log("Executando tarefa agendada: envio de relatórios mensais.");
        sendMonthlyReportEmails();
      },
      {
        scheduled: true,
        timezone: "Europe/Lisbon", //só pra garantir
      }
    );

    // Endpoint para Contabilização Mensal de Créditos
    app.get("/api/credits/monthly-tally/:username", async (req, res) => {
      const { username } = req.params;
      console.log(
        `[CREDITS] Requisição para contabilizar créditos de: ${username}`
      );
      try {
        let user = await User.findOne({ username, role: "Cliente" });

        // Validação: Utilizador deve existir e ter a role "Cliente"
        if (!user) {
          console.log(
            `[CREDITS] Utilizador '${username}' não encontrado ou não é um Cliente válido.`
          );
          return res.status(404).json({
            message:
              "Utilizador não encontrado ou não é um Cliente válido. Por favor, insira um username válido.",
          });
        }
        console.log(`[CREDITS] Utilizador '${username}' (Cliente) encontrado.`);

        const producedThisMonth = user.prodMes;

        const consumedThisMonth = (Math.random() * (1500 - 50) + 50).toFixed(1);

        let energyForCredits = 0;

        if (producedThisMonth > consumedThisMonth) {
          energyForCredits = Math.floor(producedThisMonth - consumedThisMonth);
          console.log(
            `[CREDITS] Produção (${producedThisMonth}) > Consumo (${consumedThisMonth}). Créditos a gerar: ${energyForCredits}`
          );
        } else {
          console.log(
            `[CREDITS] Produção (${producedThisMonth}) <= Consumo (${consumedThisMonth}). Créditos a gerar: 0.`
          );
        }

        // Atualiza os créditos totais do utilizador na BD, acumulando os créditos gerados
        const oldCredits = user.creditos;
        user.creditos = user.creditos + energyForCredits;
        await user.save(); // Guarda a alteração no DB
        console.log(
          `[CREDITS] Créditos de '${username}' atualizados de ${oldCredits} para ${user.creditos} e salvos no DB.`
        );

        res.json({
          username: user.username,
          producedThisMonth: producedThisMonth, // Valor de prodMes do DB
          consumedThisMonth: parseFloat(consumedThisMonth),
          energyForCredits: energyForCredits, // Valor inteiro
          currentTotalCredits: user.creditos, // Créditos totais atualizados do DB
          unit: "créditos",
        });
      } catch (error) {
        console.error(
          "[CREDITS] ERRO geral no endpoint /credits/monthly-tally:",
          error
        );
        res.status(500).json({ message: "Erro interno do servidor." });
      }
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error("Server Error:", err);
      res
        .status(500)
        .json({ message: "Erro interno do servidor.", error: err.message });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Servidor Principal a correr em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  });

mongoose.connection.on("disconnected", () => {
  console.log("Conexão com MongoDB encerrada.");
});
