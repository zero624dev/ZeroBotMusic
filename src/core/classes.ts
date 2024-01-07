import {
    ApplicationCommandData,
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    ClientOptions,
    Collection,
    InteractionReplyOptions,
    InteractionUpdateOptions,
    MessagePayload,
    ModalSubmitInteraction,
    PermissionResolvable,
    StringSelectMenuInteraction,
} from 'discord.js';
import { DisTube } from 'distube';
import fs from 'fs';
import path from 'path';
import Utils from './utils';
import MusicManager from './music';

type CommandOptions = {
    guilds?: string[];
    whitelist?: string[];
    permissions?: PermissionResolvable[];
}

export abstract class Command {
    client: ExtendedClient;
    data: ApplicationCommandData;
    options: CommandOptions;
    constructor(client: ExtendedClient, data: ApplicationCommandData, options?: CommandOptions) {
        this.client = client;
        this.data = data;
        this.options = options ?? {};
    }
    public abstract run(message: ChatInputCommandInteraction): Promise<string | MessagePayload | InteractionReplyOptions>;
    public button?(interaction: ButtonInteraction, args: string[]): Promise<string | MessagePayload | InteractionUpdateOptions>;
    public modalSubmit?(interaction: ModalSubmitInteraction, args: string[]): void;
    public stringSelect?(interaction: StringSelectMenuInteraction, args: string[]): Promise<string | MessagePayload | InteractionUpdateOptions>;
    public autocomplete?(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[]>;
}

export class ExtendedClient extends Client {
    cache: {
        commands: Collection<string, Command>
    };
    config: {
        token: string
        accentColor: number
        errorColor: number
    };
    utils: Utils;
    music: MusicManager;

    constructor(options: ClientOptions, config: ExtendedClient['config']) {
        super(options);

        this.cache = {
            commands: new Collection<string, Command>()
        }
        this.config = config;
        this.utils = new Utils(this);
        this.music = new MusicManager(this, {
            leaveOnEmpty: false,
            leaveOnStop: false,
            streamType: 1
        });

        this.on('ready', async () => {
            console.log(`Bot started on ${process.pid}`);

            this.loadEvents();
            this.loadCommands();
        });
    }

    private loadEvents() {
        const eventDir = path.join(__dirname, '../events');
        fs.readdirSync(eventDir).forEach(event => {
            try {
                this.on(event.slice(0, -3), (...args: any) => (require(`${eventDir}/${event}`)).run(this, ...args));
            } catch (e) {
                console.error(`${eventDir}/${event}\n`, e);
            }
        });
    }

    private loadCommands() {
        const commandDir = path.join(__dirname, '../commands');
        this.cache.commands = new Collection<string, Command>();

        const commandData: {
            [key: string]: ApplicationCommandData[]
        } = {
            global: []
        };

        fs.readdirSync(commandDir).forEach(cmd => {
            try {
                const command: Command = new (require(`${commandDir}/${cmd}`).default)(this);
                this.cache.commands.set(command.data.name, command);
                if (command.options.guilds?.length) {
                    command.options.guilds.forEach(guildId => {
                        if (!commandData[guildId]) commandData[guildId] = [];
                        commandData[guildId].push(command.data);

                    })
                } else {
                    commandData.global.push(command.data);
                }
            } catch (e) {
                console.error(`${commandDir}/${cmd}\n`, e);
            }
        });

        Object.entries(commandData).forEach(([key, value]) => {
            if (key == "global") {
                this.application?.commands.set(value);
            } else {
                this.application?.commands.set(value, key);
            }
        });
    }
}