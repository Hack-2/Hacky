import axios from 'axios';
import ical from 'node-ical';
import env from '../../../env.json';

export type ICalEvent = {
    type: string;
    params: any[];
    start: Date;
    datetype: string;
    end: Date;
    dtstamp: Date;
    uid: string;
    created: Date;
    description: string;
    lastmodified: Date;
    location: string;
    sequence: string;
    status: string;
    summary: string;
    transparency: string;
}

/**
 * Returns a list of ICalEvent objects in chronological order
 * as specified by their source calendar - if no argument is
 * supplied to this function, the ``calendar`` property of
 * the environment file is used instead.
 * 
 * @param id [optional] any link that returns an ICal-compatible payload
 */
export const getCalendar = async (id: string = env.calendar): Promise<ICalEvent[]> =>
    await axios
        .get(id)
        .then(res => res.data)
        .then(ics => ical.sync.parseICS(ics))
        .then(events => {
            let keys = Object.keys(events);
            return [...keys.map(key => events[key])] as unknown as ICalEvent[];
        });

/**
 * Returns the closest event to a supplied time (or `Date.now()`)
 * provided a list of `ICalEvents`.
 * 
 * @param events a list of events to compare
 * @param target the time to compare to
 */
export const getClosestEvent = (events: ICalEvent[], target: number | Date = Date.now()) => {
    if (target instanceof Date) 
        target = target.getTime();

    return events.reduce((prev, cur) => (Math.abs(cur.dtstamp.getTime() - (target as number)) < Math.abs(prev.dtstamp.getTime() - (target as number))) ? cur : prev);
}