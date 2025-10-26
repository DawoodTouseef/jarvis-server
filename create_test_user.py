import uuid
from backend.models.users import UsersTable
from backend.utils.auth import create_token

# Create a test user
users_table = UsersTable()
test_user_id = str(uuid.uuid4())

user = users_table.insert_new_user(
    id=test_user_id,
    name="Test User",
    email="test@example.com",
    role="user"
)

print("Test user created:", user)
print("User ID:", test_user_id)

# Create a valid token for the test user
test_user_data = {
    "id": test_user_id,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
}
valid_token = create_token(test_user_data)
print("Valid token:", valid_token)