import env from '../../../env.json';
import scheduler from 'node-schedule';

import { TextChannel } from 'discord.js';
import { getCalendar, getClosestEvent, ICalEvent } from '../events/calendar';
import { getLatestTimeValue, isURL, link, Module, numberEnding, time } from '@ilefa/ivy';

export class Announcer extends Module {

    channel: TextChannel;
    events: ICalEvent[];
    announced: ICalEvent[];
    job: scheduler.Job;

    constructor() {
        super('Announcer');
    }

    async start() {
        let ctx = this;

        this.client.on('ready', async () => {
            let channel = await this.resolveChannel(env.announcer.channel);
            if (!channel) {
                this.error('Could not initialize the announcer module.');
                this.error(`The provided announcer channel [${env.announcer.channel}] is not valid.`);
                this.manager.unregisterModule(this);
                return;
            }
            
            // Find all previously announced events and add them to,
            // the announced array so that they will not be repeated.
            let messages = await channel.messages.fetch();
            messages
                .array()
                .filter(message => message.author.id === message.guild.me.id)
                .filter(message => message.embeds.length > 0)
                .forEach(message => {
                    let match = ctx.events.find(event => event.summary === message.embeds[0].title);
                    if (!match) return;
                    this.announced.push(match);
                });

            ctx.channel = channel;
        })

        this.announced = [];
        this.events = await getCalendar();
        this.log(`Loaded ${this.events.length} event${numberEnding(this.events.length)} from the calendar.`);

        this.job = scheduler.scheduleJob(env.announcer.interval, async _ => {
            // Check if the calendar has been updated since the last check.
            let cur = await getCalendar();
            if (this.anyUpdates(ctx.events, cur))
                ctx.events = cur;

            // Closest event has already elapsed.
            let closest = getClosestEvent(ctx.events);
            if (Date.now() - closest.start.getTime() > 0)
                return;
            
            // sendDiff threshold not hit yet, not ready to announce.
            if (closest.start.getTime() - Date.now() > env.announcer.sendDiff)
                return;
            
            // Closest event has already been announced.
            if (this.announced.some(event => event.uid === closest.uid))
                return;
                        
            this.announced.push(closest);
            this.channel.send(this.generateAnnouncement(closest));
        });
    }

    end = () => this.job ? this.job.cancel() : {};

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
        console.log(event)
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

    private log = (message: string) => this.manager.engine.logger.info('Announcer', message);
    private error = (message: string) => this.manager.engine.logger.severe('Announcer', message);

}