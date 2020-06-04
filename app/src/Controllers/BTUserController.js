const ERRORS = require('../errors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class BTUserController {
    constructor(userModel, redis) {
        /* models */
        this.userModel = userModel;
        this.redis = redis;

        /* fixing `this` context for the class */
        this.newUser = this.newUser.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getByToken = this.getByToken.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.checkPassword = this.checkPassword.bind(this);
        this.readQueue = this.readQueue.bind(this);

        this.bcryptSaltRounds = 11; // arround 150ms on localhost; @TODO: look for other possibilities
        this.secret = process.env.SECRET || '123456';
    }

    checkPassword = (reqBody) => {
        return reqBody.password && reqBody.password_confirmation && reqBody.password == reqBody.password_confirmation
    }

    newUser = async(req, res) => {
        try {

            if (!(this.checkPassword(req.body))) {
                return res.status(406).json({
                    success: false,
                    message: 'Passwords must match!'
                });
            }

            const hashedPassword = await bcrypt.hash(req.body.password, this.bcryptSaltRounds);
            const newUser = new this.userModel(req.body);
            newUser.password = hashedPassword;

            await newUser.save();

            await this.redis.sendMessageAsync({ qname: 'register_message_queue', message: JSON.stringify({ email: newUser.email, name: newUser.name }) });

            return res.status(201).json({
                success: true,
                user: newUser.toJSON()
            });
        } catch (e) {
            console.log(e);
            const error = ERRORS.GENERIC_400;

            if (e.name && e.name == "MongoError") {
                if (e.code == 11000) {
                    e.errmsg = `Duplicate entry for email (${req.body.email})`
                }
                error.details = e;
            } else {
                error.details = e.errors;
            }

            return res.status(400).json(error);
        }
    }

    login = async(req, res) => {
        try {
            if (!req.body.email || !req.body.password) {
                return res.status(406).json({
                    success: false,
                    message: 'Parameters `email` and `password` are required'
                });
            } else if (req.body.password.length < 6) {
                return res.status(411).json({
                    success: false,
                    message: 'Password must be at least 6 characters long.'
                });
            }

            const user = await this.userModel.findOne({ email: req.body.email });

            if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid user and/or password!'
                });
            }

            const token = jwt.sign({ user_id: user._id }, this.secret, {
                expiresIn: 900 // 15min
            });

            return res.json({
                success: !!user,
                token: token
            });
        } catch (e) {
            console.log(e);
            const error = ERRORS.GENERIC_401;
            error.details = e.errors;
            return res.status(400).json(error);
        }
    }

    getAll = async(req, res) => {
        try {
            const options = req.query.include_deleted == 1 ? {} : { deleted: false };
            const users = await this.userModel.find(options);
            return res.json({
                success: users.length > 0,
                users: users.map((user) => user.toJSON())
            });
        } catch (e) {
            console.log(e);
            const error = ERRORS.GENERIC_400;
            error.details = e.errors;
            return res.status(400).json(error);
        }
    }

    getByToken = async(req, res) => {
        try {
            const token = req.header('x-client-token');

            if (!token) {
                return res.status(406).json({
                    success: false,
                    message: 'Missing header `X-client-token`'
                });
            }

            let verifiedToken = null;

            try {
                verifiedToken = jwt.verify(token, this.secret);
            } catch (e) {
                return res.status(406).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            const id = verifiedToken.user_id;

            const options = req.query.include_deleted == 1 ? { _id: id } : { _id: id, deleted: false };
            const user = await this.userModel.where(options).findOne();
            if (user) {
                return res.json({
                    success: !!user,
                    user: user.toJSON()
                });
            } else {
                return res.json(ERRORS.NOT_FOUND);
            }
        } catch (e) {
            console.log(e);
            const error = ERRORS.GENERIC_400;
            error.details = e.errors;
            return res.status(400).json(error);
        }
    }

    updateUser = async(req, res) => {
        try {

            const token = req.header('x-client-token');

            if (!token) {
                return res.status(406).json({
                    success: false,
                    message: 'Missing header `X-client-token`'
                });
            }

            let verifiedToken = null;

            try {
                verifiedToken = jwt.verify(token, this.secret);
            } catch (e) {
                return res.status(406).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            const id = verifiedToken.user_id;

            const options = req.query.include_deleted == 1 ? { _id: id } : { _id: id, deleted: false };
            const user = await this.userModel.where(options).findOne();
            if (user) {
                const result = await user.update(req.body, { new: true });
                return res.json({
                    success: !!result.ok
                });
            } else {
                const error = ERRORS.NOT_FOUND;
                return res.json(error);
            }
        } catch (e) {
            console.log(e);
            const error = ERRORS.GENERIC_400;

            if (e.name && e.name == "MongoError") {
                if (e.code == 11000) {
                    e.errmsg = `Duplicate entry for email (${req.body.email})`
                }
                error.details = e;
            } else {
                error.details = e.errors;
            }

            return res.status(400).json(error);
        }
    }

    deleteUser = async(req, res) => {
        try {
            const id = req.params.id;
            const user = await this.userModel.findById(id);
            await user.delete();
            return res.status(206).json({
                success: true
            });
        } catch (e) {
            console.log(e);
            const error = ERRORS.GENERIC_400;
            error.details = e.errors;
            return res.status(400).json(error);
        }
    }

    readQueue = async(req, res) => {
        this.redis.popMessage({ qname: "register_message_queue" }, (err, resp) => {
            if (err) {
                return res.send(err);
            }

            if (resp.id) {
                return res.send(resp);
            } else {
                return res.send('no message');
            }
        });
    }
}

module.exports = BTUserController;