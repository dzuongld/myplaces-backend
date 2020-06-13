const fs = require('fs')

const mongoose = require('mongoose')
const { validationResult } = require('express-validator')
const getCoords = require('../utils/location')
const HttpError = require('../models/http-error')
const Place = require('../models/place')
const User = require('../models/user')

let DUMMY_PLACES = [
    {
        id: 'p1',
        title: 'Trump Tower',
        description: "Orange-faced's residence",
        imageUrl:
            'https://i.insider.com/5d5b3aeacd9784667b78e332?width=1136&format=jpeg',
        address: '725 5th Ave, New York, NY 10022, United States',
        location: {
            lat: 40.7624284,
            lng: -73.9759827,
        },
        creator: '1',
    },
    {
        id: 'p2',
        title: 'Empire State Building',
        description: 'Historical landmark',
        imageUrl:
            'https://cropper.watch.aetnd.com/public-content-aetn.video.aetnd.com/video-thumbnails/AETN-History_VMS/21/202/tdih-may01-HD.jpg?w=1440',
        address: '20 W 34th St, New York, NY 10001, United States',
        location: {
            lat: 40.7484405,
            lng: -73.9878531,
        },
        creator: '2',
    },
]

const getPlaceById = async (req, res, next) => {
    // params: { pid: 'p1' }
    const placeId = req.params.pid

    // findbyid does not return Promise but await can still be used
    let place
    try {
        place = await Place.findById(placeId)
    } catch (error) {
        const e = new HttpError('Cannot find place', 500)
        return next(e)
    }

    if (!place) {
        const e = new HttpError('Could not find a place for provided id', 404)
        return next(e)
    }

    // add id as string to returned object
    res.json({ place: place.toObject({ getters: true }) })
}

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid

    let places
    try {
        // .exec() is optional
        places = await Place.find({ creator: userId })
    } catch (e) {
        const error = new HttpError('Failed in fetching places', 500)
        return next(error)
    }

    // if (!places || places.length === 0) {
    //     return next(new HttpError('Could not find places for this user', 404)) // different way than throw
    // }

    res.json({
        places: places.map((place) => {
            return place.toObject({ getters: true })
        }),
    })

    // * alternative: use populate()
    // let places
    // try {
    //     places = await User.findById(userId).populate('places')
    // } catch (e) {
    //     const error = new HttpError('Failed in fetching places', 500)
    //     return next(error)
    // }
}

const createPlace = async (req, res, next) => {
    // perform validation first
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        // console.log(errors)
        // throw new HttpError('Invalid inputs', 422)

        // *use next() because throw does not work correctly with async
        return next(new HttpError('Invalid inputs for place', 422))
    }

    // from body parser
    const { title, description, address, creator } = req.body

    let coordinates
    try {
        coordinates = await getCoords(address)
    } catch (error) {
        return next(error)
    }

    const createdPlace = new Place({
        title,
        description,
        location: {
            lng: coordinates[0],
            lat: coordinates[1],
        },
        address,
        image: req.file.path,
        creator,
    })

    let user
    try {
        user = await User.findById(creator)
    } catch (e) {
        const error = new HttpError('Failed in creating new place', 500)
        return next(error)
    }

    if (!user) {
        const error = new HttpError('Could not find user with provided ID', 404)
        return next(error)
    }

    try {
        if (process.env.ENV_NAME === 'Development') {
            await createdPlace.save()
            user.places.push(createdPlace)
            await user.save()
        } else {
            // * use session for multiple DB operations
            // * if 1 fails, all will be rolled back
            // ! not working in local mode

            const session = await mongoose.startSession()
            session.startTransaction()
            await createdPlace.save({ session })

            await user.save({ session })
            await session.commitTransaction()
        }
    } catch (e) {
        console.log(e)
        const error = new HttpError('Failed in creating new place abc', 500)
        return next(error)
    }

    res.status(201).json({ place: createdPlace.toObject({ getters: true }) })
}

const editPlace = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors)
        const e = new HttpError('Invalid inputs', 422)
        return next(e)
    }

    const { title, description } = req.body
    const placeId = req.params.pid

    let place
    try {
        place = await Place.findById(placeId)
    } catch (error) {
        const e = new HttpError('Cannot update place', 500)
        return next(e)
    }

    place.title = title
    place.description = description

    try {
        await place.save()
    } catch (e) {
        const error = new HttpError('Failed in saving changes', 500)
        return next(error)
    }

    res.status(200).json({ place: place.toObject({ getters: true }) })
}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid

    let place
    try {
        // * require 'ref' in relationship to work
        place = await Place.findById(placeId).populate('creator')

        if (!place) {
            const e = new HttpError('Could not find this place', 404)
            return next(e)
        }

        if (process.env.ENV_NAME === 'Development') {
            await place.remove()
            place.creator.places.pull(place)
            await place.creator.save()
        } else {
            const session = await mongoose.startSession()
            session.startTransaction()
            await place.remove({ session })

            // remove from array
            place.creator.places.pull(place)

            // save the user
            await place.creator.save({ session })

            await session.commitTransaction()
        }

        // remove photo
        const imagePath = place.image
        fs.unlink(imagePath, (err) => {
            console.log(err)
        })
    } catch (error) {
        const e = new HttpError('Cannot delete place', 500)
        return next(e)
    }

    res.status(200).json({ message: 'Place deleted' })
}

// individual export in Node
exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.editPlace = editPlace
exports.deletePlace = deletePlace
