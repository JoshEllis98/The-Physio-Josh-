// ============================================
// THE PHYSIO JOSH — Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Navigation Toggle ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // --- Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(other => other.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // =============================================
  // UNIFIED BOOKING FLOW
  // =============================================
  const calendarGrid = document.getElementById('calendarGrid');
  if (!calendarGrid) return; // Not on the contact page

  const calendarTitle = document.getElementById('calendarTitle');
  const calendarPrev = document.getElementById('calendarPrev');
  const calendarNext = document.getElementById('calendarNext');
  const timeSlotsGrid = document.getElementById('timeSlotsGrid');
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const bookingFlow = document.getElementById('bookingFlow');

  // Step elements
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step1Summary = document.getElementById('step1Summary');
  const step2Summary = document.getElementById('step2Summary');
  const selectedDateText = document.getElementById('selectedDateText');
  const selectedSlotText = document.getElementById('selectedSlotText');
  const changeDateBtn = document.getElementById('changeDateBtn');
  const changeTimeBtn = document.getElementById('changeTimeBtn');

  // State
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let selectedDate = null;
  let selectedTime = null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdaySlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const saturdaySlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM'
  ];

  // --- Step Management ---
  function goToStep(stepNum) {
    [step1, step2, step3].forEach(s => {
      s.classList.remove('active');
      s.classList.remove('completed');
    });

    // Mark completed steps
    if (stepNum >= 2) step1.classList.add('completed');
    if (stepNum >= 3) step2.classList.add('completed');

    // Activate current step
    const activeStep = document.getElementById('step' + stepNum);
    activeStep.classList.add('active');

    // Scroll the active step into view
    setTimeout(() => {
      activeStep.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function formatDateShort(date) {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

  // --- Calendar ---
  function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    calendarTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarGrid.innerHTML = '';

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement('button');
      emptyDay.className = 'calendar-day empty';
      emptyDay.disabled = true;
      calendarGrid.appendChild(emptyDay);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      dayDate.setHours(0, 0, 0, 0);
      const dayBtn = document.createElement('button');
      dayBtn.className = 'calendar-day';
      dayBtn.textContent = day;

      const dayOfWeek = dayDate.getDay();

      if (dayDate < today || dayOfWeek === 0) {
        dayBtn.classList.add('past');
        dayBtn.disabled = true;
      } else {
        if (dayDate.getTime() === today.getTime()) {
          dayBtn.classList.add('today');
        }
        dayBtn.classList.add('available');

        // Re-highlight if this date was already selected
        if (selectedDate && dayDate.getTime() === selectedDate.getTime()) {
          dayBtn.classList.add('selected');
        }

        dayBtn.addEventListener('click', () => onDateSelected(dayDate, dayBtn));
      }

      calendarGrid.appendChild(dayBtn);
    }
  }

  function onDateSelected(date, btn) {
    selectedDate = date;
    selectedTime = null; // Reset time when date changes

    // Update visual selection on calendar
    calendarGrid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    btn.classList.add('selected');

    // Update summaries
    step1Summary.textContent = formatDateShort(date);
    selectedDateText.textContent = '📅 ' + formatDate(date);
    step2Summary.textContent = '';

    // Populate time slots
    renderTimeSlots(date);

    // Move to step 2
    goToStep(2);
  }

  // --- Time Slots ---
  function renderTimeSlots(date) {
    const dayOfWeek = date.getDay();
    const slots = dayOfWeek === 6 ? saturdaySlots : weekdaySlots;

    // Simulate availability (deterministic based on date)
    const seed = date.getDate() + date.getMonth() * 31;

    timeSlotsGrid.innerHTML = '';

    slots.forEach((slot, index) => {
      const isAvailable = ((seed + index * 7) % 3) !== 0;

      const slotBtn = document.createElement('button');
      slotBtn.className = 'time-slot';
      slotBtn.textContent = slot;

      if (!isAvailable) {
        slotBtn.disabled = true;
        slotBtn.classList.add('unavailable');
      } else {
        slotBtn.addEventListener('click', () => onTimeSelected(slot, slotBtn));
      }

      timeSlotsGrid.appendChild(slotBtn);
    });
  }

  function onTimeSelected(time, btn) {
    selectedTime = time;

    // Update visual selection
    timeSlotsGrid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');

    // Update summaries
    step2Summary.textContent = time;
    selectedSlotText.textContent = '📅 ' + formatDate(selectedDate) + '  ·  🕐 ' + time;

    // Move to step 3
    goToStep(3);
  }

  // --- Change buttons (go back) ---
  if (changeDateBtn) {
    changeDateBtn.addEventListener('click', () => {
      selectedTime = null;
      step2Summary.textContent = '';
      goToStep(1);
    });
  }

  if (changeTimeBtn) {
    changeTimeBtn.addEventListener('click', () => {
      selectedTime = null;
      step2Summary.textContent = '';
      goToStep(2);
    });
  }

  // --- Calendar Navigation ---
  if (calendarPrev) {
    calendarPrev.addEventListener('click', () => {
      const today = new Date();
      if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) return;
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
  }

  if (calendarNext) {
    calendarNext.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
  }

  // --- Form Submission ---
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      // Attach calendar selections
      if (selectedDate) {
        data.preferredDate = formatDate(selectedDate);
      }
      if (selectedTime) {
        data.preferredTime = selectedTime;
      }

      console.log('Booking submission:', data);

      // Show success, hide booking flow
      bookingFlow.style.display = 'none';
      formSuccess.classList.add('show');

      // Scroll to success message
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // In production, send to your backend or Formspree:
      // fetch('/api/booking', { method: 'POST', body: JSON.stringify(data) })
    });
  }

  // --- Initial render ---
  renderCalendar();

});
