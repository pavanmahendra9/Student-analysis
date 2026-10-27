from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


def subject_average_chart(subject_summary_df):
    chart_path = REPORTS_DIR / "subject_average.png"
    plt.figure(figsize=(10, 6))
    if subject_summary_df.empty:
        plt.text(0.5, 0.5, "No subject data available", ha="center", va="center")
        plt.axis("off")
        plt.tight_layout()
        plt.savefig(chart_path)
        plt.close()
        return str(chart_path)

    labels = subject_summary_df["subject_name"].tolist()
    values = [float(x) for x in subject_summary_df["avg_marks"].tolist()]
    plt.bar(labels, values, color="steelblue")
    plt.title("Subject-wise Average Marks")
    plt.xlabel("Subject")
    plt.ylabel("Average Marks")
    plt.xticks(rotation=25, ha="right")
    plt.tight_layout()
    plt.savefig(chart_path)
    plt.close()
    return str(chart_path)


def pass_percentage_chart(subject_summary_df):
    chart_path = REPORTS_DIR / "subject_pass_percentage.png"
    plt.figure(figsize=(10, 6))
    if subject_summary_df.empty:
        plt.text(0.5, 0.5, "No subject data available", ha="center", va="center")
        plt.axis("off")
        plt.tight_layout()
        plt.savefig(chart_path)
        plt.close()
        return str(chart_path)

    labels = subject_summary_df["subject_name"].tolist()
    values = [float(x) for x in subject_summary_df["pass_percentage"].tolist()]
    plt.bar(labels, values, color="darkgreen")
    plt.title("Subject-wise Pass Percentage")
    plt.xlabel("Subject")
    plt.ylabel("Pass Percentage (%)")
    plt.xticks(rotation=25, ha="right")
    plt.tight_layout()
    plt.savefig(chart_path)
    plt.close()
    return str(chart_path)


def build_subject_summary(df):
    if df.empty:
        return pd.DataFrame(columns=["subject_id", "subject_name", "avg_marks", "pass_percentage", "pass_count", "fail_count"])
    df = df.copy()
    df["marks_obtained"] = pd.to_numeric(df["marks_obtained"], errors="coerce")
    df["max_marks"] = pd.to_numeric(df["max_marks"], errors="coerce")
    df["pass_marks"] = pd.to_numeric(df["pass_marks"], errors="coerce")
    df["is_pass"] = df["marks_obtained"] >= df["pass_marks"]

    subject_summary = (
        df.groupby("subject_name", as_index=False)
        .agg(
            subject_id=("subject_id", "first"),
            avg_marks=("marks_obtained", "mean"),
            pass_count=("is_pass", "sum"),
            fail_count=("is_pass", lambda s: (s == False).sum())
        )
    )
    subject_summary["pass_percentage"] = np.where(
        (subject_summary["pass_count"] + subject_summary["fail_count"]) > 0,
        (subject_summary["pass_count"] / (subject_summary["pass_count"] + subject_summary["fail_count"])) * 100,
        0,
    )
    return subject_summary


def build_section_summary(df):
    if df.empty:
        return pd.DataFrame(columns=["section", "student_count", "avg_overall_percentage", "pass_rate"])
    df = df.copy()
    df["overall_percentage"] = pd.to_numeric(df["overall_percentage"], errors="coerce")
    grouped = (
        df.groupby("section", as_index=False)
        .agg(student_count=("student_id", "nunique"), avg_overall_percentage=("overall_percentage", "mean"), pass_rate=("overall_pass", "mean"))
    )
    grouped["pass_rate"] = grouped["pass_rate"] * 100
    return grouped


def compute_numpy_statistics(series):
    values = pd.to_numeric(series, errors="coerce").dropna().tolist()
    if not values:
        return {"count": 0, "mean": None, "median": None, "min": None, "max": None}
    arr = np.array(values, dtype=float)
    return {
        "count": int(len(arr)),
        "mean": float(np.mean(arr)),
        "median": float(np.median(arr)),
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
    }
