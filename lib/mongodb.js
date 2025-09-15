import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('horarioDB');
    const collection = db.collection('horarios');

    if (req.method === 'GET') {
      const { usuario } = req.query;
      const horario = await collection.findOne({ usuario });
      res.json(horario || { usuario, semanas: {}, nuevasClases: {} });
    } else if (req.method === 'POST') {
      const data = req.body;
      await collection.replaceOne({ usuario: data.usuario }, data, {
        upsert: true
      });
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
