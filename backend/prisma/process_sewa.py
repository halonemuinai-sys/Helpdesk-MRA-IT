import pandas as pd
import json
import re
import os
import sys

# Paths
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
excel_dir = os.path.join(base_dir, 'Excel')
raw_path = os.path.join(excel_dir, 'Data cleansing sewa.xlsx')
names_path = os.path.join(excel_dir, 'ambil data nama media.xlsx')
cleaned_path = os.path.join(excel_dir, 'Data cleansing sewa_Cleaned.xlsx')
emp_path = os.path.join(excel_dir, 'All Employee MRA Group.xlsx')
json_output_path = os.path.join(base_dir, 'backend', 'prisma', 'cleaned_assets_for_import.json')

# Manual name adjustments for users that have slight variations
manual_user_map = {
    "medi retnosari": "40325031",       # RD. Media Retnosari
    "lintang": "40324011",              # Lintang Cahya Dewinta Afdellyn
    "firdza r. oktavianty": "40318039", # Firdza Rachmawati Oktavianty
    "mia": "40311011",                  # Miawati Nugraha Ardi
}

# Branch names to database IDs mapping
branch_map = {
    "PT. Rahayu Arumdhani Distribusindo - 1": {"companyMasterId": 8, "companyId": 9},
    "PT. Rahayu Arumdhani Distribusindo - 2": {"companyMasterId": 8, "companyId": 10},
    "PT. Rahayu Arumdhani Distribusindo - 3": {"companyMasterId": 8, "companyId": 13},
    "PT. Rahayu Arumdhani International - 1": {"companyMasterId": 9, "companyId": 12},
    "PT. Rahayu Arumdhani International - 2": {"companyMasterId": 9, "companyId": 14},
    "PT. Rahayu Arumdhani International - 3": {"companyMasterId": 9, "companyId": 11},
    "PT Emera Boga Makmur": {"companyMasterId": 2, "companyId": 2},
}

# Excel Company Name to Database IDs mapping (fallback and shared/cabang devices)
excel_company_map = {
    "pt rahayu arumdhani international": {"companyMasterId": 9, "companyId": 12},
    "pt rahayu arumdhani distribusindo": {"companyMasterId": 8, "companyId": 9},
    "pt emera boga makmur": {"companyMasterId": 2, "companyId": 2},
    "pt permata landmarq abadi": {"companyMasterId": 15, "companyId": 23},
    "pt amanda arumdhani aishwarya": {"companyMasterId": 19, "companyId": 32},
    "pt mogems putri international": {"companyMasterId": 14, "companyId": 19},
    "pt jemma putri international": {"companyMasterId": 13, "companyId": 18},
    "pt mugi rekso abadi": {"companyMasterId": 1, "companyId": 6},
    "pt hourlogy indah perkasa": {"companyMasterId": 17, "companyId": 28},
    "pt hourlogy inti semesta": {"companyMasterId": 16, "companyId": 25},
    "pt radio antar nusa djaja": {"companyMasterId": 11, "companyId": 16},
    "pt radio suara kedjajaan": {"companyMasterId": 10, "companyId": 15},
    "pt surya swara mediatama": {"companyMasterId": 7, "companyId": 8},
    "pt rupa kreasi anak bangsa": {"companyMasterId": 12, "companyId": 17},
    "pt rupa kreatif anak bangsa": {"companyMasterId": 12, "companyId": 17},
}

def parse_item_name(item_name):
    brand, model, processor, ram, storage = "", "", "", "", ""
    item_name_str = str(item_name).strip()
    
    parts = item_name_str.split(" GEN ")
    if len(parts) == 2:
        left, right = parts[0], parts[1]
        
        # Left part (Brand and Model)
        left_words = left.split(" ")
        brand = left_words[0].upper()
        model_raw = " ".join(left_words[1:])
        
        # Format model words to match standard casing
        model_words = []
        for word in model_raw.split(" "):
            if word.upper() in ["SSD", "HX", "G2", "G4", "G9"]:
                model_words.append(word.upper())
            elif re.match(r"^[0-9]+[a-zA-Z]+[0-9]*$", word): # e.g. 14IAU7, 14IRU8, etc.
                model_words.append(word.upper())
            else:
                model_words.append(word.capitalize())
        model = " ".join(model_words)
        model = model.replace("Thinkpad", "ThinkPad").replace("Ideapad", "IdeaPad")
        
        # Right part (Gen, Specs)
        right_parts = right.split(" ", 1)
        if len(right_parts) == 2:
            specs_str = right_parts[1]
            specs = specs_str.split("/")
            if len(specs) >= 3:
                proc_raw = specs[0].strip().upper()
                ram_raw = specs[1].strip().upper()
                storage_raw = specs[2].strip()
                
                # Format Processor
                if proc_raw.startswith("I"):
                    processor = f"Intel {proc_raw}"
                elif proc_raw.startswith("RYZEN"):
                    processor = f"AMD {proc_raw.capitalize()}"
                else:
                    processor = proc_raw
                
                # Format RAM
                ram = ram_raw
                
                # Format Storage
                storage = storage_raw.upper().replace("SSD", " SSD").replace("  ", " ").strip()
    else:
        # Fallback if no GEN keyword
        words = item_name_str.split(" ")
        brand = words[0].upper()
        model = " ".join(words[1:])
        
    return brand, model, processor, ram, storage

def main():
    print("--- Starting Asset Data Cleansing Pipeline ---")
    
    if not os.path.exists(raw_path):
        print(f"[ERROR] Raw file not found at {raw_path}")
        sys.exit(1)
        
    if not os.path.exists(names_path):
        print(f"[ERROR] User names mapping file not found at {names_path}")
        sys.exit(1)
        
    if not os.path.exists(emp_path):
        print(f"[ERROR] Employee lookup file not found at {emp_path}")
        sys.exit(1)

    # 1. Load Excel files
    print(f"Reading raw data from: {raw_path}")
    df_sewa = pd.read_excel(raw_path)
    print(f"Original Sewa Rows: {df_sewa.shape[0]}")

    print(f"Reading user names mapping from: {names_path}")
    df_names = pd.read_excel(names_path)
    print(f"User Names Mapping Rows: {df_names.shape[0]}")

    # 2. Explode Code Unit
    df_sewa['Code Unit'] = df_sewa['Code Unit'].fillna('').astype(str)
    df_sewa['Code Unit'] = df_sewa['Code Unit'].apply(lambda x: [item.strip() for item in x.split(',') if item.strip()])
    df_exploded = df_sewa.explode('Code Unit').reset_index(drop=True)
    df_exploded['Code Unit'] = df_exploded['Code Unit'].astype(str).str.strip()

    # 3. Parse Item Name specifications
    print("Parsing item specifications...")
    parsed_data = df_exploded['Item Name'].apply(parse_item_name)
    df_exploded['Brand'] = [p[0] for p in parsed_data]
    df_exploded['Model'] = [p[1] for p in parsed_data]
    df_exploded['Processor'] = [p[2] for p in parsed_data]
    df_exploded['RAM'] = [p[3] for p in parsed_data]
    df_exploded['Storage'] = [p[4] for p in parsed_data]

    # 4. Merge with user names mapping file
    print("Merging assets with user names mapping...")
    def get_base_id(code_unit):
        if not code_unit:
            return ""
        return code_unit.split('_')[0].strip()

    df_exploded['Base ID'] = df_exploded['Code Unit'].apply(get_base_id)
    df_names['ID Asset'] = df_names['ID Asset'].fillna('').astype(str).str.strip()

    # Determine columns to select from df_names dynamically
    names_cols = ['ID Asset', 'User']
    
    # Check for Position
    has_position = 'Position' in df_names.columns
    if has_position:
        names_cols.append('Position')
        
    # Check for Division/Departement
    has_division = 'Division' in df_names.columns
    has_dept = 'Departement' in df_names.columns
    if has_division:
        names_cols.append('Division')
    elif has_dept:
        names_cols.append('Departement')
        
    # Check for Cost Center
    has_cc = 'Cost Center' in df_names.columns
    if has_cc:
        names_cols.append('Cost Center')

    df_merged = pd.merge(
        df_exploded,
        df_names[names_cols],
        left_on='Base ID',
        right_on='ID Asset',
        how='left'
    )

    # Populate missing columns with empty string or mapping
    df_merged['User'] = df_merged['User'].fillna('')
    
    if has_position:
        df_merged['Position'] = df_merged['Position'].fillna('')
    else:
        df_merged['Position'] = ''
        
    if has_division:
        df_merged['Division'] = df_merged['Division'].fillna('')
    elif has_dept:
        df_merged['Division'] = df_merged['Departement'].fillna('')
    else:
        df_merged['Division'] = ''
        
    if has_cc:
        df_merged['Cost Center'] = df_merged['Cost Center'].fillna('')
    else:
        df_merged['Cost Center'] = ''

    # Arrange columns
    final_cols = [
        'Company Name', 'Order ID', 'Batch', 'Order Status', 
        'Item Name', 'Brand', 'Model', 'Processor', 'RAM', 'Storage', 
        'Price', 'Code Unit', 'User', 'Position', 'Division', 'Cost Center', 
        'Duration', 'Start Rent', 'End Rent'
    ]
    df_final = df_merged[final_cols]
    
    # Save cleaned excel
    df_final.to_excel(cleaned_path, index=False)
    print(f"[SUCCESS] Cleaned spreadsheet saved to: {cleaned_path}")
    print(f"Cleaned Rows: {df_final.shape[0]}")

    # 5. Resolve Employee NIP & Branch Details
    print("\nMapping names and locations to database IDs...")
    df_emp = pd.read_excel(emp_path)
    df_emp['Employee ID'] = df_emp['Employee ID'].fillna('').astype(str).str.strip()
    df_emp['Full Name'] = df_emp['Full Name'].fillna('').astype(str).str.strip().str.lower()
    df_emp['Branch Name'] = df_emp['Branch Name'].fillna('').astype(str).str.strip()

    name_to_id = dict(zip(df_emp['Full Name'], df_emp['Employee ID']))
    
    json_assets = []
    unmapped_names = set()

    for index, row in df_final.iterrows():
        user_name = str(row['User']).strip() if pd.notna(row['User']) else ''
        code_unit = str(row['Code Unit']).strip()
        raw_company_name = str(row['Company Name']).strip() if pd.notna(row['Company Name']) else ''
        
        user_id = None
        comp_master_id = 9  # default: PT. Rahayu Arumdhani International
        comp_id = 12       # default: Branch 1
        
        # 1. Resolve default company by Excel's 'Company Name' column
        if raw_company_name:
            company_clean = raw_company_name.lower().replace('.', '').strip()
            matched_comp = None
            for key, val in excel_company_map.items():
                if key.replace('.', '').strip() == company_clean:
                    matched_comp = val
                    break
            if matched_comp:
                comp_master_id = matched_comp['companyMasterId']
                comp_id = matched_comp['companyId']
        
        # 2. Resolve user NIP and override branch if specific user is assigned
        if user_name and user_name.lower() not in ['nan', '', 'null']:
            user_lower = user_name.lower()
            
            # Check manual map
            if user_lower in manual_user_map:
                user_id = manual_user_map[user_lower]
            elif user_lower in name_to_id:
                user_id = name_to_id[user_lower]
            else:
                # Try partial match
                partial_matches = df_emp[df_emp['Full Name'].str.contains(user_lower, na=False)]
                if partial_matches.shape[0] == 1:
                    user_id = partial_matches.iloc[0]['Employee ID']
            
            if user_id:
                emp_row = df_emp[df_emp['Employee ID'] == user_id].iloc[0]
                branch_name = emp_row['Branch Name']
                if branch_name in branch_map:
                    comp_master_id = branch_map[branch_name]['companyMasterId']
                    comp_id = branch_map[branch_name]['companyId']
            else:
                unmapped_names.add(user_name)
        
        start_rent = pd.to_datetime(row['Start Rent']).strftime('%Y-%m-%d') if pd.notna(row['Start Rent']) else '2024-01-01'
        end_rent = pd.to_datetime(row['End Rent']).strftime('%Y-%m-%d') if pd.notna(row['End Rent']) else '2026-01-01'
        
        # Today's date is 2026-06-01. If the lease has ended, mark status as DISPOSED and clear userId
        if end_rent < '2026-06-01':
            status = "DISPOSED"
            user_id = None
        else:
            status = "ASSIGNED" if user_name else "AVAILABLE"


        asset_obj = {
            "assetTag": code_unit,
            "deviceRef": code_unit.split('_')[0],
            "vendorRef": str(row['Order ID']).strip() if pd.notna(row['Order ID']) else 'N/A',
            "brand": str(row['Brand']).strip(),
            "model": str(row['Model']).strip(),
            "processor": str(row['Processor']).strip() if pd.notna(row['Processor']) else 'None',
            "ram": str(row['RAM']).strip() if pd.notna(row['RAM']) else 'None',
            "storage": str(row['Storage']).strip() if pd.notna(row['Storage']) else 'None',
            "os": "Windows 11 Pro",
            "office": "None",
            "ownershipType": "RENTAL",
            "status": status,
            "rentalCost": float(row['Price']) if pd.notna(row['Price']) else 0.0,
            "rentalStart": start_rent,
            "rentalEnd": end_rent,
            "notes": f"Cleaned import: user={user_name}, pos={row['Position']}, div={row['Division']}",
            "userId": user_id,
            "companyId": comp_id,
            "companyMasterId": comp_master_id
        }
        
        json_assets.append(asset_obj)

    # Save final JSON
    with open(json_output_path, 'w', encoding='utf-8') as f:
        json.dump(json_assets, f, indent=2, ensure_ascii=False)
        
    print(f"[SUCCESS] Generated final import payload at: {json_output_path}")
    print(f"Payload contains {len(json_assets)} assets ready to seed.")

    # Print mapping results
    if unmapped_names:
        print("\n[WARNING] The following user names could not be resolved to database Employee NIPs:")
        for name in sorted(unmapped_names):
            print(f"  - {name}")
        print("These assets will be imported with `userId: null` (viewed as Shared / Cabang).")
        print("To fix them, add them to the 'manual_user_map' at the top of process_sewa.py and run it again.")
    else:
        print("[SUCCESS] All user names successfully resolved to Employee NIPs!")
        
    print("\n--- Pipeline Completed Successfully ---")

if __name__ == '__main__':
    main()
