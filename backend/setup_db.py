import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Step 1: Create the database if it doesn't exist
print("Connecting to PostgreSQL...")
try:
    conn = psycopg2.connect(host='localhost', port=5432, user='postgres', password='admin123', dbname='postgres')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname='school_erp'")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE school_erp")
        print("Created database: school_erp")
    else:
        print("Database school_erp already exists")
    conn.close()
except Exception as e:
    print(f"ERROR connecting to PostgreSQL: {e}")
    exit(1)

# Step 2: Create all tables
print("\nCreating tables...")
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

from app.database import engine, Base
from app.models import user, student, teacher, parent, management
from app.models import attendance, homework, exam, mark, subject
from app.models import class_model, notification, salary, ai_log

Base.metadata.create_all(bind=engine)
print("All tables created successfully!")

# Step 3: Seed default users
print("\nSeeding default users...")
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.auth.password import get_password_hash

db = SessionLocal()

users_to_create = [
    {"username": "admin",    "email": "admin@school.com",    "password": "admin123",    "role": UserRole.MANAGEMENT},
    {"username": "teacher1", "email": "teacher1@school.com", "password": "teacher123",  "role": UserRole.TEACHER},
    {"username": "student1", "email": "student1@school.com", "password": "student123",  "role": UserRole.STUDENT},
    {"username": "parent1",  "email": "parent1@school.com",  "password": "parent123",   "role": UserRole.PARENT},
]

for u in users_to_create:
    existing = db.query(User).filter(User.username == u["username"]).first()
    if not existing:
        new_user = User(
            username=u["username"],
            email=u["email"],
            password_hash=get_password_hash(u["password"]),
            role=u["role"],
            is_active=True
        )
        db.add(new_user)
        print(f"  Created user: {u['username']} / {u['password']}  (role: {u['role'].value})")
    else:
        print(f"  User already exists: {u['username']}")

db.commit()
db.close()

print("\n✅ Setup complete! Login credentials:")
print("  admin    / admin123   (Management)")
print("  teacher1 / teacher123 (Teacher)")
print("  student1 / student123 (Student)")
print("  parent1  / parent123  (Parent)")
