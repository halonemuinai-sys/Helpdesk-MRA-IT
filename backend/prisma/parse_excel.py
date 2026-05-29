import os
import json
import pandas as pd

excel_path = r"D:\Private Project\Helpdesk MRA\Excel\All Employee MRA Group.xlsx"
output_path = r"D:\Private Project\Helpdesk MRA\backend\prisma\employees.json"

def clean_text(val):
    if pd.isna(val):
        return ""
    text = str(val).strip()
    # Clean encoding issues (e.g., 'Hagen-Dazs' -> 'Häagen-Dazs')
    text = text.replace("Hagen-Dazs", "Häagen-Dazs")
    text = text.replace("Caf", "Café")
    # Replace multiple spaces with single space
    text = " ".join(text.split())
    return text

def determine_sector(company_name, branch_name):
    name_lower = company_name.lower() + " " + branch_name.lower()
    
    # F&B (Food & Beverage)
    if "rahayu arumdhani" in name_lower or "emera boga" in name_lower or "haagen-dazs" in name_lower or "häagen-dazs" in name_lower:
        return "FB"
    # Radio / Broadcasting
    elif "radio" in name_lower or "surya swara" in name_lower or "prambors" in name_lower or "delta fm" in name_lower or "female radio" in name_lower:
        return "RADIO"
    # Media & Publishing & Arts
    elif "media" in name_lower or "artindo" in name_lower or "jemma" in name_lower or "rupa kreasi" in name_lower or "cosmopolitan" in name_lower or "bazaar" in name_lower:
        return "MEDIA"
    # Retail (Luxury & Watches)
    elif "hourlogy" in name_lower or "mpi" in name_lower or "bvlgari" in name_lower or "omega" in name_lower:
        return "RETAIL"
    # Default is General (Holding, Property, GA, etc.)
    else:
        return "GENERAL"

def main():
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        return

    print("Reading Excel file...")
    df = pd.read_excel(excel_path)
    
    # Filter out empty or placeholder rows
    df = df[df['Employee ID'].notna()]
    df = df[df['Branch Name'] != "-"]
    
    employees = []
    
    for _, row in df.iterrows():
        emp_id = clean_text(row['Employee ID'])
        # Skip if ID is invalid or empty
        if not emp_id or emp_id == "-":
            continue
            
        full_name = clean_text(row['Full Name'])
        org = clean_text(row['Organization'])
        job_pos = clean_text(row['Job Position'])
        email = clean_text(row['Email']).lower()
        phone = clean_text(row['Mobile Phone'])
        branch_name = clean_text(row['Branch Name'])
        
        # Split branch name into Company & Location
        if " - " in branch_name:
            company_name, location = [x.strip() for x in branch_name.split(" - ", 1)]
        elif "-" in branch_name:
            company_name, location = [x.strip() for x in branch_name.split("-", 1)]
        else:
            company_name = branch_name
            location = "HQ"
            
        # Clean double spaces in company name (e.g. 'PT.  Rupa' -> 'PT. Rupa')
        company_name = " ".join(company_name.split())
        
        # Determine business sector
        sector = determine_sector(company_name, branch_name)
        
        # Default placeholder email if email is empty or invalid
        if not email or "@" not in email:
            email = f"emp.{emp_id}@mragroup.co.id"
            
        employees.append({
            "employeeId": emp_id,
            "name": full_name,
            "email": email,
            "phone": phone if phone else None,
            "department": org if org else "General",
            "jobPosition": job_pos if job_pos else "Staff",
            "company": company_name,
            "location": location,
            "sector": sector
        })
        
    print(f"Total employees parsed: {len(employees)}")
    
    # Make sure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(employees, f, indent=2, ensure_ascii=False)
        
    print(f"Output saved to {output_path}")

if __name__ == "__main__":
    main()
