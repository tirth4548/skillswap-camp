from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from passlib.context import CryptContext
import uuid

# Use the same scheme as app/auth.py
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_force_data():
    db = SessionLocal()
    
    # 1. Ensure Skills exist for a healthy ecosystem
    skill_names = ["Python", "UI/UX Design", "React", "Node.js", "Marketing", "Solidity", "Machine Learning", "Figma", "Public Speaking", "Data Analysis"]
    existing_skills = {s.name: s for s in db.query(models.Skill).all()}
    
    skills = []
    for name in skill_names:
        if name not in existing_skills:
            skill = models.Skill(name=name, category="Tech")
            db.add(skill)
            skills.append(skill)
        else:
            skills.append(existing_skills[name])
    db.commit()

    # 2. Hard-Seeded Demo Persons
    demo_people = [
        {
            "username": "alex_founder",
            "full_name": "Alex Rivars",
            "email": "alex@skillswap.edu",
            "bio": "Visionary entrepreneur | 3x Hackathon winner | Building DeFi on campus.",
            "xp": 2450,
            "credits": 500,
            "level": 12,
            "dept": "Computer Science",
            "year": 3,
            "skills": ["Python", "Solidity", "Marketing"]
        },
        {
            "username": "sarah_design",
            "full_name": "Sarah Chen",
            "email": "sarah@skillswap.edu",
            "bio": "Product Architect & UI/UX Specialist | Passionate about glassmorphism.",
            "xp": 1800,
            "credits": 1200,
            "level": 9,
            "dept": "Design",
            "year": 2,
            "skills": ["UI/UX Design", "Figma", "React"]
        },
        {
            "username": "jason_data",
            "full_name": "Jason Miller",
            "email": "jason@skillswap.edu",
            "bio": "ML Engineer | Transforming campus data into insights.",
            "xp": 950,
            "credits": 350,
            "level": 5,
            "dept": "Data Science",
            "year": 4,
            "skills": ["Machine Learning", "Python"]
        }
    ]

    for p in demo_people:
        user = db.query(models.User).filter(models.User.username == p["username"]).first()
        if not user:
            user = models.User(
                username=p["username"],
                email=p["email"],
                hashed_password=get_password_hash("password123"),
                full_name=p["full_name"],
                referral_code=str(uuid.uuid4())[:8].upper()
            )
            db.add(user)
            db.flush()
        
        user.bio = p["bio"]
        user.xp = p["xp"]
        user.credits = p["credits"]
        user.level = p["level"]
        user.department = p["dept"]
        user.year = p["year"]
        print(f"Propagated data for: {user.username}")

    # 3. Boost ALL existing users so their 'Sir' sees activity
    all_users = db.query(models.User).all()
    for u in all_users:
        if u.credits < 150: u.credits = 150
        if u.xp < 300: u.xp = 350
        if not u.bio: u.bio = "Active SkillSwap member. Exploring campus opportunities."
        if not u.department: u.department = "General Science"
        if not u.year: u.year = 1
        print(f"Boosted account: {u.username}")

    # 4. Create some active Gigs to show off the 'Gigs' feature
    market_skills = db.query(models.Skill).limit(5).all()
    if db.query(models.Gig).count() < 3:
        for i in range(3):
            gig = models.Gig(
                title=f"Demo Gig #{i+1}: Project Support",
                description="Seeking a collaborator to help polish the UI of my latest project.",
                credit_reward=75,
                status="open",
                poster_id=db.query(models.User).filter(models.User.username=="alex_founder").first().id
            )
            db.add(gig)

    db.commit()
    db.close()
    print("DEMO ECOSYSTEM INITIALIZED.")

if __name__ == "__main__":
    seed_force_data()
