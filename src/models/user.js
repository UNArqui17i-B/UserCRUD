'use strict';

const request = require('request');
const status = require('http-status');
const Puid = require('puid');

// CouchDB url
const PORT = process.env.PORT || 5984;
const ROOT_URL = process.env.ROOT_URL || 'localhost';
const url = `http://${ROOT_URL}:${PORT}/`;
const dbUrl = url + 'blinkbox_users';

let User = {};
const idGenerator = new Puid();

User.checkDB = (func) => {
    // eslint-disable-next-line no-unused-vars
    request.head(dbUrl, (err, res, body) => {
        if (err || (res.statusCode === status.INTERNAL_SERVER_ERROR)) {
            func(err, res);
        } else {
            request.put(dbUrl, func);
        }
    });
};

User.create = (user, func) => {
    let id = idGenerator.generate();
    request({
        method: 'PUT',
        url: `${dbUrl}/${id}`,
        body: JSON.stringify(user)
    }, func);
};

User.delete = (id, rev, func) => {
    request(`${dbUrl}/${id}?rev=${rev}`, func);
};

User.update = (id, rev, user, func) => {
    request({
        method: 'PUT',
        url: `${dbUrl}/${id}?rev=${rev}`,
        body: JSON.stringify(user)
    }, func);
};

User.findById = (id, func) => {
    request.get(`${dbUrl}/${id}`, func);
};

User.findAll = (func) => {
    request.get(dbUrl + '/_all_docs', func);
};

module.exports = User;
