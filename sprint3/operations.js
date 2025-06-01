document.addEventListener("DOMContentLoaded", () => {
  const monitorForm = document.getElementById("monitor-form");
  const creditsForm = document.getElementById("credits-form");
  const monitorResult = document.getElementById("monitor-result");
  const creditsResult = document.getElementById("credits-result");
  const realTimeValueSpan = document.getElementById("real-time-value");
  const monthlyValueSpan = document.getElementById("monthly-value");
  const monthlyHistorySpan = document.getElementById("monthly-history");

  // ATENÇÃO: A API_BASE_URL AGORA APONTA PARA O TEU SERVIDOR PRINCIPAL (onde está o MongoDB)
  const API_BASE_URL = "http://localhost:3000/api"; // Certifica-te que esta é a porta do teu server.js principal

  // Função de logout
  window.logout = function () {
    window.location.href = "index.html";
  };

  // Lidar com o formulário de Monitorização de Produção
  if (monitorForm) {
    monitorForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("username").value;

      monitorResult.innerHTML = "<p>A carregar dados...</p>";

      if (!username) {
        monitorResult.innerHTML =
          '<p style="color: red;">Erro: Username do cliente não pode estar vazio.</p>';
        console.error("Erro: Username do cliente não foi obtido corretamente.");
        return;
      }

      try {
        // Obter dados em tempo real
        const realTimeUrl = `${API_BASE_URL}/production/realtime/${username}`;
        const realTimeResponse = await fetch(realTimeUrl);

        // Tratamento de erro aprimorado
        if (!realTimeResponse.ok) {
          const errorData = await realTimeResponse.json();
          // Exibe a mensagem de erro específica do servidor (ex: "Utilizador não encontrado...")
          monitorResult.innerHTML = `<p style="color: red;">${
            errorData.message ||
            "Erro desconhecido ao carregar dados em tempo real."
          }</p>`;
          console.error("Erro do servidor (realtime):", errorData.message);
          return; // Sai da função, pois houve um erro na requisição
        }
        const realTimeData = await realTimeResponse.json();
        realTimeValueSpan.textContent = `${realTimeData.currentPower} ${realTimeData.unit}`;

        // Obter dados mensais
        const monthlyUrl = `${API_BASE_URL}/production/monthly/${username}`;
        const monthlyResponse = await fetch(monthlyUrl);
        if (!monthlyResponse.ok) {
          const errorData = await monthlyResponse.json();
          // Exibe a mensagem de erro específica do servidor
          monitorResult.innerHTML = `<p style="color: red;">${
            errorData.message || "Erro desconhecido ao carregar dados mensais."
          }</p>`;
          console.error("Erro do servidor (monthly):", errorData.message);
          return;
        }
        const monthlyData = await monthlyResponse.json();
        monthlyValueSpan.textContent = `${monthlyData.monthlyEnergy} ${monthlyData.unit}`;

        // Exibir histórico mensal
        let historyHtml = "<ul>";
        if (monthlyData.history && monthlyData.history.length > 0) {
          monthlyData.history.forEach((item) => {
            historyHtml += `<li>${item.month}: ${item.energy} ${monthlyData.unit}</li>`;
          });
        } else {
          historyHtml += "<li>Nenhum histórico disponível.</li>";
        }
        historyHtml += "</ul>";
        monthlyHistorySpan.innerHTML = historyHtml;

        monitorResult.innerHTML = `<p>Dados atualizados para ${username}.</p>`;
      } catch (error) {
        console.error("Erro ao buscar dados de monitorização:", error);
        monitorResult.innerHTML = `<p style="color: red;">Erro ao carregar dados. Por favor, tenta novamente. (${error.message})</p>`;
        realTimeValueSpan.textContent = "N/A";
        monthlyValueSpan.textContent = "N/A";
        monthlyHistorySpan.innerHTML = "N/A";
      }
    });
  } else {
    console.error('Erro: Formulário com ID "monitor-form" não encontrado!');
  }

  // Lidar com o formulário de Contabilização dos Créditos
  if (creditsForm) {
    creditsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const clientUserCredits =
        document.getElementById("clientUserCredits").value;

      creditsResult.innerHTML = "<p>A carregar dados...</p>";

      if (!clientUserCredits) {
        creditsResult.innerHTML =
          '<p style="color: red;">Erro: Username do cliente para créditos não pode estar vazio.</p>';
        console.error(
          "Erro: Username do cliente para créditos não foi obtido corretamente."
        );
        return;
      }

      try {
        const monthlyTallyUrl = `${API_BASE_URL}/credits/monthly-tally/${clientUserCredits}`;
        const response = await fetch(monthlyTallyUrl);

        // Tratamento de erro aprimorado para créditos
        if (!response.ok) {
          const errorData = await response.json();
          creditsResult.innerHTML = `<p style="color: red;">${
            errorData.message || "Erro desconhecido ao carregar créditos."
          }</p>`;
          console.error("Erro do servidor (credits):", errorData.message);
          return;
        }
        const data = await response.json();

        // Atualizado para exibir os novos dados de créditos
        creditsResult.innerHTML = `
          <p><strong>Produção Registrada este Mês:</strong> ${data.producedThisMonth} kWh</p>
          <p><strong>Consumo Registrado este Mês:</strong> ${data.consumedThisMonth} kWh</p>
          <p><strong>Créditos Gerados este Mês:</strong> ${data.energyForCredits} ${data.unit}</p>
          <p><strong>Créditos Totais Acumulados:</strong> ${data.currentTotalCredits} ${data.unit}</p>
        `;
      } catch (error) {
        console.error("Erro ao buscar créditos:", error);
        creditsResult.innerHTML = `<p style="color: red;">Erro ao carregar créditos. Por favor, tenta novamente. (${error.message})</p>`;
      }
    });
  } else {
    console.error('Erro: Formulário com ID "credits-form" não encontrado!');
  }
});
