const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const XLSX = require('xlsx');

const excelPath = 'C:\\Users\\ariss\\Downloads\\Documents\\Budgeting MRA Retail (AAA , PLA , MPI , JPI) Actual 2025 Vs Budget 2026.xlsx';

async function importOfficialBudgets() {
  try {
    console.log('Loading official Excel file:', excelPath);
    const workbook = XLSX.readFile(excelPath);

    // Map company names to CompanyMaster IDs
    const allCompanyMasters = await prisma.companyMaster.findMany();
    
    const findCompanyId = (nameStr) => {
      if (!nameStr) return 15; // default PLA
      const s = String(nameStr).toLowerCase();
      if (s.includes('mogems') || s.includes('mpi')) return 14;
      if (s.includes('permata') || s.includes('pla')) return 15;
      if (s.includes('jemma') || s.includes('jpi')) return 13;
      if (s.includes('amanda') || s.includes('aaa')) return 19;
      return 15;
    };

    const mapDepartment = (costCenter) => {
      if (!costCenter) return 'Store Operations';
      const c = String(costCenter).trim().toUpperCase();
      if (c === 'ITS' || c === 'IT') return 'IT Department';
      if (c === 'GAF' || c === 'GA') return 'General Affairs';
      if (c === 'ACC' || c === 'FIN' || c === 'FINANCE') return 'Finance & Accounting';
      if (c === 'OPS' || c === 'STORE') return 'Store Operations';
      if (c === 'SALES' || c === 'VIP') return 'Sales Advisor / Store Staff';
      if (c === 'MKT') return 'Marketing & CRM';
      return 'Store Operations';
    };

    const mapCategory = (budgetCat, accountType) => {
      const b = String(budgetCat || '').toLowerCase();
      const a = String(accountType || '').toLowerCase();
      if (b.includes('software') || a.includes('license')) return 'SOFTWARE_DEVELOPMENT';
      if (b.includes('hardware') || b.includes('device')) return 'HARDWARE_REFRESH';
      if (b.includes('network') || b.includes('isp')) return 'INFRASTRUCTURE';
      if (b.includes('security')) return 'CYBERSECURITY';
      if (b.includes('ai') || b.includes('analytic')) return 'AI_INNOVATION';
      return 'DIGITAL_TRANSFORMATION';
    };

    let totalImported = 0;

    for (const sheetName of ['2025', '2026']) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json(sheet);
      console.log(`\nProcessing Sheet ${sheetName} (${rows.length} rows)...`);

      let indexCounter = 1;
      for (const row of rows) {
        const itemDesc = row['Keterangan'];
        if (!itemDesc || String(itemDesc).trim() === '') continue;

        const fiscalYear = parseInt(row['Tahun']) || (sheetName === '2025' ? 2025 : 2026);
        const compName = row['Company'];
        const companyMasterId = findCompanyId(compName);
        const dept = mapDepartment(row['Cost Center Dept ']);
        const accountType = row['Account Type'] || 'Utilities';
        const typeBiaya = String(row['Type Biaya'] || '').toUpperCase().includes('CAPEX') ? 'CAPEX' : 'OPEX';
        const category = mapCategory(row['Budget'], accountType);
        
        const allocated = parseFloat(row['Total/Tahun']) || 0;
        const actual = parseFloat(row['Total/tahun Actual']) || 0;
        const remaining = allocated - actual > 0 ? allocated - actual : 0;
        const statusStr = String(row['Status'] || '').toLowerCase();
        let status = 'APPROVED';
        if (statusStr.includes('tidak')) status = 'PROPOSED';
        else if (statusStr.includes('terealisasi')) status = 'COMPLETED';

        const projectCode = `BGT-${fiscalYear}-${String(indexCounter++).padStart(3, '0')}`;

        // Upsert by projectCode or description
        await prisma.iTProjectBudget.upsert({
          where: { projectCode },
          update: {
            projectName: String(itemDesc).trim(),
            category,
            companyMasterId,
            brand: compName ? String(compName).trim() : 'MRA Retail',
            department: dept,
            fiscalYear,
            allocatedBudget: allocated,
            actualCost: actual,
            remainingBudget: remaining,
            budgetType: typeBiaya,
            accountType,
            priority: 'HIGH',
            status,
            notes: row['Remark'] ? String(row['Remark']) : `Imported from Official Excel Sheet ${sheetName}`
          },
          create: {
            projectCode,
            projectName: String(itemDesc).trim(),
            category,
            companyMasterId,
            brand: compName ? String(compName).trim() : 'MRA Retail',
            department: dept,
            fiscalYear,
            allocatedBudget: allocated,
            actualCost: actual,
            remainingBudget: remaining,
            budgetType: typeBiaya,
            accountType,
            priority: 'HIGH',
            status,
            notes: row['Remark'] ? String(row['Remark']) : `Imported from Official Excel Sheet ${sheetName}`
          }
        });

        totalImported++;
      }
    }

    console.log(`\n🎉 SUKSES MEMASUKKAN ${totalImported} ITEM ANGGARAN DARI EXCEL "Budgeting MRA Retail 2025 Vs 2026.xlsx"!`);
  } catch (err) {
    console.error('Error importing budget excel:', err);
  } finally {
    await prisma.$disconnect();
  }
}

importOfficialBudgets();
