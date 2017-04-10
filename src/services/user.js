'use strict';

const express = require('express');
const status = require('http-status');

module.exports = function (User) {
    const router = express.Router();

    // list of all users
    router.get('/', function (req, res) {
        User.findAll
            .then((body) => {
                res.status(status.OK).send(JSON.parse(body).rows);
            })
            .catch((err) => res.status(status.BAD_REQUEST).send(err));
    });

    // search for id
    router.get('/:id', function (req, res) {
        User.findById(req.params.id)
            .then((body) => res.status(status.OK).send(body))
            .catch((err) => res.status(status.BAD_REQUEST).send(err));
    });

    // create a User
    router.post('/', function (req, res) {
        User.create(req.body)
            .then((body) => res.status(status.CREATED).send(body))
            .catch((err) => res.status(status.BAD_REQUEST).send(err));
    });

    // update a User
    router.put('/:id/:rev', function (req, res) {
        User.update(req.params.id, req.params.rev, req.body)
            .then((body) => res.status(status.OK).send(body))
            .catch((err) => res.status(status.BAD_REQUEST).send(err));
    });

    // delete a User
    router.delete('/:id/:rev', function (req, res) {
        User.delete(req.params.id, req.params.rev)
            .then((body) => res.status(status.OK).send(body))
            .catch((err) => res.status(status.BAD_REQUEST).send(err));
    });

    return router;
};
