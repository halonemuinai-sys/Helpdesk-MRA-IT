/**
 * Utility functions for IT Cost Overview 12-Month Matrix Calculations
 * Supports Accrual (Prorated 12-Month Amortization) vs Cash Basis (Tagged Transactions)
 */

export const OPEX_ACCOUNT_TYPES = [
  { id: 'Utilities', name: 'Utilities', type: 'OPEX' },
  { id: 'License & Permit', name: 'License & Permit', type: 'OPEX' },
  { id: 'Repair & Maintenance', name: 'Repair & Maintenance', type: 'OPEX' },
  { id: 'Rental Expenses', name: 'Rental Expenses', type: 'OPEX' },
  { id: 'Telecommunication', name: 'Telecommunication', type: 'OPEX' }
];

export const CAPEX_ACCOUNT_TYPES = [
  { id: 'Proyek & Inovasi', name: 'Proyek & Inovasi', type: 'CAPEX' }
];

export const buildMonthlyRowForAccountType = (
  accType,
  isCapexType,
  projectBudgets = [],
  monthlyTrend = [],
  selectedYear = new Date().getFullYear(),
  viewMode = 'accrual'
) => {
  const months = Array(12).fill(0);
  const targetYear = parseInt(selectedYear);

  projectBudgets.forEach(pb => {
    const isMatch = isCapexType
      ? (pb.budgetType === 'CAPEX' || pb.accountType === 'Proyek & Inovasi')
      : (pb.budgetType !== 'CAPEX' && (pb.accountType === accType || (!pb.accountType && accType === 'Utilities')));

    if (isMatch) {
      let currentYearExpensesSum = 0;

      // In Cash Mode, check tagged expenses for targetYear
      if (viewMode === 'cash' && Array.isArray(pb.expenses) && pb.expenses.length > 0) {
        pb.expenses.forEach(exp => {
          const d = new Date(exp.expenseDate);
          if (d.getFullYear() === targetYear) {
            const mIdx = d.getMonth();
            if (mIdx >= 0 && mIdx < 12) {
              months[mIdx] += (parseFloat(exp.amount) || 0);
              currentYearExpensesSum += (parseFloat(exp.amount) || 0);
            }
          }
        });
      }

      // In Accrual Mode (or Cash Mode when untagged), automatically prorate/amortize evenly across 12 months
      if (viewMode === 'accrual' || currentYearExpensesSum === 0) {
        const costToAmortize = parseFloat(pb.actualCost) > 0 ? parseFloat(pb.actualCost) : (parseFloat(pb.allocatedBudget) || 0);
        if (costToAmortize > 0) {
          const perMonth = costToAmortize / 12;
          for (let i = 0; i < 12; i++) months[i] += perMonth;
        }
      }
    }
  });

  // System contract monthlyTrend integration (Rental Assets, Subscriptions, ISP)
  months.forEach((v, idx) => {
    if (monthlyTrend[idx]) {
      let systemVal = 0;
      if (accType === 'Rental Expenses') systemVal = monthlyTrend[idx].assetsRental || 0;
      else if (accType === 'License & Permit') systemVal = monthlyTrend[idx].subscriptions || 0;
      else if (accType === 'Telecommunication') systemVal = monthlyTrend[idx].isp || 0;

      if (systemVal > 0) {
        months[idx] = viewMode === 'accrual' ? Math.max(v, systemVal) : (v > 0 ? v : systemVal);
      }
    }
  });

  return months;
};

export const getPaguForAccountType = (
  accType,
  isCapexType,
  projectBudgets = [],
  reportData = null
) => {
  let sum = 0;
  projectBudgets.forEach(pb => {
    const isMatch = isCapexType
      ? (pb.budgetType === 'CAPEX' || pb.accountType === 'Proyek & Inovasi')
      : (pb.budgetType !== 'CAPEX' && (pb.accountType === accType || (!pb.accountType && accType === 'Utilities')));
    if (isMatch) sum += (parseFloat(pb.allocatedBudget) || 0);
  });

  if (accType === 'Rental Expenses' && sum === 0) sum = reportData?.grandTotal?.assetsRental || 0;
  if (accType === 'License & Permit' && sum === 0) sum = reportData?.grandTotal?.subscriptions || 0;
  if (accType === 'Telecommunication' && sum === 0) sum = reportData?.grandTotal?.isp || 0;

  return sum;
};
