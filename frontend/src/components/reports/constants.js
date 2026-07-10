export const MONTHS = [
  { value: 'ALL', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const YEARS = ['2026', '2025', '2024'];

export const getSlaColor = (rate) => {
  if (rate >= 90) return 'text-emerald-500';
  if (rate >= 75) return 'text-amber-500';
  return 'text-red-500';
};

export const buildSelectStyles = (darkMode) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: darkMode ? '#0f172a' : '#f9fafb',
    borderColor: state.isFocused
      ? '#06b6d4'
      : darkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(229, 231, 235, 0.5)',
    borderRadius: '0.75rem',
    padding: '0.05rem 0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    boxShadow: state.isFocused ? '0 0 0 1px #06b6d4' : 'none',
    '&:hover': { borderColor: '#06b6d4' },
    minHeight: '34px',
    cursor: 'pointer',
    minWidth: '135px',
    borderWidth: '1px',
    transition: 'all 0.2s ease',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
    borderRadius: '0.75rem',
    border: darkMode ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(229, 231, 235, 0.6)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    zIndex: 50,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#06b6d4'
      : state.isFocused
      ? (darkMode ? '#1e293b' : '#f3f4f6')
      : 'transparent',
    color: state.isSelected ? '#ffffff' : (darkMode ? '#cbd5e1' : '#374151'),
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 12px',
    transition: 'all 0.15s ease',
    '&:active': { backgroundColor: '#06b6d4', color: '#ffffff' },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: darkMode ? '#e2e8f0' : '#374151',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: darkMode ? '#64748b' : '#9ca3af',
  }),
  input: (provided) => ({
    ...provided,
    color: darkMode ? '#e2e8f0' : '#374151',
    margin: '0px',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0px 6px',
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#06b6d4' : (darkMode ? '#475569' : '#9ca3af'),
    padding: '4px',
    '&:hover': { color: '#06b6d4' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
});
