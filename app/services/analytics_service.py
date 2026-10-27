from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from app.db import fetch_all

REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


def student_result_summary(student_id):
    rows = fetch_all(
        """
        SELECT m.student_id, s.roll_no, s.name, s.section, sub.subject_id, sub.subject_name,
               sub.max_marks, sub.pass_marks, m.assessment, m.marks_obtained
        FROM marks m
        JOIN students s ON s.student_id = m.student_id
        JOIN subjects sub ON sub.subject_id = m.subject_id
        WHERE m.student_id = %s
        ORDER BY sub.subject_id, m.assessment
        """,
        (student_id,),
    )
    if not rows:
        return {"student_id": student_id, "total_marks": 0, "total_max_marks": 0, "percentage": 0, "grade": "F", "overall_pass": False, "subjects": []}

    df = pd.DataFrame(rows)
    df["marks_obtained"] = pd.to_numeric(df["marks_obtained"], errors="coerce")
    df["pass_marks"] = pd.to_numeric(df["pass_marks"], errors="coerce")
    df["max_marks"] = pd.to_numeric(df["max_marks"], errors="coerce")
    df["subject_pass"] = df["marks_obtained"] >= df["pass_marks"]

    subject_rows = []
    for _, group in df.groupby("subject_name"):
        total_marks = float(group["marks_obtained"].sum())
        max_marks = float(group["max_marks"].max())
        pass_status = bool(group["subject_pass"].all())
        subject_rows.append({
            "subject_name": group.iloc[0]["subject_name"],
            "total_marks": total_marks,
            "total_max_marks": max_marks,
            "percentage": round((total_marks / max_marks) * 100, 2) if max_marks else 0,
            "pass": pass_status,
            "assessments": group[["assessment", "marks_obtained", "pass_marks"]].to_dict("records"),
        })

    total_marks = float(df["marks_obtained"].sum())
    total_max_marks = float(df["max_marks"].sum())
    percentage = (total_marks / total_max_marks) * 100 if total_max_marks else 0
    grade = compute_grade(percentage)
    overall_pass = all(item["pass"] for item in subject_rows) if subject_rows else False

    return {
        "student_id": student_id,
        "roll_no": rows[0]["roll_no"],
        "name": rows[0]["name"],
        "section": rows[0]["section"],
        "total_marks": total_marks,
        "total_max_marks": total_max_marks,
        "percentage": round(percentage, 2),
        "grade": grade,
        "overall_pass": overall_pass,
        "subjects": subject_rows,
    }


def compute_grade(percentage):
    thresholds = {"A": 90, "B": 80, "C": 70, "D": 60, "E": 40, "F": 0}
    for grade, threshold in sorted(thresholds.items(), key=lambda item: item[1], reverse=True):
        if percentage >= threshold:
            return grade
    return "F"


def subject_summary_report():
    rows = fetch_all(
        """
        SELECT m.student_id, sub.subject_id, sub.subject_name, sub.max_marks, sub.pass_marks, m.marks_obtained
        FROM marks m
        JOIN subjects sub ON sub.subject_id = m.subject_id
        """
    )
    if not rows:
        return []
    df = pd.DataFrame(rows)
    df["marks_obtained"] = pd.to_numeric(df["marks_obtained"], errors="coerce")
    df["pass_marks"] = pd.to_numeric(df["pass_marks"], errors="coerce")
    df["is_pass"] = df["marks_obtained"] >= df["pass_marks"]
    grouped = df.groupby("subject_name", as_index=False).agg(
        subject_id=("subject_id", "first"),
        avg_marks=("marks_obtained", "mean"),
        pass_count=("is_pass", "sum"),
        fail_count=("is_pass", lambda s: (s == False).sum()),
    )
    grouped["pass_percentage"] = (grouped["pass_count"] / (grouped["pass_count"] + grouped["fail_count"])) * 100
    return grouped.to_dict("records")


def section_summary_report():
    rows = fetch_all(
        """
        SELECT s.student_id, s.section, sp.subject_id, sp.subject_name, sp.max_marks, sp.pass_marks, m.marks_obtained
        FROM students s
        LEFT JOIN marks m ON m.student_id = s.student_id
        LEFT JOIN subjects sp ON sp.subject_id = m.subject_id
        """
    )
    if not rows:
        return []
    df = pd.DataFrame(rows)
    df["section"] = df["section"].fillna("UNKNOWN")
    grouped = df.groupby("section", as_index=False).agg(student_count=("student_id", "nunique"))
    return grouped.to_dict("records")


def toppers_report():
    rows = fetch_all(
        """
        SELECT s.student_id, s.name, s.section, SUM(m.marks_obtained) AS total_marks,
               SUM(sub.max_marks) AS total_max_marks
        FROM students s
        LEFT JOIN marks m ON m.student_id = s.student_id
        LEFT JOIN subjects sub ON sub.subject_id = m.subject_id
        GROUP BY s.student_id, s.name, s.section
        HAVING total_max_marks IS NOT NULL AND total_max_marks > 0
        """
    )
    if not rows:
        return []
    df = pd.DataFrame(rows)
    df["overall_percentage"] = (df["total_marks"] / df["total_max_marks"]) * 100
    df = df.sort_values(["overall_percentage", "name"], ascending=[False, True]).reset_index(drop=True)
    df["rank"] = 0
    rank = 0
    previous = None
    for idx, row in df.iterrows():
        if previous is None or row["overall_percentage"] != previous:
            rank = idx + 1
            previous = row["overall_percentage"]
        df.at[idx, "rank"] = rank
    return df[["rank", "student_id", "name", "section", "overall_percentage"]].to_dict("records")


def low_performance_report(threshold=40):
    rows = fetch_all(
        """
        SELECT s.student_id, s.name, s.section, SUM(m.marks_obtained) AS total_marks, SUM(sub.max_marks) AS total_max_marks
        FROM students s
        LEFT JOIN marks m ON m.student_id = s.student_id
        LEFT JOIN subjects sub ON sub.subject_id = m.subject_id
        GROUP BY s.student_id, s.name, s.section
        """
    )
    if not rows:
        return []
    df = pd.DataFrame(rows)
    df["overall_percentage"] = (df["total_marks"].fillna(0) / df["total_max_marks"].fillna(1)) * 100
    df = df[df["total_max_marks"].notna() & (df["total_max_marks"] > 0)]
    result = df[df["overall_percentage"] < float(threshold)]
    return result[["student_id", "name", "section", "overall_percentage"]].to_dict("records")


def numpy_statistics_report():
    rows = fetch_all("SELECT marks_obtained FROM marks")
    if not rows:
        return {"count": 0, "mean": None, "median": None, "min": None, "max": None}
    values = pd.to_numeric([item["marks_obtained"] for item in rows], errors="coerce").dropna().to_numpy(dtype=float)
    return {
        "count": int(len(values)),
        "mean": float(np.mean(values)),
        "median": float(np.median(values)),
        "min": float(np.min(values)),
        "max": float(np.max(values)),
    }


def generate_subject_chart(subject_summary):
    chart_path = REPORTS_DIR / "subject_average_marks.png"
    plt.figure(figsize=(10, 6))
    if not subject_summary:
        plt.text(0.5, 0.5, "No data", ha="center", va="center")
        plt.axis("off")
    else:
        labels = [item["subject_name"] for item in subject_summary]
        values = [float(item["avg_marks"]) for item in subject_summary]
        plt.bar(labels, values, color="steelblue")
        plt.title("Subject-wise Average Marks")
        plt.xlabel("Subject")
        plt.ylabel("Average Marks")
        plt.xticks(rotation=25, ha="right")
    plt.tight_layout()
    plt.savefig(chart_path)
    plt.close()
    return str(chart_path)


def generate_pass_chart(subject_summary):
    chart_path = REPORTS_DIR / "subject_pass_percentage.png"
    plt.figure(figsize=(10, 6))
    if not subject_summary:
        plt.text(0.5, 0.5, "No data", ha="center", va="center")
        plt.axis("off")
    else:
        labels = [item["subject_name"] for item in subject_summary]
        values = [float(item["pass_percentage"]) for item in subject_summary]
        plt.bar(labels, values, color="forestgreen")
        plt.title("Subject-wise Pass Percentage")
        plt.xlabel("Subject")
        plt.ylabel("Pass Percentage (%)")
        plt.xticks(rotation=25, ha="right")
    plt.tight_layout()
    plt.savefig(chart_path)
    plt.close()
    return str(chart_path)
