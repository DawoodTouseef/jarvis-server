# Read the file
with open('backend/routers/home_assistant.py', 'r') as f:
    content = f.read()

# Fix the function signature
content = content.replace(
    'async def call_service(\n    domain: str,\n    service: str,\n    service_data: Optional[Dict[str, Any]] = None,\n    user=Depends(get_verified_user)\n):',
    'async def call_service(\n    domain: str,\n    service: str,\n    service_data: Optional[Dict[str, Any]] = None,\n    db: Session = Depends(get_db),\n    user=Depends(get_verified_user)\n):'
)

# Fix the function body
content = content.replace(
    '''        # Use the Session directly like in the health check
        db = DBSession()
        try:
            db.add(event)
            db.commit()
            
            # In a real implementation, this would actually call the service
            # For now, we just record the event and return success
            return {"status": "success", "message": f"Service {domain}.{service} called"}
        except Exception as e:
            db.rollback()
            log.error(f"Error calling service {domain}.{service}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to call service"
            )
        finally:
            db.close()''',
    '''        db.add(event)
        db.commit()
        
        # In a real implementation, this would actually call the service
        # For now, we just record the event and return success
        return {"status": "success", "message": f"Service {domain}.{service} called"}
    except Exception as e:
        db.rollback()
        log.error(f"Error calling service {domain}.{service}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to call service"
        )'''
)

# Write the file back
with open('backend/routers/home_assistant.py', 'w') as f:
    f.write(content)

print("Fixed call_service function")