// index.js

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET;

app.use(cors());
app.use(express.json());

// ✅ Inicializar Firebase Admin usando archivo secreto montado por Render
const serviceAccount = require("/etc/secrets/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware de autenticación simple
function verificarToken(req, res, next) {
  const token = req.headers["x-api-key"];
  if (!token || token !== API_SECRET) {
    return res.status(403).json({ error: "Acceso no autorizado" });
  }
  next();
}

// Ruta protegida para enviar notificaciones
app.post("/enviar-notificacion", verificarToken, async (req, res) => {
  const { titulo, mensaje, tokens } = req.body;

  if (!titulo || !mensaje || !tokens || !Array.isArray(tokens)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const mensajes = tokens.map((token) => ({
    token,
    notification: {
      title: titulo,
      body: mensaje,
    },
    data: {
      screen: "Notificaciones",
    },
  }));

  try {
    const response = await admin.messaging().sendEach(mensajes);
    console.log("✅ Notificaciones enviadas:", response.successCount);
    res.status(200).json({ ok: true, entregadas: response.successCount });
  } catch (error) {
    console.error("❌ Error al enviar notificaciones:", error);
    res.status(500).json({ error: "Error al enviar notificaciones" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de notificaciones escuchando en http://localhost:${PORT}`);
});
