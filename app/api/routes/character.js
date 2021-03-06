const express       = require('express')
const router        = express.Router()
const errors        = require('./errors')
const Character     = require('../models/character')

// GET /api/characters
router.get('/', (req, res) => {

    let protocol        = req.protocol
    let host            = req.hostname

    Character.findAll()
        .then( characters => {
            let type, statusCode, message
            let count       = characters.length
            type            = "success"
            statusCode      = 200
            characters.map( c => {
                let charactersUri   = `/api/characters/${c.dataValues.id}`
                c.serialise(charactersUri)
            })
            return res
                    .status(statusCode)
                    .json({type, statusCode, count, characters})
        })
        .catch( error => {
            let e = errors.handle(error)
            return res.status(e.statusCode).json(e.responseBody)
        })
})

// GET /api/characters/:id
router.get('/:id', (req, res) => {

    Character.findById(req.params.id)
        .then( character => {

            if (character === null) {
                let e = errors.notFound()
                return res.status(e.statusCode).json(e.responseBody)
            }

            return res.status(200).json(character)
        })
        .catch( error => {
            let e = errors.notFound()
            return res.status(e.statusCode).json(e.responseBody)
        })
})

// POST /api/characters
router.post('/', (req, res) => {
    let data, type, statusCode, message, uri
    let protocol = req.protocol
    let host     = req.hostname
    data = { name, age, birthPlace, bio, occupation, novel } = req.body

    Character.create(data)
        .then( character => {
            type       = "success"
            statusCode = 201
            message    = "Character was successfully created"
            uri        = `/api/characters/${character.dataValues.id}`
            character.serialise(uri)
            return res
                    .location(character.dataValues.href)
                    .status(statusCode)
                    .json({type, statusCode, message, character})
        })
        .catch( error => {
            let err = errors.handle(error)
            return res.status(err.statusCode).json(err.responseBody)
        })
})

// PUT /api/characters/:id
router.put('/:id', (req, res) => {

    Character.findById(req.params.id)
        .then( character => {

            let type, message, data, statusCode

            if (character.isIdenticalTo(req.body)) {

                type        = "success"
                message     = "Character successfully updated"
                statusCode  = 200
                data        = {name, age, birthplace, bio, occupation} = req.body

                character.update(data)
                    .then( () => {
                        return res
                                .status(statusCode)
                                .json({type, statusCode, message, character})
                    })
                    .catch( err => {
                        let e = errors.handle(err)
                        return res.status(e.statusCode).json(e.responseBody)
                    })

            } else {
                type        = "error"
                message     = "Bad request. Please provide all the fields"
                statusCode  = 400
                return res.status(statusCode).json({type, statusCode, message})
            }

        })
        .catch( error => {
            let e = errors.notFound()
            return res.status(e.statusCode).json(e.responseBody)
        })
})

// PATCH /api/characters/:id
router.patch('/:id', (req, res) => {

    let data, type, statusCode, message

    Character.findById(req.params.id)

        .then( character => {

            data = {name, age, birthplace, bio, occupation, novel} = req.body

            character.update(data)
                .then( () => {
                    type        = "success"
                    statusCode  = 200
                    message     = "Update successful"
                    return res
                            .status(200)
                            .json({type, statusCode, message, character})
                })
                .catch( error => {
                    let e =  errors.handle(error)
                    return res.status(e.statusCode).json(e.responseBody)
                })
        })

        // :id doesn't match any record in the database -> 404 bitch where ?
        .catch( error => {
            let e = errors.notFound()
            return res.status(e.statusCode).json(e.responseBody)
        })
})

// DELETE /api/characters/:id
router.delete('/:id', (req, res) => {

    Character.destroy({ where: {id: req.params.id} })
        .then( () => res.status(204).end() )
        .catch( error => {
            return res
                    .status(400)
                    .json({ type:"error", message:"Bad request" })
        })
})

module.exports = router
