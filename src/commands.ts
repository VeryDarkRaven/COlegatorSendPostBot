// import { Telegraf } from "telegraf"
// import { message } from "telegraf/filters"





const commandsDescription: string = `
/start - перезапустить бота;
/help - список комманд;
/status - статус бота;
/outchannel - инициализация канала из которого будут копироваться посты;
/inchannel - инициализация канала в который будут копироваться посты;
`;

// function initCommands (bot: Telegraf) {
//   bot.command('consolectx', (ctx) => {
//     ctx.reply('вызов комманды');
//     console.log(ctx);
//   })
  
//   bot.command('outgroup', (ctx) => {
//     ctx.reply('Введите ссылку на группу');
  
//     outGroup = ctx.message;
  
//     ctx.reply(outGroup);
//   })
// }



export {
  commandsDescription
}