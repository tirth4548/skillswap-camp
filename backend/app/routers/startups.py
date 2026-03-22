from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/startups",
    tags=["startups"]
)

@router.post("/", response_model=schemas.Startup)
def create_startup(
    startup: schemas.StartupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_startup = models.Startup(
        title=startup.title,
        problem_statement=startup.problem_statement,
        vision=startup.vision,
        creator_id=current_user.id,
        max_members=startup.max_members
    )
    db.add(db_startup)
    
    # Add required skills
    if startup.required_skill_ids:
        skills = db.query(models.Skill).filter(models.Skill.id.in_(startup.required_skill_ids)).all()
        db_startup.required_skills = skills
        
    db.commit()
    db.refresh(db_startup)
    return db_startup

@router.get("/", response_model=List[schemas.Startup])
def get_startups(db: Session = Depends(get_db)):
    return db.query(models.Startup).all()

@router.get("/{startup_id}", response_model=schemas.Startup)
def get_startup(startup_id: int, db: Session = Depends(get_db)):
    db_startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
    if not db_startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    return db_startup

@router.post("/{startup_id}/join", response_model=schemas.StartupRequest)
def join_startup(
    startup_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
    if not db_startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if current_user in db_startup.members or current_user.id == db_startup.creator_id:
        raise HTTPException(status_code=400, detail="Already in squad")

    # Check for existing pending request
    existing_req = db.query(models.StartupRequest).filter(
        models.StartupRequest.startup_id == startup_id,
        models.StartupRequest.user_id == current_user.id,
        models.StartupRequest.status == "pending"
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="Join request already pending")
    
    # Check if squad is full
    if len(db_startup.members) + 1 >= db_startup.max_members:
        raise HTTPException(status_code=400, detail="Squad is full")
    
    db_req = models.StartupRequest(
        startup_id=startup_id,
        user_id=current_user.id,
        status="pending"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@router.get("/my/requests", response_model=List[schemas.StartupRequest])
def get_my_startup_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get join requests (user -> startup) for startups I created"""
    return db.query(models.StartupRequest).join(models.Startup).filter(
        models.Startup.creator_id == current_user.id,
        models.StartupRequest.status == "pending",
        models.StartupRequest.request_type == "join"
    ).all()

@router.get("/my/invitations", response_model=List[schemas.StartupRequest])
def get_my_invitations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get invitations (startup -> user) I received"""
    return db.query(models.StartupRequest).filter(
        models.StartupRequest.user_id == current_user.id,
        models.StartupRequest.status == "pending",
        models.StartupRequest.request_type == "invite"
    ).all()

@router.post("/{startup_id}/invite/{user_id}", response_model=schemas.StartupRequest)
def invite_to_startup(
    startup_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Invite a user to a startup (Startup Creator only)"""
    db_startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
    if not db_startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if db_startup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the pitch owner can invite people")

    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user in db_startup.members or target_user.id == db_startup.creator_id:
        raise HTTPException(status_code=400, detail="User is already in the squad")

    # Check for existing pending request/invite
    existing = db.query(models.StartupRequest).filter(
        models.StartupRequest.startup_id == startup_id,
        models.StartupRequest.user_id == user_id,
        models.StartupRequest.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A pending request or invitation already exists")

    db_req = models.StartupRequest(
        startup_id=startup_id,
        user_id=user_id,
        status="pending",
        request_type="invite"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@router.post("/invitations/{request_id}/accept", response_model=schemas.Startup)
def accept_invitation(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Accept an invitation to join a squad"""
    db_req = db.query(models.StartupRequest).filter(models.StartupRequest.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if db_req.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this invitation")
        
    if db_req.status != "pending" or db_req.request_type != "invite":
        raise HTTPException(status_code=400, detail="Invalid invitation")

    # Check if space still exists
    if len(db_req.startup.members) + 1 >= db_req.startup.max_members:
        db_req.status = "rejected"
        db.commit()
        raise HTTPException(status_code=400, detail="Squad is now full")

    db_req.status = "approved"
    db_req.startup.members.append(current_user)
    db.commit()
    db.refresh(db_req.startup)
    return db_req.startup

@router.post("/invitations/{request_id}/reject", response_model=schemas.StartupRequest)
def reject_invitation(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Reject an invitation to join a squad"""
    db_req = db.query(models.StartupRequest).filter(models.StartupRequest.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if db_req.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_req.status = "rejected"
    db.commit()
    db.refresh(db_req)
    return db_req

@router.post("/requests/{request_id}/approve", response_model=schemas.Startup)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Approve a join request (Creator only)"""
    db_req = db.query(models.StartupRequest).filter(models.StartupRequest.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if db_req.startup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if db_req.status != "pending" or db_req.request_type != "join":
        raise HTTPException(status_code=400, detail="Invalid request")

    if len(db_req.startup.members) + 1 >= db_req.startup.max_members:
        db_req.status = "rejected"
        db.commit()
        raise HTTPException(status_code=400, detail="Squad is full")

    db_req.status = "approved"
    db_req.startup.members.append(db_req.user)
    db.commit()
    db.refresh(db_req.startup)
    return db_req.startup

@router.post("/requests/{request_id}/reject", response_model=schemas.StartupRequest)
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Reject a join request (Creator only)"""
    db_req = db.query(models.StartupRequest).filter(models.StartupRequest.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if db_req.startup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_req.status = "rejected"
    db.commit()
    db.refresh(db_req)
    return db_req

@router.get("/synergy/match", response_model=List[schemas.SynergyMatch])
def get_synergy_matches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Find startups that need skills the current user has.
    """
    # Pre-select user skills to avoid N+1
    user_skill_ids = [us.skill_id for us in current_user.skills if us.type == 'teach']
    
    # Deep-eager load to handle the full serialization tree in one query
    startups = db.query(models.Startup).options(
        selectinload(models.Startup.creator),
        selectinload(models.Startup.members),
        selectinload(models.Startup.required_skills)
    ).all()
    
    matches = []
    
    for startup in startups:
        # Avoid matching with startups user already belongs to
        if current_user.id == startup.creator_id or current_user in startup.members:
            continue
            
        required_skills = startup.required_skills
        required_skill_ids = [s.id for s in required_skills]
        
        # Calculate overlap
        overlap_ids = set(user_skill_ids).intersection(set(required_skill_ids))
        
        # Only show matches if they have at least one overlapping skill
        # OR if it's a "vague" startup with no requirements (default synergy 50)
        if overlap_ids or not required_skill_ids:
            score = (len(overlap_ids) / len(required_skill_ids) * 100) if required_skill_ids else 50
            
            matched_names = [s.name for s in required_skills if s.id in overlap_ids]
            
            matches.append({
                "startup": startup,
                "synergy_score": round(score),
                "matched_skills": matched_names
            })
            
    # Sort by score descending
    matches.sort(key=lambda x: x["synergy_score"], reverse=True)
    return matches

@router.get("/{startup_id}/similar-minds", response_model=List[schemas.User])
def get_similar_minds(
    startup_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Find users who have the skills required by this startup.
    """
    db_startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
    if not db_startup:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    required_skill_ids = [s.id for s in db_startup.required_skills]
    if not required_skill_ids:
        return []
        
    # Find users who have at least one of these skills (type='teach')
    # Exclude the creator and existing members
    member_ids = [m.id for m in db_startup.members] + [db_startup.creator_id]
    
    similar_minds = db.query(models.User).join(models.UserSkill).filter(
        models.UserSkill.skill_id.in_(required_skill_ids),
        models.UserSkill.type == 'teach',
        ~models.User.id.in_(member_ids)
    ).distinct().all()
    
    return similar_minds
