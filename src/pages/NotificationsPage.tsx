import React, { useState } from 'react';
import { ArrowRight, CheckCheck } from 'lucide-react';
import { Notification } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Button, Card, Chip, PageHeader } from '../components/ui';

interface NotificationsPageProps {
  notifications: Notification[];
  onNavigate: (route: string) => void;
  onMarkAllAsRead?: () => void;
  onToggleRead?: (id: string) => void;
}

type Filter = 'ALL' | 'UNREAD' | 'ACTION_REQUIRED';

const CATEGORY_LABEL: Record<Notification['category'], string> = {
  STATUTORY_ALERT: 'Official alert',
  CLAIM_UPDATE: 'Claim update',
  PACS_QUOTA: 'PACS quota',
  PACS_REQUEST: 'PACS request',
  GRIEVANCE_SLA: 'Grievance update',
  WEATHER_ADVISORY: 'Weather advisory',
};

const EMPTY_MESSAGE: Record<Filter, { title: string; description: string }> = {
  ALL: { title: 'No notifications yet', description: 'Updates about your claim, documents and PACS account will appear here.' },
  UNREAD: { title: 'No unread notifications', description: 'You have read all your updates.' },
  ACTION_REQUIRED: { title: 'Nothing needs your action', description: 'No updates are asking you to do something right now.' },
};

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onNavigate,
  onMarkAllAsRead,
  onToggleRead,
}) => {
  const [filter, setFilter] = useState<Filter>('ALL');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'ACTION_REQUIRED') return n.isUrgent;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => n.isUrgent).length;

  return (
    <div className="space-y-6" id="notifications-page-root">
      <PageHeader
        title="Notifications"
        description="Updates about your crop insurance claim, documents, grievances and PACS account."
        actions={
          onMarkAllAsRead && (
            <Button variant="secondary" onClick={onMarkAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="w-4 h-4" aria-hidden="true" /> Mark all as read
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter notifications">
        <Chip active={filter === 'ALL'} count={notifications.length} onClick={() => setFilter('ALL')}>
          All
        </Chip>
        <Chip active={filter === 'UNREAD'} count={unreadCount} onClick={() => setFilter('UNREAD')}>
          Unread
        </Chip>
        <Chip active={filter === 'ACTION_REQUIRED'} count={urgentCount} onClick={() => setFilter('ACTION_REQUIRED')}>
          Action required
        </Chip>
      </div>

      <Card className="overflow-hidden">
        {filteredNotifications.length > 0 ? (
          <ul className="divide-y divide-line">
            {filteredNotifications.map((notif) => (
              <li key={notif.id} className="flex gap-3 px-5 py-4">
                <span
                  className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notif.read ? 'bg-line' : notif.isUrgent ? 'bg-danger' : 'bg-brand'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-1 min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <p className={`text-navy leading-snug break-words ${notif.read ? 'font-medium' : 'font-semibold'}`}>
                      {notif.title}
                      {!notif.read && <span className="sr-only"> (unread)</span>}
                    </p>
                    <p className="text-[15px] text-ink mt-1 leading-relaxed break-words">{notif.message}</p>
                    <p className="text-[13px] text-muted mt-1.5">
                      {CATEGORY_LABEL[notif.category] ?? notif.category}
                      {notif.isUrgent && <span className="text-danger font-medium"> · Action required</span>}
                      {' · '}
                      {notif.timestamp}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 sm:self-center">
                    {onToggleRead && (
                      <Button variant="secondary" size="sm" onClick={() => onToggleRead(notif.id)}>
                        {notif.read ? 'Mark unread' : 'Mark read'}
                      </Button>
                    )}
                    {notif.actionRoute && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (!notif.read) onToggleRead?.(notif.id);
                          onNavigate(notif.actionRoute!);
                        }}
                      >
                        View <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={EMPTY_MESSAGE[filter].title}
            description={EMPTY_MESSAGE[filter].description}
            actionLabel={filter !== 'ALL' ? 'Show all notifications' : undefined}
            onAction={filter !== 'ALL' ? () => setFilter('ALL') : undefined}
          />
        )}
      </Card>
    </div>
  );
};
