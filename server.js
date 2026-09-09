const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// ==============================
// MIDDLEWARES
// ==============================

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// RUTA PRINCIPAL
// ==============================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================
// MONGODB
// ==============================

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI no está configurada');
}

let clientPromise = null;

async function getMongoClient() {

  // Si ya existe una conexión o una conexión en proceso,
  // reutilizarla.
  if (clientPromise) {
    return clientPromise;
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  clientPromise = client.connect()
    .then(async (connectedClient) => {

      await connectedClient
        .db('admin')
        .command({ ping: 1 });

      console.log('Conectado exitosamente a MongoDB');

      return connectedClient;
    })
    .catch((error) => {

      // Si falla, permitir volver a intentar
      clientPromise = null;

      console.error(
        'Error al conectar con MongoDB:',
        error
      );

      throw error;
    });

  return clientPromise;
}

// ==============================
// HEALTH CHECK
// ==============================

app.get('/health', async (req, res) => {

  try {

    await getMongoClient();

    res.status(200).json({
      status: 'ok',
      mongo: 'connected'
    });

  } catch (error) {

    res.status(500).json({
      status: 'error',
      mongo: 'disconnected',
      error: error.message
    });

  }
});

// ==============================
// GUARDAR FORMULARIO
// ==============================

app.post('/submit', async (req, res) => {

  try {

    console.log(
      'Datos recibidos en /submit:',
      req.body
    );

    // IMPORTANTE:
    // Esperamos a MongoDB antes de intentar guardar.
    const client = await getMongoClient();

    const {
      name,
      phone,
      guestType,
      attendance,
      guests,
      message
    } = req.body;

    if (
      !name ||
      !phone ||
      !guestType ||
      !attendance
    ) {

      return res
        .status(400)
        .send('Faltan campos obligatorios.');
    }

    const db = client.db('invitaciones');

    const collection = db.collection('rsvps');

    const newRsvp = {

      name: String(name).trim(),

      phone: String(phone).trim(),

      guestType: String(guestType).trim(),

      attendance: String(attendance).trim(),

      guests: String(guests || '0').trim(),

      message: String(message || '').trim(),

      createdAt: new Date()
    };

    const result =
      await collection.insertOne(newRsvp);

    console.log(
      'Documento insertado correctamente con ID:',
      result.insertedId
    );

    return res
      .status(200)
      .send('¡Datos guardados correctamente!');

  } catch (error) {

    console.error(
      'Error al guardar los datos:',
      error
    );

    return res
      .status(500)
      .send(
        'Error al guardar los datos: ' +
        error.message
      );
  }
});

// ==============================
// INICIAR SERVIDOR
// ==============================

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});