from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/wallet",
    tags=["wallet"]
)

@router.post("/request", response_model=schemas.CreditRequest)
def request_credits(
    request: schemas.CreditRequestCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if request.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request credits from yourself")
    
    receiver = db.query(models.User).filter(models.User.id == request.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    new_request = models.CreditRequest(
        sender_id=current_user.id,
        receiver_id=request.receiver_id,
        amount=request.amount,
        message=request.message
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/requests/incoming", response_model=List[schemas.CreditRequest])
def get_incoming_requests(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.CreditRequest).filter(
        models.CreditRequest.receiver_id == current_user.id,
        models.CreditRequest.status == "pending"
    ).all()

@router.post("/requests/{request_id}/respond")
def respond_to_request(
    request_id: int,
    approve: bool,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    credit_request = db.query(models.CreditRequest).filter(
        models.CreditRequest.id == request_id,
        models.CreditRequest.receiver_id == current_user.id
    ).first()

    if not credit_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if credit_request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    if approve:
        if current_user.credits < credit_request.amount:
            raise HTTPException(status_code=400, detail="Insufficient credits")
        
        # Perform transfer
        sender = db.query(models.User).filter(models.User.id == credit_request.sender_id).first()
        current_user.credits -= credit_request.amount
        sender.credits += credit_request.amount
        
        # Record transaction
        db.add(models.CreditTransaction(
            from_user_id=current_user.id,
            to_user_id=sender.id,
            amount=credit_request.amount,
            reason=f"Peer Request: {credit_request.message or 'No message'}"
        ))
        
        credit_request.status = "approved"
    else:
        credit_request.status = "declined"

    db.commit()
    return {"message": f"Request {'approved' if approve else 'declined'}"}
