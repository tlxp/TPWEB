document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  window.showRegisterForm = () => {
    loginForm.style.display = "none";
    registerForm.style.display = "flex";
  };

  window.showLoginForm = () => {
    registerForm.style.display = "none";
    loginForm.style.display = "flex";
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        console.log(
          "Login successful, token:",
          result.token,
          "role:",
          result.role
        ); // Debug log
        localStorage.setItem("token", result.token);
        localStorage.setItem("userRole", result.role);
        const userRole = result.role;
        if (userRole === "Técnico") {
          window.location.href = "/technician.html";
        } else if (userRole === "Cliente") {
          window.location.href = "/dashboard.html";
        } else if (userRole === "Gestor Operações") {
          window.location.href = "/operations.html";
        } else {
          alert("Role não suportado.");
        }
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      alert("Erro ao fazer login.");
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const data = {
      username: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: "Cliente",
      prod: "0",
      prodMes: "0",
      creditos: "0",
    };

    // Basic client-side validation
    if (!data.username || !data.email || !data.password) {
      alert("Nome de utilizador, e-mail e palavra-passe são obrigatórios.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      alert(result.message);
      if (response.ok) {
        showLoginForm();
        registerForm.reset();
      }
    } catch (err) {
      console.error("Erro ao registar usuário:", err);
      alert("Erro ao registar usuário.");
    }
  });
});
