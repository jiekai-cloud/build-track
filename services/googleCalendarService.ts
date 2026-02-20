import { SystemCalendarEvent } from '../types';

class GoogleCalendarService {
    /**
     * Pushes a local event to Google Calendar
     * (Deprecated: System now uses Supabase Backend instead of Google Drive)
     */
    async syncEventToGoogle(event: SystemCalendarEvent): Promise<string | null> {
        console.warn('[Calendar] Google syncing is disabled because system uses Supabase.');
        return null;
    }

    /**
     * Deletes an event from Google Calendar
     * (Deprecated)
     */
    async deleteEventFromGoogle(googleEventId: string): Promise<boolean> {
        console.warn('[Calendar] Google syncing is disabled because system uses Supabase.');
        return true;
    }
}

export const googleCalendarService = new GoogleCalendarService();
