import React from 'react';
import { QuestionStatus, PackageStatus, RiskLevel, AppRole } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs font-semibold';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-800 border border-red-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200',
    cyan: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-mono uppercase tracking-wide ${sizeClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

export const QuestionStatusBadge: React.FC<{ status: QuestionStatus }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return <Badge variant="success">Approved</Badge>;
    case 'UNDER_REVIEW':
      return <Badge variant="info">Under Review</Badge>;
    case 'NEEDS_REVISION':
      return <Badge variant="warning">Needs Revision</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Rejected</Badge>;
    case 'DRAFT':
    default:
      return <Badge variant="default">Draft</Badge>;
  }
};

export const PackageStatusBadge: React.FC<{ status: PackageStatus }> = ({ status }) => {
  switch (status) {
    case 'FINAL_LOCKED':
      return <Badge variant="success">Final Locked</Badge>;
    case 'PENDING_DUAL_CONFIRMATION':
      return <Badge variant="warning">Pending Dual Auth</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Rejected</Badge>;
    case 'DRAFT':
    default:
      return <Badge variant="default">Draft</Badge>;
  }
};

export const RiskBadge: React.FC<{ level: RiskLevel; score?: number }> = ({ level, score }) => {
  const displayLabel = level === 'HIGH_RISK' ? 'HIGH RISK' : level === 'UNDER_WATCH' ? 'UNDER WATCH' : 'NORMAL';
  const text = score !== undefined ? `${displayLabel} (${score}/100)` : displayLabel;
  switch (level) {
    case 'HIGH_RISK':
      return <Badge variant="danger">{text}</Badge>;
    case 'UNDER_WATCH':
      return <Badge variant="warning">{text}</Badge>;
    case 'NORMAL':
    default:
      return <Badge variant="success">{text}</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: AppRole }> = ({ role }) => {
  switch (role) {
    case 'SETTER':
      return <Badge variant="cyan">Question Setter</Badge>;
    case 'REVIEWER':
      return <Badge variant="purple">Reviewer</Badge>;
    case 'APPROVER':
      return <Badge variant="info">Approver</Badge>;
    case 'ADMIN_2':
      return <Badge variant="warning">Dual Admin</Badge>;
    case 'INVESTIGATOR':
      return <Badge variant="danger">Investigator</Badge>;
  }
};
