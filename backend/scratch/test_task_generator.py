import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set mock environment variable if not present
os.environ.setdefault("GEMINI_API_KEY", "AIzaSyCibQeZXNSwNAjkzN5Tj3pAW1XFXUrTRRM")

from app.services.tree_task_generator import generate_task_list

print("Running generate_task_list test...")
try:
    result = generate_task_list("My dog died, I'm depressed.")
    print("Result:")
    print(result)
except Exception as e:
    import traceback
    traceback.print_exc()
