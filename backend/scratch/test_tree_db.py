import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mongoengine import connect
from app.models.growing_tree_model import GrowingTreeState

connect(host="mongodb://localhost:27017/health_care")

print("Connected to MongoDB")
try:
    print("Fetching documents...")
    states = GrowingTreeState.objects()
    print(f"Found {len(states)} documents.")
    for idx, s in enumerate(states):
        print(f"\nDocument {idx+1}:")
        print("Raw data keys:", s._data.keys())
        try:
            d = s.to_dict()
            print("to_dict succeeded:", d)
        except Exception as e:
            print("to_dict failed with error:")
            import traceback
            traceback.print_exc()
except Exception as e:
    print("Failed to run test:")
    import traceback
    traceback.print_exc()
