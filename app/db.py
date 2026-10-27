import mysql.connector
from flask import g

from app.config import get_config


def get_db():
    if "db" not in g:
        cfg = get_config()
        g.db = mysql.connector.connect(
            host=cfg.DB_HOST,
            port=cfg.DB_PORT,
            user=cfg.DB_USER,
            password=cfg.DB_PASSWORD,
            database=cfg.DB_NAME,
            autocommit=False,
            charset="utf8mb4",
        )
    return g.db


def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def fetch_one(query, params=()):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params)
        return cursor.fetchone()
    finally:
        cursor.close()


def fetch_all(query, params=()):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        cursor.close()


def execute(query, params=()):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
