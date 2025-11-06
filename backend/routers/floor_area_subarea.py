from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from backend.models.homeassistant import Floor, Area, SubArea
from backend.utils.auth import get_current_user
from backend.internal.db import get_db

router = APIRouter()

@router.delete("/floors/{floor_id}")
async def delete_floor(floor_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Check if there are any areas associated with this floor
    area_count = db.query(func.count(Area.id)).filter(Area.floor_id == floor_id).scalar()
    if area_count > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete floor because it has associated areas. Please delete all areas first."
        )
    
    # Proceed with deletion
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    db.delete(floor)
    db.commit()
    return {"message": "Floor deleted successfully"}

@router.delete("/areas/{area_id}")
async def delete_area(area_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Check if there are any sub-areas associated with this area
    sub_area_count = db.query(func.count(SubArea.id)).filter(SubArea.area_id == area_id).scalar()
    if sub_area_count > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete area because it has associated sub-areas. Please delete all sub-areas first."
        )
    
    # Proceed with deletion
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    db.delete(area)
    db.commit()
    return {"message": "Area deleted successfully"}

@router.delete("/sub-areas/{sub_area_id}")
async def delete_sub_area(sub_area_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Sub-areas can be deleted directly as they are the lowest level
    sub_area = db.query(SubArea).filter(SubArea.id == sub_area_id).first()
    if not sub_area:
        raise HTTPException(status_code=404, detail="Sub-area not found")
    
    db.delete(sub_area)
    db.commit()
    return {"message": "Sub-area deleted successfully"}