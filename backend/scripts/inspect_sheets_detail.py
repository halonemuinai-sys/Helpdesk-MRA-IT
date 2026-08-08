import pandas as pd

path = r'C:\Users\ariss\Downloads\Documents\Budgeting MRA Retail (AAA , PLA , MPI , JPI) Actual 2025 Vs Budget 2026.xlsx'
xl = pd.ExcelFile(path)

for s in ['2025', '2026']:
    df = xl.parse(s)
    print(f"\n=================== SHEET {s} COLUMNS ===================")
    print(df.columns.tolist())
    print("\nFIRST 5 ROWS:")
    print(df.head(5).to_string())
