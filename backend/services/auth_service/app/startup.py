# app/startup.py
import time
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.hash import bcrypt

from app.database.db import engine, get_db, Base
from app.models.role import Role
from app.models.user import User

def wait_for_db(max_retries=30, delay=2):
    for attempt in range(max_retries):
        try:
            db = next(get_db())
            db.execute(text("SELECT 1"))
            print("✅ Conexión a base de datos OK")
            return
        except OperationalError as e:
            print(f"⏳ Esperando DB... intento {attempt+1} - {e}")
            time.sleep(delay)
    raise RuntimeError("DB not ready")

def seed_roles():
    db: Session = next(get_db())
    if db.query(Role).count() == 0:
        roles = ["administrador", "usuario", "labfin"]  # <= renombrado
        for name in roles:
            db.add(Role(name=name))
        db.commit()
        print("✅ Roles por defecto insertados")

def seed_labfin_admin():
    db: Session = next(get_db())
    existing = db.query(User).join(User.role).filter(Role.name.ilike("labfin")).first()
    if existing:
        print("ℹ️ Admin Labfin ya existe"); return
    labfin_role = db.query(Role).filter(Role.name.ilike("labfin")).first()
    if not labfin_role:
        print("❌ Rol 'labfin' no encontrado"); return
    admin = User(
        email="admin@labfin.dev",
        username="admin",
        hashed_password=bcrypt.hash("admin123"),
        role_id=labfin_role.id,
        is_active=True,
    )
    db.add(admin); db.commit()
    print("✅ Usuario admin Labfin creado")

def run_startup():
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    seed_roles()
    seed_labfin_admin()
