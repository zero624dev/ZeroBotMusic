"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const classes_1 = require("./core/classes");
const config = require('./config.json');
const client = new classes_1.ExtendedClient({
    intents: [
        "Guilds", "GuildVoiceStates", "GuildMembers", "GuildMessages"
    ]
}, config);
client.login(config.token);
process.on('uncaughtException', function (err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    console.error(err.stack);
});
