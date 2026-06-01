import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Loader2, AlertCircle, CheckCircle2, 
  Check, X, FileText, Laptop, CreditCard, Wifi, FolderTree, MessageSquare, Clock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ENTITY_ICONS = {
  ASSET: Laptop,
  SUBSCRIPTION: CreditCard,
  WIFI_AP: Wifi,
  CATEGORY: FolderTree
};

const ENTITY_LABELS = {
  ASSET: 'Hardware Asset',
  SUBSCRIPTION: 'IT Subscription',
  WIFI_AP: 'Wifi Access Point',
  CATEGORY: 'Category Detailing'
};

export default function Approvals({ user, token }) {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal / Action states
  const [activeRequest, setActiveRequest] = useState(null); // Request to approve/reject
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
  const [adminNotes, setAdminNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'ALL' 
        ? `${API_URL}/approvals` 
        : `${API_URL}/approvals?status=${statusFilter}`;
        
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch approval requests.');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (req, type) => {
    setActiveRequest(req);
    setActionType(type);
    setAdminNotes('');
  };

  const handleCloseActionModal = () => {
    setActiveRequest(null);
    setActionType(null);
    setAdminNotes('');
  };

  const handleProcessRequest = async (e) => {
    e.preventDefault();
    if (!activeRequest || !actionType) return;
    if (actionType === 'REJECT' && !adminNotes.trim()) {
      setError('Rejection notes / reason is mandatory.');
      return;
    }

    setActionSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const endpoint = actionType === 'APPROVE' ? 'approve' : 'reject';

    try {
      const res = await fetch(`${API_URL}/approvals/${activeRequest.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminNotes: adminNotes.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${actionType.toLowerCase()} request.`);

      setSuccessMsg(actionType === 'APPROVE' 
        ? 'Permintaan penghapusan berhasil disetujui dan data telah terhapus dari sistem.' 
        : 'Permintaan penghapusan berhasil ditolak.'
      );
      
      handleCloseActionModal();
      await fetchRequests();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-brand-500" />
            Delete Approval Requests
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
            {isAdmin 
              ? 'Review and approve/reject deletion requests for hardware assets, subscriptions, Wi-Fi APs, and categories submitted by IT Agents.' 
              : 'Track the status of deletion requests you have submitted to system administrators.'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3 animate-slide-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Panel Card */}
      <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-1.5 border-b border-gray-150 dark:border-slate-800/80 pb-3 flex-wrap">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 scale-102'
                  : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-650 dark:text-slate-350'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <span className="text-xs font-semibold">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center text-gray-450 dark:text-slate-500 text-xs font-medium space-y-2">
            <Clock className="w-8 h-8 mx-auto text-gray-300 dark:text-slate-700" />
            <p>No approval requests found for status "{statusFilter}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const Icon = ENTITY_ICONS[req.entityType] || FileText;
              return (
                <div 
                  key={req.id} 
                  className={`p-5 bg-white/70 dark:bg-slate-900/60 border rounded-3xl group transition-all duration-200 animate-fade-in ${
                    req.status === 'PENDING'
                      ? 'border-gray-200 dark:border-slate-800 hover:border-brand-500/30'
                      : req.status === 'APPROVED'
                      ? 'border-emerald-100 dark:border-emerald-950/20'
                      : 'border-red-100 dark:border-red-950/20'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Details Column */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{ENTITY_LABELS[req.entityType] || req.entityType}</span>
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${
                          req.status === 'PENDING' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' 
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {req.status}
                        </span>
                        
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(req.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-slate-100">
                          {req.entityName}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ID: <span className="font-mono">{req.entityId}</span>
                        </p>
                      </div>

                      {/* Requester agent details */}
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300 bg-gray-50/50 dark:bg-slate-900/30 px-3.5 py-2 rounded-xl w-fit">
                        <span className="font-semibold">Requested By Agent:</span>
                        <span>{req.requestedBy.name} ({req.requestedBy.email})</span>
                      </div>

                      {/* Reason */}
                      <div className="flex items-start gap-2 text-xs bg-brand-50/30 dark:bg-brand-950/5 p-3 rounded-2xl">
                        <MessageSquare className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-brand-700 dark:text-brand-400 text-[10px] uppercase tracking-wider">Delete Reason / Note</p>
                          <p className="text-gray-700 dark:text-slate-300 mt-0.5 font-medium">{req.reason || '-'}</p>
                        </div>
                      </div>

                      {/* Admin Decision Section */}
                      {req.status !== 'PENDING' && (
                        <div className={`flex flex-col gap-1 p-3 rounded-2xl text-xs ${
                          req.status === 'APPROVED' 
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/5 text-emerald-800 dark:text-emerald-400' 
                            : 'bg-red-50/30 dark:bg-red-950/5 text-red-800 dark:text-red-400'
                        }`}>
                          <p className="font-bold text-[10px] uppercase tracking-wider">
                            Admin Action & Notes
                          </p>
                          <p className="mt-0.5 text-gray-700 dark:text-slate-300 font-medium">
                            Reviewed by: <span className="font-bold">{req.handledBy?.name || 'System'}</span> on {new Date(req.updatedAt).toLocaleString('id-ID')}
                          </p>
                          <p className="mt-1 text-gray-850 dark:text-slate-200 italic font-semibold">
                            &ldquo;{req.adminNotes || '-'}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions Column (Admins only, PENDING status only) */}
                    {isAdmin && req.status === 'PENDING' && (
                      <div className="flex sm:flex-col items-center gap-2 self-center shrink-0">
                        <button
                          onClick={() => handleOpenActionModal(req, 'APPROVE')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Delete</span>
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(req, 'REJECT')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-650 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approve/Reject Notes Modal Dialogue Overlay */}
      {activeRequest && actionType && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-850">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-slate-100 flex items-center gap-2">
                {actionType === 'APPROVE' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Approve Deletion</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span>Reject Deletion Request</span>
                  </>
                )}
              </h3>
              <button 
                onClick={handleCloseActionModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xs font-semibold p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1.5">
              <p>You are performing action on request for:</p>
              <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200/40 dark:border-slate-850 text-gray-700 dark:text-slate-200 font-semibold text-xs leading-tight">
                {activeRequest.entityName}
              </div>
            </div>

            <form onSubmit={handleProcessRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                  Decision Notes / Reason {actionType === 'REJECT' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  required={actionType === 'REJECT'}
                  rows="3"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'APPROVE' 
                    ? 'e.g. Asset retired due to severe motherboard failure.' 
                    : 'Rejection reason is mandatory (e.g. Asset is still in active use).'
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-850 focus:border-brand-500 rounded-2xl text-gray-800 dark:text-slate-200 focus:outline-none text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={actionSubmitting || (actionType === 'REJECT' && !adminNotes.trim())}
                  className={`px-4 py-2 text-white font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center gap-1.5 disabled:opacity-50 ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10'
                      : 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
                  }`}
                >
                  {actionSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {actionType === 'APPROVE' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
