# Sistema de Gestão de Painéis Solares

Este projeto é um sistema para gerenciar painéis solares, com autenticação de usuários, registro de painéis, upload de certificados e relatórios de energia, desenvolvido em Node.js.

Agora com suporte a **MongoDB Atlas** para armazenamento em nuvem!

---

## 📁 Estrutura do Projeto

### Arquivos JavaScript (`.js`)
- `server.js` – Configuração do servidor backend.
- `auth.js` – Rotas de autenticação e gerenciamento de painéis.
- `index.js` – Lógica de autenticação do frontend.
- `dashboard.js` – Lógica do painel do frontend.
- `technician.js` – Lógica para funcionalidades de técnico no frontend.

### Arquivos HTML (`.html`)
- `index.html` – Página de login/registro.
- `dashboard.html` – Painel para registro de painéis.
- `technician.html` – Página para funcionalidades de técnico.

### Arquivos CSS (`.css`)
- `index.css` – Estilização da página de login/registro.
- `dashboard.css` – Estilização do painel.
- `technician.css` – Estilização da página de técnico.

### Arquivos de Configuração (`.json`, `.env`)
- `package.json` – Dependências e scripts do Node.js.
- `package-lock.json` – Lock de dependências do Node.js.
- `.env` – Variáveis de ambiente (ex.: `DB_URI`, `JWT_SECRET`).

### Arquivos de Documentação (`.md`)
- `README.md` – Este documento.

---

## 🔧 Instalação

### 📦 Requisitos

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl gnupg build-essential
```

### 🛠️ Instalar Node.js e npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 📡 Instalar Cliente MongoDB

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update
sudo apt install -y mongodb-mongosh
```

### 📥 Instalar Dependências

```bash
cd ~/renewable-energy
npm init -y
npm install express jsonwebtoken nodemailer mongoose multer multer-gridfs-storage dotenv cors
npm install -g live-server
```

### ⚙️ Configurar .env

```bash
echo "DB_URI=XXXXXXXXXXXXXXXXXXXXXXXXX" > .env
echo "JWT_SECRET=suaChaveSecreta123" >> .env
echo "EMAIL_USER=seu-email@gmail.com" >> .env
echo "EMAIL_PASS=sua-senha-de-app" >> .env
```

> ⚠️ Substitua `XXXXXXXXXXXXXXXXXXXXX`, `suaChaveSecreta123`, `seu-email@gmail.com` e `sua-senha-de-app` por valores reais.

---

## ▶️ Execução

### 🌐 Backend

```bash
node server.js &
```

### 🖥️ Frontend

```bash
live-server --port=5500
```

Acesse `http://localhost:5500`.

---

## 📄 Banco de Dados

O sistema usa MongoDB Atlas. Limpe a coleção `solarpanels` para evitar erros de IDs duplicados:

```bash
mongosh "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" --eval 'db.solarpanels.deleteMany({});'
```

Formato de um painel no banco:

```
panelId: PANEL101
location: Lisboa, Alvalade
technicalSpecs: 300W, Monocristalino
clientId: <user_id>
status: Pendente
```

---

## 🧠 Funcionalidades

- Autenticação (login/registro)
- Registro de painéis solares
- Upload de certificados (PDF)

---

## 📊 Saída

- Painéis registrados no MongoDB Atlas
- Logs no console do servidor e navegador

---

## 👥 Autores

- José Amoreira  – 51712 (Sprint 1)
- Diogo Gomes – 51618
- Tiago Valério – 52334

---

## 📌 Observações

- Certifique-se de que o `.env` contém credenciais válidas.
- O MongoDB Atlas requer conexão à internet.
- Use uma Senha de Aplicativo do Gmail para `EMAIL_PASS`.
- Credenciais no `DB_URI` devem ser protegidas em produção.

---
![image](https://github.com/user-attachments/assets/290c3cf0-7f68-4f15-b251-15cd0ae361e0)
