import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function TicketsSummaryEmptyState({ user }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center animate-fade-in">
      <style>{`
        @keyframes planeFloat {
          0%, 100% { transform: translate(220px, 48px) rotate(-10deg) scale(1); }
          50% { transform: translate(226px, 35px) rotate(-5deg) scale(1.05); }
        }
        @keyframes dashFlow { to { stroke-dashoffset: -20; } }
        @keyframes swayLeft { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-3deg); } }
        @keyframes swayRight { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(3deg); } }
        @keyframes cloudFloatLeft { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-4px); } }
        @keyframes cloudFloatRight { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
        .animate-plane-float { animation: planeFloat 4s ease-in-out infinite; }
        .animate-dash-flow { animation: dashFlow 1.2s linear infinite; }
        .animate-sway-left { animation: swayLeft 6s ease-in-out infinite; }
        .animate-sway-right { animation: swayRight 6s ease-in-out infinite; }
        .animate-cloud-left { animation: cloudFloatLeft 8s ease-in-out infinite; }
        .animate-cloud-right { animation: cloudFloatRight 10s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full max-w-sm h-48 flex items-center justify-center mb-4">
        <svg className="w-80 h-48" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g className="animate-cloud-left">
            <path d="M50 45C50 39.5 54.5 35 60 35C65.5 35 70 39.5 70 45C70 42.5 73.5 40 77 43C80.5 46 79 52 75 52H55C51 52 50 48.5 50 45Z" fill="#e2e8f0" fillOpacity="0.45" className="dark:fill-slate-800 dark:fill-opacity-40" />
          </g>
          <g className="animate-cloud-right">
            <path d="M230 65C230 59.5 234.5 55 240 55C245.5 55 250 59.5 250 65C250 62.5 253.5 60 257 63C260.5 66 259 72 255 72H235C231 72 230 68.5 230 65Z" fill="#e2e8f0" fillOpacity="0.45" className="dark:fill-slate-800 dark:fill-opacity-40" />
          </g>

          <g className="animate-sway-left origin-bottom" style={{ transformOrigin: '95px 150px' }}>
            <path d="M 95,150 Q 80,120 75,95" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" className="dark:stroke-emerald-950/30" />
            <path d="M 75,95 C 70,85 78,75 83,85 C 88,95 80,100 75,95 Z" fill="#d1fae5" className="dark:fill-emerald-900/30" />
            <path d="M 78,110 C 65,105 68,93 76,100 C 84,107 82,112 78,110 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
            <path d="M 85,115 C 95,110 95,98 87,105 C 79,112 81,117 85,115 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
            <path d="M 83,130 C 70,128 72,115 80,120 C 88,125 86,132 83,130 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
            <path d="M 90,135 C 100,133 98,120 90,125 C 82,130 85,137 90,135 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
          </g>

          <g className="animate-sway-right origin-bottom" style={{ transformOrigin: '225px 150px' }}>
            <path d="M 225,150 Q 240,120 245,95" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" className="dark:stroke-emerald-950/30" />
            <path d="M 245,95 C 250,85 242,75 237,85 C 232,95 240,100 245,95 Z" fill="#d1fae5" className="dark:fill-emerald-900/30" />
            <path d="M 242,110 C 255,105 252,93 244,100 C 236,107 238,112 242,110 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
            <path d="M 235,115 C 225,110 225,98 233,105 C 241,112 239,117 235,115 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
            <path d="M 237,130 C 250,128 248,115 240,120 C 232,125 234,132 237,130 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
            <path d="M 230,135 C 220,133 222,120 230,125 C 238,130 235,137 230,135 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
          </g>

          <path d="M 125,130 L 195,130 L 203,150 L 117,150 Z" fill="#a7f3d0" className="dark:fill-emerald-950/40" />
          <path d="M 160,125 C 135,105 160,85 180,95 C 200,105 210,65 220,53" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" strokeDashoffset="0" className="animate-dash-flow text-emerald-500" />

          <path d="M 117,150
                   L 142,150
                   C 145,150 147,152 148,155
                   L 151,163
                   C 153,167 156,169 159,169
                   C 162,169 165,167 167,163
                   L 170,155
                   C 171,152 173,150 176,150
                   L 203,150
                   L 196,176
                   C 195,179 191,182 187,182
                   L 133,182
                   C 129,182 125,179 124,176
                   Z"
                fill="#d1fae5"
                stroke="#34d399"
                strokeWidth="1.5"
                className="dark:fill-emerald-900/50 dark:stroke-emerald-500/20" />

          <g className="animate-plane-float">
            <path d="M -12,4 L 16,-10 L 0,10 Z" fill="#10b981" className="dark:fill-emerald-400" />
            <path d="M -12,4 L 0,10 L -4,18 Z" fill="#047857" className="dark:fill-emerald-600" />
            <path d="M 16,-10 L 0,10 L 6,-3 Z" fill="#34d399" className="dark:fill-emerald-300" />
          </g>
        </svg>
      </div>

      <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">No tickets found</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed font-medium">
        No tickets match your current filter criteria.<br />Try adjusting your filters or create a new ticket.
      </p>

      {['USER', 'ADMIN'].includes(user.role) && (
        <Link
          to="/input-ticket"
          className="mt-6 flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Ticket</span>
        </Link>
      )}
    </div>
  );
}
