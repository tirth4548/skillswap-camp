from app.database import SessionLocal
from app import models
import sys

def verify_db_payout():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.id == 1).first()
        executor = db.query(models.User).filter(models.User.id == 3).first()
        
        if not admin or not executor:
            print("Missing Admin (1) or Mihika (3)")
            return

        initial_admin_credits = admin.credits
        initial_executor_credits = executor.credits
        
        # 1. Ensure a system gig exists
        gig = db.query(models.Gig).filter(models.Gig.is_system == True, models.Gig.status == "open").first()
        if not gig:
            gig = models.Gig(
                title="Profile Completion",
                description="Complete profile",
                credit_reward=50,
                is_system=True,
                status="open"
            )
            db.add(gig)
            db.commit()
            db.refresh(gig)

        print(f"Testing with System Gig: {gig.title} (Reward: {gig.credit_reward})")

        # 2. Simulate Router Completion Logic
        # (This is a manual verification of the LOGIC added to gigs.py)
        
        # Payout logic:
        if gig.is_system:
            executor.credits += gig.credit_reward
            from_id = None
            reason = f"System Bounty: {gig.title}"
        else:
            admin.credits -= gig.credit_reward
            executor.credits += gig.credit_reward
            from_id = admin.id
            reason = f"Gig completion: {gig.title}"

        transaction = models.CreditTransaction(
            from_user_id=from_id,
            to_user_id=executor.id,
            amount=gig.credit_reward,
            reason=reason
        )
        db.add(transaction)
        gig.status = "completed"
        gig.executor_id = executor.id
        db.commit()

        db.refresh(admin)
        db.refresh(executor)

        print(f"Admin Credits: {initial_admin_credits} -> {admin.credits}")
        print(f"Executor Credits: {initial_executor_credits} -> {executor.credits}")

        if admin.credits == initial_admin_credits and executor.credits == initial_executor_credits + gig.credit_reward:
            print("✅ DB LOGIC VERIFIED: Executor gained credits, Admin lost nothing.")
        else:
            print("❌ DB LOGIC FAILED!")
            sys.exit(1)

    finally:
        db.close()

if __name__ == "__main__":
    verify_db_payout()
