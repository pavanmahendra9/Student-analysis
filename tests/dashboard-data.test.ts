import assert from "node:assert/strict";
import test from "node:test";

import {
  addMark,
  addStudent,
  addSubject,
  DashboardData,
  deleteMark,
  deleteStudent,
  deleteSubject,
  emptyData,
  loadDashboardData,
  saveDashboardData,
  STORAGE_KEY,
  StorageLike,
} from "../lib/dashboard-data";

function createStorage(): StorageLike & { value: string | null } {
  return {
    value: null,
    getItem(key) {
      assert.equal(key, STORAGE_KEY);
      return this.value;
    },
    setItem(key, value) {
      assert.equal(key, STORAGE_KEY);
      this.value = value;
    },
  };
}

function createClassData(): DashboardData {
  const withStudent = addStudent(emptyData, { rollNo: "S-101", name: "Alex Student", section: "A" });
  const withSubject = addSubject(withStudent, { subjectName: "Mathematics", maxMarks: "100", passMarks: "40" });
  return addMark(withSubject, {
    studentId: "1",
    subjectId: "1",
    assessment: "Unit test",
    marksObtained: "80",
  });
}

test("saves and restores dashboard data using browser storage", () => {
  const storage = createStorage();
  const data = createClassData();

  saveDashboardData(storage, data);

  assert.deepEqual(loadDashboardData(storage), data);
});

test("starts with empty data when browser storage has no saved records", () => {
  assert.deepEqual(loadDashboardData(createStorage()), emptyData);
});

test("reports invalid saved JSON instead of silently discarding it", () => {
  const storage = createStorage();
  storage.value = "{invalid";

  assert.throws(() => loadDashboardData(storage), /Saved class data is corrupted/);
});

test("rejects duplicate students and subjects", () => {
  const withStudent = addStudent(emptyData, { rollNo: "S-101", name: "Alex Student", section: "A" });
  const withSubject = addSubject(withStudent, { subjectName: "Mathematics", maxMarks: 100, passMarks: 40 });

  assert.throws(
    () => addStudent(withSubject, { rollNo: "S-101", name: "Another Student", section: "B" }),
    /already exists/,
  );
  assert.throws(
    () => addSubject(withSubject, { subjectName: "Mathematics", maxMarks: 100, passMarks: 40 }),
    /already exists/,
  );
});

test("rejects invalid subject marks and duplicate assessments", () => {
  const withStudent = addStudent(emptyData, { rollNo: "S-101", name: "Alex Student", section: "A" });
  const withSubject = addSubject(withStudent, { subjectName: "Mathematics", maxMarks: 100, passMarks: 40 });

  assert.throws(
    () => addSubject(withSubject, { subjectName: "Science", maxMarks: 50, passMarks: 51 }),
    /valid maximum/,
  );
  const withMark = addMark(withSubject, {
    studentId: "1",
    subjectId: "1",
    assessment: "Unit test",
    marksObtained: "80",
  });
  assert.throws(
    () => addMark(withMark, { studentId: "1", subjectId: "1", assessment: "Unit test", marksObtained: "90" }),
    /already has marks/,
  );
  assert.throws(
    () => addMark(withSubject, { studentId: "1", subjectId: "1", assessment: "Final", marksObtained: "101" }),
    /cannot exceed/,
  );
});

test("deleting students and subjects also deletes their marks", () => {
  const data = createClassData();

  assert.deepEqual(deleteStudent(data, 1), { students: [], subjects: data.subjects, marks: [] });
  assert.deepEqual(deleteSubject(data, 1), { students: data.students, subjects: [], marks: [] });
  assert.deepEqual(deleteMark(data, 1), { ...data, marks: [] });
});
