'use strict';

const express = require('express');
const status = require('http-status');

module.exports = function (User) {
    const router = express.Router();

    // list of all books
    router.get('/', function (req, res) {
        const users = User.findAll();
        if (users) {
            res.status(status.OK).send(users);
        } else {
            res.status(status.BAD_REQUEST).send({});
        }
    });

    // search for id
    router.get('/:id', function (req, res) {
        const user = User.findById(req.params.id);
        if (user) {
            res.status(status.OK).send(user);
        } else {
            res.status(status.BAD_REQUEST).send({});
        }
    });

    // create a User
    router.post('/', function (req, res) {
        let User = new User(req.body);
        User.save(function (err, data) {
            /* istanbul ignore next */
            if (err) {
                res.status(status.INTERNAL_SERVER_ERROR).send(err);
            } else {
                res.status(status.CREATED).send(data);
            }
        });
    });

    // update a User
    router.put('/:id', function (req, res) {
        const user = User.update(req.params.id, req.body);
        if (user) {
            res.status(status.OK).send(user);
        } else {
            res.status(status.BAD_REQUEST).send({});
        }
    });

    // delete a User
    router.delete('/:id', function (req, res) {
        const user = User.delete(req.params.id);
        if (user) {
            res.status(status.ACCEPTED).send(user);
        } else {
            res.status(status.BAD_REQUEST).send({});
        }
    });

    return router;
};
