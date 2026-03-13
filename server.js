const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// URI de MongoDB
const uri =
  "mongodb+srv://webcraftv_db_user:invitados12@cluster0.f0l5nwb.mongodb.net/invitaciones?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let isMongoConnected = false;

// Conectar a MongoDB
async function connectMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    isMongoConnected = true;
    console.log("Conectado exitosamente a MongoDB");
  } catch (err) {
    isMongoConnected = false;
    console.error("Error al conectar con MongoDB:", err);
  }
}

connectMongo();

// Ruta de prueba
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mongo: isMongoConnected ? 'connected' : 'disconnected'
  });
});

// Guardar formulario
app.post('/submit', async (req, res) => {
  try {
    console.log("Datos recibidos en /submit:", req.body);

    if (!isMongoConnected) {
      console.error("MongoDB no está conectado.");
      return res.status(500).send("La base de datos no está disponible en este momento.");
    }

    const { name, phone, guestType, attendance, guests, message } = req.body;

    if (!name || !phone || !guestType || !attendance) {
      return res.status(400).send("Faltan campos obligatorios.");
    }

    const db = client.db("invitaciones");
    const collection = db.collection("rsvps");

    const newRsvp = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      guestType: String(guestType).trim(),
      attendance: String(attendance).trim(),
      guests: String(guests || "0").trim(),
      message: String(message || "").trim(),
      createdAt: new Date()
    };

    const result = await collection.insertOne(newRsvp);

    console.log("Documento insertado correctamente con ID:", result.insertedId);

    return res.status(200).send("¡Datos guardados correctamente!");
  } catch (error) {
    console.error("Error al guardar los datos:", error);
    return res.status(500).send("Error al guardar los datos: " + error.message);
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});