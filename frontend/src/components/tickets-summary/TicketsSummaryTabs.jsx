import React from 'react';

const TABS = [
  { label: 'Active Tickets', value: 'ACTIVE' },
  { label: 'Ticket History', value: 'HISTORY' },
];

export default function TicketsSummaryTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800/60">
      {TABS.map(tab => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === tab.value
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-450 dark:border-emerald-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
