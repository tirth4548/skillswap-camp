from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth
from sqlalchemy import func

router = APIRouter(prefix="/social", tags=["social"])

@router.get("/matches", response_model=List[schemas.User])
def get_social_matches(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get matching users based on:
    - Common Skills
    - Common Interests (parsed from text)
    - Active Projects (owned workspaces)
    - Common Hackathons
    """
    # Filter out users I've already engaged with
    # 1. Requests I sent (pending or accepted)
    sent_ids = db.query(models.FriendRequest.receiver_id).filter(
        models.FriendRequest.sender_id == current_user.id
    ).all()
    sent_ids = {r[0] for r in sent_ids}

    # 2. Requests received that are accepted (already friends)
    received_accepted_ids = db.query(models.FriendRequest.sender_id).filter(
        models.FriendRequest.receiver_id == current_user.id,
        models.FriendRequest.status == "accepted"
    ).all()
    received_accepted_ids = {r[0] for r in received_accepted_ids}
    
    exclude_ids = sent_ids.union(received_accepted_ids)
    exclude_ids.add(current_user.id)

    all_users = db.query(models.User).filter(models.User.id.notin_(exclude_ids)).all()
    
    my_skills = {s.skill.name.lower() for s in current_user.skills}
    my_interests = {i.strip().lower() for i in (current_user.interests or "").split(",") if i.strip()}
    my_hacks = {h.strip().lower() for h in (current_user.hackathons or "").split(",") if h.strip()}
    
    scored_users = []
    for user in all_users:
        score = 0
        
        # 1. Common Skills (10 pts each)
        u_skills = {s.skill.name.lower() for s in user.skills}
        common_skills = my_skills.intersection(u_skills)
        score += len(common_skills) * 10
        
        # 2. Common Interests (15 pts each)
        u_interests = {i.strip().lower() for i in (user.interests or "").split(",") if i.strip()}
        common_interests = my_interests.intersection(u_interests)
        score += len(common_interests) * 15
        
        # 3. Common Hackathons (20 pts each)
        u_hacks = {h.strip().lower() for h in (user.hackathons or "").split(",") if h.strip()}
        common_hacks = my_hacks.intersection(u_hacks)
        score += len(common_hacks) * 20
        
        # 4. Project Momentum (5 pts per owned workspace)
        score += len(user.owned_workspaces) * 5
        
        user.match_score = score # Transient field
        scored_users.append(user)
        
    # Sort by score desc
    scored_users.sort(key=lambda x: x.match_score, reverse=True)
    
    return scored_users[:20] # Return top 20 matches

@router.post("/swipe", response_model=schemas.SwipeResponse)
def swipe_user(
    receiver_id: int,
    action: str, # 'like' or 'dislike'
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    print(f"SWIPE: User {current_user.id} swiping on {receiver_id} with action {action}")
    if action == 'dislike':
        return {"status": "disliked"}

    # 1. Check if receiver has already liked sender
    reverse_request = db.query(models.FriendRequest).filter(
        models.FriendRequest.sender_id == receiver_id,
        models.FriendRequest.receiver_id == current_user.id,
        models.FriendRequest.status == "pending"
    ).first()
    
    print(f"SWIPE: Reverse request found? {reverse_request}")

    if reverse_request:
        reverse_request.status = "accepted"
        # Create mutual request (optional, but good for record)
        existing = db.query(models.FriendRequest).filter(
            models.FriendRequest.sender_id == current_user.id,
            models.FriendRequest.receiver_id == receiver_id
        ).first()
        
        if existing:
            existing.status = "accepted"
        else:
            new_req = models.FriendRequest(
                sender_id=current_user.id,
                receiver_id=receiver_id,
                status="accepted"
            )
            db.add(new_req)
        
        db.commit()
        match_user = db.query(models.User).filter(models.User.id == receiver_id).first()
        return {"status": "match", "match_user": match_user}

    # 2. Normal Like (Check if exists)
    existing = db.query(models.FriendRequest).filter(
        models.FriendRequest.sender_id == current_user.id,
        models.FriendRequest.receiver_id == receiver_id
    ).first()
    
    if existing:
        return {"status": "liked", "friend_request": existing}
        
    new_req = models.FriendRequest(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return {"status": "liked", "friend_request": new_req}

@router.get("/leaderboard", response_model=List[schemas.User])
def get_leaderboard(db: Session = Depends(database.get_db)):
    """Returns top 10 users by XP"""
    return db.query(models.User).order_by(models.User.xp.desc()).limit(10).all()

@router.post("/match-chat/{partner_id}", response_model=schemas.Workspace)
def initiate_match_chat(
    partner_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Creates a private workspace/chat between matched users"""
    receiver = db.query(models.User).filter(models.User.id == partner_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check for accepted friend request (mutual match)
    match_exists = db.query(models.FriendRequest).filter(
        (models.FriendRequest.status == "accepted") &
        (
            ((models.FriendRequest.sender_id == current_user.id) & (models.FriendRequest.receiver_id == partner_id)) |
            ((models.FriendRequest.sender_id == partner_id) & (models.FriendRequest.receiver_id == current_user.id))
        )
    ).first()
    
    if not match_exists:
        raise HTTPException(status_code=400, detail="No mutual match found with this user")

    # Create private workspace
    new_workspace = models.Workspace(
        title=f"Chat: {current_user.username} & {receiver.username}",
        description=f"Direct Match Chat between {current_user.username} and {receiver.username}",
        creator_id=current_user.id
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    # Add both users
    new_workspace.members.append(current_user)
    new_workspace.members.append(receiver)
    db.commit()
    
    return new_workspace
