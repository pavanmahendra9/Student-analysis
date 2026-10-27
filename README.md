# Student Performance Analysis System

This project provides a Python-based student performance application. Its browser dashboard works locally without a database and saves class data in the current browser. The existing Flask API and analytics endpoints can also use MySQL when it is configured.

## Features

- Student, subject and mark management with validation
- Academic result calculations: totals, averages, percentage, grade and pass/fail
- Toppers and low-performance analysis
- Pandas-based grouped summaries and NumPy statistics
- Matplotlib charts saved under the `reports/` directory
- REST API endpoints for integration and testing
- Responsive dashboard for students, subjects, marks and reports
- Local demo data with browser-based persistence; no database required for the dashboard

## Architecture

- `app/`: Flask application, configuration, DB utilities, routes and dashboard
- `app/templates/` and `app/static/`: dashboard HTML, styling and browser-side behavior
- `app/services/`: business logic for students, subjects and marks
- `app/analytics/`: charting and aggregated analytics code
- `sql/`: schema and seed SQL
- `tests/`: pytest tests
- `reports/`: generated chart output

## Prerequisites

- Python 3.11+
- MySQL 8+ (optional; required only for the database-backed API)
- VS Code recommended
- An environment with internet access to install Python packages

## Setup on Windows

1. Open PowerShell in the project folder.
2. Create a virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```
4. Optional: configure MySQL for the database-backed API. Create a database and user:
   ```sql
   CREATE DATABASE student_performance_db;
   CREATE USER 'student_app_user'@'localhost' IDENTIFIED BY 'change_me';
   GRANT ALL PRIVILEGES ON student_performance_db.* TO 'student_app_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
5. Configure `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=student_performance_db
   DB_USER=student_app_user
   DB_PASSWORD=change_me
   DEBUG=False
   SECRET_KEY=change-me
   LOW_PERFORMANCE_THRESHOLD=40
   ```

## Optional API Database Setup

```bash
mysql -u root -p < sql/schema.sql
```

Optional seed data:
```bash
mysql -u root -p < sql/seed.sql
```

## Run the Dashboard Locally

```bash
python run.py
```

Open the dashboard at <http://127.0.0.1:5000/>. The dashboard starts with sample class data and can add/remove students, subjects and assessment marks. Changes are saved in that browser's local storage; they are not shared across browsers or connected to MySQL.

The database health endpoint is available at:
```bash
curl http://localhost:5000/health
```

## API Reference

### Health
- `GET /health`

### Students
- `GET /api/students?page=1&per_page=20&search=abc&section=A`
- `POST /api/students`
  ```json
  {
    "roll_no": "S-101",
    "name": "Alice Johnson",
    "section": "A"
  }
  ```
- `GET /api/students/<student_id>`
- `PATCH /api/students/<student_id>`
- `DELETE /api/students/<student_id>`

### Subjects
- `GET /api/subjects`
- `POST /api/subjects`
  ```json
  {
    "subject_name": "Mathematics",
    "max_marks": 100,
    "pass_marks": 40
  }
  ```

### Marks
- `GET /api/marks?student_id=1&subject_id=2&section=A&assessment=Midterm`
- `POST /api/marks`
  ```json
  {
    "student_id": 1,
    "subject_id": 2,
    "assessment": "Midterm",
    "marks_obtained": 88
  }
  ```

### Reports
- `GET /api/reports/subject-summary`
- `GET /api/reports/section-summary`
- `GET /api/reports/toppers`
- `GET /api/reports/low-performance?threshold=40`
- `GET /api/reports/statistics`
- `GET /api/reports/subject-average-chart`
- `GET /api/reports/pass-percentage-chart`
- `GET /api/students/<student_id>/results`

## Business Rules

- Overall pass means passing every required subject, not just having an average above pass marks.
- A student's overall percentage is computed as total marks obtained divided by total maximum marks * 100.
- Grade boundaries: A >= 90, B >= 80, C >= 70, D >= 60, E >= 40, F < 40.
- Toppers are ranked by overall percentage; equal percentages receive the same rank.
- Students without sufficient records are excluded from overall rankings.

## Testing

```bash
pytest -q
```

## Known Limitations

- The dashboard uses browser-local data and does not sync to the MySQL-backed API.
- API endpoints that read or write students, subjects, marks or reports require a running MySQL server, a configured `.env`, and the schema above.
- Clearing this site's browser storage removes dashboard changes and restores the sample data.

## Troubleshooting

- If MySQL connection fails, verify `.env` values and ensure the MySQL service is running.
- If package installation fails, ensure pip is upgraded and Python version is 3.11+.
- If charts are not generated, confirm the `reports/` directory exists and the code has write permission.
"# Student-analysis" 
"# Student-analysis" 
