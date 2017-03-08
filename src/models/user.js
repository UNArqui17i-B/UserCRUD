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

User.checkDB = () => {
    request.head(dbUrl, (err, res, body) => {
        if (err || (res.statusCode === status.INTERNAL_SERVER_ERROR) || (res.statusCode === status.NOT_FOUND)) {
            return false;
        } else {
            request.put(dbUrl, (err, res, body) => {
                return !(err || (res.statusCode === status.INTERNAL_SERVER_ERROR) ||
                    (res.statusCode === status.NOT_FOUND));
            });
        }
    });
};

User.create = (user) => {
    let id = idGenerator.generate();
    request({
        method: 'PUT',
        url: `${dbUrl}/${id}`,
        form: user
    }, (err, res, body) =>
            !(err || (res.statusCode === status.INTERNAL_SERVER_ERROR) || (res.statusCode === status.NOT_FOUND))
    );
};

User.delete = (id) => {
    request.delete(`${dbUrl}/${id}`, (err, res, body) =>
        !(err || (res.statusCode === status.INTERNAL_SERVER_ERROR) || (res.statusCode === status.NOT_FOUND))
    );
};

User.update = (id, user) => {
    request({
        method: 'PUT',
        url: `${dbUrl}/${id}`,
        form: user
    }, (err, res, body) =>
            !(err || (res.statusCode === status.INTERNAL_SERVER_ERROR) || (res.statusCode === status.NOT_FOUND))
    );
};

User.findById = (id) => {
    request.get(`${dbUrl}/${id}`, (err, res, body) => {
        if (!(err || (res.statusCode === status.INTERNAL_SERVER_ERROR) || (res.statusCode === status.NOT_FOUND))) {
            return body;
        }
    });
};

User.findAll = () => {
    request.get(dbUrl + '/_all_docs', (err, res, body) => body);
};

module.exports = User;
