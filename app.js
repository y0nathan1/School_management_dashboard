/*
  School Management System (Vanilla JS)

  This demo app lets you manage students and classes.
  Data is stored locally in the browser (localStorage).
*/

const STORAGE_KEYS = {
  students: "sms_students",
  classes: "sms_classes",
};

const elements = {
  studentForm: document.getElementById("studentForm"),
  classForm: document.getElementById("classForm"),
  studentList: document.getElementById("studentList"),
  classList: document.getElementById("classList"),
  studentSearch: document.getElementById("studentSearch"),
  classSearch: document.getElementById("classSearch"),
  studentFormTitle: document.getElementById("studentFormTitle"),
  classFormTitle: document.getElementById("classFormTitle"),
  toast: document.getElementById("toast"),
  studentName: document.getElementById("studentName"),
  studentGrade: document.getElementById("studentGrade"),
  studentClass: document.getElementById("studentClass"),
  classOptions: document.getElementById("classOptions"),
  className: document.getElementById("className"),
  classTeacher: document.getElementById("classTeacher"),
  studentCancel: document.getElementById("studentCancel"),
  classCancel: document.getElementById("classCancel"),
  statStudents: document.getElementById("statStudents"),
  statClasses: document.getElementById("statClasses"),
  exportButton: document.getElementById("exportButton"),
  importButton: document.getElementById("importButton"),
  resetButton: document.getElementById("resetButton"),
};

let editingStudentId = null;
let editingClassId = null;
let studentFilter = "";
let classFilter = "";

function showToast(message, duration = 2800) {
  elements.toast.textContent = message;
  elements.toast.classList.add("toast--visible");
  window.clearTimeout(elements.toast._hideTimeout);
  elements.toast._hideTimeout = window.setTimeout(() => {
    elements.toast.classList.remove("toast--visible");
  }, duration);
}

function updateDashboard() {
  const students = getStorage(STORAGE_KEYS.students);
  const classes = getStorage(STORAGE_KEYS.classes);
  elements.statStudents.textContent = students.length;
  elements.statClasses.textContent = classes.length;
}

function exportData() {
  const data = {
    students: getStorage(STORAGE_KEYS.students),
    classes: getStorage(STORAGE_KEYS.classes),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "school-data.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Data exported.");
}

function importData() {
  const json = prompt(
    "Paste exported JSON to import (this replaces existing data)."
  );
  if (!json) return;

  try {
    const parsed = JSON.parse(json);
    if (!parsed.students || !parsed.classes) {
      throw new Error("Invalid format");
    }
    setStorage(STORAGE_KEYS.students, parsed.students);
    setStorage(STORAGE_KEYS.classes, parsed.classes);
    renderStudents();
    renderClasses();
    updateDashboard();
    showToast("Data imported successfully.");
  } catch (err) {
    showToast("Import failed. Please provide valid data.");
  }
}

function resetData() {
  if (!confirm("Reset all data? This cannot be undone.")) return;
  setStorage(STORAGE_KEYS.students, []);
  setStorage(STORAGE_KEYS.classes, []);
  renderStudents();
  renderClasses();
  updateDashboard();
  showToast("Data reset.");
}

function getStorage(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderStudents() {
  const students = getStorage(STORAGE_KEYS.students)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const filtered = students.filter((student) => {
    const query = studentFilter.trim().toLowerCase();
    if (!query) return true;
    return (
      student.name.toLowerCase().includes(query) ||
      student.className.toLowerCase().includes(query) ||
      String(student.grade).includes(query)
    );
  });

  if (filtered.length === 0) {
    elements.studentList.innerHTML =
      "<li class=\"list__item\">No matching students found.</li>";
    return;
  }

  elements.studentList.innerHTML = filtered
    .map(
      (student) => `
      <li class="list__item" data-id="${student.id}">
        <div>
          <div class="list__item-title">${student.name}</div>
          <div class="list__item-meta">Grade ${student.grade} • ${student.className}</div>
        </div>
        <div class="list__item-actions">
          <button class="button--secondary" data-action="edit-student">Edit</button>
          <button class="button--danger" data-action="remove-student">Remove</button>
        </div>
      </li>`
    )
    .join("");
  updateDashboard();
}

function renderClasses() {
  const classes = getStorage(STORAGE_KEYS.classes)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  updateClassOptions(classes);

  const filtered = classes.filter((cls) => {
    const query = classFilter.trim().toLowerCase();
    if (!query) return true;
    return (
      cls.name.toLowerCase().includes(query) ||
      cls.teacher.toLowerCase().includes(query)
    );
  });

  if (filtered.length === 0) {
    elements.classList.innerHTML =
      "<li class=\"list__item\">No matching classes found.</li>";
    return;
  }

  elements.classList.innerHTML = filtered
    .map(
      (cls) => `
      <li class="list__item" data-id="${cls.id}">
        <div>
          <div class="list__item-title">${cls.name}</div>
          <div class="list__item-meta">Teacher: ${cls.teacher}</div>
        </div>
        <div class="list__item-actions">
          <button class="button--secondary" data-action="edit-class">Edit</button>
          <button class="button--danger" data-action="remove-class">Remove</button>
        </div>
      </li>`
    )
    .join("");
  updateDashboard();
}

function resetStudentForm() {
  editingStudentId = null;
  elements.studentFormTitle.textContent = "Add Student";
  elements.studentForm.querySelector("button[type=submit]").textContent = "Add student";
  elements.studentCancel.classList.add("form__button--hidden");

  elements.studentName.value = "";
  elements.studentGrade.value = "";
  elements.studentClass.value = "";
  elements.studentName.focus();
}

function resetClassForm() {
  editingClassId = null;
  elements.classFormTitle.textContent = "Add Class";
  elements.classForm.querySelector("button[type=submit]").textContent = "Add class";
  elements.classCancel.classList.add("form__button--hidden");

  elements.className.value = "";
  elements.classTeacher.value = "";
  elements.className.focus();
}

function updateClassOptions(classes) {
  if (!elements.classOptions) return;
  elements.classOptions.innerHTML = classes
    .map((cls) => `<option value="${cls.name}"></option>`)
    .join("");
}

function startEditingStudent(student) {
  editingStudentId = student.id;
  elements.studentFormTitle.textContent = "Edit Student";
  elements.studentForm.querySelector("button[type=submit]").textContent = "Save changes";
  elements.studentCancel.classList.remove("form__button--hidden");

  elements.studentName.value = student.name;
  elements.studentGrade.value = student.grade;
  elements.studentClass.value = student.className;
  elements.studentName.focus();
}

function startEditingClass(cls) {
  editingClassId = cls.id;
  elements.classFormTitle.textContent = "Edit Class";
  elements.classForm.querySelector("button[type=submit]").textContent = "Save changes";
  elements.classCancel.classList.remove("form__button--hidden");

  elements.className.value = cls.name;
  elements.classTeacher.value = cls.teacher;
  elements.className.focus();
}

function addStudent(student) {
  const students = getStorage(STORAGE_KEYS.students);
  students.unshift(student);
  setStorage(STORAGE_KEYS.students, students);
  renderStudents();
}

function addClass(cls) {
  const classes = getStorage(STORAGE_KEYS.classes);
  classes.unshift(cls);
  setStorage(STORAGE_KEYS.classes, classes);
  renderClasses();
}

function removeStudent(id) {
  const students = getStorage(STORAGE_KEYS.students).filter((s) => s.id !== id);
  setStorage(STORAGE_KEYS.students, students);
  renderStudents();
}

function removeClass(id) {
  const classes = getStorage(STORAGE_KEYS.classes).filter((c) => c.id !== id);
  setStorage(STORAGE_KEYS.classes, classes);
  renderClasses();
}

elements.studentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.studentName.value.trim();
  const grade = elements.studentGrade.value;
  const className = elements.studentClass.value.trim();

  if (!name || !grade || !className) {
    showToast("Please fill in all student fields.");
    return;
  }

  if (editingStudentId) {
    const students = getStorage(STORAGE_KEYS.students).map((student) =>
      student.id === editingStudentId ? { ...student, name, grade, className } : student
    );
    setStorage(STORAGE_KEYS.students, students);
    showToast(`Updated ${name}`);
  } else {
    addStudent({ id: createId(), name, grade, className });
    showToast(`Added student ${name}`);
  }

  resetStudentForm();
  renderStudents();
});

elements.studentCancel.addEventListener("click", () => {
  resetStudentForm();
});

elements.classForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.className.value.trim();
  const teacher = elements.classTeacher.value.trim();

  if (!name || !teacher) {
    showToast("Please fill in all class fields.");
    return;
  }

  if (editingClassId) {
    const classes = getStorage(STORAGE_KEYS.classes).map((cls) =>
      cls.id === editingClassId ? { ...cls, name, teacher } : cls
    );
    setStorage(STORAGE_KEYS.classes, classes);
    showToast(`Updated ${name}`);
  } else {
    addClass({ id: createId(), name, teacher });
    showToast(`Added class ${name}`);
  }

  resetClassForm();
  renderClasses();
});

elements.classCancel.addEventListener("click", () => {
  resetClassForm();
});

elements.studentSearch.addEventListener("input", (event) => {
  studentFilter = event.target.value;
  renderStudents();
});

elements.classSearch.addEventListener("input", (event) => {
  classFilter = event.target.value;
  renderClasses();
});

elements.exportButton.addEventListener("click", exportData);
elements.importButton.addEventListener("click", importData);
elements.resetButton.addEventListener("click", resetData);

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const item = button.closest(".list__item");
  const id = item?.dataset?.id;
  if (!id) return;

  const action = button.dataset.action;
  if (action === "remove-student") {
    removeStudent(id);
    showToast("Student removed");
    return;
  }

  if (action === "edit-student") {
    const student = getStorage(STORAGE_KEYS.students).find((s) => s.id === id);
    if (student) startEditingStudent(student);
    return;
  }

  if (action === "remove-class") {
    removeClass(id);
    showToast("Class removed");
    return;
  }

  if (action === "edit-class") {
    const cls = getStorage(STORAGE_KEYS.classes).find((c) => c.id === id);
    if (cls) startEditingClass(cls);
  }
});

// Initialize app state
renderStudents();
renderClasses();
updateDashboard();
