import { Shard, ShardingManager } from "discord.js";
import fs from "fs";

if (process.env.pm_out_log_path) fs.writeFileSync(process.env.pm_out_log_path, "");

const botfile = fs.readdirSync(`${__dirname}`).find((file) => file.startsWith("bot"));
if (!botfile) throw new Error("No bot file found")

const manager = new ShardingManager(`${__dirname}/${botfile}`, {
    totalShards: 'auto',
    token: require("./config.json").token,
    execArgv: botfile.endsWith(".ts") ? ['-r', 'ts-node/register'] : undefined
});

manager.on('shardCreate', (shard: Shard) => {
    console.log(`Shard ${shard.id} launched`)
});

manager.spawn();