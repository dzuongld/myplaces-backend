const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')
const User = require('../models/user')

const getUsers = async (req, res, next) => {
    let users
    try {
        // alternative: 'email name'
        users = await User.find({}, '-password')
    } catch (error) {
        const e = new HttpError('Failed in fetching users', 500)
        return next(e)
    }

    res.json({
        users: users.map((user) => {
            return user.toObject({ getters: true })
        }),
    })
}

const createUser = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors)
        const e = new HttpError('Invalid inputs', 422)
        return next(e)
    }

    // from body parser
    const { name, email, password } = req.body

    let exist
    try {
        exist = await User.findOne({ email })
    } catch (e) {
        const error = new HttpError('Failed in getting user from db', 500)
        return next(error)
    }
    if (exist) {
        const error = new HttpError('User already exists', 422)
        return next(error)
    }

    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch (e) {
        const error = new HttpError('Could not create user', 500)
        return next(error)
    }

    const createdUser = new User({
        email,
        name,
        password: hashedPassword,
        image: req.file.path,
        places: [],
    })

    try {
        await createdUser.save()
    } catch (e) {
        const error = new HttpError('Failed in signing up', 500)
        return next(error)
    }

    let token
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        )
    } catch (e) {
        const error = new HttpError('Failed in signing up', 500)
        return next(error)
    }

    res.status(201).json({
        userId: createdUser.id,
        email: createdUser.email,
        token: token,
    })
}

const loginUser = async (req, res, next) => {
    const { email, password } = req.body

    let user
    try {
        user = await User.findOne({ email })
    } catch (e) {
        const error = new HttpError('Failed in logging in', 403)
        return next(error)
    }

    let validPassword = false
    try {
        validPassword = await bcrypt.compare(password, user.password)
    } catch (e) {
        const error = new HttpError('Cannot login', 500)
        return next(error)
    }

    if (!user || !validPassword) {
        const e = new HttpError('Unauthorized', 401)
        return next(e)
    }

    let token
    try {
        token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        )
    } catch (e) {
        const error = new HttpError('Failed in logging in', 500)
        return next(error)
    }

    res.json({
        userId: user.id,
        email: user.email,
        token: token,
    })
}

// individual export in Node
exports.getUsers = getUsers
exports.createUser = createUser
exports.loginUser = loginUser
