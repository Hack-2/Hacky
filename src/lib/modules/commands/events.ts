import { ICON } from '../../../app';
import { Announcer } from '../announcer';
import { ICalEvent } from '../../events/calendar';
import { Message, Permissions, TextChannel, User } from 'discord.js';

import {
    bold,
    Command,
    CommandReturn,
    cond,
    emboss,
    isURL,
    join,
    link,
    PageContent,
    PaginatedEmbed,
    time
} from '@ilefa/ivy';

export class EventsCommand extends Command {
    
    constructor() {
        super('events', `Invalid usage: ${emboss('.events')}`, null, [], Permissions.FLAGS.SEND_MESSAGES, false);
    }
    
    async execute(user: User, message: Message, args: string[]): Promise<CommandReturn> {
        if (args.length > 0)
            return CommandReturn.HELP_MENU;

        let announcer = this.engine.moduleManager.require<Announcer>('Announcer');
        if (!announcer) {
            message.reply(this.embeds.build('Hack^2 Events', ICON, `:warning: Something went wrong while retrieving data from the web, please try again later.`, [], message))
            return CommandReturn.EXIT;
        }

        if (!announcer.events) {
            message.reply(this.embeds.build('Hack^2 Events', ICON, ':pencil: No events are currently scheduled, check again later.'))
            return CommandReturn.EXIT;
        }

        let transform = (pageContent: ICalEvent[]): PageContent => {
            let description = join(pageContent, '\n', event => {
                let raw = event.description;
                if (!raw) raw = 'This event does not have a description.';

                let descLen = Math.min(500, raw.length);
                let desc = raw.slice(0, descLen) + (descLen < event.description.length ? '..' : '');
                return `${cond(isURL(event.location), link(event.summary, event.location), bold(event.summary))} (${this.generateDate(event)} ${time(event.start.getTime(), 'h:mmA')} - ${time(event.end.getTime(), 'h:mmA')})\n` 
                     + `${desc}\n`;
            });

            return {
                description,
                fields: []
            }
        }

        let events = this.flatten(Array.from(announcer.events.entries(),
            ([k, v]) => {
                return {
                    calendar: k,
                    entry: announcer.entries.find(ent => ent.calendar === k),
                    events: v
                }
            })
            .filter(ent => ent.entry.includeInCommand)
            .map(ent => ent.events))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        PaginatedEmbed.ofItems<ICalEvent>(
            this.engine, message.channel as TextChannel,
            user, 'Hack^2 Events', ICON, events,
            3, transform, 120000, null, '#7DCBB3', '#5084C4');

        return CommandReturn.EXIT;
    }

    private generateDate = ({ start }: ICalEvent) => {
        let now = new Date();
        if (start.getMonth() === now.getMonth()
            && start.getDate() === now.getDate())
                return 'Today';

        return time(start.getTime(), 'MMMM Do [from]');
    }

    private flatten = <T>(arr: T[][]) => arr.reduce((acc, val) => acc.concat(val), []);

}