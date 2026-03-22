from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, Table, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Many-to-Many relationship table for Workspace Members
workspace_members = Table(
    'workspace_members',
    Base.metadata,
    Column('workspace_id', Integer, ForeignKey('workspaces.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role', String, default='member')
)

# Many-to-Many relationship table for Event Participants
event_participants = Table(
    'event_participants',
    Base.metadata,
    Column('event_id', Integer, ForeignKey('events.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role', String, default='attendee')
)

# Many-to-Many relationship table for Startup Members
startup_members = Table(
    'startup_members',
    Base.metadata,
    Column('startup_id', Integer, ForeignKey('startups.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role', String, default='member')
)

# Many-to-Many relationship table for Startup Required Skills
startup_skills = Table(
    'startup_skills',
    Base.metadata,
    Column('startup_id', Integer, ForeignKey('startups.id'), primary_key=True),
    Column('skill_id', Integer, ForeignKey('skills.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    full_name = Column(String)
    department = Column(String)
    year = Column(Integer)
    bio = Column(Text)
    profile_pic = Column(Text)
    credits = Column(Integer, default=100)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    rating = Column(Float, default=5.0)
    interests = Column(Text) # Comma-separated or JSON
    hackathons = Column(Text) # Comma-separated or JSON
    referral_code = Column(String, unique=True, index=True)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    skills = relationship("UserSkill", back_populates="user")
    workspaces = relationship("Workspace", secondary=workspace_members, back_populates="members")
    owned_workspaces = relationship("Workspace", back_populates="creator")
    gigs_posted = relationship("Gig", foreign_keys="[Gig.poster_id]", back_populates="poster")
    gigs_accepted = relationship("Gig", foreign_keys="[Gig.executor_id]", back_populates="executor")
    events_organized = relationship("Event", back_populates="organizer")
    events_joined = relationship("Event", secondary=event_participants, back_populates="participants")

    # Startups
    owned_startups = relationship("Startup", back_populates="creator")
    joined_startups = relationship("Startup", secondary=startup_members, back_populates="members")

    # Friendships (Many-to-Many self-referential)
    sent_friend_requests = relationship("FriendRequest", foreign_keys="[FriendRequest.sender_id]", back_populates="sender")
    received_friend_requests = relationship("FriendRequest", foreign_keys="[FriendRequest.receiver_id]", back_populates="receiver")

class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending") # 'pending', 'accepted', 'declined'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_friend_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_friend_requests")

class MentorshipRequest(Base):
    __tablename__ = "mentorship_requests"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"))
    learner_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    credits_offered = Column(Integer, default=50)
    status = Column(String, default="pending") # 'pending', 'accepted', 'completed', 'declined'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    mentor = relationship("User", foreign_keys=[mentor_id])
    learner = relationship("User", foreign_keys=[learner_id])
    skill = relationship("Skill")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String)

class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    type = Column(String)  # 'teach' or 'learn'
    proficiency = Column(String)

    user = relationship("User", back_populates="skills")
    skill = relationship("Skill")
    endorsements = relationship("Endorsement", back_populates="user_skill")

class Endorsement(Base):
    __tablename__ = "endorsements"

    id = Column(Integer, primary_key=True, index=True)
    endorser_id = Column(Integer, ForeignKey("users.id"))
    user_skill_id = Column(Integer, ForeignKey("user_skills.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    endorser = relationship("User")
    user_skill = relationship("UserSkill", back_populates="endorsements")

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="owned_workspaces")
    members = relationship("User", secondary=workspace_members, back_populates="workspaces")
    tasks = relationship("Task", back_populates="workspace")
    resources = relationship("Resource", back_populates="workspace")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    title = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    type = Column(String) # 'link', 'file', 'video'
    shared_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workspace = relationship("Workspace", back_populates="resources")
    shared_by = relationship("User")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="todo") # 'todo', 'doing', 'done'
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workspace = relationship("Workspace", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])

class Gig(Base):
    __tablename__ = "gigs"

    id = Column(Integer, primary_key=True, index=True)
    poster_id = Column(Integer, ForeignKey("users.id"))
    executor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    credit_reward = Column(Integer, nullable=False)
    category = Column(String)
    status = Column(String, default="open") # 'open', 'in_progress', 'completed'
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    poster = relationship("User", foreign_keys=[poster_id], back_populates="gigs_posted")
    executor = relationship("User", foreign_keys=[executor_id], back_populates="gigs_accepted")
    applications = relationship("GigApplication", back_populates="gig")

class GigApplication(Base):
    __tablename__ = "gig_applications"

    id = Column(Integer, primary_key=True, index=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"))
    applicant_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending") # 'pending', 'approved', 'declined'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    gig = relationship("Gig", back_populates="applications")
    applicant = relationship("User")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    location = Column(String)
    event_time = Column(DateTime)
    organizer_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String) # 'fest', 'workshop', etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organizer = relationship("User", back_populates="events_organized")
    participants = relationship("User", secondary=event_participants, back_populates="events_joined")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"))
    to_user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Integer, nullable=False)
    reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])

class CreditRequest(Base):
    __tablename__ = "credit_requests"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Integer, nullable=False)
    message = Column(String)
    status = Column(String, default="pending") # pending, approved, declined
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class Startup(Base):
    __tablename__ = "startups"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    problem_statement = Column(Text)
    vision = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pitching") # 'pitching', 'developed', 'launched'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="owned_startups")
    members = relationship("User", secondary=startup_members, back_populates="joined_startups")
    required_skills = relationship("Skill", secondary=startup_skills)
    max_members = Column(Integer, default=5)
    requests = relationship("StartupRequest", back_populates="startup")

class StartupRequest(Base):
    __tablename__ = "startup_requests"

    id = Column(Integer, primary_key=True, index=True)
    startup_id = Column(Integer, ForeignKey("startups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending") # pending, approved, rejected
    request_type = Column(String, default="join") # 'join' (user -> startup) or 'invite' (startup -> user)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    startup = relationship("Startup", back_populates="requests")
    user = relationship("User")
