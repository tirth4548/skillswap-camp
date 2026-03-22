from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(prefix="/friends", tags=["friends"])

@router.post("/request", response_model=schemas.FriendRequest)
def send_friend_request(
    request: schemas.FriendRequestBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if request.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    
    # Check if already friends or request exists
    existing = db.query(models.FriendRequest).filter(
        ((models.FriendRequest.sender_id == current_user.id) & (models.FriendRequest.receiver_id == request.receiver_id)) |
        ((models.FriendRequest.sender_id == request.receiver_id) & (models.FriendRequest.receiver_id == current_user.id))
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Friendship or request already exists")

    db_request = models.FriendRequest(sender_id=current_user.id, receiver_id=request.receiver_id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@router.post("/accept/{request_id}", response_model=schemas.User)
def accept_friend_request(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_request = db.query(models.FriendRequest).filter(
        models.FriendRequest.id == request_id,
        models.FriendRequest.receiver_id == current_user.id,
        models.FriendRequest.status == "pending"
    ).first()
    
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")

    db_request.status = "accepted"
    db.commit()
    # In a real many-to-many we would add to a friends table, 
    # but for simplicity we'll just use the accepted requests as the friend list.
    return db_request.sender

@router.get("/", response_model=List[schemas.User])
def list_friends(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Get all accepted requests where user is sender or receiver
    requests = db.query(models.FriendRequest).filter(
        (models.FriendRequest.status == "accepted") &
        ((models.FriendRequest.sender_id == current_user.id) | (models.FriendRequest.receiver_id == current_user.id))
    ).all()
    
    friends = []
    for r in requests:
        if r.sender_id == current_user.id:
            friends.append(r.receiver)
        else:
            friends.append(r.sender)
    return friends

@router.get("/pending", response_model=List[schemas.FriendRequest])
def get_pending_requests(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.FriendRequest).filter(
        models.FriendRequest.receiver_id == current_user.id,
        models.FriendRequest.status == "pending"
    ).all()
