from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def seed_system_gigs():
    db = SessionLocal()
    
    # Check if system gigs already exist
    existing = db.query(models.Gig).filter(models.Gig.is_system == True).first()
    if existing:
        print("System gigs already seeded.")
        return

    bounties = [
        {
            "title": "Complete Your Profile",
            "description": "Fill in your bio, interests, and add at least 3 skills to your profile to earn your first bonus.",
            "credit_reward": 50,
            "category": "Onboarding"
        },
        {
            "title": "Skill Endorsement Pro",
            "description": "Endorse 5 of your classmates' skills after successful collaborations.",
            "credit_reward": 30,
            "category": "Social"
        },
        {
            "title": "Knowledge Sharer",
            "description": "Share 3 high-quality resources (PDFs, Videos, or Links) in your workspace library.",
            "credit_reward": 40,
            "category": "Academic"
        }
    ]

    for b in bounties:
        gig = models.Gig(
            poster_id=None, # System post
            title=b["title"],
            description=b["description"],
            credit_reward=b["credit_reward"],
            category=b["category"],
            is_system=True,
            status="open"
        )
        db.add(gig)
    
    db.commit()
    print("System bounties seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_system_gigs()
