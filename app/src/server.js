/* packages used */
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const server = express();
const mongoose = require('mongoose');
const BT_USER_SCHEMA = require('./Schemas/BTUserSchema');

/* app level imports */
const BTUserController = require('./Controllers/BTUserController');




/* configurações do mongoose */
mongoose.Promise = global.Promise; //api de Promises do mongoose está depreciada, sobreescrevendo pela global
mongoose.connect('mongodb://auth_db/users', { useNewUrlParser: true, useUnifiedTopology: true }); // conectando ao banco






/* middleware used */
server.use(cors());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.use((req, res, next) => {
    req.acceptsFormat = (format) => {
        return req.header('accept').split(',').includes(format)
    }
    return next();
})



/* inicializando MVC */
const userSchema = new mongoose.Schema(BT_USER_SCHEMA);
const userModel = new mongoose.model('User', userSchema);
const userController = new BTUserController(userModel);



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
server.get('/users/:id', userController.getById);
server.patch('/users/:id', userController.updateUser);
server.delete('/users/:id', userController.deleteUser);
/* @END application routes */

PORT = process.env.PORT || 3000;


/* initialing server */
server.listen(PORT, () => {
    console.log('listening on PORT: ' + PORT);
});