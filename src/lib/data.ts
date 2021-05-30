import { Guild } from 'discord.js';
import { GuildDataProvider, GuildTokenLike } from '@ilefa/ivy';

export class DataProvider implements GuildDataProvider<GuildTokenLike> {
    
    load = async (guild: Guild): Promise<GuildTokenLike> => {
        return {
            prefix: '.'
        }
    }
    
    save = (guild: Guild, data: GuildTokenLike) => {}

}