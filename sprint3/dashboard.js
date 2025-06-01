document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  if (!token || !userRole) {
    alert("Por favor, inicie sessão.");
    window.location.href = "index.html";
    return;
  }

  if (userRole !== "Cliente") {
    alert("Acesso não autorizado: apenas clientes podem aceder a esta página.");
    window.location.href = "index.html";
    return;
  }

  // Fetch and display user profile
  try {
    const response = await fetch("http://localhost:3000/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("Sessão inválida. Por favor, inicie sessão novamente.");
        localStorage.clear();
        window.location.href = "index.html";
        return;
      }
      throw new Error("Erro ao carregar perfil do usuário.");
    }
    const profile = await response.json();
    console.log("Profile recebido:", profile);
    if (profile.role !== "Cliente") {
      alert("Acesso não autorizado: role inválido no token.");
      localStorage.clear();
      window.location.href = "index.html";
      return;
    }
    const userInfo = document.querySelector(".user-info p");
    if (userInfo) {
      userInfo.textContent = `${profile.username} - ${profile.role}`;
    }
    const userProdReal = document.querySelector(".real p");
    if (userProdReal) {
      userProdReal.textContent = `${profile.prod} kWh`;
    }
    const userProdMes = document.querySelector(".mes p");
    if (userProdMes) {
      userProdMes.textContent = `${profile.prodMes} kWh`;
    }
    const userCreditos = document.querySelector(".creditos p");
    if (userCreditos) {
      userCreditos.textContent = `${profile.creditos} créditos`;
    }
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
  }

  const panelSection = document.getElementById("panel-section");
  console.log("Seção panel-section encontrada:", panelSection ? "Sim" : "Não");

  const concelhosPorDistrito = {
    Aveiro: [
      "Águeda",
      "Albergaria-a-Velha",
      "Anadia",
      "Arouca",
      "Aveiro",
      "Castelo de Paiva",
      "Espinho",
      "Estarreja",
      "Ílhavo",
      "Mealhada",
      "Murtosa",
      "Oliveira de Azeméis",
      "Oliveira do Bairro",
      "Ovar",
      "Santa Maria da Feira",
      "São João da Madeira",
      "Sever do Vouga",
      "Vagos",
      "Vale de Cambra",
    ],
    Beja: [
      "Aljustrel",
      "Almodôvar",
      "Alvito",
      "Barrancos",
      "Beja",
      "Castro Verde",
      "Cuba",
      "Ferreira do Alentejo",
      "Mértola",
      "Moura",
      "Odemira",
      "Ourique",
      "Serpa",
      "Vidigueira",
    ],
    Braga: [
      "Amares",
      "Barcelos",
      "Braga",
      "Cabeceiras de Basto",
      "Celorico de Basto",
      "Esposende",
      "Fafe",
      "Guimarães",
      "Póvoa de Lanhoso",
      "Terras de Bouro",
      "Vieira do Minho",
      "Vila Nova de Famalicão",
      "Vila Verde",
      "Vizela",
    ],
    Bragança: [
      "Alfândega da Fé",
      "Bragança",
      "Carrazeda de Ansiães",
      "Freixo de Espada à Cinta",
      "Macedo de Cavaleiros",
      "Miranda do Douro",
      "Mirandela",
      "Mogadouro",
      "Torre de Moncorvo",
      "Vila Flor",
      "Vimioso",
      "Vinhais",
    ],
    "Castelo Branco": [
      "Belmonte",
      "Castelo Branco",
      "Covilhã",
      "Fundão",
      "Idanha-a-Nova",
      "Oleiros",
      "Penamacor",
      "Proença-a-Nova",
      "Sertã",
      "Vila de Rei",
      "Vila Velha de Ródão",
    ],
    Coimbra: [
      "Arganil",
      "Cantanhede",
      "Coimbra",
      "Condeixa-a-Nova",
      "Figueira da Foz",
      "Góis",
      "Lousã",
      "Mira",
      "Miranda do Corvo",
      "Montemor-o-Velho",
      "Oliveira do Hospital",
      "Pampilhosa da Serra",
      "Penacova",
      "Penela",
      "Soure",
      "Tábua",
      "Vila Nova de Poiares",
    ],
    Évora: [
      "Alandroal",
      "Arraiolos",
      "Borba",
      "Estremoz",
      "Évora",
      "Montemor-o-Novo",
      "Mora",
      "Mourão",
      "Portel",
      "Redondo",
      "Reguengos de Monsaraz",
      "Vendas Novas",
      "Viana do Alentejo",
      "Vila Viçosa",
    ],
    Faro: [
      "Albufeira",
      "Alcoutim",
      "Aljezur",
      "Castro Marim",
      "Faro",
      "Lagoa",
      "Lagos",
      "Loulé",
      "Monchique",
      "Olhão",
      "Portimão",
      "São Brás de Alportel",
      "Silves",
      "Tavira",
      "Vila do Bispo",
      "Vila Real de Santo António",
    ],
    Guarda: [
      "Aguiar da Beira",
      "Almeida",
      "Celorico da Beira",
      "Figueira de Castelo Rodrigo",
      "Fornos de Algodres",
      "Gouveia",
      "Guarda",
      "Manteigas",
      "Mêda",
      "Pinhel",
      "Sabugal",
      "Seia",
      "Trancoso",
      "Vila Nova de Foz Côa",
    ],
    Leiria: [
      "Alcobaça",
      "Alvaiázere",
      "Ansião",
      "Batalha",
      "Bombarral",
      "Caldas da Rainha",
      "Castanheira de Pera",
      "Figueiró dos Vinhos",
      "Leiria",
      "Marinha Grande",
      "Nazaré",
      "Óbidos",
      "Pedrógão Grande",
      "Peniche",
      "Pombal",
      "Porto de Mós",
    ],
    Lisboa: [
      "Alenquer",
      "Amadora",
      "Arruda dos Vinhos",
      "Azambuja",
      "Cadaval",
      "Cascais",
      "Lisboa",
      "Loures",
      "Lourinhã",
      "Mafra",
      "Odivelas",
      "Oeiras",
      "Sintra",
      "Sobral de Monte Agraço",
      "Torres Vedras",
      "Vila Franca de Xira",
    ],
    Portalegre: [
      "Alter do Chão",
      "Arronches",
      "Avis",
      "Campo Maior",
      "Castelo de Vide",
      "Crato",
      "Elvas",
      "Fronteira",
      "Gavião",
      "Marvão",
      "Monforte",
      "Nisa",
      "Ponte de Sor",
      "Portalegre",
      "Sousel",
    ],
    Porto: [
      "Amarante",
      "Baião",
      "Felgueiras",
      "Gondomar",
      "Lousada",
      "Maia",
      "Marco de Canaveses",
      "Matosinhos",
      "Paços de Ferreira",
      "Paredes",
      "Penafiel",
      "Porto",
      "Póvoa de Varzim",
      "Santo Tirso",
      "São João da Madeira",
      "Trofa",
      "Valongo",
      "Vila do Conde",
      "Vila Nova de Gaia",
    ],
    Santarém: [
      "Abrantes",
      "Alcanena",
      "Almeirim",
      "Alpiarça",
      "Benavente",
      "Cartaxo",
      "Chamusca",
      "Constância",
      "Coruche",
      "Entroncamento",
      "Ferreira do Zêzere",
      "Golegã",
      "Mação",
      "Ourém",
      "Rio Maior",
      "Salvaterra de Magos",
      "Santarém",
      "Sardoal",
      "Tomar",
      "Torres Novas",
      "Vila Nova da Barquinha",
    ],
    Setúbal: [
      "Alcácer do Sal",
      "Alcochete",
      "Almada",
      "Barreiro",
      "Grândola",
      "Moita",
      "Montijo",
      "Palmela",
      "Santiago do Cacém",
      "Seixal",
      "Sesimbra",
      "Setúbal",
      "Sines",
    ],
    "Viana do Castelo": [
      "Arcos de Valdevez",
      "Caminha",
      "Melgaço",
      "Monção",
      "Paredes de Coura",
      "Ponte da Barca",
      "Ponte de Lima",
      "Valença",
      "Viana do Castelo",
      "Vila Nova de Cerveira",
    ],
    "Vila Real": [
      "Alijó",
      "Boticas",
      "Chaves",
      "Mesão Frio",
      "Mondim de Basto",
      "Montalegre",
      "Murça",
      "Peso da Régua",
      "Ribeira de Pena",
      "Sabrosa",
      "Santa Marta de Penaguião",
      "Valpaços",
      "Vila Pouca de Aguiar",
      "Vila Real",
    ],
    Viseu: [
      "Armamar",
      "Carregal do Sal",
      "Castro Daire",
      "Cinfães",
      "Lamego",
      "Mangualde",
      "Moimenta da Beira",
      "Mortágua",
      "Nelas",
      "Oliveira de Frades",
      "Penalva do Castelo",
      "Penedono",
      "Resende",
      "Santa Comba Dão",
      "São João da Pesqueira",
      "São Pedro do Sul",
      "Sátão",
      "Sernancelhe",
      "Tabuaço",
      "Tarouca",
      "Tondela",
      "Vila Nova de Paiva",
      "Viseu",
      "Vouzela",
    ],
    Açores: [
      "Angra do Heroísmo",
      "Calheta (Açores)",
      "Corvo",
      "Horta",
      "Lagoa (Açores)",
      "Lajes das Flores",
      "Lajes do Pico",
      "Madalena",
      "Nordeste",
      "Ponta Delgada",
      "Povoação",
      "Praia da Vitória",
      "Ribeira Grande",
      "Santa Cruz da Graciosa",
      "Santa Cruz das Flores",
      "São Roque do Pico",
      "Velas",
      "Vila do Porto",
      "Vila Franca do Campo",
    ],
    Madeira: [
      "Calheta (Madeira)",
      "Câmara de Lobos",
      "Funchal",
      "Machico",
      "Ponta do Sol",
      "Porto Moniz",
      "Porto Santo",
      "Ribeira Brava",
      "Santa Cruz",
      "Santana",
      "São Vicente",
    ],
  };

  const distritoSelect = document.getElementById("distrito");
  const concelhoSelect = document.getElementById("concelho");
  const powerValueSelect = document.getElementById("power-value");
  const powerValueError = document.getElementById("power-value-error");
  const panelIdInput = document.getElementById("panel-id");
  const panelIdError = document.getElementById("panel-id-error");

  distritoSelect.addEventListener("change", () => {
    const distrito = distritoSelect.value;
    concelhoSelect.innerHTML =
      '<option value="">Selecione um concelho</option>';
    if (distrito && concelhosPorDistrito[distrito]) {
      concelhosPorDistrito[distrito].forEach((concelho) => {
        const option = document.createElement("option");
        option.value = concelho;
        option.textContent = concelho;
        concelhoSelect.appendChild(option);
      });
    }
  });

  powerValueSelect.addEventListener("change", () => {
    powerValueError.textContent = powerValueSelect.value
      ? ""
      : "Por favor, selecione uma potência válida.";
  });

  panelIdInput.addEventListener("input", () => {
    const panelId = panelIdInput.value.trim();
    if (!/^PANEL\d{3}$/.test(panelId)) {
      panelIdError.textContent =
        "O ID do painel deve seguir o formato PANELXXX (ex: PANEL123).";
    } else {
      panelIdError.textContent = "";
    }
  });

  window.showSection = (sectionId) => {
    console.log(`Exibindo seção: ${sectionId}`);
    document.querySelectorAll(".section").forEach((section) => {
      section.style.display = section.id === sectionId ? "block" : "none";
    });
    const sidebar = document.querySelector(".sidebar");
    const burger = document.querySelector(".burger");
    sidebar.classList.remove("sidebar-active");
    burger.classList.remove("toggle");
    if (sectionId === "my-panels-section") {
      loadUserPanels();
    }
  };

  const panelForm = document.getElementById("panel-form");
  const reportButton = document.getElementById("send-report");
  const searchMyPanelsForm = document.getElementById("search-my-panels-form");
  const myPanelsResults = document.getElementById("my-panels-results");

  panelForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = panelForm.querySelector("button");
    submitButton.disabled = true;
    try {
      const formData = new FormData(panelForm);
      const panelId = formData.get("panel-id").trim();
      const distrito = formData.get("distrito").trim();
      const concelho = formData.get("concelho").trim();
      const powerValue = formData.get("power-value").trim();
      const panelType = formData.get("panel-type").trim();
      const location = `${distrito}, ${concelho}`;
      const technicalSpecs = `${powerValue}W, ${panelType}`;

      if (!panelId || !distrito || !concelho || !powerValue || !panelType) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }

      if (!/^PANEL\d{3}$/.test(panelId)) {
        panelIdError.textContent =
          "O ID do painel deve seguir o formato PANELXXX (ex: PANEL123).";
        return;
      }

      const data = { panelId, location, technicalSpecs };
      console.log("Enviando registo de painel:", data);

      const response = await fetch(
        "http://localhost:3000/auth/register-panel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      console.log("Resposta do servidor:", result);
      if (!response.ok) {
        throw new Error(result.message || "Erro interno do servidor.");
      }
      alert(result.message);
      panelForm.reset();
      concelhoSelect.innerHTML =
        '<option value="">Selecione um distrito primeiro</option>';
      powerValueError.textContent = "";
      panelIdError.textContent = "";
    } catch (err) {
      console.error("Erro ao registar painel:", err);
      alert(`Erro: ${err.message}`);
    } finally {
      submitButton.disabled = false;
    }
  });

  reportButton.addEventListener("click", async () => {
    try {
      const response = await fetch("http://localhost:3000/auth/send-report", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Erro ao enviar relatório.");
      }
      alert(result.message);
    } catch (err) {
      console.error("Erro ao enviar relatório:", err);
      alert(`Erro: ${err.message}`);
    }
  });

  window.downloadPanelCertificate = async (panelId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/auth/download-certificate?panelId=${encodeURIComponent(
          panelId
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message ||
            "Ainda não há certificado disponível para este painel."
        );
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate_${panelId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      alert("Certificado baixado com sucesso.");
    } catch (err) {
      console.error("Erro ao baixar certificado:", err);
      alert(`Erro: ${err.message}`);
    }
  };

  async function loadUserPanels(query = "") {
    const myPanelsResults = document.getElementById("my-panels-results");
    myPanelsResults.innerHTML = "<p>A carregar...</p>";
    try {
      // Verify token validity via profile endpoint
      const profileResponse = await fetch(
        "http://localhost:3000/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!profileResponse.ok) {
        if (profileResponse.status === 401 || profileResponse.status === 403) {
          alert("Sessão inválida. Por favor, inicie sessão novamente.");
          localStorage.clear();
          window.location.href = "index.html";
          return;
        }
        throw new Error("Erro ao verificar sessão.");
      }

      const url = "http://localhost:3000/auth/user-panels";
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Erro ao carregar painéis.";
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          if (response.status === 403) {
            alert("Acesso não autorizado. Verifique suas credenciais.");
            localStorage.clear();
            window.location.href = "index.html";
            return;
          }
        } else {
          errorMessage = `Erro ${response.status}: Resposta não é JSON`;
        }
        throw new Error(errorMessage);
      }

      let panels = await response.json();
      console.log("Painéis recebidos:", panels);

      if (query) {
        panels = panels.filter(
          (panel) => panel.panelId.toLowerCase() === query.toLowerCase()
        );
      }

      if (panels.length === 0) {
        myPanelsResults.innerHTML =
          '<p class="card">Nenhum painel encontrado.</p>';
        return;
      }

      myPanelsResults.innerHTML = "";
      panels.forEach((panel) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>Painel ${panel.panelId}</h3>
          <p><strong>Localização:</strong> ${panel.location}</p>
          <p><strong>Especificações:</strong> ${panel.technicalSpecs}</p>
          <p><strong>Status:</strong> ${panel.status}</p>
          <button class="download-panel-certificate" onclick="downloadPanelCertificate('${panel.panelId}')">Baixar Certificado</button>
        `;
        myPanelsResults.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar painéis:", err);
      myPanelsResults.innerHTML = `<p class="card error">Erro: ${err.message}</p>`;
    }
  }

  searchMyPanelsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = document
      .getElementById("search-my-panels-query")
      .value.trim();
    if (query && !/^PANEL\d{3}$/.test(query)) {
      myPanelsResults.innerHTML =
        '<p class="card error">O ID do painel deve seguir o formato PANELXXX (ex: PANEL123).</p>';
      return;
    }
    loadUserPanels(query);
  });

  window.toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    const burger = document.querySelector(".burger");
    sidebar.classList.toggle("sidebar-active");
    burger.classList.toggle("toggle");
  };

  window.logout = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "index.html";
  };

  showSection("monitor-section");
});
