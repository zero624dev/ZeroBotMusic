import discord, { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";
import { Command } from "../core/classes";
import util from 'util';

export default class Eval extends Command {
    constructor(client: any) {
        super(client, {
            name: "eval",
            description: "Evaluate the code(TS).",
            options: [
                {
                    name: "code",
                    description: "The code to evaluate.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "silent",
                    description: "Whether to not send the output to the channel.",
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        }, {
            guilds: ["678566031874064394"],
            whitelist: ["532239959281893397"]
        });
    }

    async run(interaction: ChatInputCommandInteraction) {
        return new Promise<InteractionReplyOptions>((resolve, reject) => {
            const Discord = discord;
            const code: string = interaction.options.getString("code", true);
            const silent: boolean = interaction.options.getBoolean("silent", false) ?? true;

            interaction.deferReply({ ephemeral: silent }).then(async () => {
                const startTime: number = performance.now();
                try {
                    let evaled = await eval(code);
                    if (typeof evaled == "string") evaled = `"${evaled}"`;
                    else evaled = util.inspect(evaled);
                    resolve({
                        embeds: [
                            {
                                title: "Eval",
                                fields: [
                                    { name: "Input", value: `\`\`\`ts\n${code}\`\`\``, inline: false },
                                    { name: "Output", value: `\`\`\`js\n${evaled.length > 1000 ? `${evaled.slice(0, 1000)}\n\n...` : evaled}\`\`\``, inline: false },
                                ],
                                footer: { text: `${(performance.now() - startTime).toFixed(1)}ms` },
                                color: this.client.config.accentColor
                            }
                        ],
                        ephemeral: silent
                    });
                } catch (err) {
                    const erorr: string = err as string;
                    resolve({
                        embeds: [
                            {
                                title: "Eval Error",
                                fields: [
                                    { name: "Input", value: `\`\`\`ts\n${code}\`\`\``, inline: false },
                                    { name: "Output", value: `\`\`\`js\n${erorr.length > 1000 ? `${erorr.slice(0, 1000)}\n\n...` : erorr}\`\`\``, inline: false },
                                ],
                                footer: { text: `${(performance.now() - startTime).toFixed(1)}ms` },
                                color: this.client.config.errorColor
                            }
                        ],
                        ephemeral: silent
                    });
                }
            });
        });
    }
}