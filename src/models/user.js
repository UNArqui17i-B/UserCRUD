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

User.delete = (id, rev) => request.delete(`${dbUrl}/${id}?rev=${rev}`);

User.update = (id, rev, user) => {
    const result = Joi.validate(user, userSchema);

    if (result.error) {
        return Promise.reject(result.error);
    } else {
        // encrypt password
        user.salt = crypto.randomBytes(16).toString('hex');
        user.hash = crypto.pbkdf2Sync(user.password, user.salt, 1000, 224, 'sha224').toString('hex');
        delete user.password;

        return request({
            method: 'PUT',
            url: `${dbUrl}/${id}`,
            json: user
        });
    }
};

User.findById = (id) => request.get(`${dbUrl}/${id}`);

User.findAll = request.get(dbUrl + '/_all_docs');

module.exports = User;
