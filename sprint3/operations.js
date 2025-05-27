document.addEventListener('DOMContentLoaded', () => {
  console.log('operations.js loaded at:', new Date().toISOString());
  console.log('Current page URL:', window.location.href);

  // Check file version and timestamp
  const fileVersionMeta = document.querySelector('meta[name="file-version"]');
  const fileVersion = fileVersionMeta ? fileVersionMeta.getAttribute('content') : 'Unknown';
  const timestampMeta = document.querySelector('meta[name="timestamp"]');
  const timestamp = timestampMeta ? timestampMeta.getAttribute('content') : 'Unknown';

  console.log('File version:', fileVersion);
  console.log('File timestamp:', timestamp);

  if (!fileVersion.includes('20250525') || timestamp !== '2025-05-25T16:51:00') {
    console.error('Outdated or incorrect file version/timestamp detected:', { fileVersion, timestamp });
    alert('Erro: Arquivo HTML desatualizado ou incorreto. Versão: ' + fileVersion + ', Timestamp: ' + timestamp + '. Por favor, limpe o cache do navegador e recarregue a página.');
    return;
  }

  // Check for token and role
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  console.log('Token retrieved:', token ? 'Present' : 'Not present');
  console.log('Role retrieved:', userRole);

  if (!token || !userRole) {
    console.error('No token or userRole found in localStorage');
    alert('Por favor, inicie sessão.');
    window.location.href = 'index.html';
    return;
  }

  const normalizedRole = userRole.trim().toLowerCase();
  console.log('Normalized role:', normalizedRole);
  if (normalizedRole !== 'gestor operações') {
    console.warn('Unauthorized access attempt with role:', normalizedRole);
    alert('Acesso não autorizado: apenas gestores de operações podem aceder a esta página.');
    window.location.href = 'index.html';
    return;
  }

  // Function to check for DOM elements with retry
  const checkElements = (attempt = 1) => {
    console.log(`Attempt ${attempt}: Checking DOM elements...`);

    const monitorForm = document.getElementById('monitor-form');
    const monitorResult = document.getElementById('monitor-result');
    const realTimeValue = document.getElementById('real-time-value');
    const monthlyValue = document.getElementById('monthly-value');
    const creditsForm = document.getElementById('credits-form');
    const creditsResult = document.getElementById('credits-result');
    const logoutBtn = document.querySelector('.logout-btn');

    console.log('monitorForm:', monitorForm ? 'Found' : 'Not found', monitorForm);
    console.log('monitorResult:', monitorResult ? 'Found' : 'Not found', monitorResult);
    console.log('realTimeValue:', realTimeValue ? 'Found' : 'Not found', realTimeValue);
    console.log('monthlyValue:', monthlyValue ? 'Found' : 'Not found', monthlyValue);
    console.log('creditsForm:', creditsForm ? 'Found' : 'Not found', creditsForm);
    console.log('creditsResult:', creditsResult ? 'Found' : 'Not found', creditsResult);
    console.log('logoutBtn:', logoutBtn ? 'Found' : 'Not found', logoutBtn);
    console.log('Document body HTML:', document.body.innerHTML.substring(0, 500));

    const isTestPage = fileVersion.includes('test-operations');
    const requiredElementsMissing = isTestPage
      ? !monitorForm || !monitorResult
      : !monitorForm || !monitorResult || !realTimeValue || !monthlyValue || !creditsForm || !creditsResult || !logoutBtn;

    if (requiredElementsMissing) {
      const missingElements = [];
      if (!monitorForm) missingElements.push('monitor-form');
      if (!monitorResult) missingElements.push('monitor-result');
      if (!isTestPage) {
        if (!realTimeValue) missingElements.push('real-time-value');
        if (!monthlyValue) missingElements.push('monthly-value');
        if (!creditsForm) missingElements.push('credits-form');
        if (!creditsResult) missingElements.push('credits-result');
        if (!logoutBtn) missingElements.push('logout-btn');
      }
      console.error(`Attempt ${attempt}: Required elements not found:`, missingElements);

      if (attempt < 3) {
        console.log(`Retrying in ${attempt * 500}ms...`);
        setTimeout(() => checkElements(attempt + 1), attempt * 500);
        return false;
      } else {
        alert(`Erro: Elementos necessários não encontrados após ${attempt} tentativas. Elementos ausentes: ${missingElements.join(', ')}. Verifique o console e a fonte da página (Ctrl+U).`);
        return false;
      }
    }

    // Test direct DOM manipulation
    console.log('Testing direct DOM manipulation...');
    if (monitorResult) {
      monitorResult.innerHTML = '<p>Teste: DOM funcionando! (Monitor)</p>';
      console.log('Direct DOM test - monitorResult:', monitorResult.innerHTML);
    }
    if (creditsResult) {
      creditsResult.innerHTML = '<p>Teste: DOM funcionando! (Créditos)</p>';
      console.log('Direct DOM test - creditsResult:', creditsResult.innerHTML);
    }
    if (realTimeValue) realTimeValue.textContent = 'Test kW';
    if (monthlyValue) monthlyValue.textContent = 'Test kWh';

    // Monitor Form Submission
    if (monitorForm) {
      monitorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Monitor form submitted at:', new Date().toISOString());

        const clientIdInput = document.getElementById('clientId');
        if (!clientIdInput) {
          console.error('clientId input not found');
          monitorResult.innerHTML = '<p>Erro: Campo de ID do cliente não encontrado.</p>';
          alert('Erro: Campo de ID do cliente não encontrado.');
          return;
        }
        const clientId = clientIdInput.value.trim();
        console.log('Client ID entered (monitor):', clientId);

        if (!/^[0-9a-fA-F]{24}$/.test(clientId)) {
          console.error('Invalid clientId format:', clientId);
          monitorResult.innerHTML = '<p>Erro: ID do cliente inválido.</p>';
          alert('Erro: ID do cliente inválido.');
          return;
        }

        try {
          console.log('Fetching monitor data for clientId:', clientId);
          const response = await fetch(`http://localhost:3000/auth/monitor-production?clientId=${clientId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Monitor fetch response status:', response.status);

          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const data = await response.json();
          console.log('Monitor fetch response data:', data);

          if (data.clientId && data.kWh !== undefined && data.date) {
            if (realTimeValue) realTimeValue.textContent = `${data.kWh.toFixed(2)} kW`;
            if (monthlyValue) monthlyValue.textContent = `${data.kWh.toFixed(2)} kWh`;
            monitorResult.innerHTML = `
              <p>Produção monitorada com sucesso!</p>
              <p>Cliente ID: ${data.clientId}</p>
              <p>Energia Produzida: ${data.kWh.toFixed(2)} kWh</p>
              <p>Data: ${new Date(data.date).toLocaleString()}</p>
            `;
          } else {
            console.error('Invalid monitor response format:', data);
            monitorResult.innerHTML = '<p>Erro: Resposta inválida do servidor.</p>';
            alert('Erro: Resposta inválida do servidor.');
          }
        } catch (err) {
          console.error('Monitor fetch error:', err);
          monitorResult.innerHTML = `<p>Erro ao buscar dados: ${err.message}</p>`;
          alert(`Erro ao buscar dados: ${err.message}`);
        }
      });
    }

    // Credits Form Submission
    if (!isTestPage && creditsForm) {
      console.log('Setting up credits form event listener...');
      creditsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Credits form submitted at:', new Date().toISOString());

        const clientIdInput = document.getElementById('clientIdCredits');
        if (!clientIdInput) {
          console.error('clientIdCredits input not found');
          creditsResult.innerHTML = '<p>Erro: Campo de ID do cliente não encontrado.</p>';
          alert('Erro: Campo de ID do cliente não encontrado.');
          return;
        }
        const clientId = clientIdInput.value.trim();
        console.log('Client ID entered (credits):', clientId);

        if (!/^[0-9a-fA-F]{24}$/.test(clientId)) {
          console.error('Invalid clientId format:', clientId);
          creditsResult.innerHTML = '<p>Erro: ID do cliente inválido.</p>';
          alert('Erro: ID do cliente inválido.');
          return;
        }

        try {
          console.log('Fetching credits data for clientId:', clientId);
          const response = await fetch(`http://localhost:3000/auth/credits?clientId=${clientId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Credits fetch response status:', response.status, 'URL:', response.url);

          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const data = await response.json();
          console.log('Credits fetch response data:', data);

          if (data.clientId && data.totalCredits !== undefined) {
            creditsResult.innerHTML = `
              <p>Créditos contabilizados com sucesso!</p>
              <p>Cliente ID: ${data.clientId}</p>
              <p>Total de Créditos: ${data.totalCredits.toFixed(2)} kWh</p>
              <p>Última Atualização: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}</p>
            `;
            alert(`Contabilização de Créditos:\nTotal de Créditos: ${data.totalCredits.toFixed(2)} kWh`);
          } else {
            console.error('Invalid credits response format:', data);
            creditsResult.innerHTML = '<p>Erro: Resposta inválida do servidor.</p>';
            alert('Erro: Resposta inválida do servidor.');
          }
        } catch (err) {
          console.error('Credits fetch error:', err);
          creditsResult.innerHTML = `<p>Erro ao buscar créditos: ${err.message}</p>`;
          alert(`Erro ao buscar créditos: ${err.message}`);
        }
      });
    } else if (!isTestPage) {
      console.error('Credits form not found, cannot set up event listener');
    }

    // Logout Button Handler
    if (logoutBtn) {
      console.log('Setting up logout button event listener...');
      logoutBtn.addEventListener('click', () => {
        console.log('Logout button clicked at:', new Date().toISOString());
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        console.log('Token and userRole removed from localStorage');
        alert('Sessão terminada. Redirecionando para a página de login...');
        window.location.href = 'index.html';
      });
    } else {
      console.error('Logout button not found, cannot set up event listener');
    }

    return true;
  };

  // Initial check
  checkElements();
});