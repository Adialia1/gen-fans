import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'כרגע';
  if (diffInSeconds < 3600)
    return `לפני ${Math.floor(diffInSeconds / 60)} דקות`;
  if (diffInSeconds < 86400)
    return `לפני ${Math.floor(diffInSeconds / 3600)} שעות`;
  if (diffInSeconds < 604800)
    return `לפני ${Math.floor(diffInSeconds / 86400)} ימים`;
  return date.toLocaleDateString('he-IL');
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'נרשמתם למערכת';
    case ActivityType.SIGN_IN:
      return 'התחברתם למערכת';
    case ActivityType.SIGN_OUT:
      return 'התנתקתם מהמערכת';
    case ActivityType.UPDATE_PASSWORD:
      return 'שיניתם את הסיסמה';
    case ActivityType.DELETE_ACCOUNT:
      return 'מחקתם את החשבון';
    case ActivityType.UPDATE_ACCOUNT:
      return 'עדכנתם את החשבון';
    case ActivityType.CREATE_TEAM:
      return 'יצרתם צוות חדש';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'הסרתם חבר צוות';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'הזמנתם חבר צוות';
    case ActivityType.ACCEPT_INVITATION:
      return 'קיבלתם הזמנה';
    default:
      return 'פעולה לא ידועה';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-bold mb-6 text-right bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] bg-clip-text text-transparent">
        יומן פעילות
      </h1>
      <Card className="border-pink-100">
        <CardHeader>
          <CardTitle className="text-right">פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType
                );

                return (
                  <li key={log.id} className="flex items-center gap-4">
                    <div className="bg-pink-100 rounded-full p-2 flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#fb6f92]" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` מכתובת IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-[#fb6f92] mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                אין עדיין פעילות
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                כשתבצעו פעולות כמו התחברות או עדכון החשבון, הן יופיעו כאן.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
