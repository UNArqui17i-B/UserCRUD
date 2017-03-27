'use strict';

const request = require('request');
const status = require('http-status');
const crypto = require('crypto');
const Puid = require('puid');
const Joi = require('joi');

// CouchDB url
const DB_PORT = process.env.DB_PORT || 5984;
const DB_ROOT_URL = process.env.DB_ROOT_URL || 'localhost';
const url = `http://${DB_ROOT_URL}:${DB_PORT}/`;
const dbUrl = url + 'blinkbox_users';

let User = {};
const idGenerator = new Puid();

// User schema
const userSchema = Joi.object().keys({
    name: Joi.string().regex(/^[a-zA-Z\s]{3,30}$/).required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
});

const loginSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
});

User.checkDB = (func) => {
    request.head(dbUrl, (err, res, body) => {
        if (err || (res.statusCode === status.INTERNAL_SERVER_ERROR)) {
            func(err, res, body);
        } else {
            request.put(dbUrl, func);
        }
    });
};

User.create = (user, func) => {
    let id = idGenerator.generate();

    const result = Joi.validate(user, userSchema);

    if (result.error) {
        func(result.error, {statusCode: status.BAD_REQUEST}, result.error.details);
    } else {
        // encrypt password
        user.salt = crypto.randomBytes(16).toString('hex');
        user.hash = crypto.pbkdf2Sync(user.password, user.salt, 1000, 224, 'sha224').toString('hex');
        delete user.password;

        request({
            method: 'PUT',
            url: `${dbUrl}/${id}`,
            json: user
        }, func);
    }
};

User.delete = (id, rev, func) => {
    request.delete(`${dbUrl}/${id}?rev=${rev}`, func);
};

User.update = (id, rev, user, func) => {
    request({
        method: 'PUT',
        url: `${dbUrl}/${id}?rev=${rev}`,
        json: user
    }, func);
};

User.findById = (id, func) => {
    request.get(`${dbUrl}/${id}`, func);
};

User.findAll = (func) => {
    request.get(dbUrl + '/_all_docs', func);
};

User.login = (user, func) => {
    const result = Joi.validate(user, loginSchema);

    if (result.error) {
        func(result.error, {statusCode: status.BAD_REQUEST}, result.error.details);
    } else {
        const query = {
            selector: {
                email: user.email
            }
        };

        request({
            method: 'POST',
            url: `${dbUrl}/_find`,
            json: query
        }, (err, res, body) => {
            const finded = body.docs[0];
            if (err || (res.statusCode === status.INTERNAL_SERVER_ERROR || !finded)) {
                func(err, res);
            } else {
                // decrypt password
                const hash = crypto.pbkdf2Sync(user.password, finded.salt, 1000, 224, 'sha224').toString('hex');
                func(null, {statusCode: status.OK}, {result: hash === finded.hash});
            }
        });
    }
};

module.exports = User;
