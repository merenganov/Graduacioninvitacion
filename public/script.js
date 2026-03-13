const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

const partyModal = document.getElementById("partyModal");
const openPartyModal = document.getElementById("openPartyModal");
const closePartyModal = document.getElementById("closePartyModal");

const misaModal = document.getElementById("misaModal");
const openMassModal = document.getElementById("openMassModal");
const closeMisaModal = document.getElementById("closeMisaModal");

const rsvpForm = document.getElementById("rsvpForm");
const statusBox = document.getElementById("status");
const submitButton = document.querySelector("#rsvpForm button[type='submit']");

const deadline = new Date("2026-11-30T23:59:59").getTime();
const now = new Date().getTime();

/* =========================
   CIERRE DE REGISTRO
========================= */

if (now > deadline) {
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Registro cerrado";
    submitButton.style.opacity = "0.7";
    submitButton.style.cursor = "not-allowed";
  }

  if (statusBox) {
    statusBox.textContent =
      "La fecha límite para responder fue el lunes 30 de noviembre de 2026.";
  }
}

/* =========================
   MODALES
========================= */

// Abrir modal fiesta
if (openPartyModal && partyModal) {
  openPartyModal.onclick = function () {
    partyModal.style.display = "block";
  };
}

// Cerrar modal fiesta
if (closePartyModal && partyModal) {
  closePartyModal.onclick = function () {
    partyModal.style.display = "none";
  };
}

// Abrir modal misa
if (openMassModal && misaModal) {
  openMassModal.onclick = function () {
    misaModal.style.display = "block";
  };
}

// Cerrar modal misa
if (closeMisaModal && misaModal) {
  closeMisaModal.onclick = function () {
    misaModal.style.display = "none";
  };
}

// Cerrar modales al hacer clic fuera
window.onclick = function (event) {
  if (partyModal && event.target === partyModal) {
    partyModal.style.display = "none";
  }

  if (misaModal && event.target === misaModal) {
    misaModal.style.display = "none";
  }
};

/* =========================
   SLIDER
========================= */

let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  currentSlide = index;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentSlide < slides.length - 1) {
      showSlide(currentSlide + 1);
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentSlide > 0) {
      showSlide(currentSlide - 1);
    }
  });
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = Number(dot.dataset.go);
    showSlide(index);
  });
});

/* =========================
   CUENTA REGRESIVA
========================= */

const eventDate = new Date("2026-12-18T21:00:00").getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = eventDate - now;

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  if (distance <= 0) {
    daysEl.textContent = "0";
    hoursEl.textContent = "0";
    minutesEl.textContent = "0";
    secondsEl.textContent = "0";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  daysEl.textContent = days;
  hoursEl.textContent = hours;
  minutesEl.textContent = minutes;
  secondsEl.textContent = seconds;
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* =========================
   FORMULARIO
========================= */

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (statusBox) {
      statusBox.textContent = "Enviando confirmación...";
    }

    const data = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      guestType: document.getElementById("guestType").value,
      attendance: document.getElementById("attendance").value,
      guests: document.getElementById("guests").value || "0",
      message: document.getElementById("message").value.trim()
    };

    try {
      const response = await fetch("/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.text();

      if (!response.ok) {
        throw new Error(result || "Error desconocido del servidor.");
      }

      console.log("Respuesta del servidor:", result);

      if (statusBox) {
        statusBox.textContent = "Tu confirmación fue registrada correctamente.";
      }

      rsvpForm.reset();
    } catch (error) {
      console.error("Error al enviar la confirmación:", error);

      if (statusBox) {
        statusBox.textContent =
          "Hubo un error al registrar tu confirmación: " + error.message;
      }
    }
  });
}