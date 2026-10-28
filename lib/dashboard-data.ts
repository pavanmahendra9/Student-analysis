export type Student = { id: number; rollNo: string; name: string; section: string };
export type Subject = { id: number; subjectName: string; maxMarks: number; passMarks: number };
export type Mark = {
  id: number;
  studentId: number;
  subjectId: number;
  assessment: string;
  marksObtained: number;
  createdAt: string;
  student: { name: string; rollNo: string; section: string };
  subject: { subjectName: string; maxMarks: number; passMarks: number };
};
export type DashboardData = { students: Student[]; subjects: Subject[]; marks: Mark[] };
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export const STORAGE_KEY = "student-performance-dashboard:v1";
export const emptyData: DashboardData = { students: [], subjects: [], marks: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStudent(value: unknown): value is Student {
  return isRecord(value)
    && Number.isSafeInteger(value.id)
    && typeof value.rollNo === "string"
    && typeof value.name === "string"
    && typeof value.section === "string";
}

function isSubject(value: unknown): value is Subject {
  return isRecord(value)
    && Number.isSafeInteger(value.id)
    && typeof value.subjectName === "string"
    && typeof value.maxMarks === "number"
    && typeof value.passMarks === "number";
}

function isMark(value: unknown): value is Mark {
  return isRecord(value)
    && Number.isSafeInteger(value.id)
    && Number.isSafeInteger(value.studentId)
    && Number.isSafeInteger(value.subjectId)
    && typeof value.assessment === "string"
    && typeof value.marksObtained === "number"
    && typeof value.createdAt === "string"
    && isRecord(value.student)
    && typeof value.student.name === "string"
    && typeof value.student.rollNo === "string"
    && typeof value.student.section === "string"
    && isRecord(value.subject)
    && typeof value.subject.subjectName === "string"
    && typeof value.subject.maxMarks === "number"
    && typeof value.subject.passMarks === "number";
}

function isDashboardData(value: unknown): value is DashboardData {
  return isRecord(value)
    && Array.isArray(value.students)
    && value.students.every(isStudent)
    && Array.isArray(value.subjects)
    && value.subjects.every(isSubject)
    && Array.isArray(value.marks)
    && value.marks.every(isMark);
}

export function loadDashboardData(storage: StorageLike): DashboardData {
  const saved = storage.getItem(STORAGE_KEY);
  if (saved === null) return emptyData;

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error("Saved class data is corrupted. Clear this website's stored data to start again.");
  }
  if (!isDashboardData(parsed)) {
    throw new Error("Saved class data has an invalid format. Clear this website's stored data to start again.");
  }
  return parsed;
}

export function saveDashboardData(storage: StorageLike, data: DashboardData): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(ids: number[]): number {
  return Math.max(0, ...ids) + 1;
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const text = value.trim();
  if (!text || text.length > maxLength) throw new Error(`${label} is required and must be no more than ${maxLength} characters.`);
  return text;
}

function numericValue(value: unknown, label: string): number {
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`${label} must be a number.`);
  if (typeof value === "string" && !value.trim()) throw new Error(`${label} must be a number.`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a valid number.`);
  return number;
}

export function addStudent(data: DashboardData, input: { rollNo: unknown; name: unknown; section: unknown }): DashboardData {
  const rollNo = requiredText(input.rollNo, "Roll number", 50);
  const name = requiredText(input.name, "Name", 150);
  const section = requiredText(input.section, "Section", 50);
  if (data.students.some((student) => student.rollNo === rollNo)) {
    throw new Error("A student with that roll number already exists.");
  }
  const student = { id: nextId(data.students.map(({ id }) => id)), rollNo, name, section };
  return { ...data, students: [...data.students, student] };
}

export function addSubject(data: DashboardData, input: { subjectName: unknown; maxMarks: unknown; passMarks: unknown }): DashboardData {
  const subjectName = requiredText(input.subjectName, "Subject name", 150);
  const maxMarks = numericValue(input.maxMarks, "Maximum marks");
  const passMarks = numericValue(input.passMarks, "Pass marks");
  if (maxMarks <= 0 || passMarks < 0 || passMarks > maxMarks) {
    throw new Error("Provide a valid maximum mark and pass mark between zero and the maximum.");
  }
  if (data.subjects.some((subject) => subject.subjectName === subjectName)) {
    throw new Error("A subject with that name already exists.");
  }
  const subject = { id: nextId(data.subjects.map(({ id }) => id)), subjectName, maxMarks, passMarks };
  return { ...data, subjects: [...data.subjects, subject] };
}

export function addMark(data: DashboardData, input: {
  studentId: unknown;
  subjectId: unknown;
  assessment: unknown;
  marksObtained: unknown;
}): DashboardData {
  const studentId = numericValue(input.studentId, "Student");
  const subjectId = numericValue(input.subjectId, "Subject");
  const assessment = requiredText(input.assessment, "Assessment", 100);
  const marksObtained = numericValue(input.marksObtained, "Marks obtained");
  if (!Number.isSafeInteger(studentId) || studentId < 1) throw new Error("Select a valid student.");
  if (!Number.isSafeInteger(subjectId) || subjectId < 1) throw new Error("Select a valid subject.");
  if (marksObtained < 0) throw new Error("Marks cannot be negative.");

  const student = data.students.find((item) => item.id === studentId);
  if (!student) throw new Error("Selected student does not exist.");
  const subject = data.subjects.find((item) => item.id === subjectId);
  if (!subject) throw new Error("Selected subject does not exist.");
  if (marksObtained > subject.maxMarks) throw new Error(`Marks cannot exceed ${subject.maxMarks}.`);
  if (data.marks.some((mark) =>
    mark.studentId === studentId && mark.subjectId === subjectId && mark.assessment === assessment
  )) {
    throw new Error("This student already has marks for that subject and assessment.");
  }

  const mark: Mark = {
    id: nextId(data.marks.map(({ id }) => id)),
    studentId,
    subjectId,
    assessment,
    marksObtained,
    createdAt: new Date().toISOString(),
    student: { name: student.name, rollNo: student.rollNo, section: student.section },
    subject: { subjectName: subject.subjectName, maxMarks: subject.maxMarks, passMarks: subject.passMarks },
  };
  return { ...data, marks: [...data.marks, mark] };
}

export function deleteStudent(data: DashboardData, studentId: number): DashboardData {
  if (!data.students.some((student) => student.id === studentId)) throw new Error("Student not found.");
  return {
    ...data,
    students: data.students.filter((student) => student.id !== studentId),
    marks: data.marks.filter((mark) => mark.studentId !== studentId),
  };
}

export function deleteSubject(data: DashboardData, subjectId: number): DashboardData {
  if (!data.subjects.some((subject) => subject.id === subjectId)) throw new Error("Subject not found.");
  return {
    ...data,
    subjects: data.subjects.filter((subject) => subject.id !== subjectId),
    marks: data.marks.filter((mark) => mark.subjectId !== subjectId),
  };
}

export function deleteMark(data: DashboardData, markId: number): DashboardData {
  if (!data.marks.some((mark) => mark.id === markId)) throw new Error("Mark not found.");
  return { ...data, marks: data.marks.filter((mark) => mark.id !== markId) };
}
