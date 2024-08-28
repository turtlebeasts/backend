const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const socketManager = require('./middleware/socketIo');
const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');
const messageRoutes = require('./routes/messageRoutes');


const app = express();
const port = 5000;

const expressServer = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})

socketManager.init(expressServer)

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes)
app.use('/channel', channelRoutes)
app.use('/message', messageRoutes)

