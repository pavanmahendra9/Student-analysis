(() => {
  "use strict";

  const STORAGE_KEY = "classroom.performance.v1";
  const sampleData = {
    students: [
      { id: 1, roll_no: "S-101", name: "Alice Johnson", section: "A" },
      { id: 2, roll_no: "S-102", name: "Brian Lee", section: "A" },
      { id: 3, roll_no: "S-103", name: "Chloe Smith", section: "B" },
      { id: 4, roll_no: "S-104", name: "David Brown", section: "B" },
      { id: 5, roll_no: "S-105", name: "Emma Davis", section: "A" }
    ],
    subjects: [
      { id: 1, subject_name: "Mathematics", max_marks: 100, pass_marks: 40 },
      { id: 2, subject_name: "Science", max_marks: 100, pass_marks: 40 },
      { id: 3, subject_name: "English", max_marks: 100, pass_marks: 40 },
      { id: 4, subject_name: "History", max_marks: 100, pass_marks: 40 }
    ],
    marks: [
      [1, 1, 88], [1, 2, 92], [1, 3, 76], [1, 4, 82],
      [2, 1, 70], [2, 2, 55], [2, 3, 61], [2, 4, 68],
      [3, 1, 60], [3, 2, 48], [3, 3, 44], [3, 4, 51],
      [4, 1, 40], [4, 2, 35], [4, 3, 52], [4, 4, 47],
      [5, 1, 95], [5, 2, 90], [5, 3, 88], [5, 4, 91]
    ].map((item, index) => ({
      id: index + 1,
      student_id: item[0],
      subject_id: item[1],
      marks_obtained: item[2],
      assessment: "Unit Test 1",
      created_at: index
    }))
  };

  let state;
  let toastTimer;
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const number = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
  const grade = (percentage) => percentage >= 90 ? "A" : percentage >= 80 ? "B" : percentage >= 70 ? "C" : percentage >= 60 ? "D" : percentage >= 40 ? "E" : "F";

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      state = structuredClone(sampleData);
      saveState();
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.marks)) {
        throw new Error("Saved class data has an invalid format.");
      }
      state = parsed;
    } catch (error) {
      console.error("Could not load saved class data.", error);
      state = structuredClone(sampleData);
      saveState();
      showToast("Saved data could not be read; demo data was restored.");
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save class data.", error);
      showToast("Your browser could not save this change.");
    }
  }

  function showToast(message) {
    const toast = byId("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function studentFor(id) {
    return state.students.find((student) => student.id === Number(id));
  }

  function subjectFor(id) {
    return state.subjects.find((subject) => subject.id === Number(id));
  }

  function studentStats(student) {
    const records = state.marks.filter((mark) => mark.student_id === student.id);
    const max = records.reduce((sum, mark) => sum + Number(subjectFor(mark.subject_id)?.max_marks || 0), 0);
    const total = records.reduce((sum, mark) => sum + Number(mark.marks_obtained), 0);
    const percentage = max ? (total / max) * 100 : 0;
    const passed = records.length > 0 && records.every((mark) => Number(mark.marks_obtained) >= Number(subjectFor(mark.subject_id)?.pass_marks || 0));
    return { records, total, max, percentage, passed };
  }

  function averagesBySubject() {
    return state.subjects.map((subject) => {
      const marks = state.marks.filter((mark) => mark.subject_id === subject.id);
      const average = marks.length ? marks.reduce((sum, mark) => sum + Number(mark.marks_obtained), 0) / marks.length : 0;
      return { subject, average, count: marks.length };
    });
  }

  function renderChart(elementId, values) {
    const target = byId(elementId);
    const withData = values.filter((item) => item.count);
    if (!withData.length) {
      target.innerHTML = '<div class="empty-state">No assessment data yet. Add marks to see class performance.</div>';
      return;
    }
    target.innerHTML = withData.map(({ subject, average }) => `
      <div class="bar-row">
        <span class="bar-label" title="${escapeHtml(subject.subject_name)}">${escapeHtml(subject.subject_name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, average))}%"></div></div>
        <span class="bar-value">${number(average)}%</span>
      </div>`).join("");
  }

  function renderStudentTable() {
    const query = byId("student-search").value.trim().toLowerCase();
    const students = state.students.filter((student) => `${student.name} ${student.roll_no} ${student.section}`.toLowerCase().includes(query));
    byId("student-count-label").textContent = `${state.students.length} student${state.students.length === 1 ? "" : "s"}`;
    if (!students.length) {
      byId("students-table").innerHTML = '<div class="empty-state">No students found. Add a student to get started.</div>';
      return;
    }
    byId("students-table").innerHTML = `<div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NO.</th><th>SECTION</th><th>AVERAGE</th><th>GRADE</th><th></th></tr></thead><tbody>${students.map((student) => {
      const stats = studentStats(student);
      const initials = student.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
      return `<tr><td><span class="student-cell"><span class="mini-avatar">${escapeHtml(initials)}</span>${escapeHtml(student.name)}</span></td><td>${escapeHtml(student.roll_no)}</td><td><span class="section-pill">${escapeHtml(student.section)}</span></td><td>${stats.records.length ? `${number(stats.percentage)}%` : "—"}</td><td>${stats.records.length ? `<span class="grade-pill">${grade(stats.percentage)}</span>` : "—"}</td><td><button class="delete-button" data-delete-student="${student.id}" aria-label="Delete ${escapeHtml(student.name)}">×</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function renderSubjectTable() {
    byId("subject-count-label").textContent = `${state.subjects.length} subject${state.subjects.length === 1 ? "" : "s"}`;
    if (!state.subjects.length) {
      byId("subjects-table").innerHTML = '<div class="empty-state">No subjects yet. Add a subject to record marks.</div>';
      return;
    }
    byId("subjects-table").innerHTML = `<div class="table-wrap"><table><thead><tr><th>SUBJECT</th><th>MAX MARKS</th><th>PASS MARKS</th><th>AVERAGE</th><th></th></tr></thead><tbody>${state.subjects.map(({ id, subject_name, max_marks, pass_marks }) => {
      const rows = state.marks.filter((mark) => mark.subject_id === id);
      const average = rows.length ? rows.reduce((sum, mark) => sum + Number(mark.marks_obtained), 0) / rows.length : null;
      return `<tr><td><span class="student-cell">${escapeHtml(subject_name)}</span></td><td>${number(max_marks)}</td><td>${number(pass_marks)}</td><td>${average === null ? "—" : number(average)}</td><td><button class="delete-button" data-delete-subject="${id}" aria-label="Delete ${escapeHtml(subject_name)}">×</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function renderMarksTable() {
    const marks = [...state.marks].sort((a, b) => b.created_at - a.created_at);
    byId("mark-count-label").textContent = `${marks.length} assessment record${marks.length === 1 ? "" : "s"}`;
    if (!marks.length) {
      byId("marks-table").innerHTML = '<div class="empty-state">No marks recorded yet. Use the form above to add an assessment.</div>';
      return;
    }
    byId("marks-table").innerHTML = `<div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>SUBJECT</th><th>ASSESSMENT</th><th>MARKS</th><th>RESULT</th><th></th></tr></thead><tbody>${marks.map((mark) => {
      const student = studentFor(mark.student_id);
      const subject = subjectFor(mark.subject_id);
      if (!student || !subject) return "";
      const passed = Number(mark.marks_obtained) >= Number(subject.pass_marks);
      return `<tr><td>${escapeHtml(student.name)}</td><td>${escapeHtml(subject.subject_name)}</td><td>${escapeHtml(mark.assessment)}</td><td>${number(mark.marks_obtained)} / ${number(subject.max_marks)}</td><td><span class="grade-pill" style="${passed ? "" : "background:#fff0f1;color:#d34f61"}">${passed ? "Pass" : "Needs support"}</span></td><td><button class="delete-button" data-delete-mark="${mark.id}" aria-label="Delete mark">×</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function renderPerformers() {
    const ranked = state.students.map((student) => ({ student, ...studentStats(student) }))
      .filter((entry) => entry.records.length)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);
    byId("top-performers").innerHTML = ranked.length ? ranked.map(({ student, percentage }, index) => `
      <div class="performer"><span class="rank">${index + 1}</span><span class="person-info"><strong>${escapeHtml(student.name)}</strong><small>Section ${escapeHtml(student.section)}</small></span><span class="performer-score">${number(percentage)}%</span></div>`).join("") : '<div class="empty-state">Add marks to see your top performers.</div>';
  }

  function renderRecentMarks() {
    const recent = [...state.marks].sort((a, b) => b.created_at - a.created_at).slice(0, 5);
    byId("recent-marks").innerHTML = recent.length ? `<div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>SUBJECT</th><th>ASSESSMENT</th><th>SCORE</th><th>GRADE</th></tr></thead><tbody>${recent.map((mark) => {
      const student = studentFor(mark.student_id);
      const subject = subjectFor(mark.subject_id);
      if (!student || !subject) return "";
      const percentage = Number(mark.marks_obtained) / Number(subject.max_marks) * 100;
      return `<tr><td>${escapeHtml(student.name)}</td><td>${escapeHtml(subject.subject_name)}</td><td>${escapeHtml(mark.assessment)}</td><td>${number(mark.marks_obtained)} / ${number(subject.max_marks)}</td><td><span class="grade-pill">${grade(percentage)}</span></td></tr>`;
    }).join("")}</tbody></table></div>` : '<div class="empty-state">There are no recent assessments to show.</div>';
  }

  function renderSelects() {
    const studentSelect = document.querySelector('#mark-form select[name="student_id"]');
    const subjectSelect = document.querySelector('#mark-form select[name="subject_id"]');
    const selectedStudentId = studentSelect.value;
    const selectedSubjectId = subjectSelect.value;
    studentSelect.innerHTML = state.students.length ? state.students.map((student) => `<option value="${student.id}">${escapeHtml(student.name)} · ${escapeHtml(student.roll_no)}</option>`).join("") : '<option value="">Add a student first</option>';
    subjectSelect.innerHTML = state.subjects.length ? state.subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.subject_name)}</option>`).join("") : '<option value="">Add a subject first</option>';
    studentSelect.disabled = !state.students.length;
    subjectSelect.disabled = !state.subjects.length;
    if (state.students.some((student) => String(student.id) === selectedStudentId)) {
      studentSelect.value = selectedStudentId;
    }
    if (state.subjects.some((subject) => String(subject.id) === selectedSubjectId)) {
      subjectSelect.value = selectedSubjectId;
    }
    updateMarkMaximum();
  }

  function updateMarkMaximum() {
    const subjectSelect = document.querySelector('#mark-form select[name="subject_id"]');
    document.querySelector('#mark-form input[name="marks_obtained"]').max = subjectFor(subjectSelect.value)?.max_marks ?? "";
  }

  function renderReports() {
    const results = state.students.map((student) => ({ student, ...studentStats(student) }));
    const graded = results.filter((result) => result.records.length);
    byId("report-passing").textContent = results.filter((result) => result.passed).length;
    byId("report-support").textContent = graded.filter((result) => result.percentage < 40).length;
    byId("report-highest").textContent = graded.length ? `${number(Math.max(...graded.map((result) => result.percentage)))}%` : "—";
    byId("student-results").innerHTML = graded.length ? [...graded].sort((a, b) => b.percentage - a.percentage).map(({ student, percentage }) => `
      <div class="result-row"><div><div class="result-name">${escapeHtml(student.name)}</div><div class="result-section">Section ${escapeHtml(student.section)}</div></div><div class="result-percent">${number(percentage)}%</div><div class="result-grade"><span class="grade-pill">${grade(percentage)}</span></div></div>`).join("") : '<div class="empty-state">Record marks to generate student results.</div>';
  }

  function render() {
    const graded = state.students.map(studentStats).filter((stats) => stats.records.length);
    const allMarks = state.marks;
    const marksMax = allMarks.reduce((sum, mark) => sum + Number(subjectFor(mark.subject_id)?.max_marks || 0), 0);
    const average = marksMax ? allMarks.reduce((sum, mark) => sum + Number(mark.marks_obtained), 0) / marksMax * 100 : null;
    byId("stat-students").textContent = state.students.length;
    byId("stat-subjects").textContent = state.subjects.length;
    byId("stat-average").textContent = average === null ? "—" : `${number(average)}%`;
    byId("stat-marks").textContent = state.marks.length;
    renderChart("overview-chart", averagesBySubject());
    renderStudentTable();
    renderSubjectTable();
    renderMarksTable();
    renderPerformers();
    renderRecentMarks();
    renderSelects();
    renderChart("report-chart", averagesBySubject());
    renderReports();
  }

  function activateView(name) {
    document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `view-${name}`));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
    const activeButton = document.querySelector(`.nav-item[data-view="${name}"]`);
    byId("breadcrumb-current").textContent = activeButton?.textContent.trim() || "Overview";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextId(items) {
    return items.reduce((largest, item) => Math.max(largest, item.id), 0) + 1;
  }

  document.querySelector(".main-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) activateView(button.dataset.view);
  });
  document.addEventListener("click", (event) => {
    const jump = event.target.closest("[data-open-view]");
    if (jump) activateView(jump.dataset.openView);
    const deleteStudent = event.target.closest("[data-delete-student]");
    if (deleteStudent) {
      const id = Number(deleteStudent.dataset.deleteStudent);
      state.students = state.students.filter((student) => student.id !== id);
      state.marks = state.marks.filter((mark) => mark.student_id !== id);
      saveState(); render(); showToast("Student and their marks removed.");
    }
    const deleteSubject = event.target.closest("[data-delete-subject]");
    if (deleteSubject) {
      const id = Number(deleteSubject.dataset.deleteSubject);
      state.subjects = state.subjects.filter((subject) => subject.id !== id);
      state.marks = state.marks.filter((mark) => mark.subject_id !== id);
      saveState(); render(); showToast("Subject and its marks removed.");
    }
    const deleteMark = event.target.closest("[data-delete-mark]");
    if (deleteMark) {
      const id = Number(deleteMark.dataset.deleteMark);
      state.marks = state.marks.filter((mark) => mark.id !== id);
      saveState(); render(); showToast("Assessment record removed.");
    }
  });
  byId("student-search").addEventListener("input", renderStudentTable);
  document.querySelector('#mark-form select[name="subject_id"]').addEventListener("change", updateMarkMaximum);

  byId("student-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rollNo = String(form.get("roll_no")).trim();
    if (state.students.some((student) => student.roll_no.toLowerCase() === rollNo.toLowerCase())) {
      showToast("That roll number is already in use.");
      return;
    }
    state.students.push({ id: nextId(state.students), roll_no: rollNo, name: String(form.get("name")).trim(), section: String(form.get("section")).trim() });
    saveState(); event.currentTarget.reset(); render(); showToast("Student added to your class.");
  });
  byId("subject-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("subject_name")).trim();
    const max = Number(form.get("max_marks"));
    const pass = Number(form.get("pass_marks"));
    if (state.subjects.some((subject) => subject.subject_name.toLowerCase() === name.toLowerCase())) {
      showToast("A subject with that name already exists.");
      return;
    }
    if (!(max > 0) || pass < 0 || pass > max) {
      showToast("Use a positive maximum and a pass mark within that range.");
      return;
    }
    state.subjects.push({ id: nextId(state.subjects), subject_name: name, max_marks: max, pass_marks: pass });
    saveState(); event.currentTarget.reset(); render(); showToast("Subject added.");
  });
  byId("mark-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const studentId = Number(form.get("student_id"));
    const subjectId = Number(form.get("subject_id"));
    const subject = subjectFor(subjectId);
    const score = Number(form.get("marks_obtained"));
    const assessment = String(form.get("assessment")).trim();
    if (!studentFor(studentId) || !subject || !assessment || score < 0 || score > subject.max_marks) {
      showToast("Check the student, subject and score, then try again.");
      return;
    }
    if (state.marks.some((mark) => mark.student_id === studentId && mark.subject_id === subjectId && mark.assessment.toLowerCase() === assessment.toLowerCase())) {
      showToast("That student already has marks for this assessment.");
      return;
    }
    state.marks.push({ id: nextId(state.marks), student_id: studentId, subject_id: subjectId, marks_obtained: score, assessment, created_at: Date.now() });
    saveState(); event.currentTarget.reset(); render(); showToast("Assessment marks saved.");
  });

  document.addEventListener("DOMContentLoaded", () => {
    loadState();
    render();
  });
})();
