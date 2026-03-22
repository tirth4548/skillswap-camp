from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(prefix="/gigs", tags=["gigs"])

@router.post("/", response_model=schemas.Gig)
def post_gig(
    gig: schemas.GigCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_gig = models.Gig(
        **gig.dict(),
        poster_id=current_user.id,
        status="open"
    )
    db.add(db_gig)
    db.commit()
    db.refresh(db_gig)
    return db_gig

@router.get("/", response_model=List[schemas.Gig])
def list_gigs(db: Session = Depends(database.get_db)):
    return db.query(models.Gig).filter(models.Gig.status == "open").all()

@router.post("/{gig_id}/apply", response_model=schemas.GigApplication)
def apply_for_gig(
    gig_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_gig = db.query(models.Gig).filter(models.Gig.id == gig_id).first()
    if not db_gig or db_gig.status != "open":
        raise HTTPException(status_code=400, detail="Gig not available")
    
    if db_gig.poster_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot apply for your own gig")

    # Check if already applied
    existing = db.query(models.GigApplication).filter(
        models.GigApplication.gig_id == gig_id,
        models.GigApplication.applicant_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied for this gig")

    db_app = models.GigApplication(gig_id=gig_id, applicant_id=current_user.id)
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.post("/applications/{app_id}/approve", response_model=schemas.Gig)
def approve_application(
    app_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_app = db.query(models.GigApplication).filter(models.GigApplication.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db_gig = db_app.gig
    
    # Permission check: Poster or Admin for system gigs
    is_admin = current_user.id == 1
    if db_gig.poster_id != current_user.id and not (db_gig.is_system and is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to approve this application")

    if db_gig.status != "open":
        raise HTTPException(status_code=400, detail="Gig is no longer open")

    # Approve this applicant and start the gig
    db_gig.executor_id = db_app.applicant_id
    db_app.status = "approved"
    
    # If it's a system bounty, pay out immediately and mark as complete
    if db_gig.is_system:
        applicant = db_app.applicant
        applicant.credits += db_gig.credit_reward
        
        # Record transaction
        transaction = models.CreditTransaction(
            from_user_id=None,  # Campus System
            to_user_id=applicant.id,
            amount=db_gig.credit_reward,
            reason=f"System Bounty: {db_gig.title}"
        )
        db.add(transaction)
        db_gig.status = "completed"
    else:
        db_gig.status = "in_progress"
    
    # Decline others
    db.query(models.GigApplication).filter(
        models.GigApplication.gig_id == db_gig.id,
        models.GigApplication.id != app_id
    ).update({"status": "declined"})
    
    db.commit()
    db.refresh(db_gig)
    return db_gig

@router.get("/my-applications", response_model=List[schemas.GigApplication])
def get_my_applications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Applications ON my gigs (or system bounties for admin)
    is_admin = current_user.id == 1
    query = db.query(models.GigApplication).join(models.Gig)
    
    if is_admin:
        return query.filter(
            ((models.Gig.poster_id == current_user.id) | (models.Gig.is_system == True)),
            models.GigApplication.status == "pending"
        ).all()
    
    return query.filter(
        models.Gig.poster_id == current_user.id,
        models.GigApplication.status == "pending"
    ).all()

@router.post("/{gig_id}/complete", response_model=schemas.Gig)
def complete_gig(
    gig_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_gig = db_query = db.query(models.Gig).filter(models.Gig.id == gig_id).first()
    
    # Permission check: Poster or Admin for system gigs
    is_admin = current_user.id == 1
    if not db_gig:
        raise HTTPException(status_code=404, detail="Gig not found")
        
    if db_gig.poster_id != current_user.id and not (db_gig.is_system and is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to complete this gig")

    if db_gig.status != "in_progress":
        raise HTTPException(status_code=400, detail="Gig is not in progress")

    # Transfer credits
    poster = db_gig.poster
    executor = db_gig.executor
    
    if db_gig.is_system:
        # System payout (no deduction from anyone)
        executor.credits += db_gig.credit_reward
        from_id = None
        reason_prefix = "System Bounty"
    else:
        # Regular peer-to-peer payout
        if not poster:
            raise HTTPException(status_code=400, detail="Poster not found for this gig")
        if poster.credits < db_gig.credit_reward:
            raise HTTPException(status_code=400, detail="Insufficient credits")
        
        poster.credits -= db_gig.credit_reward
        executor.credits += db_gig.credit_reward
        from_id = poster.id
        reason_prefix = "Gig completion"

    # Record transaction
    transaction = models.CreditTransaction(
        from_user_id=from_id,
        to_user_id=executor.id,
        amount=db_gig.credit_reward,
        reason=f"{reason_prefix}: {db_gig.title}"
    )
    db.add(transaction)
    
    # Award XP to executor
    xp_gain = 50 + (db_gig.credit_reward // 2)
    executor.xp += xp_gain
    # Simple level up logic: 1000 XP per level
    new_level = (executor.xp // 1000) + 1
    if new_level > executor.level:
        executor.level = new_level

    db_gig.status = "completed"
    db.commit()
    db.refresh(db_gig)
    return db_gig

@router.get("/my-active", response_model=List[schemas.Gig])
def get_my_active_gigs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Gigs where I am poster OR executor, and status is 'in_progress'
    # For admin, also include system bounties in progress
    is_admin = current_user.id == 1
    if is_admin:
        return db.query(models.Gig).filter(
            ((models.Gig.poster_id == current_user.id) | (models.Gig.executor_id == current_user.id) | (models.Gig.is_system == True)),
            models.Gig.status == "in_progress"
        ).all()

    return db.query(models.Gig).filter(
        ((models.Gig.poster_id == current_user.id) | (models.Gig.executor_id == current_user.id)),
        models.Gig.status == "in_progress"
    ).all()

@router.get("/credits/transactions", response_model=List[schemas.CreditTransaction])
def get_my_transactions(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # If admin, show all transactions (to track system payouts)
    if current_user.id == 1:
        return db.query(models.CreditTransaction).order_by(models.CreditTransaction.created_at.desc()).all()
        
    # Transactions where I am sender OR receiver
    return db.query(models.CreditTransaction).filter(
        (models.CreditTransaction.from_user_id == current_user.id) | 
        (models.CreditTransaction.to_user_id == current_user.id)
    ).order_by(models.CreditTransaction.created_at.desc()).all()

@router.get("/my-stats")
def get_my_gig_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    completed = db.query(models.Gig).filter(
        models.Gig.executor_id == current_user.id,
        models.Gig.status == "completed"
    ).count()
    return {"completed_count": completed}
