document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  if (!token || !userRole) {
    alert('Por favor, inicie sessão.');
    window.location.href = 'index.html';
    return;
  }

  if (userRole !== 'Cliente') {
    alert('Acesso não autorizado: apenas clientes podem aceder a esta página.');
    window.location.href = 'index.html';
    return;
  }

  window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
  };
});