const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000; // Podes mudar a porta se quiseres

app.use(cors());
app.use(express.json());

// Dados simulados de produção mensal para garantir consistência
// Vamos armazenar a energia de Junho aqui para usar no cálculo dos créditos
let prodMes = 0; // Variável para armazenar a energia de junho

// Endpoint para obter a produção de energia em tempo real
app.get("/api/production/realtime/:username", (req, res) => {
  const { username } = req.params;
  // Simula a potência atual entre 10 kW e 30 kW, com duas casas decimais
  const currentPower = (Math.random() * (30 - 10) + 10).toFixed(2);
  res.json({ username, currentPower: parseFloat(currentPower), unit: "kW" });
});

// Endpoint para obter o histórico mensal de produção de energia
app.get("/api/production/monthly/:username", (req, res) => {
  const { username } = req.params;

  // Gerar histórico mensal para os meses de janeiro a junho, entre 800 e 2000 kWh, com uma casa decimal
  const monthlyHistory = [];
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < months.length; i++) {
    const energy = (Math.random() * (2000 - 800) + 800).toFixed(1); // Entre 800 e 2000, uma casa decimal
    monthlyHistory.push({
      month: `${months[i]}/${currentYear}`,
      energy: parseFloat(energy),
    });
    // Se for Junho, guarda este valor para o cálculo de créditos
    if (months[i] === "Junho") {
      prodMes = parseFloat(energy);
    }
  }

  res.json({
    username,
    // monthlyEnergy é um valor geral, o histórico já dá uma ideia.
    // Usamos a energia de junho como o valor do mês atual para 'monthlyEnergy' para a secção de monitorização.
    monthlyEnergy: prodMes, // Energia de Junho para o valor geral
    unit: "kWh",
    history: monthlyHistory, // Já está na ordem correta (Janeiro a Junho)
  });
});

// Endpoint para consultar créditos de energia (exemplo simples)
app.get("/api/credits/:username", (req, res) => {
  const { username } = req.params;
  // Simula um valor de crédito total acumulado sem casas decimais (inteiro)
  const currentCredits = Math.floor(Math.random() * (5000 - 500) + 500); // Inteiro
  res.json({
    username,
    currentCredits: currentCredits,
    unit: "créditos", // Unidade alterada para 'créditos'
  });
});

// Endpoint para Contabilização Mensal de Créditos
app.get("/api/credits/monthly-tally/:username", (req, res) => {
  const { username } = req.params;

  // A energia produzida neste mês (Junho) é agora o valor de 'prodMes'
  // Se a página for carregada sem passar pelo histórico, prodMes pode ser 0,
  // então geramos um valor aleatório para garantir que há sempre um número.
  const producedThisMonth =
    prodMes > 0
      ? prodMes
      : parseFloat((Math.random() * (2000 - 800) + 800).toFixed(1));

  // O consumo é independente da produção para créditos, mas mantemos para contexto
  const consumedThisMonth = (Math.random() * (1500 - 50) + 50).toFixed(1);

  // Os créditos gerados este mês são baseados na energia produzida este mês (Junho), como um número inteiro
  const energyForCredits = Math.floor(producedThisMonth); // Valor inteiro dos créditos

  // Simula o cálculo de um crédito total acumulado (inteiro)
  const currentTotalCredits = Math.floor(Math.random() * (10000 - 1000) + 1000);

  res.json({
    username,
    producedThisMonth: parseFloat(producedThisMonth), // Mantemos como float para exibição
    consumedThisMonth: parseFloat(consumedThisMonth),
    energyForCredits: energyForCredits, // Já é um número inteiro
    currentTotalCredits: currentTotalCredits, // Já é um número inteiro
    unit: "créditos",
  });
});

app.listen(PORT, () => {
  console.log(`API de Energia Solar a correr em http://localhost:${PORT}`);
});
