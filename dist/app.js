"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const commands_1 = require("./src/commands");
const database_1 = require("./src/database/database");
const server_1 = require("./src/server");
(0, server_1.expressStart)();
const dbController = (0, database_1.databaseСontroller)();
dbController.createDB();
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => {
    dbController.addUser(ctx.message.from.id);
    ctx.reply(`Привет, ${ctx.message.from.first_name || 'нн'}`);
});
bot.help((ctx) => ctx.reply(commands_1.commandsDescription));
// GMT+3
// Europe/Kiev
node_cron_1.default.schedule('0 11 * * *', () => {
    sendPost();
}, {
    timezone: 'Europe/Kiev'
});
node_cron_1.default.schedule('0 22 * * *', () => {
    sendPost();
}, {
    timezone: 'Europe/Kiev'
});
let userId = undefined;
let currectCommand;
let processingNewPostChannelsStart = false;
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (ctx.from) {
        if (!userId) {
            userId = ctx.from.id;
        }
        if (!processingNewPostChannelsStart) {
            const userData = yield dbController.getUserById(userId);
            if (userData && userData.out_channel_id && userData.in_channel_id) {
                processingNewPostsChannels(ctx, userId);
            }
        }
    }
    next();
}));
bot.command('status', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        userId = getUserId(ctx);
    }
    if (userId) {
        const userData = yield dbController.getUserById(userId);
        if (userData) {
            const outChannel = yield ctx.telegram.getChat(`${userData.out_channel_id}`);
            const inChannel = yield ctx.telegram.getChat(`${userData.in_channel_id}`);
            ctx.reply(`
Группа из которой будут копироваться посты: ${outChannel === null || outChannel === void 0 ? void 0 : outChannel.title};
Группа в которую будут копироваться посты: ${inChannel === null || inChannel === void 0 ? void 0 : inChannel.title};
      `);
        }
    }
}));
bot.command('outchannel', (ctx) => {
    currectCommand = 'outchannel';
    ctx.reply('Введите ссылку на группу');
});
bot.command('inchannel', (ctx) => {
    currectCommand = 'inchannel';
    ctx.reply('Введите ссылку на группу');
});
bot.command('sendpost', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        userId = getUserId(ctx);
    }
    sendPost();
}));
bot.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        userId = getUserId(ctx);
    }
    if (currectCommand === 'outchannel') {
        const outChannel = {};
        outChannel.link = ctx.message.text;
        yield ctx.reply('Подождите загрузку данных');
        if (outChannel.link) {
            outChannel.id = yield returnChannelId(ctx, outChannel.link);
            if (outChannel.id) {
                dbController.updateUserOutChannelId(outChannel.id, userId);
                outChannel.title = yield returnChannelTitle(ctx, outChannel.id);
            }
        }
        ctx.reply(`${outChannel.title}: \n${outChannel.id} \n${outChannel.link} \n\n Загрузка данных завершена`);
    }
    else if (currectCommand === 'inchannel') {
        const inChannel = {};
        inChannel.link = ctx.message.text;
        yield ctx.reply('Подождите загрузку данных');
        if (inChannel.link) {
            inChannel.id = yield returnChannelId(ctx, inChannel.link);
            if (inChannel.id) {
                dbController.updateUserInChannelId(inChannel.id, userId);
                inChannel.title = yield returnChannelTitle(ctx, inChannel.id);
            }
        }
        ctx.reply(`${inChannel.title}: \n${inChannel.id} \n${inChannel.link} \n\n Загрузка данных завершена`);
    }
    else {
        ctx.reply('Неизвестная комманда. Используйте /help для просмотра списка комманд');
    }
    currectCommand = '';
}));
function returnChannelId(ctx, link) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!userId) {
            userId = getUserId(ctx);
        }
        if (link) {
            const channelName = "@" + extractChannelName(link);
            if (channelName) {
                const post = yield ctx.telegram.sendMessage(channelName, 'test \n#botTest');
                const postId = post.message_id;
                const channelId = post.chat.id;
                if (channelId) {
                    ctx.telegram.deleteMessage(channelId, postId);
                    return channelId;
                }
                else {
                    ctx.reply('Не удалось получить ID канала');
                }
            }
            else {
                ctx.reply('Не удалось извлечь Name канала из ссылки');
            }
        }
        else {
            ctx.reply(`Не удалось подключиться к ${link}. Проверьте задан ли outChannel и является ли он публичным`);
        }
    });
}
function returnChannelTitle(ctx, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chat = yield ctx.telegram.getChat(id);
            return chat.title;
        }
        catch (error) {
            console.error(error);
            ctx.reply('Произошла ошибка при получении информации о канале.');
        }
    });
}
function extractChannelName(inviteLink) {
    const match = inviteLink.match(/t.me\/(.+)/);
    if (match && match[1]) {
        return match[1];
    }
    else {
        return null;
    }
}
function processingNewPostsChannels(ctx, userId, hashtag = '#botsend') {
    return __awaiter(this, void 0, void 0, function* () {
        processingNewPostChannelsStart = true;
        if (!userId) {
            userId = getUserId(ctx);
        }
        const userData = yield dbController.getUserById(userId);
        if (userData) {
            bot.on('channel_post', (ctx) => __awaiter(this, void 0, void 0, function* () {
                const channelId = ctx.update.channel_post.chat.id;
                const messageId = ctx.update.channel_post.message_id;
                if (userData.out_channel_id === channelId) {
                    const channelPost = ctx.update.channel_post;
                    const text = channelPost.text || '';
                    if (text.includes(hashtag)) {
                        const userPostIds = yield dbController.getUserIdsArr(userId);
                        userPostIds.push(channelPost.message_id);
                        dbController.updateUserPostIds(userPostIds, userId);
                        if (!text.includes('#notrim')) {
                            ctx.telegram.editMessageText(channelId, messageId, undefined, text.replace(hashtag, '').trim());
                        }
                        else {
                            ctx.telegram.editMessageText(channelId, messageId, undefined, text.replace(hashtag, ''));
                            ctx.telegram.editMessageText(channelId, messageId, undefined, text.replace('#notrim', ''));
                        }
                    }
                }
            }));
        }
    });
}
function getUserId(ctx) {
    return ctx.message.from.id;
}
function sendPost() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!userId) {
            userId = (_a = bot.context.from) === null || _a === void 0 ? void 0 : _a.id;
            console.log(userId);
        }
        const idsArr = yield dbController.getUserIdsArr(userId);
        if (idsArr.length) {
            const userData = yield dbController.getUserById(userId);
            if (userData) {
                for (let i = 0; i < idsArr.length; i++) {
                    try {
                        yield bot.telegram.copyMessage(userData.in_channel_id, userData.out_channel_id, idsArr[0]);
                        yield bot.telegram.deleteMessage(userData.out_channel_id, idsArr[0]);
                        idsArr.shift();
                        dbController.updateUserPostIds(idsArr, userId);
                        break;
                    }
                    catch (_b) {
                        if (i === idsArr.length - 1) {
                            bot.telegram.sendMessage(userData.id, 'Нет постов для отправки');
                        }
                        idsArr.shift();
                        dbController.updateUserPostIds(idsArr, userId);
                        continue;
                    }
                }
            }
        }
        else {
            const userData = yield dbController.getUserById(userId);
            if (userData) {
                bot.telegram.sendMessage(userData.id, 'Нет постов для отправки');
            }
        }
    });
}
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
