import http from '@/lib/http';

export type GoogleCalendarStatus = {
  connected: boolean;
  email: string | null;
};

export const getGoogleCalendarStatus = () =>
  http<GoogleCalendarStatus>('/users/google/calendar/status');

export const getGoogleCalendarConnectUrl = () =>
  http<{ url: string }>('/users/google/calendar/connect');

export const disconnectGoogleCalendar = () =>
  http<void>('/users/google/calendar/disconnect', { method: 'DELETE' });

/**
 * Opens the consent flow in a popup and resolves when Google redirects back
 * to our backend callback. The callback HTML posts a message back to opener.
 */
export function openGoogleCalendarConsent(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const w = 520;
    const h = 640;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      url,
      'gcal_consent',
      `width=${w},height=${h},left=${left},top=${top}`,
    );
    if (!popup) {
      resolve(false);
      return;
    }

    let resolved = false;
    const onMessage = (ev: MessageEvent) => {
      if (!ev.data || ev.data.type !== 'gcal-connect') return;
      resolved = true;
      window.removeEventListener('message', onMessage);
      clearInterval(poll);
      resolve(Boolean(ev.data.success));
    };
    window.addEventListener('message', onMessage);

    // Fallback: if the popup is closed without a message, resolve false
    const poll = setInterval(() => {
      if (popup.closed && !resolved) {
        clearInterval(poll);
        window.removeEventListener('message', onMessage);
        resolve(false);
      }
    }, 500);
  });
}
