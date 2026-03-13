// Importar las dependencias necesarias
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');  // Importar CORS

// Crear la aplicación Express
const app = express();
const port = 3000;

// Habilitar CORS para todas las solicitudes
app.use(cors());  // Permitir solicitudes de todos los orígenes

// Configurar body-parser para procesar las solicitudes JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Crear la URI de conexión con MongoDB Atlas
const uri = "mongodb+srv://webcraftv_db_user:merenganov09@cluster0.f0l5nwb.mongodb.net/?appName=Cluster0";

// Crear un cliente de MongoDB
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Conectar a MongoDB y realizar el ping
async function connectMongo() {
  try {
    // Conectar al servidor de MongoDB
    await client.connect();
    // Hacer un ping para asegurarse de que la conexión está activa
    await client.db("admin").command({ ping: 1 });
    console.log("¡Conectado exitosamente a MongoDB!");
  } catch (err) {
    console.error('Error al conectar con MongoDB:', err);
  }
}

// Conectar a MongoDB
connectMongo();

// Ruta para manejar el envío del formulario
app.post('/submit', async (req, res) => {
  const { name, phone, guestType, attendance, guests, message } = req.body;

  // Acceder a la base de datos "invitaciones"
  const db = client.db("invitaciones");
  const collection = db.collection("rsvps");

  // Crear el documento a guardar
  const newRsvp = {
    name,
    phone,
    guestType,
    attendance,
    guests,
    message
  };

  try {
    // Insertar el documento en la colección "rsvps"
    await collection.insertOne(newRsvp);
    res.status(200).send('¡Datos guardados correctamente!');
  } catch (error) {
    res.status(500).send('Error al guardar los datos: ' + error.message);
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});