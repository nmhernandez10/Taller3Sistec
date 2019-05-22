const Movie = require('../models').Movie;
const Review = require('../models').Review;
const MovieTag = require('../models').MovieTag;
const Photo = require('../models').Photo;
const Tag = require('../models').Tag;
const User = require('../models').User;
const db = require('../models/index');

module.exports = {
    getAll(req, res) {
        return Movie.findAll({
            order: [['createdAt', 'DESC'],],
        }).then((movies) => res.status(200).send(movies))
            .catch((error) => res.status(400).send(error));
    },
    getTop(req, res) {
        return User.findById(req.params.id).then(user => {
            let orList = [];
            if (user.top != null) {
                for (let movie of user.top.split(',')) {
                    if (movie.length > 0) {
                        orList.push({ id: movie });
                    }
                }
            }
            return Movie.findAll({
                include: [{ model: MovieTag, include: [Tag] }, Photo],
                where: { $or: orList }
            }).then(movies => res.status(200).send(movies))
                .catch((error) => res.status(400).send(error));
        }).catch((error) => res.status(400).send(error));
    },
    getByName(req, res) {
        return Movie.findAll({
            include: [{ model: MovieTag, include: [Tag] }, Photo],
            where: { name: { $iLike: '%' + req.params.name + '%' } },
            limit: 12
        }).then((movies) => res.status(200).send(movies))
            .catch((error) => res.status(400).send(error));
    },
    getByYelpId(req, res) {
        return Movie.findAll({
            include: [Review, MovieTag, Photo],
            where: { yelp_id: req.params.yelp_id }
        }).then((movies) => res.status(200).send(movies))
            .catch((error) => res.status(400).send(error));
    },
    getByAttributes(req, res) {
        let orList = [];
        if (req.body.attributes != null) {
            for (let attribute of req.body.attributes) {
                orList.push({ name: attribute });
            }
        }
        return Tag.findAll({
            attributes: ['id'],
            where: { $or: orList }
        }).then(tags => {
            orList = [];
            for (let tag of tags) {
                orList.push({
                    TagId: tag.get({
                        plain: true
                    }).id
                });
            }
            return MovieTag.findAll({
                include: [Movie],
                where: { $or: orList },
                limit: 12
            }).then(movietags => {
                let movies = [];
                for (let movietag of movietags) {
                    movies.push(movietag.Movie);
                }
                return res.status(200).send(movies);
            }).catch((error) => res.status(400).send(error));
        }).catch((error) => res.status(400).send(error));
    },
    getExactlyByAttributes(req, res) {
        let orList = [];
        if (req.body.attributes != null) {
            for (let attribute of req.body.attributes) {
                orList.push({ name: attribute });
            }
        }
        return Tag.findAll({
            attributes: ['id'],
            where: { $or: orList }
        }).then(tags => {
            let orText = '';
            for (let tag in tags) {
                if (tag == tags.length - 1) {
                    orText +=
                        '"TagId" = ' + tags[tag].get({
                            plain: true
                        }).id
                        ;
                }
                else {
                    orText +=
                        '"TagId" = ' + tags[tag].get({
                            plain: true
                        }).id + " OR "
                        ;
                }
            }
            let query = 'SELECT "id" FROM (SELECT "MovieId",COUNT(*) AS "Count" FROM "MovieTags" WHERE ' + orText + ' GROUP BY "MovieId") AS "CountTable", "Moviees" WHERE "Count" = ' + tags.length + ' AND "CountTable"."MovieId" = "Moviees"."id" LIMIT 12';
            return db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT }).then(movieids => {
                orList = [];
                for (let movieid of movieids) {
                    orList.push({ id: movieid.id });
                }
                return Movie.findAll({
                    include: [{ model: MovieTag, include: [Tag] }, Photo],
                    where: { $or: orList }
                }).then(movies => res.status(200).send(movies)).catch(error => res.status(400).send(error));
            }).catch(error => res.status(400).send(error));
        }).catch(error => res.status(400).send(error));
    },
    getByNameAndExactlyByAttributes(req, res) {
        let orList = [];
        if (req.body.attributes != null) {
            for (let attribute of req.body.attributes) {
                orList.push({ name: attribute });
            }
        }
        return Tag.findAll({
            attributes: ['id'],
            where: { $or: orList }
        }).then(tags => {
            orText = '';
            for (let tag in tags) {
                if (tag == tags.length - 1) {
                    orText +=
                        '"TagId" = ' + tags[tag].get({
                            plain: true
                        }).id
                        ;
                }
                else {
                    orText +=
                        '"TagId" = ' + tags[tag].get({
                            plain: true
                        }).id + " OR "
                        ;
                }
            }
            let ilike = "'%" + req.body.name + "%'";
            let query = 'SELECT "id" FROM (SELECT "MovieId",COUNT(*) AS "Count" FROM "MovieTags" WHERE ' + orText + ' GROUP BY "MovieId") AS "CountTable", "Moviees" WHERE "Count" = ' + tags.length + ' AND "CountTable"."MovieId" = "Moviees"."id" AND "Moviees"."name" ILIKE ' + ilike + ' LIMIT 12';
            return db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT }).then(movieids => {
                orList = [];
                for (let movieid of movieids) {
                    orList.push({ id: movieid.id });
                }
                return Movie.findAll({
                    include: [{ model: MovieTag, include: [Tag] }, Photo],
                    where: { $or: orList }
                }).then(movies => res.status(200).send(movies)).catch(error => res.status(400).send(error));
            }).catch(error => res.status(400).send(error));
        }).catch(error => res.status(400).send(error));
    },
    get(req, res) {
        return Movie.findById(req.params.id, { include: [Photo, { model: MovieTag, include: [Tag] }] })
            .then((movie) => {
                if (!movie) {
                    return res.status(404).send({
                        message: 'Movie not found',
                    });
                }
                return res.status(200).send(movie);
            }).catch((error) => res.status(400).send(error));
    },
    post(req, res) {
        return Movie.create({
            name: req.body.name,
            photo: req.body.photo,
            year: req.body.year
        }).then((movie) => res.status(201).send(movie))
            .catch((error) => res.status(400).send(error));
    },
    put(req, res) {
        return Movie.findById(req.params.id)
            .then((movie) => {
                if (!movie) {
                    return res.status(404).send({
                        message: 'Movie not found',
                    });
                }
                return movie.update({
                    name: req.body.name || movie.name,
                    yelp_id: req.body.yelp_id || movie.yelp_id,
                    address: req.body.address || movie.address,
                    city: req.body.city || movie.city,
                    latitude: req.body.latitude || movie.latitude,
                    longitude: req.body.longitude || movie.longitude
                })
                    .then((movie) => res.status(200).send(movie))
                    .catch((error) => res.status(400).send(error));
            });
    },
    delete(req, res) {
        return Movie.findById(req.params.id)
            .then((movie) => {
                if (!movie) {
                    return res.status(404).send({
                        message: 'Movie not found',
                    });
                }
                return movie.destroy()
                    .then((movie) => res.status(200).send(movie))
                    .catch((error) => res.status(400).send(error));
            });
    },
};