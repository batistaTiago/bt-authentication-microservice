/* packages used */
const cors = require('cors');
const mongoose_delete = require('mongoose-delete');
const mongoose_hidden = require('mongoose-hidden')()

const redis_mq = require("rsmq");
const bodyParser = require('body-parser');
const express = require('express');
const server = express();
const mongoose = require('mongoose');
const BT_USER_SCHEMA = require('./Schemas/BTUserSchema');


/* app level imports */
const BTUserController = require('./Controllers/BTUserController');






/* setting up mongoose */
mongoose.Promise = global.Promise; //api de Promises do mongoose está depreciada, sobreescrevendo pela global
mongoose.connect('mongodb://auth_db/users', { useNewUrlParser: true, useUnifiedTopology: true }); // conectando ao banco





/* setting up redis */
const rsmq = new redis_mq({ host: 'auth_queue', port: 6379, ns: 'rsmq' });
rsmq.createQueue({ qname: 'register_message_queue' }, () => {});





/* middleware used */
server.use(cors());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.use((req, res, next) => {
    req.acceptsFormat = (format) => {
        return req.header('accept').split(',').includes(format)
    }
    return next();
});



/* inicializando MVC */
// user model
const userSchema = new mongoose.Schema(BT_USER_SCHEMA);
userSchema.plugin(mongoose_delete)
userSchema.plugin(mongoose_hidden, { hidden: { _id: false }, hiddenJSON: { password: true } })
const userModel = new mongoose.model('User', userSchema);


const userController = new BTUserController(userModel, rsmq);



/* route for server status */
server.get('/', (req, res) => {
    if (req.acceptsFormat('text/html')) {
        /* @TODO: retornar arquivo estilizado... */
        return res.send('This authentication webservice is working and ready to receive requests...');
    } else {
        return res.json({
            success: true,
            status: 'online',
            message: 'This authentication webservice is working and ready to receive requests...'
        });
    }
});



/* @BEGIN application routes */
server.post('/users/new', userController.newUser);
server.get('/users/', userController.getAll);
server.get('/users/details', userController.getByToken);
server.patch('/users/:id', userController.updateUser);
server.delete('/users/:id', userController.deleteUser);

server.post('/login', userController.login);
server.post('/read-queue', userController.readQueue);
/* @END application routes */

PORT = process.env.PORT || 3000;


/* initialing server */
server.listen(PORT, () => {
    console.log('listening on PORT: ' + PORT);
});