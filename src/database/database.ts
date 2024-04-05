import sqlite3 from "sqlite3";

import { IReturnDatabaseСontroller, IDBUser } from "../types";





function databaseСontroller (): IReturnDatabaseСontroller {
  const db = new sqlite3.Database('./database.db');

  return {
    createDB,
    addUser,
    updateUserOutChannelId,
    updateUserInChannelId,
    updateUserPostIds,
    getUserById,
    getUserIdsArr
  }



  function createDB (): void {
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, out_channel_id INTEGER, in_channel_id INTEGER, post_ids TEXT)');
    })
  }

  function addUser (userId: number, outChannelId: number | undefined = undefined, inChannelId: number | undefined = undefined): void {
    db.run('INSERT INTO users (user_id) VALUES (?)', userId, (err: Error) => {
      if (err) {
        console.error('Ошибка при добавлении пользователя:', err);
      } else {
        console.log('Пользователь успешно добавлен в базу данных');
      }
    });

    if (outChannelId) {
      updateUserOutChannelId(outChannelId, userId);
    } else if (inChannelId) {
      updateUserInChannelId(inChannelId, userId);
    }
  }

  function updateUserOutChannelId (outChannelId: number, userId: number): void {
    db.run('UPDATE users SET out_channel_id = ? WHERE user_id = ?', outChannelId, userId, (err: Error) => {
      if (err) {
        console.error('Ошибка при обновлении outChannelId:', err);
      } else {
        console.log('outChannelId успешно обновлено в базе данных');
      }
    });
  }

  function updateUserInChannelId (inChannelId: number, userId: number): void {
    db.run('UPDATE users SET in_channel_id = ? WHERE user_id = ?', inChannelId, userId, (err: Error) => {
      if (err) {
        console.error('Ошибка при обновлении inChannelId:', err);
      } else {
        console.log('inChannelId успешно обновлено в базе данных');
      }
    });
  }

  function updateUserPostIds (idsArr: number[], userId: number): void {
    db.run('UPDATE users SET post_ids = ? WHERE user_id = ?', idsArr.join(','), userId, (err: Error) => {
      if (err) {
        console.error("Error adding user posts:", err);
      } else {
        // console.log("User posts update successfully.");
      }
    })
  }


  async function getUserById(userId: number): Promise<IDBUser | undefined> {
    // console.log('Запрос пользователя с ID:', userId);
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE user_id = ?', userId, (err, row: IDBUser) => {
        if (err) {
          console.error('Ошибка при выполнении запроса:', err);
          reject(err);
        } else {
          // console.log('Полученный результат:', row);
          resolve(row);
        }
      });
    });
  }

  async function getUserIdsArr(userId: number): Promise<number[]> {
    // console.log('Запрос пользователя с ID:', userId);
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE user_id = ?', userId, (err, row: IDBUser) => {
        if (err) {
          console.error('Ошибка при выполнении запроса:', err);
          reject(err);
        } else {
          // console.log('Полученный результат:', row);
          if (row.post_ids && row.post_ids.length > 0) {
            resolve(row.post_ids.split(',').map((id: string) => +id));
          } else {
            resolve([]);
          }
        }
      });
    });
  }
}





export {
  databaseСontroller
}