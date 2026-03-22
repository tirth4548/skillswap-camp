from app.database import SessionLocal
from app import models
import datetime

def update_events():
    db = SessionLocal()
    events = db.query(models.Event).all()
    
    # Let's say "next week" starts 7 days from now.
    # We will distribute them over the next week (7-14 days from now).
    base_date = datetime.datetime.now() + datetime.timedelta(days=7)
    
    for i, event in enumerate(events):
        # Shift each event by some days to spread them out
        new_time = base_date + datetime.timedelta(days=(i % 7))
        event.event_time = new_time
        print(f"Updated event '{event.title}' to {new_time}")
    
    db.commit()
    db.close()
    print("All events updated to next week!")

if __name__ == "__main__":
    update_events()
