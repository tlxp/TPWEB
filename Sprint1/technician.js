document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  if (!token || !userRole) {
    alert('Por favor, inicie sessão.');
    window.location.href = 'index.html';
    return;
  }

  if (userRole !== 'Técnico') {
    alert('Acesso não autorizado: apenas técnicos podem acessar esta página.');
    window.location.href = 'index.html';
    return;
  }

  // Função de logout
  window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
  };
});