import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Usar la URI de MongoDB desde .env o fallback a local
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/horarioDB';
const client = new MongoClient(MONGO_URI);
let db;

client.connect().then(() => {
  db = client.db('horarioDB');
  console.log('✅ Conectado a MongoDB');
  console.log('📍 URI:', MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Ocultar credenciales en logs
}).catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  console.log('🔧 Verifica que tu MONGO_URI en .env sea correcta');
});

// Middleware para verificar conexión a BD
const checkDBConnection = (req, res, next) => {
  if (!db) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  next();
};

// Obtener horario
app.get('/api/horario', checkDBConnection, async (req, res) => {
  try {
    const horario = await db
      .collection('horarios')
      .findOne({ usuario: 'elena' });
    res.json(horario || { semanas: {}, nuevasClases: {}, viernesRotativo: {}, diasBloqueados: {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener horario' });
  }
});

// Guardar horario
app.post('/api/horario', checkDBConnection, async (req, res) => {
  const data = req.body;
  try {
    // Obtener datos existentes
    const existingData = await db
      .collection('horarios')
      .findOne({ usuario: data.usuario });

    const updatedData = {
      usuario: data.usuario,
      semanas: { ...(existingData?.semanas || {}), ...(data.semanas || {}) },
      nuevasClases: { ...(existingData?.nuevasClases || {}), ...(data.nuevasClases || {}) },
      viernesRotativo: { ...(existingData?.viernesRotativo || {}), ...(data.viernesRotativo || {}) },
      diasBloqueados: { ...(existingData?.diasBloqueados || {}), ...(data.diasBloqueados || {}) }
    };

    await db
      .collection('horarios')
      .updateOne({ usuario: data.usuario }, { $set: updatedData }, { upsert: true });

    res.json({ ok: true, message: 'Datos guardados correctamente' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al guardar horario' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`)
);
