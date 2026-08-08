/**
 * Utility functions for IT Cost Overview 12-Month Matrix Calculations
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
  selectedYear = new Date().getFullYear()
) => {
  const months = Array(12).fill(0);
  const targetYear = parseInt(selectedYear);

  projectBudgets.forEach(pb => {
    const isMatch = isCapexType
      ? (pb.budgetType === 'CAPEX' || pb.accountType === 'Proyek & Inovasi')
      : (pb.budgetType !== 'CAPEX' && (pb.accountType === accType || (!pb.accountType && accType === 'Utilities')));

    if (isMatch) {
      let currentYearExpensesSum = 0;

      if (Array.isArray(pb.expenses) && pb.expenses.length > 0) {
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

      if (currentYearExpensesSum === 0 && pb.actualCost > 0) {
        const perMonth = (parseFloat(pb.actualCost) || 0) / 12;
        for (let i = 0; i < 12; i++) months[i] += perMonth;
      }
    }
  });

  // Fallback per month to monthlyTrend system contracts if a month is still 0
  months.forEach((v, idx) => {
    if (v === 0 && monthlyTrend[idx]) {
      if (accType === 'Rental Expenses' && monthlyTrend[idx].assetsRental > 0) {
        months[idx] = monthlyTrend[idx].assetsRental;
      } else if (accType === 'License & Permit' && monthlyTrend[idx].subscriptions > 0) {
        months[idx] = monthlyTrend[idx].subscriptions;
      } else if (accType === 'Telecommunication' && monthlyTrend[idx].isp > 0) {
        months[idx] = monthlyTrend[idx].isp;
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
