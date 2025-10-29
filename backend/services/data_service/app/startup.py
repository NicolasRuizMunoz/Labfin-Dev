import time
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from app.database.db import engine, get_db, Base

def wait_for_db(max_retries=30, delay=2):
    for attempt in range(max_retries):
        try:
            db = next(get_db())
            db.execute(text("SELECT 1"))
            print("✅ Conexión a base de datos exitosa")
            return
        except OperationalError as e:
            print(f"⏳ Esperando base de datos... (intento {attempt + 1}) - {e}")
            time.sleep(delay)
    print("❌ No se pudo conectar a la base de datos luego de varios intentos.")
    raise Exception("Database not ready")

def init_db():
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    print("🗄️ Tablas creadas exitosamente")

