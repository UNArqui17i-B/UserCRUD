'use strict';

const request = require('request-promise');
const crypto = require('crypto');
const Puid = require('puid');
const Joi = require('joi');

// CouchDB url
const DB_PORT = process.env.DB_PORT || 5984;
const DB_URL = process.env.DB_URL || 'localhost';
const DB_NAME = process.env.DB_NAME || 'blinkbox_users';
const url = `http://${DB_URL}:${DB_PORT}/`;
const dbUrl = url + DB_NAME;

let User = {};
const idGenerator = new Puid();

// User schema
const userSchema = Joi.object().keys({
    firstName: Joi.string().regex(/^[a-zA-Z\s]{3,30}$/).required(),
    lastName: Joi.string().regex(/^[a-zA-Z\s]{3,30}$/).required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
});

User.checkDB = request.head(dbUrl)
    .then((body) => Promise.resolve(body))
    .catch(() => request.put(dbUrl));

User.create = (user) => {
    let id = idGenerator.generate();

    const result = Joi.validate(user, userSchema);

    if (result.error) {
        return Promise.reject(result.error);
    } else {
        // encrypt password
        user.salt = crypto.randomBytes(16).toString('hex');
        user.hash = crypto.pbkdf2Sync(user.password, user.salt, 1000, 224, 'sha224').toString('hex');
        delete user.password;

        user.notValidated = true;

        return request({
            method: 'PUT',
            url: `${dbUrl}/${id}`,
            json: user
        });
    }
};

User.delete = (id) => request.get(`${dbUrl}/${id}`)
    .then((user) => {
        user = JSON.parse(user);
        return request.delete(`${dbUrl}/${id}?rev=${user._rev}`)
    });

User.update = (id, user) => request.get(`${dbUrl}/${id}`)
    .then((oldUser) => {
        oldUser = JSON.parse(oldUser);
        let newUser = {
            firstName: user.firstName || oldUser.firstName,
            lastName: user.lastName || oldUser.lastName,
            email: oldUser.email,
            password: user.password
        };

        const result = Joi.validate(newUser, userSchema);

        if (result.error) {
            return Promise.reject(result.error);
        } else {
            newUser.notValidated = user.notValidated;
            newUser.token = user.token;
            newUser.expDate = user.expDate;

            // encrypt password
            newUser.salt = crypto.randomBytes(16).toString('hex');
            newUser.hash = crypto.pbkdf2Sync(newUser.password, newUser.salt, 1000, 224, 'sha224').toString('hex');
            delete newUser.password;

            return request({
                method: 'PUT',
                url: `${dbUrl}/${id}?rev=${oldUser._rev}`,
                json: newUser
            });
        }
    }).catch((err) => Promise.reject(err));

User.findById = (id) => request.get(`${dbUrl}/${id}`);

User.findAll = request.get(dbUrl + '/_all_docs');

module.exports = User;
