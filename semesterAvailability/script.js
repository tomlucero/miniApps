(function () {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayShort = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun"
  };
  const startHour = 7;
  const endHour = 22;
  const defaultSemesters = [
    {
      name: "Fall 2026",
      start: "2026-08-24",
      end: "2026-12-11",
      breaks: [
        { name: "Fall Break", start: "2026-11-23", end: "2026-11-27" },
        { name: "Finals Week", start: "2026-12-07", end: "2026-12-11" }
      ]
    },
    {
      name: "Spring 2027",
      start: "2027-01-19",
      end: "2027-05-14",
      breaks: [
        { name: "Spring Break", start: "2027-03-15", end: "2027-03-19" },
        { name: "Finals Week", start: "2027-05-10", end: "2027-05-14" }
      ]
    }
  ];

  const semesters = defaultSemesters.map(function (semester) {
    return {
      name: semester.name,
      start: semester.start,
      end: semester.end,
      breaks: semester.breaks.slice()
    };
  });
  let selectedSemesterIndex = 0;
  const blocks = [];

  const fields = {
    employeeName: document.getElementById("employeeName"),
    role: document.getElementById("role"),
    semesterPreset: document.getElementById("semesterPreset"),
    phone: document.getElementById("phone"),
    termStart: document.getElementById("termStart"),
    termEnd: document.getElementById("termEnd"),
    startTime: document.getElementById("startTime"),
    endTime: document.getElementById("endTime"),
    reason: document.getElementById("reason"),
    notes: document.getElementById("notes")
  };

  const form = document.getElementById("availabilityForm");
  const formStatus = document.getElementById("formStatus");
  const conflictCount = document.getElementById("conflictCount");
  const sheetPreview = document.getElementById("sheetPreview");
  const printArea = document.getElementById("printArea");

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function valueOrLine(value) {
    return value.trim() ? escapeHtml(value.trim()) : "________________________";
  }

  function formatDate(value) {
    if (!value) return "________________________";
    const parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatTime(value) {
    const parts = value.split(":").map(Number);
    return new Date(2026, 0, 1, parts[0], parts[1]).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function parseTimeEntry(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const compact = trimmed.toLowerCase().replace(/\s/g, "");
    const ampmMatch = compact.match(/^(\d{1,2})(?::?(\d{2}))?(a|am|p|pm)$/);
    let hour;
    let minute;

    if (ampmMatch) {
      hour = Number(ampmMatch[1]);
      minute = ampmMatch[2] ? Number(ampmMatch[2]) : 0;
      const suffix = ampmMatch[3][0];
      if (hour < 1 || hour > 12) return null;
      if (suffix === "p" && hour !== 12) hour += 12;
      if (suffix === "a" && hour === 12) hour = 0;
    } else if (/^\d{1,2}$/.test(compact)) {
      hour = Number(compact);
      minute = 0;
    } else if (/^\d{3,4}$/.test(compact)) {
      const padded = compact.padStart(4, "0");
      hour = Number(padded.slice(0, 2));
      minute = Number(padded.slice(2));
    } else {
      const match = compact.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;
      hour = Number(match[1]);
      minute = Number(match[2]);
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function toMinutes(value) {
    const parts = value.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function currentSemester() {
    return semesters[selectedSemesterIndex] || semesters[0];
  }

  function selectedDays() {
    return Array.from(document.querySelectorAll("#dayChecks input:checked")).map(function (input) {
      return input.value;
    });
  }

  function renderSemesterOptions() {
    fields.semesterPreset.innerHTML = semesters.map(function (semester, index) {
      return `<option value="${index}">${escapeHtml(semester.name)}</option>`;
    }).join("");
    fields.semesterPreset.value = String(selectedSemesterIndex);
  }

  function applySemesterToForm() {
    const semester = currentSemester();
    fields.termStart.value = semester.start || "";
    fields.termEnd.value = semester.end || "";
  }

  function sortBlocks() {
    blocks.sort(function (a, b) {
      const dayResult = days.indexOf(a.day) - days.indexOf(b.day);
      return dayResult || a.start.localeCompare(b.start);
    });
  }

  function detailsHtml() {
    const semester = currentSemester();
    const breaks = semester.breaks.length
      ? semester.breaks.map(function (semesterBreak) {
        return `<span>${escapeHtml(semesterBreak.name)}: ${formatDate(semesterBreak.start)} - ${formatDate(semesterBreak.end)}</span>`;
      }).join("")
      : "<span>No breaks or exceptions listed.</span>";

    return `
      <div class="sheet-meta">
        <div><span>Name</span><strong>${valueOrLine(fields.employeeName.value)}</strong></div>
        <div><span>Job / Area</span><strong>${valueOrLine(fields.role.value)}</strong></div>
        <div><span>Phone</span><strong>${valueOrLine(fields.phone.value)}</strong></div>
        <div><span>Semester</span><strong>${escapeHtml(semester.name)}</strong></div>
        <div><span>Dates</span><strong>${formatDate(fields.termStart.value)} - ${formatDate(fields.termEnd.value)}</strong></div>
      </div>
      <div class="break-strip">${breaks}</div>
    `;
  }

  function gridHtml(includeControls) {
    const totalMinutes = (endHour - startHour) * 60;
    const hours = [];
    for (let hour = startHour; hour <= endHour; hour += 1) {
      const label = formatTime(`${String(hour).padStart(2, "0")}:00`);
      hours.push(`<div class="time-label">${label}</div>`);
    }

    const dayColumns = days.map(function (day) {
      const dayBlocks = blocks.filter(function (block) {
        return block.day === day;
      }).map(function (block, index) {
        const top = ((toMinutes(block.start) - startHour * 60) / totalMinutes) * 100;
        const height = ((toMinutes(block.end) - toMinutes(block.start)) / totalMinutes) * 100;
        const globalIndex = blocks.indexOf(block);
        return `
          <div class="unavailable-block" style="top:${top}%;height:${height}%;">
            <strong>${formatTime(block.start)} - ${formatTime(block.end)}</strong>
            <span>${escapeHtml(block.reason)}</span>
            ${includeControls ? `<button type="button" data-remove="${globalIndex}" aria-label="Remove ${day} block">x</button>` : ""}
          </div>
        `;
      }).join("");

      return `
        <div class="day-column">
          <div class="day-name">${dayShort[day]}</div>
          <div class="day-track">${dayBlocks}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="availability-grid-shell">
        <div class="grid-heading">
          <div>
            <p class="suite-eyebrow">For Supervisor</p>
            <h3>Times I Cannot Work</h3>
          </div>
          <span>Printed ${new Date().toLocaleDateString()}</span>
        </div>
        ${detailsHtml()}
        <div class="availability-grid" style="--hour-count:${endHour - startHour};">
          <div class="time-axis">
            <div class="time-spacer"></div>
            <div class="time-track">${hours.join("")}</div>
          </div>
          <div class="day-grid">${dayColumns}</div>
        </div>
        <div class="print-notes">
          <span>Notes for Supervisor</span>
          <p>${fields.notes.value.trim() ? escapeHtml(fields.notes.value.trim()) : "No additional notes."}</p>
        </div>
        <div class="signature-row">
          <div>Employee signature</div>
          <div>Date</div>
        </div>
      </div>
    `;
  }

  function renderSheet() {
    sheetPreview.innerHTML = gridHtml(true);
    printArea.innerHTML = gridHtml(false);
    sheetPreview.querySelectorAll("[data-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        blocks.splice(Number(button.dataset.remove), 1);
        render();
      });
    });
  }

  function render() {
    renderSemesterOptions();
    conflictCount.textContent = blocks.length === 1 ? "1 block" : `${blocks.length} blocks`;
    renderSheet();
  }

  function validateStudentDetails() {
    if (!fields.employeeName.value.trim()) {
      fields.employeeName.reportValidity();
      return false;
    }

    if (phoneDigits().length !== 10) {
      fields.phone.setCustomValidity("Enter a 10-digit phone number.");
      fields.phone.reportValidity();
      return false;
    }

    fields.phone.setCustomValidity("");
    return true;
  }

  function phoneDigits() {
    return fields.phone.value.replace(/\D/g, "").slice(0, 10);
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function safeFileName(value) {
    return value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "semester-availability";
  }

  function pdfFileName() {
    const name = safeFileName(fields.employeeName.value);
    const semester = safeFileName(currentSemester().name);
    return `${name}-${semester}-availability.pdf`;
  }

  function downloadPdf() {
    if (!validateStudentDetails()) return;
    render();
    if (!window.html2pdf) {
      formStatus.textContent = "PDF download library did not load. Use Print Grid and choose Save as PDF.";
      return;
    }

    const source = printArea.firstElementChild.cloneNode(true);
    source.classList.add("pdf-export");

    const options = {
      margin: 0.25,
      filename: pdfFileName(),
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
      pagebreak: { mode: ["avoid-all"] }
    };

    formStatus.textContent = "Building PDF...";
    window.html2pdf().set(options).from(source).save().then(function () {
      formStatus.textContent = "PDF downloaded.";
    }).catch(function () {
      formStatus.textContent = "PDF download failed. Use Print Grid and choose Save as PDF.";
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    formStatus.textContent = "";

    if (!validateStudentDetails()) return;

    const checkedDays = selectedDays();
    if (!checkedDays.length) {
      formStatus.textContent = "Choose at least one day.";
      return;
    }

    const startValue = parseTimeEntry(fields.startTime.value);
    const endValue = parseTimeEntry(fields.endTime.value);

    if (!startValue || !endValue) {
      formStatus.textContent = "Enter times like 9:00 AM, 2:30 PM, 9a, 2:30p, or 14:30.";
      return;
    }

    fields.startTime.value = formatTime(startValue);
    fields.endTime.value = formatTime(endValue);

    if (startValue >= endValue) {
      formStatus.textContent = "End time must be after start time.";
      return;
    }

    checkedDays.forEach(function (day) {
      blocks.push({
        day: day,
        start: startValue,
        end: endValue,
        reason: fields.reason.value
      });
    });

    sortBlocks();
    fields.startTime.value = "";
    fields.endTime.value = "";
    fields.reason.selectedIndex = 0;
    document.querySelectorAll("#dayChecks input").forEach(function (input) {
      input.checked = false;
    });
    render();
  });

  fields.semesterPreset.addEventListener("change", function () {
    selectedSemesterIndex = Number(fields.semesterPreset.value);
    applySemesterToForm();
    render();
  });

  fields.phone.addEventListener("input", function () {
    fields.phone.value = formatPhone(fields.phone.value);
    fields.phone.setCustomValidity("");
    render();
  });

  [fields.startTime, fields.endTime].forEach(function (field) {
    field.addEventListener("blur", function () {
      const parsed = parseTimeEntry(field.value);
      if (parsed) field.value = formatTime(parsed);
    });
  });

  [fields.employeeName, fields.role, fields.notes].forEach(function (field) {
    field.addEventListener("input", render);
    field.addEventListener("change", render);
  });

  document.getElementById("printButton").addEventListener("click", function () {
    if (!validateStudentDetails()) return;
    render();
    document.body.classList.add("print-mode");
    window.focus();
    setTimeout(function () {
      window.print();
      document.body.classList.remove("print-mode");
    }, 100);
  });

  document.getElementById("downloadPdfButton").addEventListener("click", downloadPdf);

  document.getElementById("clearTimesButton").addEventListener("click", function () {
    blocks.splice(0, blocks.length);
    render();
  });

  document.getElementById("resetButton").addEventListener("click", function () {
    blocks.splice(0, blocks.length);
    fields.employeeName.value = "";
    fields.role.selectedIndex = 0;
    fields.phone.value = "";
    fields.notes.value = "";
    fields.startTime.value = "";
    fields.endTime.value = "";
    fields.reason.selectedIndex = 0;
    document.querySelectorAll("#dayChecks input").forEach(function (input) {
      input.checked = false;
    });
    selectedSemesterIndex = 0;
    applySemesterToForm();
    formStatus.textContent = "";
    render();
  });

  renderSemesterOptions();
  applySemesterToForm();
  render();
})();
