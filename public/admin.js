const TOKEN_KEY =
  'graduation_admin_token';

const loginView =
  document.getElementById(
    'loginView'
  );

const adminView =
  document.getElementById(
    'adminView'
  );

const loginForm =
  document.getElementById(
    'loginForm'
  );

const loginStatus =
  document.getElementById(
    'loginStatus'
  );

const adminStatus =
  document.getElementById(
    'adminStatus'
  );

const tableBody =
  document.getElementById(
    'rsvpTableBody'
  );

const logoutBtn =
  document.getElementById(
    'logoutBtn'
  );

let currentRsvps = [];

// ==============================
// TOKEN
// ==============================

function getToken() {
  return sessionStorage.getItem(
    TOKEN_KEY
  );
}

function setToken(token) {
  sessionStorage.setItem(
    TOKEN_KEY,
    token
  );
}

function removeToken() {
  sessionStorage.removeItem(
    TOKEN_KEY
  );
}

// ==============================
// FORMATEAR DINERO
// ==============================

function money(value) {

  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN'
    }
  ).format(value);
}

// ==============================
// LOGIN
// ==============================

loginForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();

    loginStatus.textContent =
      'Ingresando...';

    const username =
      document.getElementById(
        'username'
      ).value;

    const password =
      document.getElementById(
        'password'
      ).value;

    try {

      const response =
        await fetch(
          '/api/admin/login',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              username,
              password
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        loginStatus.textContent =
          data.error ||
          'No se pudo iniciar sesión.';

        return;
      }

      setToken(data.token);

      loginStatus.textContent = '';

      showAdmin();

    } catch (error) {

      loginStatus.textContent =
        'Error de conexión.';
    }
  }
);

// ==============================
// MOSTRAR ADMIN
// ==============================

function showAdmin() {

  loginView.classList.add(
    'hidden'
  );

  adminView.classList.remove(
    'hidden'
  );

  loadRsvps();
}

// ==============================
// MOSTRAR LOGIN
// ==============================

function showLogin() {

  removeToken();

  adminView.classList.add(
    'hidden'
  );

  loginView.classList.remove(
    'hidden'
  );
}

// ==============================
// CARGAR REGISTROS
// ==============================

async function loadRsvps() {

  adminStatus.textContent =
    'Cargando registros...';

  try {

    const response =
      await fetch(
        '/api/admin/rsvps',
        {
          headers: {
            Authorization:
              `Bearer ${getToken()}`
          }
        }
      );

    if (
      response.status === 401
    ) {

      showLogin();
      return;
    }

    if (!response.ok) {

      throw new Error(
        'No se pudieron cargar los registros.'
      );
    }

    currentRsvps =
      await response.json();

    renderRsvps();

    adminStatus.textContent =
      `${currentRsvps.length} registros encontrados`;

  } catch (error) {

    adminStatus.textContent =
      error.message;
  }
}

// ==============================
// MOSTRAR TABLA
// ==============================

function renderRsvps() {

  tableBody.innerHTML = '';

  if (
    currentRsvps.length === 0
  ) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="9">
          No hay registros todavía.
        </td>
      </tr>
    `;

    return;
  }

  currentRsvps.forEach(
    rsvp => {

      const row =
        document.createElement(
          'tr'
        );

      row.innerHTML = `
        <td>
          ${escapeHtml(rsvp.name)}
        </td>

        <td>
          ${escapeHtml(rsvp.phone)}
        </td>

        <td>
          ${escapeHtml(rsvp.attendance)}
        </td>

        <td>
          ${rsvp.guests}
        </td>

        <td>
          ${rsvp.tickets}
        </td>

        <td>
          ${money(rsvp.total)}
        </td>

        <td class="paid">
          ${money(rsvp.paid)}
        </td>

        <td class="pending">
          ${money(rsvp.pending)}
        </td>

        <td>
          <div class="actions">

            <button
              class="btn-edit"
              data-action="edit"
              data-id="${rsvp._id}"
            >
              Editar
            </button>

            <button
              class="btn-payment"
              data-action="payment"
              data-id="${rsvp._id}"
            >
              Abono
            </button>

            <button
              class="btn-delete"
              data-action="delete"
              data-id="${rsvp._id}"
            >
              Eliminar
            </button>

          </div>
        </td>
      `;

      tableBody.appendChild(row);
    }
  );
}

// ==============================
// ACCIONES
// ==============================

tableBody.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        'button[data-action]'
      );

    if (!button) {
      return;
    }

    const id =
      button.dataset.id;

    const rsvp =
      currentRsvps.find(
        item =>
          item._id === id
      );

    if (!rsvp) {
      return;
    }

    const action =
      button.dataset.action;

    if (action === 'edit') {
      editRsvp(rsvp);
    }

    if (action === 'payment') {
      registerPayment(rsvp);
    }

    if (action === 'delete') {
      deleteRsvp(rsvp);
    }
  }
);

// ==============================
// EDITAR
// ==============================

async function editRsvp(rsvp) {

  const name =
    prompt(
      'Nombre completo:',
      rsvp.name
    );

  if (name === null) {
    return;
  }

  const phone =
    prompt(
      'Teléfono:',
      rsvp.phone
    );

  if (phone === null) {
    return;
  }

  const guestType =
    prompt(
      'Tipo de invitado:',
      rsvp.guestType
    );

  if (guestType === null) {
    return;
  }

  const attendance =
    prompt(
      'Asistencia (Sí / No / Por confirmar):',
      rsvp.attendance
    );

  if (attendance === null) {
    return;
  }

  const guests =
    prompt(
      'Número de acompañantes:',
      rsvp.guests
    );

  if (guests === null) {
    return;
  }

  const message =
    prompt(
      'Mensaje:',
      rsvp.message || ''
    );

  if (message === null) {
    return;
  }

  try {

    const response =
      await fetch(
        `/api/admin/rsvps/${rsvp._id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${getToken()}`
          },

          body: JSON.stringify({
            name,
            phone,
            guestType,
            attendance,
            guests,
            message
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.error ||
        'No se pudo editar.'
      );

      return;
    }

    await loadRsvps();

  } catch (error) {

    alert(
      'Error al editar.'
    );
  }
}

// ==============================
// ABONO
// ==============================

async function registerPayment(
  rsvp
) {

  if (
    rsvp.pending <= 0
  ) {

    alert(
      'Este invitado no tiene saldo pendiente.'
    );

    return;
  }

  const amount =
    prompt(
      `${rsvp.name}

Total: ${money(rsvp.total)}
Abonado: ${money(rsvp.paid)}
Pendiente: ${money(rsvp.pending)}

¿Cuánto te entregó?`
    );

  if (amount === null) {
    return;
  }

  const number =
    Number(amount);

  if (
    !number ||
    number <= 0
  ) {

    alert(
      'Ingresa un monto válido.'
    );

    return;
  }

  try {

    const response =
      await fetch(
        `/api/admin/rsvps/${rsvp._id}/payments`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${getToken()}`
          },

          body: JSON.stringify({
            amount: number
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.error ||
        'No se pudo registrar el abono.'
      );

      return;
    }

    await loadRsvps();

  } catch (error) {

    alert(
      'Error registrando el abono.'
    );
  }
}

// ==============================
// ELIMINAR
// ==============================

async function deleteRsvp(
  rsvp
) {

  const confirmed =
    confirm(
      `¿Seguro que deseas eliminar a ${rsvp.name}?

También se eliminarán sus abonos.`
    );

  if (!confirmed) {
    return;
  }

  try {

    const response =
      await fetch(
        `/api/admin/rsvps/${rsvp._id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${getToken()}`
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.error ||
        'No se pudo eliminar.'
      );

      return;
    }

    await loadRsvps();

  } catch (error) {

    alert(
      'Error eliminando registro.'
    );
  }
}

// ==============================
// CERRAR SESIÓN
// ==============================

logoutBtn.addEventListener(
  'click',
  () => {

    showLogin();

  }
);

// ==============================
// EVITAR HTML EN DATOS
// ==============================

function escapeHtml(value) {

  return String(
    value ?? ''
  )
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
}

// ==============================
// INICIO
// ==============================

if (getToken()) {

  showAdmin();

} else {

  showLogin();

}