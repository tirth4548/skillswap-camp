from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models, auth
import pytest

client = TestClient(app)

def test_system_bounty_payout():
    db = SessionLocal()
    try:
        # 1. Setup: Ensure an admin and an executor exist
        admin = db.query(models.User).filter(models.User.id == 1).first()
        executor = db.query(models.User).filter(models.User.id == 3).first()
        
        if not admin or not executor:
            print("Admin (1) or Executor (3) missing. Skipping detailed test.")
            return

        initial_admin_credits = admin.credits
        initial_executor_credits = executor.credits
        
        # 2. Setup: Ensure a system gig exists and is in progress for User 3
        gig = db.query(models.Gig).filter(models.Gig.is_system == True, models.Gig.status == "open").first()
        if not gig:
            # Create one if missing
            gig = models.Gig(
                title="Test Bounty",
                description="Test",
                credit_reward=50,
                is_system=True,
                status="open"
            )
            db.add(gig)
            db.commit()
            db.refresh(gig)

        gig_id = gig.id
        gig.status = "in_progress"
        gig.executor_id = executor.id
        db.commit()

        # 3. Create a mock token for admin
        token = auth.create_access_token(data={"sub": admin.username})
        headers = {"Authorization": f"Bearer {token}"}

        # 4. Call completion endpoint as Admin
        print(f"Completing system gig {gig_id} for user {executor.username}...")
        response = client.post(f"/gigs/{gig_id}/complete", headers=headers)
        
        if response.status_code == 200:
            db.refresh(admin)
            db.refresh(executor)
            
            print(f"Admin Credits: {initial_admin_credits} -> {admin.credits}")
            print(f"Executor Credits: {initial_executor_credits} -> {executor.credits}")
            
            # Verify executor got credits
            assert executor.credits == initial_executor_credits + gig.credit_reward
            # Verify admin credits DID NOT change
            assert admin.credits == initial_admin_credits
            print("✅ System Bounty Payout Verified!")
        else:
            print(f"❌ Failed to complete gig: {response.json()}")

    finally:
        db.close()

if __name__ == "__main__":
    test_system_bounty_payout()
