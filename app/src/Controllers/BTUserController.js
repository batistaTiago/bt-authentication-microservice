const ERRORS = require('../errors');
const bcrypt = require('bcrypt');

class BTUserController {
    constructor(userModel) {
        /* models */
        this.userModel = userModel;

        /* fixing `this` context for the class */
        this.newUser = this.newUser.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);

        this.bcryptSaltRounds = 11; // arround 150ms on localhost; @TODO: look for other possibilities
    }

    newUser = async(req, res) => {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, this.bcryptSaltRounds);

            const newUser = new this.userModel(req.body);
            await newUser.save();
            return res.status(201).json({
                success: true,
                user: newUser
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

    getAll = async(req, res) => {
        try {
            const options = req.query.include_deleted == 1 ? {} : { deleted: false };
            const users = await this.userModel.find(options);
            return res.json({
                success: users.length > 0,
                users: users
            });
        } catch (e) {
            console.log(e);
            const error = ERRORS.GENERIC_400;
            error.details = e.errors;
            return res.status(400).json(error);
        }
    }

    getById = async(req, res) => {
        try {
            const id = req.params.id;
            const options = req.query.include_deleted == 1 ? { _id: id } : { _id: id, deleted: false };
            const user = await this.userModel.where(options).findOne();
            if (user) {
                return res.json({
                    success: !!user,
                    user: user
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
            const id = req.params.id;
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
}

module.exports = BTUserController;