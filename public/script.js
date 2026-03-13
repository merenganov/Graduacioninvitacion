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

const deadline = new Date("2026-11-30T23:59:59").getTime();
const now = new Date().getTime();
const submitButton = document.querySelector("#rsvpForm button[type='submit']");

if (now > deadline) {
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Registro cerrado";
    submitButton.style.opacity = "0.7";
    submitButton.style.cursor = "not-allowed";
  }

  if (statusBox) {
    statusBox.textContent = "La fecha límite para responder fue el lunes 30 de noviembre de 2026.";
  }
}

// Abrir el modal de la fiesta
openPartyModal.onclick = function() {
  partyModal.style.display = "block";
}

// Cerrar el modal de la fiesta
closePartyModal.onclick = function() {
  partyModal.style.display = "none";
}

// Cerrar el modal si se hace clic fuera de él
window.onclick = function(event) {
  if (event.target === partyModal) {
    partyModal.style.display = "none";
  }
}

// Openmenu misa
openMassModal.onclick = function(){
  misaModal.style.display = "block";
}
closeMisaModal.onclick = function(){
  misaModal.style.display = "none";
}

window.onclick = function(event){
  if (event.target === misaModal){
    misaModal.style.display = "none"
  }
}

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

const eventDate = new Date("2026-12-18T22:00:00").getTime();

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
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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

const rsvpForm = document.getElementById("rsvpForm");
const statusBox = document.getElementById("status");

if (rsvpForm) {
  rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      guestType: document.getElementById("guestType").value,
      attendance: document.getElementById("attendance").value,
      guests: document.getElementById("guests").value || "0",
      message: document.getElementById("message").value
    };

    // Enviar los datos al servidor usando Fetch API
    fetch("/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data) // Convertir los datos en formato JSON
    })
      .then((response) => response.text()) // Leer la respuesta del servidor
      .then((data) => {
        console.log("Respuesta del servidor:", data);

        if (statusBox) {
          statusBox.textContent = "Tu confirmación fue registrada correctamente.";
        }

        rsvpForm.reset(); // Limpiar el formulario
      })
      .catch((error) => {
        console.error("Error al enviar la confirmación:", error);
        if (statusBox) {
          statusBox.textContent = "Hubo un error al registrar tu confirmación. Intenta nuevamente.";
        }
      });
  });
}