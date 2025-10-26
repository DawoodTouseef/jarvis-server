with open('backend/routers/home_assistant.py', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 'db.rollback()' in line:
            print(f'Line {i+1}: {line.strip()}')