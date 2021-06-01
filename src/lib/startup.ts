import { Colors, IvyEngine, StartupRunnable } from '@ilefa/ivy';

const TEXT = Colors.CYAN + `
\t      __    ____    _   _            _          
\t     / /   / /\\ \\  | | | | __ _  ___| | ___   _ 
\t    / /   / /  \\ \\ | |_| |/ _\` |/ __| |/ / | | |
\t    \\ \\  / /   / / |  _  | (_| | (__|   <| |_| |
\t     \\_\\\/_/   /_/  |_| |_|\\__,_|\\___|_|\\_\\\\__, |
\t                                          |___/ 
`;

export class StartupHandler implements StartupRunnable {
    
    run = ({ logger }: IvyEngine) => logger.unlisted(TEXT);

}