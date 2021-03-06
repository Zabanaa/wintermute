const Sequelize = require('sequelize')
const app       = require('../app')
const Author    = require('../app/api/models/author')
const Novel     = require('../app/api/models/novel')
const chai      = require('chai')
const chaiHttp  = require('chai-http')
const db        = require('../config')
const assert    = chai.assert
const token     = process.env.SECRET_TOKEN

chai.use(chaiHttp)
let request     = chai.request(app)
let author      = {name: "William Gibson"}


describe("Test /api/authors", () => {

    beforeEach( done => {

       Author.sync({force: true})
            .then( () => {
                Author.create(author)
                    .then( c => done())
                    .catch( e => {console.log(e.errors); done() })
            })
            .catch( e => { console.log(e.message); done() })
    })

    describe("TEST GET /api/authors ", () => {

        it("returns an empty array when there are no authors", done => {
            Author.destroy({ where: {id: 1}})
            request.get('/api/authors')
                .end( (err, res) => {
                    assert.equal(res.statusCode, 200)
                    assert.isArray(res.body.authors)
                    assert.equal(res.body.authors.length, 0)
                    done()
                })
        })

        it("returns a list of all available authors", (done) => {

            request.get('/api/authors')
                .end((err, res) => {
                    assert.equal(res.statusCode, 200)
                    assert.isObject(res.body)
                    assert.property(res.body, "count")
                    assert.property(res.body, "authors")
                    assert.isArray(res.body.authors)
                    assert.include(res.body.authors[0].href, '/api/authors/1')
                    done()
                })
        })
    })

    describe("TEST GET /api/authors/:id", done => {

        it("should return the corresponding author based on the id", done => {
            request.get('/api/authors/1')
                .end( (err, res) => {
                    assert.isFalse(res.error)
                    assert.equal(res.statusCode, 200)
                    assert.isObject(res.body)
                    assert.property(res.body, 'id')
                    assert.equal(res.body.id, 1)
                    done()
                })
        })

        it("Returns a 404 when the requested author does not exist", done => {

            request.get('/api/authors/4')
                .end( (err, res) => {
                    assert.equal(res.statusCode, 404)
                    assert.isObject(res.body)
                    assert.property(res.body, 'type')
                    assert.equal(res.body.type, 'error')
                    assert.property(res.body, 'message')
                    assert.include(res.body.message, 'not found')
                    done()
                })
        })
    })

    describe("TEST GET /api/authors/:id/novels ", () => {

        before( done => {
            Novel.sync({force: true})
                .then( () => done())
                .catch(e => {console.log(e); done()})

        })

        it("returns empty array when author has no novels associated", done => {

            request.get('/api/authors/2/novels')
                .end( (err, res) => {
                    assert.equal(res.statusCode, 200)
                    assert.isArray(res.body.novels)
                    assert.equal(res.body.novels.length, 0)
                    done()
                })
        })

        it("returns a list of novels associated to the author", (done) => {

            Novel.create({name: "Idoru", year: "2323", authorId: 1})
                .then( () => {

                    request.get('/api/authors/1/novels')
                        .end((err, res) => {
                            assert.equal(res.statusCode, 200)
                            assert.isObject(res.body)
                            assert.property(res.body, "count")
                            assert.property(res.body, "novels")
                            assert.isArray(res.body.novels)
                            done()
                        })
                })
                .catch( err => {console.log(err.errors); done()})
        })
    })

    describe("Test POST /api/authors/", () => {

        let sterling  = { name: "Bruce Sterling" }
        let asimov    = { name: "Isaac Asimov" }

        beforeEach( done => {

            Author.create(asimov)
                .then( c => done())
                .catch( e => { console.log("Shit happened, figure it out" + e); done() } )
        })

        it("successfully saves the resource to the DB", (done) => {

            request.post('/api/authors')
               .set('x-access-token', token)
               .send(sterling)
               .end( (err, res) => {
                   assert.isTrue(res.ok)
                   assert.isFalse(res.error)
                   assert.equal(res.statusCode, 201)
                   assert.property(res.body, 'author')
                   assert.equal(res.body.author.nationality, "Unknown")
                   assert.include(res.headers.location, `/api/authors/${res.body.author.id}`)
                   done()
                })
        })

        it("Returns a 409 when passed an already existing author", (done) => {

            request.post('/api/authors')
                .set('x-access-token', token)
                .send(asimov)
                .end( (err, res) => {
                    assert.equal(res.statusCode, 409)
                    assert.property(res.body, 'type')
                    assert.equal(res.body.type, 'error')
                    assert.equal(res.body.message, 'A resource with the following fields already exists in the database.')
                    assert.isArray(res.body.fields)
                    done()
                })
        })

        it("Returns a 422 when missing one or more required fields", (done) => {

            fakeAuthor = { nationality: "French" }

            request.post('/api/authors')
                .set('x-access-token', token)
                .send(fakeAuthor)
                .end( (err, res) => {
                    assert.equal(res.statusCode, 422)
                    assert.property(res.body, 'type')
                    assert.equal(res.body.type, 'error')
                    assert.equal(res.body.message, 'Missing required fields.')
                    assert.isArray(res.body.fields)
                    done()
                })
        })
    })

    describe("Test PUT /api/authors/id", () => {

        it("returns a 400 when passing an incomplete payload", (done) => {
           request.put(`/api/authors/1`)
               .set('x-access-token', token)
               .send({nationality: "Canadian"})
               .end( (err, res) => {
                   assert.equal(res.statusCode, 400)
                   assert.equal(res.body.statusCode, 400)
                   assert.property(res.body,'type')
                   assert.equal(res.body.message, "Bad request. Please provide all the fields")
                   done()
               })
        })

        it("returns a 200 when passing a complete payload", (done) => {

            request.put(`/api/authors/1`)
               .set('x-access-token', token)
               .send({ name: "Fanfan la tulipe", nationality: "Mexican" })
               .end( (err, res) => {
                   assert.equal(res.statusCode, 200)
                   assert.equal(res.body.statusCode, 200)
                   assert.property(res.body, "message")
                   assert.equal(res.body.message, "Author successfully updated")
                   done()
               })

        })
    })

    describe("Test PATCH /api/authors/:id", () => {

        it("should return a 200 when successful", done => {

            request.patch(`/api/authors/1`)
                .set('x-access-token', token)
                .send({name: "Bennnnnz"})
                .end( (err, res) => {
                    assert.equal(res.statusCode, 200)
                    assert.equal(res.body.statusCode, 200)
                    assert.property(res.body, "type")
                    assert.equal(res.body.type, "success")
                    assert.property(res.body, "message")
                    assert.equal(res.body.message, "Update successful")
                    done()
                })
            })
    })

    describe("Test DELETE /api/authors/:id", () => {

        it("should return a 204 when successful", done => {
                request.delete(`/api/authors/1`)
                    .set('x-access-token', token)
                    .end( (err, res) => {
                    assert.equal(res.statusCode, 204)
                    done()
                })
        })
    })
})
