from app.database import SessionLocal
from app import models

def check_apps():
    db = SessionLocal()
    try:
        # Check if any applications exist for system gigs
        apps = db.query(models.GigApplication).join(models.Gig).filter(
            models.Gig.is_system == True
        ).all()
        
        print(f"Total system bounty applications in DB: {len(apps)}")
        for a in apps:
            print(f"- Gig ID: {a.gig_id}, Title: {a.gig.title}, Status: {a.status}, Applicant: {a.applicant.username}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_apps()
