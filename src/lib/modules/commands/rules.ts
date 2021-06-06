import { ICON } from '../../../app';
import { Message, Permissions, User } from 'discord.js';
import { Command, CommandReturn, conforms, emboss } from '@ilefa/ivy';

export class RulesCommand extends Command {

    constructor() {
        super('rules', `Invalid usage: ${emboss('.rules [#target]')}`, null, [], Permissions.FLAGS.ADMINISTRATOR, true, false, ['Director']);
    }

    async execute(user: User, message: Message, args: string[]): Promise<CommandReturn> {
        if (args.length > 1)
            return CommandReturn.HELP_MENU;

        if (args[0] && !conforms(/<#\d{10,}>/, args[0])) {
            message.reply(this.embeds.build('.rules | Error', ICON, `Invalid target channel: ${emboss(args[0])}`, [], message))
            return CommandReturn.EXIT;
        }

        let target = message.channel.id;
        if (args[0]) target = args[0].split(/<#(\d{10,})>/)[1];

        // TODO: Write up some embeds for rules
        // let rules = ...;
        // let channel = await this.engine.findChannel(target);
        // channel.send(rules);

        return CommandReturn.EXIT;
    }

}