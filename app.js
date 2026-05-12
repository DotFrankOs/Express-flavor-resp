const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const PORT = 3000;

// Servir archivos del frontend
app.use(express.static('public'));

// Endpoint (API)
app.get('/api/saludo', (req, res) => {
  res.json({ mensaje: "Hola desde el servidor 🚀" });
});

// Encender servidor
app.listen(PORT, () => {
  console.log(`Servidor: http://localhost:${PORT}`);
});

// Libreria dotenv
require('dotenv').config();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));
