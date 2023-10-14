"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const express = require("express");
const fs = require("fs");
const https = require("https");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(express.static('../public'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors());
    dotenv.config();
    const privateKey = fs.readFileSync('key.pem', 'utf8');
    const certificate = fs.readFileSync('cert.pem', 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        passphrase: process.env.CREDENTIALS_PASSPHRASE,
    };
    const httpsServer = https.createServer(credentials, app.getHttpAdapter().getInstance());
    const port = 443;
    httpsServer.listen(port, () => {
        console.log(`Server is running on port https://jchat.com`);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map