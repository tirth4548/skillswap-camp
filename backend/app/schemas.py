from pydantic import BaseModel, EmailStr
from typing import List, Optional, Union
from datetime import datetime, date

# --- Base Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class UserCreate(UserBase):
    password: str
    signup_referral_code: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    bio: Optional[str] = None
    profile_pic: Optional[str] = None
    interests: Optional[str] = None
    hackathons: Optional[str] = None

# --- Skill Schemas ---
class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None

class Skill(SkillBase):
    id: int
    class Config:
        from_attributes = True

class UserSkillBase(BaseModel):
    skill_id: int
    type: str # 'teach' or 'learn'
    proficiency: str

class UserSkill(UserSkillBase):
    id: int
    skill: Skill
    endorsements: List['Endorsement'] = []
    class Config:
        from_attributes = True

class EndorsementBase(BaseModel):
    user_skill_id: int

class Endorsement(EndorsementBase):
    id: int
    endorser_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- User Schema (depends on UserSkill) ---
class User(UserBase):
    id: int
    credits: int
    xp: int
    level: int
    rating: float
    bio: Optional[str] = None
    interests: Optional[str] = None
    hackathons: Optional[str] = None
    referral_code: Optional[str] = None
    created_at: datetime
    skills: List[UserSkill] = []

    class Config:
        from_attributes = True

# --- Gig Schemas (depends on User) ---
class GigBase(BaseModel):
    title: str
    description: str
    credit_reward: int
    category: Optional[str] = None
    is_system: bool = False

class GigCreate(GigBase):
    pass

class GigApplicationBase(BaseModel):
    gig_id: int
    applicant_id: int
    status: str = "pending"

class GigApplicationCreate(BaseModel):
    gig_id: int

class GigApplication(GigApplicationBase):
    id: int
    created_at: datetime
    applicant: User
    gig: GigBase
    class Config:
        from_attributes = True

class Gig(GigBase):
    id: int
    poster_id: Optional[int] = None
    executor_id: Optional[int] = None
    status: str
    created_at: datetime
    poster: Optional[User] = None
    applications: List[GigApplication] = []
    class Config:
        from_attributes = True

# --- Market Response ---
class MarketResponse(BaseModel):
    teachers: List[User]
    learners: List[User]

# --- Friend Schemas ---
class FriendRequestBase(BaseModel):
    receiver_id: int

class FriendRequest(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    status: str
    created_at: datetime
    sender: User

    class Config:
        from_attributes = True

class SwipeResponse(BaseModel):
    status: str # 'liked', 'disliked', 'match'
    friend_request: Optional[FriendRequest] = None
    match_user: Optional[User] = None

# --- Mentorship Schemas ---
class MentorshipRequestCreate(BaseModel):
    mentor_id: int
    skill_id: int
    credits_offered: int = 50

class MentorshipRequest(BaseModel):
    id: int
    mentor_id: int
    learner_id: int
    skill_id: int
    credits_offered: int
    status: str
    created_at: datetime
    mentor: User
    learner: User
    skill: Skill

    class Config:
        from_attributes = True

# --- Workspace & Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    status: str = "todo"
    due_date: Optional[date] = None

class TaskCreate(TaskBase):
    workspace_id: int

class Task(TaskBase):
    id: int
    workspace_id: int
    created_at: datetime
    assignee: Optional[User] = None
    class Config:
        from_attributes = True

class WorkspaceBase(BaseModel):
    title: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: int
    creator_id: int
    created_at: datetime
    members: List[User] = []
    tasks: List[Task] = []
    resources: List['Resource'] = []
    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    title: str
    url: str
    type: str # 'link', 'file', 'video'

class ResourceCreate(ResourceBase):
    pass

class Resource(ResourceBase):
    id: int
    workspace_id: int
    shared_by_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Startup Schemas ---
class StartupBase(BaseModel):
    title: str
    problem_statement: Optional[str] = None
    vision: Optional[str] = None
    status: str = "pitching"
    max_members: int = 5

class StartupCreate(StartupBase):
    required_skill_ids: List[int] = []

class Startup(StartupBase):
    id: int
    creator_id: int
    created_at: datetime
    creator: User
    members: List[User] = []
    required_skills: List[Skill] = []

    class Config:
        from_attributes = True

class StartupRequestBase(BaseModel):
    startup_id: int
    user_id: int
    status: str = "pending"
    request_type: str = "join" # 'join' or 'invite'

class StartupRequest(StartupRequestBase):
    id: int
    created_at: datetime
    user: User
    startup: StartupBase

    class Config:
        from_attributes = True

class SynergyMatch(BaseModel):
    startup: Startup
    synergy_score: int
    matched_skills: List[str]

# --- Other Schemas ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_time: datetime
    type: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    organizer_id: int
    created_at: datetime
    participants: List[User] = []
    class Config:
        from_attributes = True

class UserSummary(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    class Config:
        from_attributes = True

class CreditTransaction(BaseModel):
    from_user_id: Optional[int] = None
    to_user_id: Optional[int] = None
    amount: int
    reason: str
    created_at: datetime
    from_user: Optional[UserSummary] = None
    to_user: Optional[UserSummary] = None
    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str
    receiver_id: Optional[int] = None
    workspace_id: Optional[int] = None

class Message(MessageBase):
    id: int
    sender_id: int
    sender: User
    timestamp: datetime
    class Config:
        from_attributes = True

class CreditRequestBase(BaseModel):
    receiver_id: int
    amount: int
    message: Optional[str] = None

class CreditRequestCreate(CreditRequestBase):
    pass

class CreditRequest(CreditRequestBase):
    id: int
    sender_id: int
    status: str
    created_at: datetime
    sender: User
    class Config:
        from_attributes = True
