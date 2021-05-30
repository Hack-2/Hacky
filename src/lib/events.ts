import { Message, TextChannel } from 'discord.js';
import { CommandManager, EventManager, IvyEngine } from '@ilefa/ivy';

export default class CustomEventManager extends EventManager {

    commandDeck: TextChannel;

    constructor(engine: IvyEngine, commandCenter: CommandManager) {
        super(engine);
        this.commandCenter = commandCenter;
    }

    async start() {
        const { client } = this;
        
        client.on('message', async (message: Message) => {
            if (message.author.bot) {
                return;
            }
            
            try {
                // somehow provider is null and throws an exception
                let data = await this.engine.provider.load(message.guild);
                if (!message.content.startsWith(data.prefix)) {
                    return;
                }
            
                this.commandCenter.handle(message.author, message);    
            } catch (_e) {}
        })
    }
    
    private _exceptionHandler = async (err: any) => {
        if (err.message.includes('Unknown Message')) {
            return;
        }

        this.engine.logger.except(err, 'Hacky', `Encountered a uncaught exception`);
        this.engine.logger.severe('Hacky', err.stack);
    } 

    onException = (err: any) => this._exceptionHandler(err);
    onRejection = (err: any) => this._exceptionHandler(err);

}