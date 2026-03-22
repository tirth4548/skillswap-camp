from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, database, auth
from .database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkillSwap Campus API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    import uuid
    # Generate a unique referral code for the new user
    user_referral_code = str(uuid.uuid4())[:8].upper()

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        department=user.department,
        year=user.year,
        referral_code=user_referral_code,
        credits=100 # Default starting credits
    )

    # Check for referral bonus
    if user.signup_referral_code:
        referrer = db.query(models.User).filter(models.User.referral_code == user.signup_referral_code).first()
        if referrer:
            new_user.referred_by_id = referrer.id
            new_user.credits += 20 # Bonus for new user
            referrer.credits += 20 # Bonus for referrer
            
            # Record transactions
            db.add(models.CreditTransaction(from_user_id=None, to_user_id=new_user.id, amount=20, reason="Referral Bonus (New User)"))
            db.add(models.CreditTransaction(from_user_id=None, to_user_id=referrer.id, amount=20, reason=f"Referral Bonus (Invite: {new_user.username})"))

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.patch("/auth/me", response_model=schemas.User)
def update_user_profile(
    profile_data: schemas.UserProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

from .routers import skills, workspaces, gigs, events, friends, social, wallet, startups

app.include_router(skills.router)
app.include_router(workspaces.router)
app.include_router(gigs.router)
app.include_router(events.router)
app.include_router(friends.router)
app.include_router(social.router)
app.include_router(wallet.router)
app.include_router(startups.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SkillSwap Campus API"}
