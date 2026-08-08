import pandas as pd
import json

file1 = r'C:\Users\ariss\Downloads\Documents\Budgeting MRA Retail (AAA , PLA , MPI , JPI) Actual 2025 Vs Budget 2026.xlsx'
file2 = r'C:\Users\ariss\Downloads\Documents\Summary Budgeting IT MRA Retail 2026.xlsx'

def inspect_excel(path):
    print(f"\n==========================================")
    print(f"INSPECTING: {path}")
    print(f"==========================================")
    xl = pd.ExcelFile(path)
    print("Sheet names:", xl.sheet_names)
    for sheet in xl.sheet_names:
        print(f"\n--- SHEET: {sheet} ---")
        df = xl.parse(sheet)
        print("Shape:", df.shape)
        print("Head (5 rows):")
        print(df.head(5))

inspect_excel(file1)
inspect_excel(file2)
