const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const HttpError = require('./models/http-error')
const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/users-routes')

const app = express()
const port = process.env.PORT || 5000

// extract request to JS object
app.use(bodyParser.json())

// only use place routes when url starts wih /api/places
app.use('/api/places', placesRoutes)

// user routes
app.use('/api/users', usersRoutes)

// unsupported routes
app.use((req, res, next) => {
    // passed to default error handler
    throw new HttpError('Could not find this route', 404)
})

// when providing 4 args, express wil recognize as default error handler
// only execute when an error is thrown
app.use((error, req, res, next) => {
    // special property - response headers have been sent
    if (res.headerSent) {
        return next(error)
    }

    res.status(error.code || 500)
    res.json({ message: error.message || 'An unknown error occurred!' })
})

// connect the DB
const mongoURL = process.env.MONGO_URL

mongoose.set('useCreateIndex', true)
mongoose
    .connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        app.listen(port)
    })
    .catch((error) => {
        console.log(error.reason)
    })
