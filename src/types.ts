import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram";





interface IReturnDatabaseСontroller {
  createDB: () => void;
  addUser: (userId: number, outChannelId?: number, inChannelId?: number) => void;
  updateUserOutChannelId: (outChannelId: number, userId: number) => void;
  updateUserInChannelId: (inChannelId: number, userId: number) => void;
  updateUserPostIds: (idsArr: number[], userId: number) => void;
  getUserById: (userId: number) => Promise<IDBUser | undefined>;
  getUserIdsArr: (userId: number) => Promise<number[] | undefined>;
}

interface IDBUser {
  id: number;
  user_id: number;
  out_channel_id: number;
  in_channel_id: number;
  post_ids: string;
}



type TypeContext = Context<{
  message: Update.New & Update.NonChannel & Message.TextMessage;
  update_id: number;
}>;

type TypeChannelPostWithText = Update.New & Update.Channel & Message & {text?: string};

interface IChannel {
  link: string;
  title: string;
  id: number;
}





export {
  IReturnDatabaseСontroller,
  IDBUser,
  TypeContext,
  TypeChannelPostWithText,
  IChannel,
}