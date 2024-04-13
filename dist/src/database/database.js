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
exports.databaseСontroller = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
function databaseСontroller() {
    const db = new sqlite3_1.default.Database('./database.db');
    return {
        createDB,
        addUser,
        updateUserOutChannelId,
        updateUserInChannelId,
        updateUserPostIds,
        getUserById,
        getUserIdsArr
    };
    function createDB() {
        db.serialize(() => {
            db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, out_channel_id INTEGER, in_channel_id INTEGER, post_ids TEXT)');
        });
    }
    function addUser(userId, outChannelId = undefined, inChannelId = undefined) {
        db.run('INSERT INTO users (user_id) VALUES (?)', userId, (err) => {
            if (err) {
                console.error('Ошибка при добавлении пользователя:', err);
            }
            else {
                console.log('Пользователь успешно добавлен в базу данных');
            }
        });
        if (outChannelId) {
            updateUserOutChannelId(outChannelId, userId);
        }
        else if (inChannelId) {
            updateUserInChannelId(inChannelId, userId);
        }
    }
    function updateUserOutChannelId(outChannelId, userId) {
        db.run('UPDATE users SET out_channel_id = ? WHERE user_id = ?', outChannelId, userId, (err) => {
            if (err) {
                console.error('Ошибка при обновлении outChannelId:', err);
            }
            else {
                console.log('outChannelId успешно обновлено в базе данных');
            }
        });
    }
    function updateUserInChannelId(inChannelId, userId) {
        db.run('UPDATE users SET in_channel_id = ? WHERE user_id = ?', inChannelId, userId, (err) => {
            if (err) {
                console.error('Ошибка при обновлении inChannelId:', err);
            }
            else {
                console.log('inChannelId успешно обновлено в базе данных');
            }
        });
    }
    function updateUserPostIds(idsArr, userId) {
        db.run('UPDATE users SET post_ids = ? WHERE user_id = ?', idsArr.join(','), userId, (err) => {
            if (err) {
                console.error("Error adding user posts:", err);
            }
            else {
                // console.log("User posts update successfully.");
            }
        });
    }
    function getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE user_id = ?', userId, (err, row) => {
                    if (err) {
                        console.error('Ошибка при выполнении запроса:', err);
                        reject(err);
                    }
                    else {
                        resolve(row);
                    }
                });
            });
        });
    }
    function getUserIdsArr(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE user_id = ?', userId, (err, row) => {
                    if (err) {
                        console.error('Ошибка при выполнении запроса:', err);
                        reject(err);
                    }
                    else {
                        if (row.post_ids && row.post_ids.length > 0) {
                            resolve(row.post_ids.split(',').map((id) => +id));
                        }
                        else {
                            resolve([]);
                        }
                    }
                });
            });
        });
    }
}
exports.databaseСontroller = databaseСontroller;
