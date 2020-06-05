const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')
const User = require('../models/user')

const USERS = [
    {
        id: '1',
        image: 'https://randomuser.me/api/portraits/women/77.jpg',
        name: 'An',
        places: 3,
        email: 'a@mail.com',
        password: 'password',
    },
    {
        id: '2',
        image: 'https://randomuser.me/api/portraits/men/85.jpg',
        name: 'Binh',
        places: 8,
        email: 'b@mail.com',
        password: 'password',
    },
    {
        id: '3',
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        name: 'Chi',
        places: 5,
        email: 'c@mail.com',
        password: 'password',
    },
]
const getUsers = async (req, res, next) => {
    let users
    try {
        users = await User.find({}, 'email name') // alternative: '-password'
    } catch (error) {
        const e = new HttpError('Failed in fetching users', 500)
        return next(e)
    }

    res.json({ users })
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

    const createdUser = new User({
        email,
        name,
        password,
        image: 'url',
        places: [],
    })

    try {
        await createdUser.save()
    } catch (e) {
        const error = new HttpError('Failed in signing up', 500)
        return next(error)
    }

    res.status(201).json({ user: createdUser })
}

const loginUser = async (req, res, next) => {
    const { email, password } = req.body

    let user
    try {
        user = await User.findOne({ email })
    } catch (e) {
        const error = new HttpError('Failed in logging in', 500)
        return next(error)
    }

    if (!user || user.password !== password) {
        const e = new HttpError('Unauthorized', 401)
        return next(e)
    }

    res.json({ message: 'Logged in' })
}

// individual export in Node
exports.getUsers = getUsers
exports.createUser = createUser
exports.loginUser = loginUser
