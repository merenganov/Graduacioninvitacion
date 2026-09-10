require('dotenv').config();

const express = require('express');
const {
  MongoClient,
  ServerApiVersion,
  ObjectId
} = require('mongodb');

const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

const TICKET_PRICE = 1250;

// ==============================
// MIDDLEWARES
// ==============================

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// PÁGINA PRINCIPAL
// ==============================

app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'public', 'index.html')
  );
});

// ==============================
// PANEL ADMINISTRATIVO
// ==============================

app.get('/admin', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'public', 'admin.html')
  );
});

// ==============================
// MONGODB
// ==============================

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    'MONGODB_URI no está configurada'
  );
}

let clientPromise = null;

async function getMongoClient() {

  if (clientPromise) {
    return clientPromise;
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  clientPromise = client.connect()
    .then(async (connectedClient) => {

      await connectedClient
        .db('admin')
        .command({ ping: 1 });

      console.log(
        'Conectado exitosamente a MongoDB'
      );

      return connectedClient;
    })
    .catch(error => {

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
// CALCULAR DATOS DEL INVITADO
// ==============================

function calculateRsvpData(rsvp) {

  const companions =
    Math.max(
      0,
      parseInt(rsvp.guests || 0)
    );

  // Solo se cobran boletos si confirmó asistencia
  const tickets =
    rsvp.attendance === 'Sí'
      ? 1 + companions
      : 0;

  const ticketPrice =
    Number(
      rsvp.ticketPrice ||
      TICKET_PRICE
    );

  const total =
    tickets * ticketPrice;

  const payments =
    Array.isArray(rsvp.payments)
      ? rsvp.payments
      : [];

  const paid = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  const pending =
    Math.max(total - paid, 0);

  return {
    _id: rsvp._id.toString(),

    name: rsvp.name,
    phone: rsvp.phone,
    guestType: rsvp.guestType,
    attendance: rsvp.attendance,

    guests: companions,
    message: rsvp.message || '',

    ticketPrice,
    tickets,
    total,
    paid,
    pending,

    payments,
    createdAt: rsvp.createdAt
  };
}

// ==============================
// FORMULARIO PÚBLICO
// ==============================

app.post('/submit', async (req, res) => {

  try {

    console.log(
      'Datos recibidos en /submit:',
      req.body
    );

    const client =
      await getMongoClient();

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
        .send(
          'Faltan campos obligatorios.'
        );
    }

    const db =
      client.db('invitaciones');

    const collection =
      db.collection('rsvps');

    const newRsvp = {

      name:
        String(name).trim(),

      phone:
        String(phone).trim(),

      guestType:
        String(guestType).trim(),

      attendance:
        String(attendance).trim(),

      guests:
        Math.max(
          0,
          parseInt(guests || 0) || 0
        ),

      message:
        String(message || '').trim(),

      ticketPrice:
        TICKET_PRICE,

      payments: [],

      createdAt:
        new Date()
    };

    const result =
      await collection.insertOne(
        newRsvp
      );

    console.log(
      'Documento insertado con ID:',
      result.insertedId
    );

    return res
      .status(200)
      .send(
        '¡Datos guardados correctamente!'
      );

  } catch (error) {

    console.error(
      'Error al guardar:',
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
// LOGIN ADMIN
// ==============================

app.post(
  '/api/admin/login',
  (req, res) => {

    const {
      username,
      password
    } = req.body;

    if (
      !process.env.ADMIN_USER ||
      !process.env.ADMIN_PASSWORD ||
      !process.env.JWT_SECRET
    ) {

      return res.status(500).json({
        error:
          'El administrador no está configurado.'
      });
    }

    if (
      username !==
        process.env.ADMIN_USER ||
      password !==
        process.env.ADMIN_PASSWORD
    ) {

      return res.status(401).json({
        error:
          'Usuario o contraseña incorrectos.'
      });
    }

    const token = jwt.sign(
      {
        role: 'admin'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '12h'
      }
    );

    return res.json({
      success: true,
      token
    });
  }
);

// ==============================
// PROTEGER RUTAS ADMIN
// ==============================

function requireAdmin(
  req,
  res,
  next
) {

  const authorization =
    req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith(
      'Bearer '
    )
  ) {

    return res
      .status(401)
      .json({
        error: 'No autorizado'
      });
  }

  const token =
    authorization.substring(7);

  try {

    jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();

  } catch (error) {

    return res
      .status(401)
      .json({
        error:
          'Sesión inválida o expirada'
      });
  }
}

// ==============================
// OBTENER INVITADOS
// ==============================

app.get(
  '/api/admin/rsvps',
  requireAdmin,
  async (req, res) => {

    try {

      const client =
        await getMongoClient();

      const db =
        client.db('invitaciones');

      const collection =
        db.collection('rsvps');

      const rsvps =
        await collection
          .find({})
          .sort({
            createdAt: -1
          })
          .toArray();

      const data =
        rsvps.map(
          calculateRsvpData
        );

      return res.json(data);

    } catch (error) {

      console.error(
        'Error obteniendo registros:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'No se pudieron obtener los registros.'
        });
    }
  }
);

// ==============================
// EDITAR INVITADO
// ==============================

app.put(
  '/api/admin/rsvps/:id',
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        req.params.id;

      if (!ObjectId.isValid(id)) {

        return res
          .status(400)
          .json({
            error:
              'ID inválido'
          });
      }

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
          .json({
            error:
              'Faltan campos obligatorios.'
          });
      }

      const client =
        await getMongoClient();

      const db =
        client.db('invitaciones');

      const collection =
        db.collection('rsvps');

      await collection.updateOne(
        {
          _id:
            new ObjectId(id)
        },
        {
          $set: {

            name:
              String(name).trim(),

            phone:
              String(phone).trim(),

            guestType:
              String(guestType).trim(),

            attendance:
              String(attendance).trim(),

            guests:
              Math.max(
                0,
                parseInt(
                  guests || 0
                ) || 0
              ),

            message:
              String(
                message || ''
              ).trim()
          }
        }
      );

      return res.json({
        success: true
      });

    } catch (error) {

      console.error(
        'Error editando registro:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'No se pudo editar.'
        });
    }
  }
);

// ==============================
// REGISTRAR ABONO
// ==============================

app.post(
  '/api/admin/rsvps/:id/payments',
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        req.params.id;

      if (!ObjectId.isValid(id)) {

        return res
          .status(400)
          .json({
            error:
              'ID inválido'
          });
      }

      const amount =
        Number(req.body.amount);

      if (
        !amount ||
        amount <= 0
      ) {

        return res
          .status(400)
          .json({
            error:
              'El monto debe ser mayor a cero.'
          });
      }

      const client =
        await getMongoClient();

      const db =
        client.db('invitaciones');

      const collection =
        db.collection('rsvps');

      const rsvp =
        await collection.findOne({
          _id:
            new ObjectId(id)
        });

      if (!rsvp) {

        return res
          .status(404)
          .json({
            error:
              'Invitado no encontrado.'
          });
      }

      const calculated =
        calculateRsvpData(rsvp);

      if (
        amount >
        calculated.pending
      ) {

        return res
          .status(400)
          .json({
            error:
              `El saldo pendiente es de $${calculated.pending}.`
          });
      }

      const payment = {

        amount:
          Math.round(
            amount * 100
          ) / 100,

        date:
          new Date()
      };

      await collection.updateOne(
        {
          _id:
            new ObjectId(id)
        },
        {
          $push: {
            payments:
              payment
          }
        }
      );

      return res.json({
        success: true
      });

    } catch (error) {

      console.error(
        'Error registrando pago:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'No se pudo registrar el pago.'
        });
    }
  }
);

// ==============================
// ELIMINAR INVITADO
// ==============================

app.delete(
  '/api/admin/rsvps/:id',
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        req.params.id;

      if (!ObjectId.isValid(id)) {

        return res
          .status(400)
          .json({
            error:
              'ID inválido'
          });
      }

      const client =
        await getMongoClient();

      const db =
        client.db('invitaciones');

      const collection =
        db.collection('rsvps');

      await collection.deleteOne({
        _id:
          new ObjectId(id)
      });

      return res.json({
        success: true
      });

    } catch (error) {

      console.error(
        'Error eliminando registro:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'No se pudo eliminar.'
        });
    }
  }
);

// ==============================
// HEALTH
// ==============================

app.get('/health', async (req, res) => {

  try {

    await getMongoClient();

    res.json({
      status: 'ok',
      mongo: 'connected'
    });

  } catch (error) {

    console.error('ERROR MONGODB:', error);

    res.status(500).json({
      status: 'error',
      mongo: 'disconnected',
      error: error.message
    });
  }
});

// ==============================
// SERVIDOR
// ==============================

app.listen(port, () => {
  console.log(
    `Servidor corriendo en puerto ${port}`
  );
});