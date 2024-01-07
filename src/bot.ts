import { ExtendedClient } from './core/classes';

const config = require('./config.json');

const client = new ExtendedClient({
    intents: [
        "Guilds", "GuildVoiceStates", "GuildMembers", "GuildMessages"
    ]
}, config);

client.login(config.token);

process.on('uncaughtException', function (err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    console.error(err.stack);
});
