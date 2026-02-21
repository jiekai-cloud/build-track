import { useState, useEffect } from 'react';

export interface TaiwanHoliday {
    date: string; // YYYYMMDD
    week: string;
    isHoliday: boolean;
    description: string;
}

export function useTaiwanHolidays(year: number) {
    const [holidays, setHolidays] = useState<Record<string, TaiwanHoliday>>({});

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const res = await fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`);
                if (!res.ok) return;
                const data: TaiwanHoliday[] = await res.json();

                const holidayMap: Record<string, TaiwanHoliday> = {};
                data.forEach(item => {
                    holidayMap[item.date] = item;
                });

                setHolidays(holidayMap);
            } catch (err) {
                console.error("Failed to fetch Taiwan holidays:", err);
            }
        };

        fetchHolidays();
    }, [year]);

    return holidays;
}
