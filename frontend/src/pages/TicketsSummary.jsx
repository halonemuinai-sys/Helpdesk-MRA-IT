import React from 'react';
import TicketDetailsModal from '../components/TicketDetailsModal';
import useTicketsSummary from '../hooks/useTicketsSummary';
import TicketsSummaryHeader from '../components/tickets-summary/TicketsSummaryHeader';
import TicketsSummaryTabs from '../components/tickets-summary/TicketsSummaryTabs';
import TicketsSummaryFilterBar from '../components/tickets-summary/TicketsSummaryFilterBar';
import TicketsSummaryBulkBar from '../components/tickets-summary/TicketsSummaryBulkBar';
import TicketsSummaryTable from '../components/tickets-summary/TicketsSummaryTable';

export default function TicketsSummary({ user, token }) {
  const h = useTicketsSummary({ user, token });

  return (
    <div className="relative min-h-screen">
      <div className="space-y-6 animate-fade-in">

        <TicketsSummaryHeader user={user} />

        <TicketsSummaryTabs activeTab={h.activeTab} onTabChange={h.switchTab} />

        <TicketsSummaryFilterBar
          activeTab={h.activeTab}
          statusFilter={h.statusFilter}
          setStatusFilter={h.setStatusFilter}
          priorityFilter={h.priorityFilter}
          onPriorityChange={h.handlePriorityChange}
          searchQuery={h.searchQuery}
          setSearchQuery={h.setSearchQuery}
          monthFilter={h.monthFilter}
          onMonthChange={h.handleMonthChange}
          slaFilter={h.slaFilter}
          onSlaFilterToggle={h.handleSlaFilterToggle}
          onSearch={h.handleSearch}
        />

        <TicketsSummaryBulkBar
          user={user}
          resolvedTickets={h.resolvedTickets}
          selectedTicketIds={h.selectedTicketIds}
          setSelectedTicketIds={h.setSelectedTicketIds}
          onBulkClose={h.handleBulkClose}
        />

        <TicketsSummaryTable
          loading={h.loading}
          displayTickets={h.displayTickets}
          user={user}
          currentTime={h.currentTime}
          selectedTicketIds={h.selectedTicketIds}
          setSelectedTicketIds={h.setSelectedTicketIds}
          resolvedTickets={h.resolvedTickets}
          isAllSelected={h.isAllSelected}
          handleSelectAll={h.handleSelectAll}
          setSelectedTicketId={h.setSelectedTicketId}
          handleDeleteTicket={h.handleDeleteTicket}
        />

        {h.hasMore && !h.loading && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={h.handleLoadMore}
              className="px-6 py-2.5 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-gray-200 dark:border-slate-800 text-xs font-bold text-gray-700 dark:text-slate-200 rounded-xl transition-all shadow-sm hover:shadow"
            >
              Load More (Muat Lebih Banyak)
            </button>
          </div>
        )}

      </div>

      {h.selectedTicketId && (
        <TicketDetailsModal
          user={user}
          token={token}
          ticketDetails={h.ticketDetails}
          detailsLoading={h.detailsLoading}
          agents={h.agents}
          currentTime={h.currentTime}
          onClose={() => h.setSelectedTicketId(null)}
          handleStatusChange={h.handleStatusChange}
          handleAssignAgent={h.handleAssignAgent}
          handleSlaOverride={h.handleSlaOverride}
          handleUpdateRespondedAt={h.handleUpdateRespondedAt}
          handleTicketPriorityChange={h.handleTicketPriorityChange}
          handleTicketMetaChange={h.handleTicketMetaChange}
        />
      )}
    </div>
  );
}
