import os
import glob
import pandas as pd

user_profile = os.environ.get('USERPROFILE', 'C:\\Users\\ariss')
possible_locations = [
    os.path.join(user_profile, 'Downloads'),
    os.path.join(user_profile, 'Desktop'),
    os.path.join(user_profile, 'Documents'),
    'd:\\Private Project\\Helpdesk MRA'
]

found_files = []
for loc in possible_locations:
    if os.path.exists(loc):
        for root, dirs, files in os.walk(loc):
            for f in files:
                if 'budget' in f.lower() or '2026' in f.lower() or '2027' in f.lower():
                    if f.endswith('.xlsx') or f.endswith('.xls'):
                        found_files.append(os.path.join(root, f))

print("=== BUDGET EXCEL FILES FOUND IN SYSTEM ===")
for f in found_files:
    print(f)
