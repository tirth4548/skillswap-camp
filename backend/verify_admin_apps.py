from app.database import SessionLocal
from app import models, auth
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_admin_apps():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.id == 1).first()
        if not admin:
            print("Admin not found")
            return

        # 1. Ensure a pending application exists for a system bounty
        bounty = db.query(models.Gig).filter(models.Gig.is_system == True).first()
        if not bounty:
            print("No system bounty found")
            return
            
        app_entry = db.query(models.GigApplication).filter(models.GigApplication.gig_id == bounty.id).first()
        if not app_entry:
            print(f"Creating test application for bounty {bounty.id}...")
            app_entry = models.GigApplication(
                gig_id=bounty.id,
                applicant_id=3, # Mihika
                status="pending"
            )
            db.add(app_entry)
            db.commit()

        # 2. Call the endpoint as Admin
        token = auth.create_access_token(data={"sub": admin.username})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/gigs/my-applications", headers=headers)
        if response.status_code == 200:
            apps = response.json()
            print(f"Found {len(apps)} applications for Admin.")
            for a in apps:
                print(f"- Gig: {a['gig']['title']}, System: {a['gig']['is_system']}, Applicant: {a['applicant']['username']}")
            
            # Verify that the bounty application is present
            bounty_apps = [a for a in apps if a['gig']['is_system']]
            if bounty_apps:
                print("✅ Admin can see system bounty applications!")
            else:
                print("❌ Admin CANNOT see system bounty applications.")
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")

    finally:
        db.close()

if __name__ == "__main__":
    verify_admin_apps()
