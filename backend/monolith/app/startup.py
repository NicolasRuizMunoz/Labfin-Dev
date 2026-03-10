import time
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.database.db import Base, engine, get_db
from app.models import *  # noqa: F401 — ensures all models are registered


def wait_for_db(max_retries: int = 30, delay: int = 2):
    for attempt in range(max_retries):
        try:
            db: Session = next(get_db())
            db.execute(text("SELECT 1"))
            print("DB connection OK")
            return
        except OperationalError as e:
            print(f"Waiting for DB... attempt {attempt + 1}: {e}")
            time.sleep(delay)
    raise RuntimeError("Database not ready after retries")


def run_startup():
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    print("Tables created/verified.")
