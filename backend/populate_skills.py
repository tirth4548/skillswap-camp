from app.database import SessionLocal
from app import models
import random

def assign_skills_to_all():
    db = SessionLocal()
    
    users = db.query(models.User).all()
    skills = db.query(models.Skill).all()
    
    if not skills:
        print("No skills found in database. Please run seed.py first.")
        return

    print(f"Found {len(users)} users and {len(skills)} skills.")

    for user in users:
        # Get current skill IDs for this user to avoid duplicates
        existing_skill_ids = [us.skill_id for us in user.skills]
        
        # Pick 3-5 random skills
        num_to_add = random.randint(3, 5)
        available_skills = [s for s in skills if s.id not in existing_skill_ids]
        
        skills_to_assign = random.sample(available_skills, min(num_to_add, len(available_skills)))
        
        for skill in skills_to_assign:
            # Randomly decide if they teach or learn
            skill_type = random.choice(['teach', 'learn'])
            proficiency = random.choice(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
            
            new_user_skill = models.UserSkill(
                user_id=user.id,
                skill_id=skill.id,
                type=skill_type,
                proficiency=proficiency
            )
            db.add(new_user_skill)
            
            # If it's a 'teach' skill, let's also give it some random endorsements (0-7)
            # to test the Legendary Badge system
            if skill_type == 'teach':
                num_endorsements = random.randint(0, 7)
                db.flush() # Get the user_skill ID
                
                # Pick random other users as endorsers
                other_users = [u for u in users if u.id != user.id]
                if other_users:
                    endorsers = random.sample(other_users, min(num_endorsements, len(other_users)))
                    for endorser in endorsers:
                        db.add(models.Endorsement(
                            endorser_id=endorser.id,
                            user_skill_id=new_user_skill.id
                        ))

        print(f"Assigned {len(skills_to_assign)} skills to {user.username}")

    db.commit()
    db.close()
    print("Successfully assigned multiple skills and endorsements to all users!")

if __name__ == "__main__":
    assign_skills_to_all()
