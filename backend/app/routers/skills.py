from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(prefix="/skills", tags=["skills"])

@router.get("/", response_model=List[schemas.Skill])
def read_skills(db: Session = Depends(database.get_db)):
    return db.query(models.Skill).all()

@router.post("/my", response_model=schemas.UserSkill)
def add_my_skill(
    skill_data: schemas.UserSkillBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if user already has this skill
    existing = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == current_user.id,
        models.UserSkill.skill_id == skill_data.skill_id,
        models.UserSkill.type == skill_data.type
    ).first()
    
    if existing:
        existing.proficiency = skill_data.proficiency
        db.commit()
        db.refresh(existing)
        return existing

    new_user_skill = models.UserSkill(
        user_id=current_user.id,
        skill_id=skill_data.skill_id,
        type=skill_data.type,
        proficiency=skill_data.proficiency
    )
    db.add(new_user_skill)
    db.commit()
    db.refresh(new_user_skill)
    return new_user_skill

@router.get("/match", response_model=List[schemas.User])
def get_matches(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Logic: Find users who 'teach' what I want to 'learn'
    my_learning_skills = db.query(models.UserSkill).filter(
        models.UserSkill.user_id == current_user.id,
        models.UserSkill.type == 'learn'
    ).all()
    
    skill_ids = [s.skill_id for s in my_learning_skills]
    
    if not skill_ids:
        return []

    # Find mentors
    mentors = db.query(models.User).join(models.UserSkill).filter(
        models.UserSkill.skill_id.in_(skill_ids),
        models.UserSkill.type == 'teach',
        models.User.id != current_user.id
    ).order_by(models.User.rating.desc()).limit(10).all()

    return mentors

@router.get("/market", response_model=schemas.MarketResponse)
def get_market(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Get all users who have 'teach' skills
    teachers = db.query(models.User).join(models.UserSkill).filter(
        models.UserSkill.type == 'teach',
        models.User.id != current_user.id
    ).distinct().all()

    # Get all users who have 'learn' skills
    learners = db.query(models.User).join(models.UserSkill).filter(
        models.UserSkill.type == 'learn',
        models.User.id != current_user.id
    ).distinct().all()

    return {
        "teachers": teachers,
        "learners": learners
    }

@router.post("/mentorship/request", response_model=schemas.MentorshipRequest)
def request_mentorship(
    req: schemas.MentorshipRequestCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if req.mentor_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request mentorship from yourself")
    
    # Check learner's credits
    if current_user.credits < req.credits_offered:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    db_req = models.MentorshipRequest(
        mentor_id=req.mentor_id,
        learner_id=current_user.id,
        skill_id=req.skill_id,
        credits_offered=req.credits_offered
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@router.post("/mentorship/{request_id}/accept", response_model=schemas.MentorshipRequest)
def accept_mentorship(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_req = db.query(models.MentorshipRequest).filter(
        models.MentorshipRequest.id == request_id,
        models.MentorshipRequest.mentor_id == current_user.id,
        models.MentorshipRequest.status == "pending"
    ).first()
    
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")

    learner = db_req.learner
    if learner.credits < db_req.credits_offered:
        db_req.status = "declined"
        db.commit()
        raise HTTPException(status_code=400, detail="Learner no longer has enough credits")

    # Transaction: Learner -> Mentor
    learner.credits -= db_req.credits_offered
    current_user.credits += db_req.credits_offered
    
    # Award XP to mentor
    xp_gain = 100 + (db_req.credits_offered // 2)
    current_user.xp += xp_gain
    new_level = (current_user.xp // 1000) + 1
    if new_level > current_user.level:
        current_user.level = new_level

    db_req.status = "accepted"
    
    # Record transaction
    transaction = models.CreditTransaction(
        from_user_id=learner.id,
        to_user_id=current_user.id,
        amount=db_req.credits_offered,
        reason=f"Mentorship for Skill ID {db_req.skill_id}"
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(db_req)
    return db_req

@router.get("/mentorship/pending", response_model=List[schemas.MentorshipRequest])
def get_pending_mentorships(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Requests sent TO me or FROM me
    return db.query(models.MentorshipRequest).filter(
        ((models.MentorshipRequest.mentor_id == current_user.id) | (models.MentorshipRequest.learner_id == current_user.id)),
        models.MentorshipRequest.status == "pending"
    ).all()

@router.post("/endorse", response_model=schemas.Endorsement)
def endorse_skill(
    endorsement: schemas.EndorsementBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if user skill exists
    user_skill = db.query(models.UserSkill).filter(models.UserSkill.id == endorsement.user_skill_id).first()
    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not found for this user")
    
    if user_skill.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot endorse your own skill")

    # Check for duplicate endorsement
    existing = db.query(models.Endorsement).filter(
        models.Endorsement.endorser_id == current_user.id,
        models.Endorsement.user_skill_id == endorsement.user_skill_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already endorsed this skill")

    db_endorsement = models.Endorsement(
        endorser_id=current_user.id,
        user_skill_id=endorsement.user_skill_id
    )
    db.add(db_endorsement)
    db.commit()
    db.refresh(db_endorsement)
    return db_endorsement
