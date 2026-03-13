const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

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
const uri = "mongodb+srv://webcraftv_db_user:merenganov09@cluster0.f0l5nwb.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Conectado exitosamente a MongoDB");
  } catch (err) {
    console.error("Error al conectar con MongoDB:", err);
  }
}

connectMongo();

app.post('/submit', async (req, res) => {
  const { name, phone, guestType, attendance, guests, message } = req.body;

  const db = client.db("invitaciones");
  const collection = db.collection("rsvps");

  const newRsvp = {
    name,
    phone,
    guestType,
    attendance,
    guests,
    message,
    createdAt: new Date()
  };

  try {
    await collection.insertOne(newRsvp);
    res.status(200).send('¡Datos guardados correctamente!');
  } catch (error) {
    res.status(500).send('Error al guardar los datos: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});