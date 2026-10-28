"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Student = { id: number; rollNo: string; name: string; section: string };
type Subject = { id: number; subjectName: string; maxMarks: number; passMarks: number };
type Mark = {
  id: number;
  studentId: number;
  subjectId: number;
  assessment: string;
  marksObtained: number;
  createdAt: string;
  student: { name: string; rollNo: string; section: string };
  subject: { subjectName: string; maxMarks: number; passMarks: number };
};
type DashboardData = { students: Student[]; subjects: Subject[]; marks: Mark[] };
type View = "overview" | "students" | "subjects" | "marks" | "reports";

const navigation: { id: View; icon: string; label: string }[] = [
  { id: "overview", icon: "◫", label: "Overview" },
  { id: "students", icon: "♙", label: "Students" },
  { id: "subjects", icon: "▤", label: "Subjects" },
  { id: "marks", icon: "✎", label: "Marks" },
  { id: "reports", icon: "▥", label: "Reports" },
];

const emptyData: DashboardData = { students: [], subjects: [], marks: [] };
const fmt = (value: number) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
const getGrade = (value: number) => value >= 90 ? "A" : value >= 80 ? "B" : value >= 70 ? "C" : value >= 60 ? "D" : value >= 40 ? "E" : "F";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function scoreFor(studentId: number, marks: Mark[]) {
  const records = marks.filter((mark) => mark.studentId === studentId);
  const total = records.reduce((sum, mark) => sum + mark.marksObtained, 0);
  const max = records.reduce((sum, mark) => sum + mark.subject.maxMarks, 0);
  const percentage = max ? total / max * 100 : 0;
  return {
    records,
    percentage,
    passed: records.length > 0 && records.every((mark) => mark.marksObtained >= mark.subject.passMarks),
  };
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty-state">{children}</div>;
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="table-wrap">{children}</div>;
}

function BarChart({ subjects, marks }: { subjects: Subject[]; marks: Mark[] }) {
  const averages = subjects.map((subject) => {
    const entries = marks.filter((mark) => mark.subjectId === subject.id);
    return {
      subject,
      count: entries.length,
      average: entries.length ? entries.reduce((sum, mark) => sum + mark.marksObtained, 0) / entries.length : 0,
    };
  }).filter((entry) => entry.count);

  if (!averages.length) return <Empty>No assessment data yet. Add marks to see class performance.</Empty>;
  return <div className="bar-chart">{averages.map(({ subject, average }) => (
    <div className="bar-row" key={subject.id}>
      <span className="bar-label" title={subject.subjectName}>{subject.subjectName}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, Math.max(0, average))}%` }} /></div>
      <span className="bar-value">{fmt(average)}%</span>
    </div>
  ))}</div>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const reload = useCallback(async () => {
    const result = await requestJson<DashboardData>("/api/dashboard", { cache: "no-store" });
    setData(result);
    setSelectedSubjectId((current) =>
      result.subjects.some((subject) => String(subject.id) === current)
        ? current
        : String(result.subjects[0]?.id ?? ""),
    );
    setError("");
  }, []);

  useEffect(() => {
    reload()
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const classAverage = useMemo(() => {
    const max = data.marks.reduce((sum, mark) => sum + mark.subject.maxMarks, 0);
    return max ? data.marks.reduce((sum, mark) => sum + mark.marksObtained, 0) / max * 100 : null;
  }, [data.marks]);
  const rankedStudents = useMemo(
    () => data.students.map((student) => ({ student, ...scoreFor(student.id, data.marks) }))
      .filter((entry) => entry.records.length)
      .sort((a, b) => b.percentage - a.percentage),
    [data.students, data.marks],
  );
  const visibleStudents = data.students.filter((student) =>
    `${student.name} ${student.rollNo} ${student.section}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function mutate(url: string, init: RequestInit, successMessage: string) {
    try {
      await requestJson<unknown>(url, init);
      await reload();
      setToast(successMessage);
      return true;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The change could not be saved.";
      setError(message);
      setToast(message);
      return false;
    }
  }

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const saved = await mutate("/api/students", {
      method: "POST",
      body: JSON.stringify({ rollNo: form.get("rollNo"), name: form.get("name"), section: form.get("section") }),
    }, "Student added to your class.");
    if (saved) formElement.reset();
  }

  async function addSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const saved = await mutate("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ subjectName: form.get("subjectName"), maxMarks: form.get("maxMarks"), passMarks: form.get("passMarks") }),
    }, "Subject added.");
    if (saved) formElement.reset();
  }

  async function addMark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const subjectId = String(form.get("subjectId") ?? "");
    const saved = await mutate("/api/marks", {
      method: "POST",
      body: JSON.stringify({
        studentId: form.get("studentId"),
        subjectId: form.get("subjectId"),
        assessment: form.get("assessment"),
        marksObtained: form.get("marksObtained"),
      }),
    }, "Assessment marks saved.");
    if (saved) {
      const assessment = formElement.elements.namedItem("assessment");
      const marksObtained = formElement.elements.namedItem("marksObtained");
      setSelectedSubjectId(subjectId);
      if (assessment instanceof HTMLInputElement) assessment.value = "";
      if (marksObtained instanceof HTMLInputElement) marksObtained.value = "";
    }
  }

  async function remove(url: string, label: string) {
    if (!window.confirm(`Delete this ${label}? This also deletes its related marks.`)) return;
    await mutate(url, { method: "DELETE" }, `${label[0].toUpperCase()}${label.slice(1)} deleted.`);
  }

  const activeLabel = navigation.find((item) => item.id === view)?.label ?? "Overview";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Classroom dashboard"><span className="brand-mark">C</span><span>classroom<span className="brand-period">.</span></span></a>
        <p className="nav-label">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => <button className={`nav-item ${view === item.id ? "active" : ""}`} key={item.id} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="sidebar-bottom"><span className="status-dot" /><div><strong>Connected database</strong><small>Configured storage</small></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{activeLabel}</strong></div><div className="topbar-right"><span className="local-badge"><span className="status-dot" /> Prisma database</span><div className="avatar" aria-label="Teacher">T</div></div></header>
        <div className="content-wrap">
          {error && <div className="error-banner" role="alert">{error}<button onClick={() => reload().catch((cause: unknown) => setError(String(cause)))}>Retry</button></div>}
          {loading ? <div className="loading-state">Loading your class…</div> : <>
            {view === "overview" && <>
              <div className="page-heading"><div><p className="eyebrow">YOUR CLASS AT A GLANCE</p><h1>Overview</h1><p className="subheading">Track student progress and keep your class organized.</p></div><button className="button button-primary" onClick={() => setView("marks")}>＋ Add marks</button></div>
              <div className="stats-grid">
                <StatCard icon="♙" color="violet" caption="ENROLLED" value={data.students.length} foot="Students in your class" />
                <StatCard icon="▤" color="blue" caption="CURRICULUM" value={data.subjects.length} foot="Subjects being tracked" />
                <StatCard icon="✓" color="green" caption="CLASS AVERAGE" value={classAverage === null ? "—" : `${fmt(classAverage)}%`} foot="Across recorded assessments" />
                <StatCard icon="✎" color="amber" caption="ASSESSMENTS" value={data.marks.length} foot="Marks recorded" />
              </div>
              <div className="dashboard-grid">
                <article className="card chart-card"><CardHeading title="Subject performance" subtitle="Average marks by subject" /><BarChart subjects={data.subjects} marks={data.marks} /></article>
                <article className="card"><div className="card-heading"><CardHeading title="Top performers" subtitle="Based on average percentage" /><button className="text-button" onClick={() => setView("reports")}>View report →</button></div>
                  <div className="performer-list">{rankedStudents.slice(0, 4).map(({ student, percentage }, index) => <Performer key={student.id} rank={index + 1} name={student.name} section={student.section} percentage={percentage} />)}{!rankedStudents.length && <Empty>Add marks to see your top performers.</Empty>}</div>
                </article>
              </div>
              <article className="card table-card"><div className="card-heading"><CardHeading title="Recent marks" subtitle="Your latest assessment records" /><button className="text-button" onClick={() => setView("marks")}>All marks →</button></div><RecentMarks marks={data.marks.slice(0, 5)} /></article>
            </>}
            {view === "students" && <>
              <PageHeading eyebrow="CLASS DIRECTORY" title="Students" subtitle="Manage your roster and review each student's progress." />
              <div className="management-grid">
                <article className="card form-card"><CardHeading title="Add a student" subtitle="Enter the student's class details." /><form className="stack-form" onSubmit={addStudent}>
                  <label>Roll number<input name="rollNo" maxLength={50} placeholder="e.g. S-106" required /></label><label>Full name<input name="name" maxLength={150} placeholder="e.g. Alex Morgan" required /></label><label>Section<input name="section" maxLength={50} placeholder="e.g. A" required /></label><button className="button button-primary" type="submit">Add student</button>
                </form></article>
                <article className="card table-card"><div className="card-heading"><CardHeading title="Class roster" subtitle={`${data.students.length} students`} /><input className="search-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students…" aria-label="Search students" /></div>
                  {!visibleStudents.length ? <Empty>No students found. Add a student to get started.</Empty> : <TableWrap><table><thead><tr><th>STUDENT</th><th>ROLL NO.</th><th>SECTION</th><th>AVERAGE</th><th>GRADE</th><th /></tr></thead><tbody>
                    {visibleStudents.map((student) => {
                      const stats = scoreFor(student.id, data.marks);
                      return <tr key={student.id}><td><span className="student-cell"><span className="mini-avatar">{initials(student.name)}</span>{student.name}</span></td><td>{student.rollNo}</td><td><span className="section-pill">{student.section}</span></td><td>{stats.records.length ? `${fmt(stats.percentage)}%` : "—"}</td><td>{stats.records.length ? <span className="grade-pill">{getGrade(stats.percentage)}</span> : "—"}</td><td><button className="delete-button" onClick={() => remove(`/api/students/${student.id}`, "student")} aria-label={`Delete ${student.name}`}>×</button></td></tr>;
                    })}
                  </tbody></table></TableWrap>}
                </article>
              </div>
            </>}
            {view === "subjects" && <>
              <PageHeading eyebrow="COURSE CATALOG" title="Subjects" subtitle="Set up the subjects and grading thresholds for your class." />
              <div className="management-grid">
                <article className="card form-card"><CardHeading title="Add a subject" subtitle="Define the maximum and passing marks." /><form className="stack-form" onSubmit={addSubject}>
                  <label>Subject name<input name="subjectName" maxLength={150} placeholder="e.g. Mathematics" required /></label><div className="form-row"><label>Maximum marks<input name="maxMarks" type="number" min="1" step="0.01" defaultValue="100" required /></label><label>Pass marks<input name="passMarks" type="number" min="0" step="0.01" defaultValue="40" required /></label></div><button className="button button-primary" type="submit">Add subject</button>
                </form></article>
                <article className="card table-card"><div className="card-heading"><CardHeading title="Your subjects" subtitle={`${data.subjects.length} subjects`} /></div>
                  {!data.subjects.length ? <Empty>No subjects yet. Add a subject to record marks.</Empty> : <TableWrap><table><thead><tr><th>SUBJECT</th><th>MAX MARKS</th><th>PASS MARKS</th><th>AVERAGE</th><th /></tr></thead><tbody>
                    {data.subjects.map((subject) => {
                      const entries = data.marks.filter((mark) => mark.subjectId === subject.id);
                      const average = entries.length ? entries.reduce((sum, mark) => sum + mark.marksObtained, 0) / entries.length : null;
                      return <tr key={subject.id}><td><span className="student-cell">{subject.subjectName}</span></td><td>{fmt(subject.maxMarks)}</td><td>{fmt(subject.passMarks)}</td><td>{average === null ? "—" : fmt(average)}</td><td><button className="delete-button" onClick={() => remove(`/api/subjects/${subject.id}`, "subject")} aria-label={`Delete ${subject.subjectName}`}>×</button></td></tr>;
                    })}
                  </tbody></table></TableWrap>}
                </article>
              </div>
            </>}
            {view === "marks" && <>
              <PageHeading eyebrow="ASSESSMENT BOOK" title="Marks" subtitle="Record assessment scores and keep results up to date." />
              <article className="card form-card mark-entry-card"><CardHeading title="Record an assessment" subtitle="Select a student and subject, then enter the score." /><form className="mark-form" onSubmit={addMark}>
                <label>Student<select name="studentId" required disabled={!data.students.length}>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.rollNo}</option>)}</select></label>
                <label>Subject<select name="subjectId" required disabled={!data.subjects.length} value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)}>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.subjectName}</option>)}</select></label>
                <label>Assessment<input name="assessment" maxLength={100} placeholder="e.g. Unit Test 1" required /></label>
                <label>Marks obtained<input name="marksObtained" type="number" min="0" max={data.subjects.find((subject) => String(subject.id) === selectedSubjectId)?.maxMarks ?? undefined} step="0.01" placeholder="0" required /></label>
                <button className="button button-primary" type="submit" disabled={!data.students.length || !data.subjects.length}>Save marks</button>
              </form></article>
              <article className="card table-card"><div className="card-heading"><CardHeading title="Assessment records" subtitle={`${data.marks.length} records`} /></div>
                <MarksTable marks={data.marks} onDelete={(id) => remove(`/api/marks/${id}`, "mark")} />
              </article>
            </>}
            {view === "reports" && <>
              <PageHeading eyebrow="CLASS INSIGHTS" title="Reports" subtitle="A quick view of student progress and subject outcomes." />
              <div className="stats-grid report-stats">
                <StatCard caption="PASSING STUDENTS" value={data.students.filter((student) => scoreFor(student.id, data.marks).passed).length} foot="Passing every recorded subject" />
                <StatCard caption="NEEDS SUPPORT" value={rankedStudents.filter((entry) => entry.percentage < 40).length} foot="Below 40% average" />
                <StatCard caption="HIGHEST AVERAGE" value={rankedStudents.length ? `${fmt(rankedStudents[0].percentage)}%` : "—"} foot="Top student percentage" />
              </div>
              <div className="dashboard-grid"><article className="card chart-card"><CardHeading title="Subject averages" subtitle="Class average compared with passing marks" /><BarChart subjects={data.subjects} marks={data.marks} /></article>
                <article className="card"><CardHeading title="Student results" subtitle="Average across recorded assessments" />
                  {!rankedStudents.length ? <Empty>Record marks to generate student results.</Empty> : <div className="results-list">{rankedStudents.map(({ student, percentage }) => <div className="result-row" key={student.id}><div><div className="result-name">{student.name}</div><div className="result-section">Section {student.section}</div></div><div className="result-percent">{fmt(percentage)}%</div><div className="result-grade"><span className="grade-pill">{getGrade(percentage)}</span></div></div>)}</div>}
                </article>
              </div>
            </>}
          </>}
          <footer className="footer-note"><span className="status-dot" /> Your class data is saved to the connected database.</footer>
        </div>
      </main>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}

function StatCard({ icon, color, caption, value, foot }: { icon?: string; color?: string; caption: string; value: React.ReactNode; foot: string }) {
  return <article className="stat-card"><div className="stat-top">{icon && <span className={`stat-icon ${color ?? ""}`}>{icon}</span>}<span className="stat-caption">{caption}</span></div><strong>{value}</strong><span className="stat-foot">{foot}</span></article>;
}

function CardHeading({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <div className="card-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{children}</div>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subheading">{subtitle}</p></div></div>;
}

function Performer({ rank, name, section, percentage }: { rank: number; name: string; section: string; percentage: number }) {
  return <div className="performer"><span className="rank">{rank}</span><span className="person-info"><strong>{name}</strong><small>Section {section}</small></span><span className="performer-score">{fmt(percentage)}%</span></div>;
}

function RecentMarks({ marks }: { marks: Mark[] }) {
  if (!marks.length) return <Empty>There are no recent assessments to show.</Empty>;
  return <TableWrap><table><thead><tr><th>STUDENT</th><th>SUBJECT</th><th>ASSESSMENT</th><th>SCORE</th><th>GRADE</th></tr></thead><tbody>
    {marks.map((mark) => <tr key={mark.id}><td>{mark.student.name}</td><td>{mark.subject.subjectName}</td><td>{mark.assessment}</td><td>{fmt(mark.marksObtained)} / {fmt(mark.subject.maxMarks)}</td><td><span className="grade-pill">{getGrade(mark.marksObtained / mark.subject.maxMarks * 100)}</span></td></tr>)}
  </tbody></table></TableWrap>;
}

function MarksTable({ marks, onDelete }: { marks: Mark[]; onDelete: (id: number) => void }) {
  if (!marks.length) return <Empty>No marks recorded yet. Use the form above to add an assessment.</Empty>;
  return <TableWrap><table><thead><tr><th>STUDENT</th><th>SUBJECT</th><th>ASSESSMENT</th><th>MARKS</th><th>RESULT</th><th /></tr></thead><tbody>
    {marks.map((mark) => {
      const passed = mark.marksObtained >= mark.subject.passMarks;
      return <tr key={mark.id}><td>{mark.student.name}</td><td>{mark.subject.subjectName}</td><td>{mark.assessment}</td><td>{fmt(mark.marksObtained)} / {fmt(mark.subject.maxMarks)}</td><td><span className={`grade-pill ${passed ? "" : "grade-fail"}`}>{passed ? "Pass" : "Needs support"}</span></td><td><button className="delete-button" onClick={() => onDelete(mark.id)} aria-label="Delete mark">×</button></td></tr>;
    })}
  </tbody></table></TableWrap>;
}
