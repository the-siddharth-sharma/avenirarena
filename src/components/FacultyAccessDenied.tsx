import React, { useState } from 'react';
import { ShieldAlert, GraduationCap, ArrowLeft, Mail, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '@/components/Card';

interface FacultyAccessDeniedProps {
  navigate: (path: string) => void;
}

export function FacultyAccessDenied({ navigate }: FacultyAccessDeniedProps) {
  const [requested, setRequested] = useState(false);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 border-red-500/30 bg-graphite/95 shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />
        
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
          <GraduationCap className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-red-500/10 border border-red-500/30 text-red-400">
            <Lock className="w-3 h-3" />
            FACULTY CLEARANCE REQUIRED
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-ivory">
            Academic Staff Portal Restricted
          </h2>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
            The Faculty Operations Center provides real-time cohort analytics, curriculum telemetry, and student progress telemetry. Access is strictly limited to verified faculty members and academic administrators.
          </p>
        </div>

        {requested ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Access Request Registered</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Your institutional profile has been submitted for faculty accreditation review. Academic administrators will verify your credentials within 24 hours.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-obsidian border border-line text-left space-y-2 text-xs text-muted">
            <div className="flex items-center gap-2 text-gold-400 font-mono font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Faculty Credential Verification
            </div>
            <p>
              Are you an instructor or academic coordinator? Request role accreditation with your institutional email address (@msot.edu or academic domain).
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto btn btn-secondary text-xs px-5 py-2.5 flex items-center justify-center gap-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
          </button>
          
          {!requested && (
            <button
              onClick={() => setRequested(true)}
              className="w-full sm:w-auto btn btn-primary text-xs px-5 py-2.5 flex items-center justify-center gap-2 font-mono"
            >
              <Mail className="w-3.5 h-3.5" /> Request Faculty Clearance
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
