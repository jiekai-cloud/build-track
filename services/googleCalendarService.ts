import { SystemCalendarEvent } from '../types';

declare const gapi: any;
declare const google: any;

class GoogleCalendarService {
    private isInitialized = false;
    private tokenClient: any = null;
    private accessToken: string | null = null;

    // Scopes for reading and writing to Google Calendar
    private SCOPES = 'https://www.googleapis.com/auth/calendar.events';
    private DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

    /**
     * Initialize Google API and Identity Services
     */
    async initService(clientId: string): Promise<boolean> {
        if (this.isInitialized) return true;

        return new Promise((resolve) => {
            const script1 = document.createElement('script');
            script1.src = "https://apis.google.com/js/api.js";
            script1.onload = () => {
                gapi.load('client', async () => {
                    await gapi.client.init({
                        discoveryDocs: [this.DISCOVERY_DOC],
                    });

                    const script2 = document.createElement('script');
                    script2.src = "https://accounts.google.com/gsi/client";
                    script2.onload = () => {
                        this.tokenClient = google.accounts.oauth2.initTokenClient({
                            client_id: clientId,
                            scope: this.SCOPES,
                            callback: (resp: any) => {
                                if (resp.error !== undefined) {
                                    console.error('GIS Error:', resp);
                                    return;
                                }
                                this.accessToken = resp.access_token;
                                localStorage.setItem('GOOGLE_CAL_TOKEN', resp.access_token);
                                resolve(true);
                            },
                        });
                        this.isInitialized = true;

                        // Check if we have a saved token
                        const savedToken = localStorage.getItem('GOOGLE_CAL_TOKEN');
                        if (savedToken) {
                            this.accessToken = savedToken;
                            gapi.client.setToken({ access_token: savedToken });
                        }

                        resolve(true);
                    };
                    document.body.appendChild(script2);
                });
            };
            document.body.appendChild(script1);
        });
    }

    /**
     * Request user authorization
     */
    async authorize(): Promise<void> {
        if (!this.tokenClient) return;

        // Request token (triggers popup)
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }

    /**
     * Check if the service is authorized
     */
    isAuthorized(): boolean {
        return !!this.accessToken;
    }

    /**
     * Sign out and clear tokens
     */
    signOut() {
        const token = localStorage.getItem('GOOGLE_CAL_TOKEN');
        if (token) {
            google.accounts.oauth2.revoke(token);
            localStorage.removeItem('GOOGLE_CAL_TOKEN');
        }
        this.accessToken = null;
    }

    /**
     * Sync local event to Google Calendar
     */
    async syncEventToGoogle(event: SystemCalendarEvent): Promise<string | null> {
        try {
            if (!this.accessToken) {
                console.warn('[Calendar] Not authorized with Google');
                return null;
            }

            const gEvent = {
                'summary': event.title,
                'location': event.location || '',
                'description': `${event.description || ''}\n\n(系統同步專案: ${event.projectId || '無'})`,
                'start': {
                    'dateTime': new Date(event.startDate).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': new Date(event.endDate || event.startDate).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'colorId': this.mapColorToGoogle(event.color)
            };

            let request;
            if (event.googleEventId) {
                // Update existing event
                request = gapi.client.calendar.events.update({
                    'calendarId': 'primary',
                    'eventId': event.googleEventId,
                    'resource': gEvent
                });
            } else {
                // Create new event
                request = gapi.client.calendar.events.insert({
                    'calendarId': 'primary',
                    'resource': gEvent
                });
            }

            const response = await request;
            console.log('[Calendar] Sync Success:', response.result.id);
            return response.result.id;
        } catch (e: any) {
            console.error('[Calendar] Sync Failed:', e);
            // Handle expired token
            if (e.status === 401) {
                this.signOut();
            }
            return null;
        }
    }

    /**
     * Delete event from Google
     */
    async deleteEventFromGoogle(googleEventId: string): Promise<boolean> {
        try {
            if (!this.accessToken) return true;

            await gapi.client.calendar.events.delete({
                'calendarId': 'primary',
                'eventId': googleEventId
            });
            return true;
        } catch (e) {
            console.error('[Calendar] Delete Failed:', e);
            return false;
        }
    }

    /**
     * Map system color classes to Google Calendar Color IDs
     */
    private mapColorToGoogle(colorClass: string): string {
        const map: Record<string, string> = {
            'bg-emerald-500': '10', // Basil
            'bg-rose-500': '11',    // Tomato
            'bg-amber-400': '5',     // Banana
            'bg-amber-500': '6',     // Tangerine
            'bg-red-500': '11',     // Tomato
            'bg-indigo-500': '9',    // Blueberry
            'bg-purple-500': '3',    // Grape
            'bg-sky-500': '7',       // Peacock
        };
        return map[colorClass] || '1';
    }
}

export const googleCalendarService = new GoogleCalendarService();
