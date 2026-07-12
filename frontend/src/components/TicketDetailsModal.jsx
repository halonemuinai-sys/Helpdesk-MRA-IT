import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  UserPlus, 
  Play, 
  Pause, 
  CheckCircle2, 
  Check, 
  AlertTriangle,
  Wrench
} from 'lucide-react';
import ReactLoader from './ReactLoader';

// 1. Component SlaStatusTracker (Mencatat timer countdown secara internal dan lokal)
function SlaStatusTracker({ ticket }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const isBypassed = ticket.auditLogs?.some(log => log.action === 'SLA_OVERRIDDEN');
    const isFinished = ['RESOLVED', 'CLOSED'].includes(ticket.status);

    if (isBypassed || isFinished || ticket.status === 'PENDING') {
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000); // local timer refresh every 15s

    return () => clearInterval(timer);
  }, [ticket.status, ticket.auditLogs]);

  const isBypassed = ticket.auditLogs?.some(log => log.action === 'SLA_OVERRIDDEN');
  if (isBypassed) {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10 inline-block">
        SLA Bypassed
      </span>
    );
  }

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

  const limitTime = new Date(ticket.slaResolutionLimit).getTime();
  const pausedMs = ticket.totalPausedMs || 0;
  
  let activeLimitTime = limitTime + pausedMs;
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
}

// 2. Component EmployeeInfoCard (Render detail data karyawan pelapor)
const EmployeeInfoCard = React.memo(({ requester, company }) => {
  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl space-y-3 shadow-sm">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reporting Employee</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-gray-450 dark:text-slate-500 font-medium">Full Name</p>
          <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{requester.name}</p>
        </div>
        <div>
          <p className="text-gray-450 dark:text-slate-500 font-medium">Phone Number</p>
          <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">
            {requester.phone ? requester.phone.replace(/\.0$/, '') : '-'}
          </p>
        </div>
        <div>
          <p className="text-gray-450 dark:text-slate-500 font-medium">Company / Branch</p>
          <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{company.name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{company.location}</p>
        </div>
        <div>
          <p className="text-gray-450 dark:text-slate-500 font-medium">Department / Position</p>
          <p className="font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{requester.department}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{requester.jobPosition}</p>
        </div>
      </div>
    </div>
  );
});

// 3. Component IncidentDeadlineCard (Menangani status visual SLA, bypass, dan edit respondedAt)
const IncidentDeadlineCard = React.memo(({ 
  ticketDetails, 
  user, 
  onBypassClick, 
  onEditRespondedClick 
}) => {
  return (
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
          <div className="mt-1 font-semibold flex items-center gap-2 flex-wrap">
            <SlaStatusTracker ticket={ticketDetails} />
            {(() => {
              const isBypassed = ticketDetails.auditLogs?.some(log => log.action === 'SLA_OVERRIDDEN');
              const isFinished = ['RESOLVED', 'CLOSED'].includes(ticketDetails.status);
              
              let isSlaBreachedNow = ticketDetails.isSlaBreached;
              if (!isBypassed && !isFinished) {
                const limitTime = new Date(ticketDetails.slaResolutionLimit).getTime();
                const pausedMs = ticketDetails.totalPausedMs || 0;
                let activeLimitTime = limitTime + pausedMs;
                if (ticketDetails.status === 'PENDING' && ticketDetails.lastPausedAt) {
                  const currentPause = new Date().getTime() - new Date(ticketDetails.lastPausedAt).getTime();
                  activeLimitTime += currentPause;
                }
                isSlaBreachedNow = ticketDetails.isSlaBreached || (activeLimitTime - new Date().getTime() < 0);
              }

              if (user.role === 'ADMIN' && isSlaBreachedNow && !isBypassed) {
                return (
                  <button
                    type="button"
                    onClick={onBypassClick}
                    className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/30 transition cursor-pointer"
                  >
                    Bypass SLA
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </div>
        {(ticketDetails.respondedAt || user.role === 'ADMIN') && (
          <div className="relative group">
            <div className="flex items-center justify-between gap-2">
              <p className="text-gray-450 dark:text-slate-500 font-medium">First Responded At</p>
              {user.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={onEditRespondedClick}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition cursor-pointer flex items-center gap-1"
                  title="Edit First Response Time"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
            <p className="font-semibold text-gray-800 dark:text-slate-200 mt-1">
              {ticketDetails.respondedAt ? (
                <>
                  {new Date(ticketDetails.respondedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {', '}
                  {new Date(ticketDetails.respondedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </>
              ) : (
                <span className="text-gray-400 italic">Not Responded Yet</span>
              )}
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
  );
});

// 4. Component AgentActionSection (Isolasi state actionComment untuk pengetikan bebas lag)
function AgentActionSection({ 
  ticketDetails, 
  user, 
  agents, 
  handleAssignAgent, 
  handleStatusChange 
}) {
  const [actionComment, setActionComment] = useState('');

  const onSubmitStatusChange = async (newStatus) => {
    await handleStatusChange(ticketDetails.id, newStatus, actionComment);
    setActionComment('');
  };

  return (
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
                className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800/60 focus:border-brand-500 rounded-xl text-xs text-gray-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-400 font-semibold"
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
                className="w-full col-span-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/10 transition-all cursor-pointer"
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
                  className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-gray-200 dark:border-slate-800 cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause SLA</span>
                </button>

                <button
                  disabled={actionComment.trim() === ''}
                  onClick={() => onSubmitStatusChange('RESOLVED')}
                  className="py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
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
                className="w-full col-span-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Processing (Resume SLA)</span>
              </button>
            )}

            {/* Resolved -> Close Ticket */}
            {ticketDetails.status === 'RESOLVED' && (
              <button
                onClick={() => onSubmitStatusChange('CLOSED')}
                className="w-full col-span-2 py-3 bg-gray-800 hover:bg-gray-900 dark:bg-slate-950 dark:hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Permanently Close Ticket</span>
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// 5. Component AuditLogList (Render action history logs, memoized)
const AuditLogList = React.memo(({ auditLogs }) => {
  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl shadow-sm space-y-3">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Action History (Audit Log)</h4>
      <div className="space-y-4 border-l border-gray-200 dark:border-slate-800 pl-4 py-1 ml-2 text-xs max-h-60 overflow-y-auto">
        {auditLogs.map(log => (
          <div key={log.id} className="relative animate-fade-in">
            <div className="absolute w-2 h-2 rounded-full bg-brand-500 -left-[21px] top-1"></div>
            <p className="font-semibold text-gray-850 dark:text-slate-200">{log.action.replace(/_/g, ' ')}</p>
            <p className="text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">{log.details}</p>
            <span className="text-[10px] text-gray-400">
              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Komponen Utama Modal
export default function TicketDetailsModal({
  user,
  token,
  ticketDetails,
  detailsLoading,
  agents,
  onClose,
  handleStatusChange,
  handleAssignAgent,
  handleSlaOverride,
  handleUpdateRespondedAt,
  handleTicketPriorityChange,
  handleTicketMetaChange,
}) {
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState(null);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const [showRespondedAtDialog, setShowRespondedAtDialog] = useState(false);
  const [respondedAtInput, setRespondedAtInput] = useState('');
  const [respondedAtReason, setRespondedAtReason] = useState('');
  const [respondedAtError, setRespondedAtError] = useState(null);
  const [respondedAtSubmitting, setRespondedAtSubmitting] = useState(false);

  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().slice(0, 16);
  };

  const handleOpenRespondedAtDialog = () => {
    setRespondedAtInput(formatDateTimeLocal(ticketDetails.respondedAt));
    setRespondedAtReason('');
    setRespondedAtError(null);
    setShowRespondedAtDialog(true);
  };

  const handleRespondedAtSubmit = async (e) => {
    e.preventDefault();
    if (!respondedAtReason || !respondedAtReason.trim()) {
      setRespondedAtError('Reason for updating response time is required.');
      return;
    }

    setRespondedAtError(null);
    setRespondedAtSubmitting(true);

    try {
      let payloadValue = null;
      if (respondedAtInput) {
        const parsedDate = new Date(respondedAtInput);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date-time selected.');
        }
        if (parsedDate < new Date(ticketDetails.createdAt)) {
          throw new Error('First Responded At cannot be before ticket creation date.');
        }
        payloadValue = parsedDate.toISOString();
      }

      await handleUpdateRespondedAt(ticketDetails.id, payloadValue, respondedAtReason.trim());
      setShowRespondedAtDialog(false);
      setRespondedAtReason('');
    } catch (err) {
      setRespondedAtError(err.message);
    } finally {
      setRespondedAtSubmitting(false);
    }
  };

  const handleSlaOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason || !overrideReason.trim()) {
      setOverrideError('Reason for SLA override is required.');
      return;
    }

    setOverrideError(null);
    setOverrideSubmitting(true);

    try {
      await handleSlaOverride(ticketDetails.id, overrideReason.trim());
      setShowOverrideDialog(false);
      setOverrideReason('');
    } catch (err) {
      setOverrideError(err.message);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const PRIORITY_STYLES = {
    CRITICAL: 'bg-rose-700 text-white border-rose-500 animate-pulse',
    HIGH:     'bg-red-500 text-white border-red-400',
    MEDIUM:   'bg-amber-500 text-white border-amber-400',
    LOW:      'bg-emerald-500 text-white border-emerald-400',
  };

  const getPriorityBadge = (prio) => (
    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm border ${PRIORITY_STYLES[prio] || 'bg-gray-500 text-white border-gray-400'}`}>
      {prio}
    </span>
  );

  const PriorityDropdown = ({ ticketId, current }) => {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = React.useRef(null);

    useEffect(() => {
      const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = async (p) => {
      if (p === current || saving) return;
      setSaving(true);
      setOpen(false);
      await handleTicketPriorityChange(ticketId, p);
      setSaving(false);
    };

    const canEdit = user?.role === 'ADMIN' || user?.role === 'AGENT';

    if (!canEdit) return getPriorityBadge(current);

    return (
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          title="Klik untuk ubah priority"
          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${PRIORITY_STYLES[current] || 'bg-gray-500 text-white border-gray-400'}`}
        >
          {saving ? '...' : current}
          <svg className="w-2.5 h-2.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[110px]">
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
              <button
                key={p} type="button" onClick={() => select(p)}
                className={`w-full text-left px-3 py-2 text-[11px] font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${p === current ? 'opacity-40 cursor-default pointer-events-none' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${p === 'CRITICAL' ? 'bg-rose-600' : p === 'HIGH' ? 'bg-red-500' : p === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-gray-800 dark:text-slate-200">{p}</span>
                {p === current && <span className="ml-auto text-gray-400 text-[9px]">aktif</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'ERP'];
  const SOURCES = ['Walk-in', 'Email', 'Phone Call', 'Instant Messaging (WhatsApp/Telegram)', 'Direct Instruction', 'On-site Visit', 'System Alert', 'Self-Service Portal'];

  const InlineDropdown = ({ ticketId, field, current, options, label }) => {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = React.useRef(null);

    useEffect(() => {
      const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = async (val) => {
      if (val === current || saving) return;
      setSaving(true);
      setOpen(false);
      await handleTicketMetaChange(ticketId, { [field]: val });
      setSaving(false);
    };

    const canEdit = user?.role === 'ADMIN' || user?.role === 'AGENT';

    const display = saving ? '...' : (current || '-');

    if (!canEdit) {
      return (
        <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-medium border border-gray-200/50 dark:border-slate-700/50">
          {label}: {display}
        </span>
      );
    }

    return (
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          title={`Klik untuk ubah ${label.toLowerCase()}`}
          className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg font-medium border border-gray-200/50 dark:border-slate-700/50 transition-colors flex items-center gap-1 cursor-pointer"
        >
          {label}: <span className="font-bold text-gray-700 dark:text-slate-200">{display}</span>
          <svg className="w-2.5 h-2.5 opacity-50 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-max max-w-xs">
            {options.map(opt => (
              <button
                key={opt} type="button" onClick={() => select(opt)}
                className={`w-full text-left px-3.5 py-2 text-[11px] font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-800 dark:text-slate-200 flex items-center justify-between gap-4 ${opt === current ? 'opacity-40 cursor-default pointer-events-none' : ''}`}
              >
                {opt}
                {opt === current && <span className="text-[9px] text-gray-400">aktif</span>}
              </button>
            ))}
          </div>
        )}
      </div>
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

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>

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
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/20 dark:bg-slate-950/10">
          {detailsLoading && !ticketDetails ? (
            <ReactLoader size="md" text="Loading ticket details..." />
          ) : ticketDetails ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (Employee profile, SLA values, Issue details) */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(ticketDetails.status)}
                  <PriorityDropdown ticketId={ticketDetails.id} current={ticketDetails.priority} />
                  <InlineDropdown
                    ticketId={ticketDetails.id}
                    field="category"
                    current={ticketDetails.category}
                    options={CATEGORIES}
                    label="Category"
                  />
                  {ticketDetails.subCategory && ticketDetails.subCategory !== '-' && (
                    <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-gray-200/50 dark:border-slate-700/50">
                      ({ticketDetails.subCategory})
                    </span>
                  )}
                  <InlineDropdown
                    ticketId={ticketDetails.id}
                    field="source"
                    current={ticketDetails.source || 'Walk-in'}
                    options={SOURCES}
                    label="Source"
                  />
                </div>

                <EmployeeInfoCard requester={ticketDetails.requester} company={ticketDetails.company} />

                <IncidentDeadlineCard 
                  ticketDetails={ticketDetails} 
                  user={user} 
                  onBypassClick={() => setShowOverrideDialog(true)}
                  onEditRespondedClick={handleOpenRespondedAtDialog}
                />

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issue Details</h4>
                  <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/40 rounded-2xl text-xs leading-relaxed whitespace-pre-line text-gray-700 dark:text-slate-350 shadow-sm max-h-60 overflow-y-auto font-medium">
                    {ticketDetails.description}
                  </div>
                </div>

              </div>

              {/* Right Column (Stepper, Agent inputs, audit logs) */}
              <div className="lg:col-span-5 space-y-6">
                
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

                {user.role !== 'USER' && (
                  <AgentActionSection 
                    ticketDetails={ticketDetails}
                    user={user}
                    agents={agents}
                    handleAssignAgent={handleAssignAgent}
                    handleStatusChange={handleStatusChange}
                  />
                )}

                <AuditLogList auditLogs={ticketDetails.auditLogs} />

              </div>

            </div>
          ) : null}
        </div>

      </div>

      {/* SLA Override Form Dialog */}
      {showOverrideDialog && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowOverrideDialog(false)}></div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 w-full max-w-md animate-scale-up">
            <div className="flex justify-between items-start gap-4 mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Bypass SLA Status</h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                  Manually override this ticket's SLA status to Met (On-Time).
                </p>
              </div>
              <button 
                onClick={() => setShowOverrideDialog(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {overrideError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 rounded-xl text-xs font-semibold">
                {overrideError}
              </div>
            )}

            <form onSubmit={handleSlaOverrideSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Reason for SLA Override</label>
                <textarea
                  required
                  placeholder="e.g. Menunggu vendor eksternal / pengadaan unit baru..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-855 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowOverrideDialog(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {overrideSubmitting ? 'Bypassing...' : 'Bypass SLA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit First Responded At Dialog */}
      {showRespondedAtDialog && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowRespondedAtDialog(false)}></div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 w-full max-w-md animate-scale-up">
            <div className="flex justify-between items-start gap-4 mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Edit First Responded At</h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                  Ubah waktu respon pertama tiket secara manual. Kosongkan tanggal untuk menghapus status respon.
                </p>
              </div>
              <button 
                onClick={() => setShowRespondedAtDialog(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {respondedAtError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 rounded-xl text-xs font-semibold">
                {respondedAtError}
              </div>
            )}

            <form onSubmit={handleRespondedAtSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Waktu Respon (First Responded At)</label>
                <input
                  type="datetime-local"
                  value={respondedAtInput}
                  onChange={(e) => setRespondedAtInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-855 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-semibold text-gray-800 dark:text-slate-200 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 font-medium block">
                  Format: Hari/Bulan/Tahun, Jam:Menit. Harus sesudah tanggal pembuatan tiket ({new Date(ticketDetails.createdAt).toLocaleString()}).
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Alasan Perubahan *</label>
                <textarea
                  required
                  placeholder="e.g. Koreksi manual waktu respon karena salah input status..."
                  value={respondedAtReason}
                  onChange={(e) => setRespondedAtReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-855 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowRespondedAtDialog(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={respondedAtSubmitting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {respondedAtSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
