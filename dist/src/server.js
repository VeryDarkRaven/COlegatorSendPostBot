"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressStart = void 0;
const express_1 = __importDefault(require("express"));
function expressStart() {
    const app = (0, express_1.default)();
    const host = "0.0.0.0";
    const port = 3000;
    // const port = Math.floor(2000 + Math.random() * (9000 + 1 - 2000));
    app.get("/", (req, res) => {
        res.send("Hello World!");
    });
    app.listen(port, host, () => {
        console.log(`Example app listening on ${host}:${port}`);
    });
}
exports.expressStart = expressStart;
