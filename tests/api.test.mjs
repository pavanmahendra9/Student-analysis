import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5000";

async function request(path, options) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.json();
  return { response, body };
}

test("dashboard API creates, validates, and deletes class records", async () => {
  const suffix = `${Date.now()}-${process.pid}`;
  let studentId;
  let subjectId;
  let markId;

  try {
    const home = await fetch(baseUrl);
    assert.equal(home.status, 200);
    assert.match(home.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await home.text(), /Classroom \| Student Performance/);

    const studentResult = await request("/api/students", {
      method: "POST",
      body: JSON.stringify({
        rollNo: `T-${suffix}`,
        name: "Prisma API Test",
        section: "QA",
      }),
    });
    assert.equal(studentResult.response.status, 201);
    studentId = studentResult.body.id;

    const duplicateStudent = await request("/api/students", {
      method: "POST",
      body: JSON.stringify({
        rollNo: `T-${suffix}`,
        name: "Duplicate Test",
        section: "QA",
      }),
    });
    assert.equal(duplicateStudent.response.status, 409);

    const subjectResult = await request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({
        subjectName: `Prisma API Test ${suffix}`,
        maxMarks: 80,
        passMarks: 32,
      }),
    });
    assert.equal(subjectResult.response.status, 201);
    subjectId = subjectResult.body.id;

    const invalidMark = await request("/api/marks", {
      method: "POST",
      body: JSON.stringify({
        studentId,
        subjectId,
        assessment: "Over maximum",
        marksObtained: 81,
      }),
    });
    assert.equal(invalidMark.response.status, 422);

    const markResult = await request("/api/marks", {
      method: "POST",
      body: JSON.stringify({
        studentId,
        subjectId,
        assessment: "API smoke test",
        marksObtained: 70,
      }),
    });
    assert.equal(markResult.response.status, 201);
    markId = markResult.body.id;

    const dashboard = await request("/api/dashboard");
    assert.equal(dashboard.response.status, 200);
    assert.ok(dashboard.body.students.some((student) => student.id === studentId));
    assert.ok(dashboard.body.subjects.some((subject) => subject.id === subjectId));
    assert.ok(dashboard.body.marks.some((mark) => mark.id === markId));
  } finally {
    if (markId) await request(`/api/marks/${markId}`, { method: "DELETE" });
    if (studentId) await request(`/api/students/${studentId}`, { method: "DELETE" });
    if (subjectId) await request(`/api/subjects/${subjectId}`, { method: "DELETE" });
  }
});
