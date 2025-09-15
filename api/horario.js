import clientPromise from '../lib/mongodb.js';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('horarioDB');

    if (req.method === 'GET') {
      const horario = await db
        .collection('horarios')
        .findOne({ usuario: 'elena' });

      res.status(200).json(
        horario || {
          semanas: {},
          nuevasClases: {},
          viernesRotativo: {},
          diasBloqueados: {}
        }
      );
    } else if (req.method === 'POST') {
      const data = req.body;

      const existingData = await db
        .collection('horarios')
        .findOne({ usuario: data.usuario });

      const updatedData = {
        usuario: data.usuario,
        semanas: { ...(existingData?.semanas || {}), ...(data.semanas || {}) },
        nuevasClases: {
          ...(existingData?.nuevasClases || {}),
          ...(data.nuevasClases || {})
        },
        viernesRotativo: {
          ...(existingData?.viernesRotativo || {}),
          ...(data.viernesRotativo || {})
        },
        diasBloqueados: {
          ...(existingData?.diasBloqueados || {}),
          ...(data.diasBloqueados || {})
        }
      };

      await db
        .collection('horarios')
        .updateOne(
          { usuario: data.usuario },
          { $set: updatedData },
          { upsert: true }
        );

      res
        .status(200)
        .json({ ok: true, message: 'Datos guardados correctamente' });
    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
