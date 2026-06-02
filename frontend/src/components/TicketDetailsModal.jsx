import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  UserPlus, 
  Play, 
  Pause, 
  CheckCircle2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import ReactLoader from './ReactLoader';

export default function TicketDetailsModal({ 
  user, 
  token, 
  ticketDetails, 
  detailsLoading, 
  agents, 
  currentTime, 
  onClose, 
  handleStatusChange, 
  handleAssignAgent 
}) {
  const [actionComment, setActionComment] = useState('');

  // Local helper to submit status changes with local comment
  const onSubmitStatusChange = async (newStatus) => {
    await handleStatusChange(ticketDetails.id, newStatus, actionComment);
    setActionComment(''); // Clear comment box after action
  };

  const getPriorityBadge = (prio) => {
    const classes = {
      CRITICAL: 'bg-rose-700 text-white shadow-rose-700/20 border border-rose-500 animate-pulse',
      HIGH: 'bg-red-500 text-white shadow-red-500/10',
      MEDIUM: 'bg-amber-500 text-white shadow-amber-500/10',
      LOW: 'bg-emerald-500 text-white shadow-emerald-500/10'
    };
    return (
      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm ${classes[prio] || 'bg-gray-500'}`}>
        {prio}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const classes = {
      OPEN: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      PENDING: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      CLOSED: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800'
    };
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${classes[status] || 'bg-gray-50'}`}>
        {status}
      </span>
    );
  };

  const renderSlaStatus = (ticket) => {
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      return (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
          ticket.isSlaBreached 
            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
        }`}>
          {ticket.isSlaBreached ? 'Breached (Late)' : 'SLA Met (On Time)'}
        </span>
      );
    }

    // SLA targets
    const limitTime = new Date(ticket.slaResolutionLimit).getTime();
    const pausedMs = ticket.totalPausedMs || 0;
    
    let activeLimitTime = limitTime + pausedMs;
    // Add current pending interval if currently paused
    if (ticket.status === 'PENDING' && ticket.lastPausedAt) {
      const currentPause = currentTime.getTime() - new Date(ticket.lastPausedAt).getTime();
      activeLimitTime += currentPause;
    }

    const remainingMs = activeLimitTime - currentTime.getTime();
    const isOverdue = remainingMs < 0;
    const diffMin = Math.abs(Math.round(remainingMs / 1000 / 60));
    const diffHours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;

    let timeString = '';
    if (diffHours > 0) {
      timeString = `${diffHours} hr ${mins} min`;
    } else {
      timeString = `${mins} min`;
    }

    if (ticket.status === 'PENDING') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1.5 w-fit">
          <Pause className="w-3 h-3 fill-current" />
          Paused ({timeString} left)
        </span>
      );
    }

    if (isOverdue) {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 flex items-center gap-1.5 w-fit border border-red-500/10">
          <AlertTriangle className="w-3.5 h-3.5" />
          Overdue ({timeString})
        </span>
      );
    }

    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 flex items-center gap-1.5 w-fit border border-amber-500/10">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        {timeString} left
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Box Content */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-850 overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IT Helpdesk Ticket Details</span>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{ticketDetails?.title}</h3>
              <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-gray-200/50 dark:border-slate-700/50">
                ID: {ticketDetails?.id}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body (Landscape Grid) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/20 dark:bg-slate-950/10">
          {detailsLoading && !ticketDetails ? (
            <ReactLoader size="md" text="Loading ticket details..." />
          ) : ticketDetails ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Status Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(ticketDetails.status)}
                  {getPriorityBadge(ticketDetails.priority)}
                  <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-medium border border-gray-200/50 dark:border-slate-700/50">
                    Category: {ticketDetails.category} {ticketDetails.subCategory && ticketDetails.subCategory !== '-' ? `(${ticketDetails.subCategory})` : ''}
                  </span>
                  <span className="text-xs text-brand-600 bg-brand-50 dark:bg-brand-950/20 dark:text-brand-400 px-2.5 py-1 rounded-lg font-bold border border-brand-200/10 dark:border-brand-900/10">
                    Source: {ticketDetails.source || 'Walk-in'}
                  </span>
                </div>

                {/* Reporting Employee Info Card */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reporting Employee</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-450 dark:text-slate-500 font-medium">Full Name</p>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{ticketDetails.requester.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-450 dark:text-slate-500 font-medium">Phone Number</p>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">
                        {ticketDetails.requester.phone ? ticketDetails.requester.phone.replace(/\.0$/, '') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-450 dark:text-slate-500 font-medium">Company / Branch</p>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{ticketDetails.company.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ticketDetails.company.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-450 dark:text-slate-500 font-medium">Department / Position</p>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{ticketDetails.requester.department}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ticketDetails.requester.jobPosition}</p>
                    </div>
                  </div>
                </div>

                {/* SLA Tracker Card */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Level Agreement (SLA) & Timestamps</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-450 dark:text-slate-500 font-medium">Incident Date & Time</p>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mt-1">
                        {new Date(ticketDetails.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {', '}
                        {new Date(ticketDetails.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-450 dark:text-slate-500 font-medium">Resolution Target Deadline</p>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 mt-1">
                        {new Date(ticketDetails.slaResolutionLimit).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {', '}
                        {new Date(ticketDetails.slaResolutionLimit).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-450 dark:text-slate-500 font-medium">SLA Status / Remaining</p>
                      <div className="mt-1 font-semibold">{renderSlaStatus(ticketDetails)}</div>
                    </div>
                    {ticketDetails.respondedAt && (
                      <div>
                        <p className="text-gray-450 dark:text-slate-500 font-medium">First Responded At</p>
                        <p className="font-semibold text-gray-800 dark:text-slate-200 mt-1">
                          {new Date(ticketDetails.respondedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {', '}
                          {new Date(ticketDetails.respondedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    )}
                    {ticketDetails.resolvedAt && (
                      <div className="col-span-1 sm:col-span-2">
                        <p className="text-gray-450 dark:text-slate-500 font-medium">Resolved At</p>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-450 mt-1">
                          {new Date(ticketDetails.resolvedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {', '}
                          {new Date(ticketDetails.resolvedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Box */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issue Details</h4>
                  <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl text-xs leading-relaxed whitespace-pre-line text-gray-700 dark:text-slate-350 shadow-sm max-h-60 overflow-y-auto">
                    {ticketDetails.description}
                  </div>
                </div>

              </div>

              {/* Right Column (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Stepper Card */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Ticket Journey Progress</h4>
                  {(() => {
                    const isAssigned = !!ticketDetails.assignedToId;
                    const isInProgress = ['IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'].includes(ticketDetails.status) || !!ticketDetails.respondedAt;
                    const isResolved = ['RESOLVED', 'CLOSED'].includes(ticketDetails.status) || !!ticketDetails.resolvedAt;
                    const isClosed = ticketDetails.status === 'CLOSED';

                    const steps = [
                      { label: 'Created', done: true, current: ticketDetails.status === 'OPEN' && !isAssigned },
                      { label: 'Assigned', done: isAssigned || isInProgress || isResolved || isClosed, current: ticketDetails.status === 'OPEN' && isAssigned },
                      { label: 'In Progress', done: isInProgress || isResolved || isClosed, current: ['IN_PROGRESS', 'PENDING'].includes(ticketDetails.status) },
                      { label: 'Resolved', done: isResolved || isClosed, current: ticketDetails.status === 'RESOLVED' },
                      { label: 'Closed', done: isClosed, current: ticketDetails.status === 'CLOSED' },
                    ];

                    return (
                      <div className="flex items-center justify-between overflow-x-auto pb-2">
                        {steps.map((step, idx) => (
                          <React.Fragment key={step.label}>
                            <div className="flex flex-col items-center flex-1 min-w-[50px] relative">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all ${
                                step.current
                                  ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse'
                                  : step.done
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {step.done ? '✓' : idx + 1}
                              </div>
                              <span className={`text-[9px] font-bold mt-1.5 text-center ${
                                step.current
                                  ? 'text-brand-500 font-extrabold'
                                  : step.done
                                  ? 'text-emerald-500'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                            {idx < steps.length - 1 && (
                              <div className={`h-[2px] flex-1 -mx-2 transition-all min-w-[10px] ${
                                steps[idx + 1].done
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-200 dark:bg-slate-800'
                              }`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Operations & Agent Actions (Agents/Admins Only) */}
                {user.role !== 'USER' && (
                  <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping"></span>
                        <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                          {(() => {
                            if (!ticketDetails.assignedToId) return 'Step 1: Assignment Needed';
                            if (ticketDetails.status === 'OPEN') return 'Step 2: Acknowledge & Start';
                            if (ticketDetails.status === 'IN_PROGRESS') return 'Step 3: Work & Resolution';
                            if (ticketDetails.status === 'PENDING') return 'Step 3 (Paused): Resume Work';
                            if (ticketDetails.status === 'RESOLVED') return 'Step 4: Final Closure';
                            return 'Step 5: Journey Completed';
                          })()}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Agent Guidance</span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
                      {(() => {
                        if (!ticketDetails.assignedToId) {
                          return 'This ticket is currently unassigned. You must assign it to an agent (yourself or someone else) to take responsibility and begin the journey.';
                        }
                        if (ticketDetails.status === 'OPEN') {
                          return `Ticket has been assigned to ${ticketDetails.assignedTo.name}. Next step is to click "Start Processing" which registers the first response time under SLA.`;
                        }
                        if (ticketDetails.status === 'IN_PROGRESS') {
                          return 'You are currently working on this ticket. Write a note below and choose to "Pause SLA" if waiting for employee/external factors, or "Resolve Ticket" once fixed.';
                        }
                        if (ticketDetails.status === 'PENDING') {
                          return `SLA time tracking is paused. When you are ready to continue working on this issue, write an optional update and click "Resume Processing".`;
                        }
                        if (ticketDetails.status === 'RESOLVED') {
                          return 'The issue has been marked resolved. Contact the requester to verify it works, then click "Permanently Close Ticket" to archive.';
                        }
                        return 'This ticket has been permanently closed and archived. No further actions can be performed.';
                      })()}
                    </p>

                    {/* Assignment Control Inline */}
                    {ticketDetails.status !== 'CLOSED' && (
                      <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-slate-400">
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Assignee:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!ticketDetails.assignedTo || ticketDetails.assignedTo.id !== user.id ? (
                            <button
                              onClick={() => handleAssignAgent(ticketDetails.id, user.id)}
                              className="px-2.5 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-lg transition-all"
                            >
                              Take Over
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                              Assigned to Me
                            </span>
                          )}

                          <select
                            value={ticketDetails.assignedToId || ''}
                            onChange={(e) => handleAssignAgent(ticketDetails.id, e.target.value)}
                            className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Select Agent --</option>
                            {agents.map(ag => (
                              <option key={ag.id} value={ag.id}>{ag.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Action buttons and inputs */}
                    {ticketDetails.status !== 'CLOSED' && (
                      <div className="space-y-4 pt-2.5 border-t border-gray-100 dark:border-slate-800/60">
                        {/* Note Input Field */}
                        {['IN_PROGRESS', 'PENDING'].includes(ticketDetails.status) && (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-slate-450 uppercase tracking-wider block">
                              Action Note / Comment {ticketDetails.status === 'IN_PROGRESS' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                              rows={2}
                              value={actionComment}
                              onChange={(e) => setActionComment(e.target.value)}
                              placeholder={
                                ticketDetails.status === 'IN_PROGRESS'
                                  ? "Describe resolution or why SLA is paused..."
                                  : "Write updates on resuming work (optional)..."
                              }
                              className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800/60 focus:border-brand-500 rounded-xl text-xs text-gray-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-400"
                            />
                            {ticketDetails.status === 'IN_PROGRESS' && actionComment.trim() === '' && (
                              <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1.5 bg-amber-500/5 p-2 border border-amber-500/10 rounded-lg">
                                ⚠️ Comment is mandatory to Pause or Resolve the ticket.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Status buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          
                          {/* Open -> Start Process */}
                          {ticketDetails.status === 'OPEN' && (
                            <button
                              disabled={!ticketDetails.assignedToId}
                              onClick={() => onSubmitStatusChange('IN_PROGRESS')}
                              className="w-full col-span-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/10 transition-all"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Start Processing (Start SLA)</span>
                            </button>
                          )}

                          {/* In Progress -> Pause / Resolve */}
                          {ticketDetails.status === 'IN_PROGRESS' && (
                            <>
                              <button
                                disabled={actionComment.trim() === ''}
                                onClick={() => onSubmitStatusChange('PENDING')}
                                className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-gray-200 dark:border-slate-800"
                              >
                                <Pause className="w-4 h-4 fill-current" />
                                <span>Pause SLA</span>
                              </button>

                              <button
                                disabled={actionComment.trim() === ''}
                                onClick={() => onSubmitStatusChange('RESOLVED')}
                                className="py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Resolve Ticket</span>
                              </button>
                            </>
                          )}

                          {/* Pending -> Resume Process */}
                          {ticketDetails.status === 'PENDING' && (
                            <button
                              onClick={() => onSubmitStatusChange('IN_PROGRESS')}
                              className="w-full col-span-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Resume Processing (Resume SLA)</span>
                            </button>
                          )}

                          {/* Resolved -> Close Ticket */}
                          {ticketDetails.status === 'RESOLVED' && (
                            <button
                              onClick={() => onSubmitStatusChange('CLOSED')}
                              className="w-full col-span-2 py-3 bg-gray-800 hover:bg-gray-900 dark:bg-slate-950 dark:hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Check className="w-4 h-4" />
                              <span>Permanently Close Ticket</span>
                            </button>
                          )}

                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Audit Logs chronology */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Action History (Audit Log)</h4>
                  <div className="space-y-4 border-l border-gray-200 dark:border-slate-800 pl-4 py-1 ml-2 text-xs max-h-60 overflow-y-auto">
                    {ticketDetails.auditLogs.map(log => (
                      <div key={log.id} className="relative">
                        <div className="absolute w-2 h-2 rounded-full bg-brand-500 -left-[21px] top-1"></div>
                        <p className="font-semibold text-gray-850 dark:text-slate-200">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{log.details}</p>
                        <span className="text-[10px] text-gray-400">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
