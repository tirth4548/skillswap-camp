from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def enrich_existing_users():
    db = SessionLocal()
    
    # Define enrichment data for demo personas
    enrichments = [
        {
            "username": "alex_founder",
            "bio": "Visionary entrepreneur | 3x Hackathon winner | Building DeFi on campus.",
            "xp": 2450,
            "credits": 500,
            "level": 12,
            "dept": "Computer Science",
            "year": 3
        },
        {
            "username": "sarah_design",
            "bio": "Product Architect & UI/UX Specialist | Passionate about glassmorphism.",
            "xp": 1800,
            "credits": 1200,
            "level": 9,
            "dept": "Design",
            "year": 2
        },
        {
            "username": "jason_data",
            "bio": "ML Engineer | Transforming campus data into insights.",
            "xp": 950,
            "credits": 350,
            "level": 5,
            "dept": "Data Science",
            "year": 4
        }
    ]

    for data in enrichments:
        user = db.query(models.User).filter(models.User.username == data["username"]).first()
        if user:
            user.bio = data["bio"]
            user.xp = data["xp"]
            user.credits = data["credits"]
            user.level = data["level"]
            user.department = data["dept"]
            user.year = data["year"]
            print(f"Enriched existing user: {user.username}")
        else:
            print(f"User {data['username']} not found. Skipping.")

    # Also update any user with very low credits to have a starting balance for demo
    low_credit_users = db.query(models.User).filter(models.User.credits < 100).all()
    for u in low_credit_users:
        u.credits = 150
        print(f"Topped up credits for {u.username}")

    db.commit()
    db.close()
    print("Database enrichment complete.")

if __name__ == "__main__":
    enrich_existing_users()
