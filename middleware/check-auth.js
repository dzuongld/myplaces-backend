const jwt = require('jsonwebtoken')
const HttpError = require('../models/http-error')

module.exports = (req, res, next) => {
    // browser behavior - need to handle
    if (req.method === 'OPTIONS') {
        return next()
    }

    try {
        // get token from headers - instead of params or body
        // Authorization: 'Bearer TOKEN'
        const token = req.headers.authorization.split(' ')[1]

        if (!token) {
            throw new HttpError('Authentication failed', 401)
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

        // dynamically add data to request
        req.userData = { userId: decodedToken.userId }
        // no error - continue
        next()
    } catch (e) {
        const error = new HttpError('Authentication failed', 403)
        return next(error)
    }
}
