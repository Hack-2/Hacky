import axios from 'axios';
import ical from 'node-ical';
import env from '../../../env.json';

import { replaceAll } from '@ilefa/ivy';

export type ICalEvent = {
    type: string;
    params: any[];
    start: Date;
    datetype: string;
    end: Date;
    dtstamp: Date;
    organizer?: ICalEventOrganizer;
    uid: string;
    attendee?: ICalEventAttendee[];
    created: Date;
    description: string;
    lastmodified: Date;
    location: string;
    sequence: string;
    status: string;
    summary: string;
    transparency: string;
}

export type ICalEventOrganizer = {
    params: {
        CN: string;
    };
    val: string;
}

export type ICalEventAttendee = {
    params: any[];
    val: string;
}

type SearchAndReplace = {
    search: string | RegExp;
    replacement: string;
    useRegularReplace?: boolean;
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
        .then(events => [...Object.keys(events).map(key => events[key])] as unknown as ICalEvent[])
        .then(events => events.map(event => {
            return {
                ...event,
                description: replace(event.description, [
                    {
                        search: '<br>',
                        replacement: '\n'
                    },
                    {
                        search: '&nbsp;',
                        replacement: ''
                    },
                    {
                        search: /<\/{0,1}b>/,
                        replacement: '**'
                    },
                    {
                        search: /<\/{0,1}i>/,
                        replacement: '*'
                    },
                    {
                        search: /<\/{0,1}u>/,
                        replacement: '__'
                    },
                    {
                        search: /<a href=([a-zA-Z0-9:/.']+)\s?[a-zA-Z0-9:/\s.'=_]+>([a-zA-Z0-9\s.'=_]+)<\/a>/g,
                        replacement: '[$2]($1)',
                        useRegularReplace: true
                    }
                ])
            }
        }));

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

const replace = (str: string, replacements: SearchAndReplace[]) => {
    let temp = str.slice();
    for (let { search, replacement, useRegularReplace } of replacements) {
        if (!useRegularReplace) {
            temp = _replaceAll(temp, search, replacement);
            continue;
        }

        temp = temp.replace(search, replacement);
    }

    return temp;
}

const _replaceAll = (input: string, search: string | RegExp, replace: string) => {
    if (!(search instanceof RegExp))
        return replaceAll(input, search, replace);
    
    let copy = input.slice();
    if (!search.test(input))
        return copy;

    while (search.test(copy))
        copy = copy.replace(search, replace);

    return copy;
}