import env from '../env.json';
import CustomEventManager from './lib/events';

import { Client } from 'discord.js';
import { DataProvider } from './lib/data';
import { MongoDbManager } from './lib/db';
import { IvyEngine, Logger } from '@ilefa/ivy';

export default class HackyBot extends IvyEngine {
    
    constructor() {
        super({
            token: env.token,
            name: 'Hacky',
            logger: new Logger(),
            gitRepo: 'Hack-2/Hacky',
            superPerms: [
                '177167251986841600',
                '269988616887992320',
                '528588697994788885',
                '671809882659356692',
            ],
            reportErrors: [],
            color: 0x5084C4,
            provider: new DataProvider(),
            presence: {
                status: 'online',
                activity: {
                    type: 'PLAYING',
                    name: 'with robots.'
                }
            },
            discord: {
                partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
                fetchAllMembers: true,
            },
        })
    }

    onReady(_client: Client): void {
        this.registerEventHandler(new CustomEventManager(this, this.commandManager));        
    }

    registerCommands() {}

    registerModules() {
        this.registerModule(new MongoDbManager());
    }

    registerFlows() {}

}

new HackyBot();