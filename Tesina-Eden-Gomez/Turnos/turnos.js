document.addEventListener('DOMContentLoaded', () => {

  const calendarGrid = document.querySelector('.calendar-grid');
  const yearHeader = document.querySelector('.year-header');

  let currentDate = new Date();
  let selectedDay = null;
  let selectedTime = null;

  const monthNames = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  // =========================
  // GENERAR CALENDARIO
  // =========================

  function renderCalendar() {
    calendarGrid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    yearHeader.textContent = `${monthNames[month]} ${year}`;

    // días de la semana
    const daysOfWeek = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    daysOfWeek.forEach(d => {
      const span = document.createElement('span');
      span.textContent = d;
      calendarGrid.appendChild(span);
    });

    // primer día del mes
    const firstDay = new Date(year, month, 1).getDay();

    // días del mes
    const totalDays = new Date(year, month + 1, 0).getDate();

    // espacios vacíos antes
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      calendarGrid.appendChild(empty);
    }

    // días reales
    for (let day = 1; day <= totalDays; day++) {
      const div = document.createElement('div');
      div.classList.add('day');
      div.textContent = day;

      div.addEventListener('click', () => {
        document.querySelectorAll('.day').forEach(d => d.classList.remove('selected-day'));
        div.classList.add('selected-day');
        selectedDay = day;
      });

      calendarGrid.appendChild(div);
    }
  }

  // =========================
  // CAMBIO DE MES
  // =========================

  const prevBtn = document.createElement('button');
  const nextBtn = document.createElement('button');

  prevBtn.textContent = "←";
  nextBtn.textContent = "→";

  prevBtn.style.marginRight = "10px";
  nextBtn.style.marginLeft = "10px";

  yearHeader.parentNode.insertBefore(prevBtn, yearHeader);
  yearHeader.parentNode.appendChild(nextBtn);

  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // =========================
  // HORARIOS (igual que antes)
  // =========================

  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selectedTime = slot.textContent;
    });
  });

  // =========================
  // RESERVA
  // =========================

  document.querySelector('.btn-reserva').addEventListener('click', () => {
    if (!selectedDay || !selectedTime) {
      alert("Seleccioná día y horario");
      return;
    }

    alert(`Reserva:
${selectedDay} de ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}
Hora: ${selectedTime}`);
  });

  // INIT
  renderCalendar();

});