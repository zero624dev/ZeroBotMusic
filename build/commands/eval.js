"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importStar(require("discord.js"));
const classes_1 = require("../core/classes");
const util_1 = __importDefault(require("util"));
class Eval extends classes_1.Command {
    constructor(client) {
        super(client, {
            name: "eval",
            description: "Evaluate the code(TS).",
            options: [
                {
                    name: "code",
                    description: "The code to evaluate.",
                    type: discord_js_1.ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "silent",
                    description: "Whether to not send the output to the channel.",
                    type: discord_js_1.ApplicationCommandOptionType.Boolean,
                    required: false
                }
            ]
        }, {
            guilds: ["678566031874064394"],
            whitelist: ["532239959281893397"]
        });
    }
    async run(interaction) {
        return new Promise((resolve, reject) => {
            const Discord = discord_js_1.default;
            const code = interaction.options.getString("code", true);
            const silent = interaction.options.getBoolean("silent", false) ?? true;
            interaction.deferReply({ ephemeral: silent }).then(async () => {
                const startTime = performance.now();
                try {
                    let evaled = await eval(code);
                    if (typeof evaled == "string")
                        evaled = `"${evaled}"`;
                    else
                        evaled = util_1.default.inspect(evaled);
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
                }
                catch (err) {
                    const erorr = err;
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
exports.default = Eval;
