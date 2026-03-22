from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

@router.post("/", response_model=schemas.Workspace)
def create_workspace(
    workspace: schemas.WorkspaceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_workspace = models.Workspace(
        title=workspace.title,
        description=workspace.description,
        creator_id=current_user.id
    )
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    
    # Add creator as admin member
    # Note: In a real app, you'd add this to the workspace_members table
    # Base.metadata doesn't expose the Table object easily here for direct inserts without models,
    # but we defined the relationship in the model.
    db_workspace.members.append(current_user)
    db.commit()
    
    return db_workspace

@router.get("/", response_model=List[schemas.Workspace])
def list_my_workspaces(current_user: models.User = Depends(auth.get_current_user)):
    return current_user.workspaces

@router.get("/{workspace_id}", response_model=schemas.Workspace)
def get_workspace_detail(
    workspace_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    # Check if user is member
    if current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    return workspace

@router.get("/{workspace_id}/tasks", response_model=List[schemas.Task])
def get_workspace_tasks(
    workspace_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if user is member
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace or current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    return workspace.tasks

@router.post("/{workspace_id}/tasks", response_model=schemas.Task)
def create_task(
    workspace_id: int,
    task: schemas.TaskCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if user is member
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace or current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    task_data = task.dict()
    task_data.pop("workspace_id", None)
    
    db_task = models.Task(
        **task_data,
        workspace_id=workspace_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.post("/{workspace_id}/members")
def add_member(
    workspace_id: int,
    username: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if workspace.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can invite members")
    
    user_to_add = db.query(models.User).filter(models.User.username == username).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_add in workspace.members:
        raise HTTPException(status_code=400, detail="User already in workspace")
    
    workspace.members.append(user_to_add)
    db.commit()
    return {"message": f"User {username} added to workspace"}

@router.get("/{workspace_id}/messages", response_model=List[schemas.Message])
def get_workspace_messages(
    workspace_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace or current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    return db.query(models.Message).filter(models.Message.workspace_id == workspace_id).order_by(models.Message.timestamp.asc()).all()

@router.post("/{workspace_id}/messages", response_model=schemas.Message)
def send_workspace_message(
    workspace_id: int,
    message: schemas.MessageBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace or current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    db_message = models.Message(
        content=message.content,
        sender_id=current_user.id,
        workspace_id=workspace_id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.put("/tasks/{task_id}/status")
def update_task_status_api(
    task_id: int,
    status: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check membership
    if current_user not in task.workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    if status not in ["todo", "doing", "done"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    task.status = status
    db.commit()
    return {"message": "Status updated"}

@router.post("/{workspace_id}/resources", response_model=schemas.Resource)
def add_resource(
    workspace_id: int,
    resource: schemas.ResourceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace or current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")

    db_resource = models.Resource(
        workspace_id=workspace_id,
        title=resource.title,
        url=resource.url,
        type=resource.type,
        shared_by_id=current_user.id
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.get("/{workspace_id}/resources", response_model=List[schemas.Resource])
def get_resources(
    workspace_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not workspace or current_user not in workspace.members:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
        
    return db.query(models.Resource).filter(models.Resource.workspace_id == workspace_id).all()
