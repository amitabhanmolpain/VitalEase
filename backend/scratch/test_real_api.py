import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from app.services.tree_task_generator import generate_task_list

try:
    print("Sending prompt...")
    res = generate_task_list("I am feeling lonely today")
    print("Response:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
