import { googleDriveService } from './googleDriveService';
import { SystemCalendarEvent } from '../types';

class GoogleCalendarService {
    /**
     * Pushes a local event to Google Calendar
     * @param event The system calendar event
     * @returns The generated Google Event ID, or null if failed
     */
    async syncEventToGoogle(event: SystemCalendarEvent): Promise<string | null> {
        try {
            const token = await googleDriveService.getValidAccessToken(false);

            const payload = {
                summary: event.title,
                description: event.description || '',
                start: { dateTime: new Date(event.startDate).toISOString() },
                end: { dateTime: new Date(event.endDate).toISOString() },
            };

            let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
            let method = 'POST';

            if (event.googleEventId) {
                url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleEventId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                // If 404 on PUT, it was likely deleted on Google Calendar. Re-create it.
                if (res.status === 404 && method === 'PUT') {
                    console.log('[Calendar] Event not found, attempting recreation');
                    const backupRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    if (backupRes.ok) {
                        const data = await backupRes.json();
                        return data.id;
                    }
                }
                console.error('[Calendar] Failed to sync event', await res.text());
                return null;
            }

            const data = await res.json();
            return data.id;
        } catch (e) {
            console.error('[Calendar] Sync Exception:', e);
            return null;
        }
    }

    /**
     * Deletes an event from Google Calendar
     */
    async deleteEventFromGoogle(googleEventId: string): Promise<boolean> {
        if (!googleEventId) return false;
        try {
            const token = await googleDriveService.getValidAccessToken(false);
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res.ok || res.status === 404; // Consider 404 as successful deletion
        } catch (e) {
            console.error('[Calendar] Delete Exception:', e);
            return false;
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();
