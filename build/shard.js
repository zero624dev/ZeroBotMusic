"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
if (process.env.pm_out_log_path)
    fs_1.default.writeFileSync(process.env.pm_out_log_path, "");
// Create your ShardingManger instance
const botfile = fs_1.default.readdirSync(`${__dirname}`).find((file) => file.startsWith("bot"));
if (!botfile)
    throw new Error("No bot file found");
const manager = new discord_js_1.ShardingManager(`${__dirname}/${botfile}`, {
    totalShards: 'auto',
    token: require("./config.json").token,
    execArgv: botfile.endsWith(".ts") ? ['-r', 'ts-node/register'] : undefined
});
// Emitted when a shard is created
manager.on('shardCreate', (shard) => {
    console.log(`Shard ${shard.id} launched`);
});
// Spawn your shards
manager.spawn();
