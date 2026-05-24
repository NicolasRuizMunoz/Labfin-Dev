import http from '@/lib/http';

export interface OrgSettings {
  id: number;
  name: string;
  team_emails: string[];
}

export interface OrgSettingsUpdate {
  team_emails?: string[];
}

export const getMyOrg = () =>
  http<OrgSettings>('/organizations/me');

export const updateMyOrg = (data: OrgSettingsUpdate) =>
  http<OrgSettings>('/organizations/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
