from backend.internal.db import Session, get_db
from backend.models.users import User

try:
    with get_db() as db:
        result = db.query(User).first()
        print('User exists:', result is not None)
        print('User:', result)
        if result:
            print('User ID:', result.id)
            print('User email:', result.email)
except Exception as e:
    print('Error:', e)