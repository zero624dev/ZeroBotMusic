import { Shard, ShardingManager } from "discord.js";
import fs from "fs";

if (process.env.pm_out_log_path) fs.writeFileSync(process.env.pm_out_log_path, "");

// Create your ShardingManger instance
const manager = new ShardingManager(`${__dirname}/bot.ts`, {
    totalShards: 'auto',
    token: require("./config.json").token,
    execArgv: ['-r', 'ts-node/register']
});

// Emitted when a shard is created
manager.on('shardCreate', (shard: Shard) => {
    console.log(`Shard ${shard.id} launched`)
});

// Spawn your shards
manager.spawn();