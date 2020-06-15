const fs = require('fs')
const path = require('path')

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const HttpError = require('./models/http-error')
const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/users-routes')

const app = express()
const port = process.env.PORT || 5000

// enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    )
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')

    next()
})

// app.use(cors())

// extract request to JS object
app.use(bodyParser.json())

// by default files in the backend are not accessible
// app.use('/uploads/images', express.static(path.join('uploads', 'images')))

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
    // 'file' is added by Multer
    // remove file if there is an error
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err)
        })
    }

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
