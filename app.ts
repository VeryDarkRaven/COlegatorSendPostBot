import { Telegraf } from "telegraf"
import { Chat } from "telegraf/typings/core/types/typegram";

import cron from "node-cron";

import dotenv from 'dotenv';
dotenv.config();

import { commandsDescription } from "./src/commands";
import { TypeContext, TypeChannelPostWithText, IChannel, IDBUser } from "./src/types";

import { databaseСontroller } from "./src/database/database";





const dbController = databaseСontroller();
dbController.createDB();




const bot: Telegraf = new Telegraf(process.env.BOT_TOKEN as string)
bot.start((ctx) => {
  dbController.addUser(ctx.message.from.id);

  ctx.reply(`Привет, ${ctx.message.from.first_name || 'нн'}`)
})
bot.help((ctx) => ctx.reply(commandsDescription))



// GMT+3
// Europe/Kiev

cron.schedule('0 11 * * *', () => {
  sendPost();
}, {
  timezone: 'Europe/Kiev'
})

cron.schedule('0 22 * * *', () => {
  sendPost();
}, {
  timezone: 'Europe/Kiev'
})



let userId: number | undefined = undefined;
let currectCommand: string;
let processingNewPostChannelsStart: boolean = false;



bot.use(async (ctx, next) => {
  if (ctx.from) {
    if (!userId) {
      userId = ctx.from.id;
    }
  
    if (!processingNewPostChannelsStart) {
      const userData: IDBUser | undefined = await dbController.getUserById(userId);

      if (userData && userData.out_channel_id && userData.in_channel_id) {
        processingNewPostsChannels(ctx as TypeContext, userId);
      }
    }
  }

  next();
})



bot.command('status', async (ctx) => {
  if (!userId) {
    userId = getUserId(ctx) as number;
  }
  
  if (userId) {
    const userData = await dbController.getUserById(userId);

    if (userData) {
      const outChannel: Chat.ChannelGetChat = await ctx.telegram.getChat(`${userData.out_channel_id}`) as Chat.ChannelGetChat;
      const inChannel: Chat.ChannelGetChat = await ctx.telegram.getChat(`${userData.in_channel_id}`) as Chat.ChannelGetChat;

      ctx.reply(`
Группа из которой будут копироваться посты: ${outChannel?.title};
Группа в которую будут копироваться посты: ${inChannel?.title};
      `);
    }
  }
})

bot.command('outchannel', (ctx) => {
  currectCommand = 'outchannel';

  ctx.reply('Введите ссылку на группу');
})

bot.command('inchannel', (ctx) => {
  currectCommand = 'inchannel';

  ctx.reply('Введите ссылку на группу');
})

bot.command('sendpost', async (ctx) => {
  if (!userId) {
    userId = getUserId(ctx) as number;
  }

  console.log(userId);
})



bot.on('text', async (ctx) => {
  if (!userId) {
    userId = getUserId(ctx);
  }

  if (currectCommand === 'outchannel') {
    const outChannel: Partial<IChannel> = {};

    outChannel.link = ctx.message.text;

    await ctx.reply('Подождите загрузку данных');

    if (outChannel.link) {
      outChannel.id = await returnChannelId(ctx, outChannel.link);
      
      if (outChannel.id) {
        dbController.updateUserOutChannelId(outChannel.id, userId);

        outChannel.title = await returnChannelTitle(ctx, outChannel.id);
      }
    }

    ctx.reply(`${outChannel.title}: \n${outChannel.id} \n${outChannel.link} \n\n Загрузка данных завершена`);
  } else if (currectCommand === 'inchannel') {
    const inChannel: Partial<IChannel> = {};

    inChannel.link = ctx.message.text;

    await ctx.reply('Подождите загрузку данных');

    if (inChannel.link) {
      inChannel.id = await returnChannelId(ctx, inChannel.link);

      if (inChannel.id) {
        dbController.updateUserInChannelId(inChannel.id, userId);

        inChannel.title = await returnChannelTitle(ctx, inChannel.id);
      }
    }

    ctx.reply(`${inChannel.title}: \n${inChannel.id} \n${inChannel.link} \n\n Загрузка данных завершена`);
  } else {
    ctx.reply('Неизвестная комманда. Используйте /help для просмотра списка комманд');
  }

  currectCommand = '';
})



async function returnChannelId (ctx: TypeContext, link: string): Promise<number | undefined> {
  if (!userId) {
    userId = getUserId(ctx);
  }

  if (link) {
    const channelName = "@" + extractChannelName(link);

    if (channelName) {
      const post = await ctx.telegram.sendMessage(channelName, 'test \n#botTest');

      const postId = post.message_id;
      const channelId: number = post.chat.id;

      if (channelId) {
        ctx.telegram.deleteMessage(channelId, postId);

        return channelId;
      } else {
        ctx.reply('Не удалось получить ID канала');
      }
    } else {
      ctx.reply('Не удалось извлечь Name канала из ссылки');
    }
  } else {
    ctx.reply(`Не удалось подключиться к ${link}. Проверьте задан ли outChannel и является ли он публичным`);
  }
}

async function returnChannelTitle (ctx: TypeContext, id: number) {
  try {
    const chat: Chat.ChannelGetChat = await ctx.telegram.getChat(id) as Chat.ChannelGetChat;

    return chat.title;
  } catch (error) {
    console.error(error);
    ctx.reply('Произошла ошибка при получении информации о канале.');
  }
}



function extractChannelName(inviteLink: string) {
  const match = inviteLink.match(/t.me\/(.+)/);
  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
}

async function processingNewPostsChannels (ctx: TypeContext, userId: number, hashtag: string = '#botsend') {
  processingNewPostChannelsStart = true;

  if (!userId) {
    userId = getUserId(ctx);
  }

  const userData: IDBUser | undefined = await dbController.getUserById(userId);

  if (userData) {
    bot.on('channel_post', async (ctx) => {
      const channelId: number = ctx.update.channel_post.chat.id;
      const messageId: number = ctx.update.channel_post.message_id;

      if (userData.out_channel_id === channelId) {
        const channelPost: TypeChannelPostWithText = ctx.update.channel_post;
        const text: string = channelPost.text || '';

        if (text.includes(hashtag)) {
          const userPostIds: number[] = await dbController.getUserIdsArr(userId) as number[];
          userPostIds.push(channelPost.message_id);
          dbController.updateUserPostIds(userPostIds, userId);

          if (!text.includes('#notrim')) {
            ctx.telegram.editMessageText(channelId, messageId, undefined, text.replace(hashtag, '').trim());
          } else {
            ctx.telegram.editMessageText(channelId, messageId, undefined, text.replace(hashtag, ''));
            ctx.telegram.editMessageText(channelId, messageId, undefined, text.replace('#notrim', ''));
          }
        }
      }
    })
  }
}

function getUserId (ctx: TypeContext): number {
  return ctx.message.from.id;
}



async function sendPost () {
  if (!userId) {
    userId = bot.context.from?.id as number;

    console.log(userId);
  }

  const idsArr: number[] = await dbController.getUserIdsArr(userId) as [];

  if (idsArr.length) {
    const userData = await dbController.getUserById(userId);
    
    if (userData) {
      for (let i = 0; i < idsArr.length; i++) {
        try {
          await bot.telegram.copyMessage(userData.in_channel_id, userData.out_channel_id, idsArr[0]);
          await bot.telegram.deleteMessage(userData.out_channel_id, idsArr[0]);
  
          idsArr.shift();
          dbController.updateUserPostIds(idsArr, userId);

          break
        } catch {
          if (i === idsArr.length - 1) {
            bot.telegram.sendMessage(userData.id, 'Нет постов для отправки');
          }

          idsArr.shift();
          dbController.updateUserPostIds(idsArr, userId);
  
          continue
        }
      }
    }
  } else {
    const userData = await dbController.getUserById(userId);
    
    if (userData) {
      bot.telegram.sendMessage(userData.id, 'Нет постов для отправки');
    }
  }
}





bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))