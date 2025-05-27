document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  if (!token || !userRole) {
    alert('Por favor, inicie sessão.');
    window.location.href = 'index.html';
    return;
  }

  if (userRole !== 'Técnico') {
    alert('Acesso não autorizado: apenas técnicos podem aceder a esta página.');
    window.location.href = 'index.html';
    return;
  }

  // Fetch and display user profile
  try {
    fetch('http://localhost:3000/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao carregar perfil do usuário.');
        }
        return response.json();
      })
      .then(profile => {
        const userInfo = document.querySelector('.user-info p');
        if (userInfo) {
          userInfo.textContent = `${profile.username} - ${profile.role}`;
        }
      })
      .catch(err => {
        console.error('Erro ao carregar perfil:', err);
      });
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
  }

  const searchForm = document.getElementById('search-panel-form');
  const certificateForm = document.getElementById('certificate-form');
  const searchResults = document.getElementById('search-results');
  const panelDetails = document.getElementById('panel-details');
  const panelIdInput = document.getElementById('panel-id');
  const certificateInput = document.getElementById('certificate');

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('search-query').value.trim();
    if (!query) {
      alert('Por favor, insira um ID do painel ou nome do cliente.');
      return;
    }

    searchResults.innerHTML = '<p>A carregar...</p>';
    searchResults.classList.remove('hidden');
    panelDetails.classList.add('hidden');
    certificateForm.classList.add('hidden');
    
    try {
      const response = await fetch(`http://localhost:3000/auth/search-panel?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao pesquisar painéis.');
      }
      
      const panels = await response.json();
      searchResults.innerHTML = panels.length
        ? panels.map(panel => `
            <div class="card" style="margin-bottom: 1rem;">
              <p><strong>ID:</strong> ${panel.panelId}</p>
              <p><strong>Cliente:</strong> ${panel.clientId.username}</p>
              <p><strong>Localização:</strong> ${panel.location}</p>
              <button class="select-button" onclick='selectPanel(${JSON.stringify(panel)})'>Selecionar</button>
            </div>
          `).join('')
        : '<p class="card">Nenhum painel encontrado.</p>';
    } catch (err) {
      console.error('Erro ao pesquisar:', err);
      alert(`Erro: ${err.message}`);
      searchResults.innerHTML = '<p class="card">Ocorreu um erro ao pesquisar.</p>';
    }
  });

  certificateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = certificateForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'A submeter...';
    submitButton.disabled = true;

    try {
      const panelId = panelIdInput.value.trim();
      const file = certificateInput.files[0];

      if (!panelId) {
        throw new Error('O ID do painel é obrigatório.');
      }

      if (!/^PANEL\d{3}$/.test(panelId)) {
        throw new Error('O ID do painel deve seguir o formato PANELXXX (ex: PANEL123).');
      }

      if (!file) {
        throw new Error('Selecione um arquivo PDF.');
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são permitidos.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 5MB.');
      }

      const formData = new FormData();
      formData.append('panelId', panelId);
      formData.append('certificate', file);

      console.log('Enviando upload de certificado:', { panelId, fileName: file.name });

      const response = await fetch('http://localhost:3000/auth/upload-certificate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao submeter certificado.';
        try {
          const result = await response.json();
          errorMessage = result.message || errorMessage;
        } catch (jsonErr) {
          console.error('Erro ao parsear resposta JSON:', jsonErr);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Resposta do servidor:', result);
      
      alert(result.message);
      resetForms();
    } catch (err) {
      console.error('Erro ao submeter certificado:', err);
      alert(`Erro: ${err.message || 'Falha na comunicação com o servidor. Verifique a conexão e tente novamente.'}`);
    } finally {
      submitButton.textContent = 'Submeter Certificado';
      submitButton.disabled = false;
    }
  });

  window.toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const burger = document.querySelector('.burger');
    sidebar.classList.toggle('sidebar-active');
    burger.classList.toggle('toggle');
  };

  window.logout = () => {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
  };

  window.selectPanel = (panel) => {
    document.getElementById('panel-id').value = panel.panelId;
    document.getElementById('detail-panel-id').textContent = panel.panelId;
    document.getElementById('detail-client').textContent = panel.clientId.username;
    document.getElementById('detail-location').textContent = panel.location;
    document.getElementById('detail-specs').textContent = panel.technicalSpecs;
    document.getElementById('detail-status').textContent = panel.status;
    document.getElementById('detail-created').textContent = new Date(panel.createdAt).toLocaleString('pt-PT');
    
    searchResults.classList.add('hidden');
    panelDetails.classList.remove('hidden');
  };

  window.showCertificateForm = () => {
    panelDetails.classList.add('hidden');
    certificateForm.classList.remove('hidden');
  };

  window.hidePanelDetails = () => {
    panelDetails.classList.add('hidden');
    searchResults.classList.remove('hidden');
  };
  
  window.cancelUpload = () => {
    certificateForm.classList.add('hidden');
    searchResults.classList.remove('hidden');
    certificateForm.reset();
  };
  
  function resetForms() {
    searchForm.reset();
    certificateForm.reset();
    searchResults.classList.add('hidden');
    panelDetails.classList.add('hidden');
    certificateForm.classList.add('hidden');
  }
});