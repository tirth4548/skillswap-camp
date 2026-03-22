from app.database import SessionLocal, engine
from app import models, auth
import datetime

def seed():
    db = SessionLocal()
    models.Base.metadata.create_all(bind=engine)

    skills = [
        {"name": "Python Programming", "category": "Tech"},
        {"name": "UI/UX Design", "category": "Design"},
        {"name": "Public Speaking", "category": "Soft Skills"},
        {"name": "React.js", "category": "Tech"},
        {"name": "Data Analysis", "category": "Math"},
        {"name": "Graphic Design", "category": "Design"},
        {"name": "Digital Marketing", "category": "Business"},
        {"name": "Video Editing", "category": "Media"},
    ]

    for s in skills:
        if not db.query(models.Skill).filter(models.Skill.name == s["name"]).first():
            db.add(models.Skill(**s))

    if not db.query(models.User).filter(models.User.username == "admin").first():
        admin = models.User(
            username="admin",
            email="admin@college.edu",
            hashed_password=auth.get_password_hash("admin123"),
            full_name="Campus Admin",
            department="CSE",
            year=4,
            credits=500
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        events = [
            {
                "title": "Annual Tech Fest 2026",
                "description": "The biggest coding festival on campus with over 10 workshops.",
                "location": "Main Auditorium",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=14),
                "organizer_id": admin.id,
                "type": "fest"
            },
            {
                "title": "Hackathon: Code for Change",
                "description": "24-hour hackathon to solve local community problems.",
                "location": "Innovation Lab",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=9),
                "organizer_id": admin.id,
                "type": "hackathon"
            },
            {
                "title": "Study Abroad Seminar",
                "description": "Learn about exchange programs in Europe and North America.",
                "location": "Seminar Hall B",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=7),
                "organizer_id": admin.id,
                "type": "abroad"
            },
            {
                "title": "Robotics Workshop",
                "description": "Hands-on building of your first autonomous rover.",
                "location": "Mechanical Workshop",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=11),
                "organizer_id": admin.id,
                "type": "workshop"
            },
            {
                "title": "Cultural Night 2026",
                "description": "Express yourself through music, dance, and drama.",
                "location": "Open Air Theater",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=15),
                "organizer_id": admin.id,
                "type": "fest"
            },
            {
                "title": "Entrepreneurship Summit",
                "description": "Meet successful alumni who started their own ventures.",
                "location": "MBA Block",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=13),
                "organizer_id": admin.id,
                "type": "summit"
            },
            {
                "title": "Foreign Language Meetup",
                "description": "Practice French, Spanish, or German with native speakers.",
                "location": "Library Cafe",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=8),
                "organizer_id": admin.id,
                "type": "abroad"
            },
            {
                "title": "Data Science Boot Camp",
                "description": "Intensive weekend course on Machine Learning and AI.",
                "location": "Computer Lab 4",
                "event_time": datetime.datetime.now() + datetime.timedelta(days=12),
                "organizer_id": admin.id,
                "type": "workshop"
            }
        ]
        for e in events:
            if not db.query(models.Event).filter(models.Event.title == e["title"]).first():
                db.add(models.Event(**e))

    db.commit()
    db.close()
    print("Seeded!")

if __name__ == "__main__":
    seed()
