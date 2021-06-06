import env from '../../../env.json';
import scheduler from 'node-schedule';

import { TextChannel } from 'discord.js';
import { getCalendar, getClosestEvent, ICalEvent } from '../events/calendar';
import {
    count,
    getLatestTimeValue,
    isURL,
    link,
    Module,
    numberEnding,
    time
} from '@ilefa/ivy';

type AnnouncerEntry = {
    channel: string;
    calendar: string;
    interval: string;
    sendDiff: number;
    includeInCommand: boolean;
}

export class Announcer extends Module {

    entries: AnnouncerEntry[];
    events: Map<string, ICalEvent[]>;
    channels: Map<string, TextChannel>;
    allEvents: ICalEvent[];
    announced: ICalEvent[];
    jobs: scheduler.Job[];

    constructor() {
        super('Announcer');
    }

    async start() {
        let ctx = this;

        this.client.on('ready', async () => {
            for await (let { calendar, channel: channelId } of this.entries) {
                let channel = await this.resolveChannel(channelId);
                if (!channel) {
                    this.severe('Could not initialize the announcer module.');
                    this.severe(`The provided announcer channel [${channelId}] is not valid.`);
                    this.manager.unregisterModule(this);
                    return;
                }
                
                ctx.channels.set(calendar, channel);

                // Find all previously announced events and add them to,
                // the announced array so that they will not be repeated.
                let messages = await channel.messages.fetch();
                
                messages
                    .array()
                    .filter(message => message.author.id === message.guild.me.id)
                    .filter(message => message.embeds.length > 0)
                    .forEach(message => {
                        let match = ctx.allEvents.find(event => event.summary === message.embeds[0].title);
                        if (!match) return;
                        this.announced.push(match);
                    });
            }

            ctx.allEvents = this.flatten(Array.from(ctx.events.values()));
        });


        this.jobs = [];
        this.announced = [];
        this.events = new Map();
        this.channels = new Map();
        this.entries = env.announcer;

        for await (let { calendar } of this.entries) {
            let cal = await getCalendar(calendar);
            ctx.events.set(calendar, cal);
        }

        let total = this.getTotalEvents();
        this.log(`Loaded ${total} event${numberEnding(total)} for ${this.events.size} calendar${numberEnding(this.events.size)}.`);

        this.entries.forEach(({ calendar, interval, sendDiff }) => {
            this.jobs.push(scheduler.scheduleJob(interval, async _ => {
                let cur = await getCalendar(calendar);
                if (this.anyUpdates(ctx.events.get(calendar), cur))
                    ctx.events.set(calendar, cur);
    
                // Closest event has already elapsed.
                let closest = getClosestEvent(ctx.events.get(calendar));
                if (Date.now() - closest.start.getTime() > 0)
                    return;
                
                // sendDiff threshold not hit yet, not ready to announce.
                if (closest.start.getTime() - Date.now() > sendDiff)
                    return;
                
                // Closest event has already been announced.
                if (this.announced.some(event => event.uid === closest.uid))
                    return;
                            
                let channel = ctx.channels.get(calendar);
                channel.send(this.generateAnnouncement(closest));
                ctx.announced.push(closest);
            }));
        })
    }

    end = () => this.jobs ? this.jobs.forEach(ent => ent.cancel()) : {};

    private anyUpdates = (existing: ICalEvent[], fetched: ICalEvent[]) => {
        return !fetched.every(event => existing.includes(event));
    }

    private resolveChannel = async (id: string): Promise<TextChannel> => {
        let res = await this
            .manager
            .engine
            .client
            .channels
            .fetch(id, false);

        if (!res || res.type !== 'text')
            return null;

        return res as TextChannel;
    }

    private generateAnnouncement = (event: ICalEvent) => {
        return this.manager.engine.embeds.build(event.summary, env.icon, event.description ?? 'This event does not have a description.', [
            {
                name: 'Time',
                value: `${time(event.start.getTime(), 'h:mmA')} - ${time(event.end.getTime(), 'h:mmA')}`,
                inline: true
            },
            {
                name: 'Duration',
                value: getLatestTimeValue(event.end.getTime() - event.start.getTime()),
                inline: true
            },
            {
                name: 'Join Event',
                value: isURL(event.location)
                    ? link(':link: Click Here', event.location) 
                    : ':pushpin: There is no link for this event.',
                inline: true
            },
        ]);
    }

    private getTotalEvents = () => count(this.flatten(Array.from(this.events.values())), _ => true);

    private flatten = <T>(arr: T[][]) => arr.reduce((acc, val) => acc.concat(val), []);

}