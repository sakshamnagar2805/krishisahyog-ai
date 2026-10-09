import React from 'react';
import { Lock } from 'lucide-react';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface AccessRestrictedProps {
  currentRole: UserRole;
  attemptedPage: string;
  onReturnToDashboard: () => void;
  onSwitchToAdmin: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: 'Farmer',
  pacs: 'PACS operator',
  officer: 'Agriculture officer',
  admin: 'Administrator',
};

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  currentRole,
  attemptedPage,
  onReturnToDashboard,
  onSwitchToAdmin,
}) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Card className="max-w-md w-full p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-soft text-navy">
        <Lock className="w-6 h-6" aria-hidden="true" />
      </span>
      <h1 className="font-display text-2xl font-semibold text-navy mt-4">You don't have access to this page</h1>
      <p className="text-[15px] text-muted mt-2">
        {attemptedPage} is only available to administrators. You are signed in as {ROLE_LABELS[currentRole].toLowerCase()}.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onReturnToDashboard}>Go to dashboard</Button>
        <Button variant="secondary" onClick={onSwitchToAdmin}>
          Switch to demo administrator
        </Button>
      </div>
    </Card>
  </div>
);
