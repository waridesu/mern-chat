const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const routes = require('./routes/routes');
const { clientUrl, mongoUrl} = require('./config/config');
const setupWebSocketServer = require("./socket");
const mongoose = require('mongoose');
function setupServer() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser())
    app.use('/uploads', express.static(__dirname + '/uploads'));
    app.use(cors({
        credentials: true,
        origin: clientUrl,
    }));
    app.use(routes);

    mongoose?.connect(mongoUrl);

    const server = app.listen(4040);

    setupWebSocketServer(server);
}

module.exports = setupServer;
