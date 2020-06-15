const express = require('express')
const { check } = require('express-validator')

const placesController = require('../controllers/places-controllers')
const fileUpload = require('../middleware/file-upload')
const checkAuth = require('../middleware/check-auth.js')

const router = express.Router()

// specific place
router.get('/:pid', placesController.getPlaceById)

// places by user
// order matters - /user is interpreted as an invalid pid
router.get('/user/:uid', placesController.getPlacesByUserId)

// * placed after public routes
router.use(checkAuth)

// add new place
// middlewares are executed left to right
router.post(
    '/',
    fileUpload.single('image'),
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 }),
        check('address').not().isEmpty(),
    ],
    placesController.createPlace
)

// edit place
router.patch(
    '/:pid',
    [check('title').not().isEmpty(), check('description').isLength({ min: 5 })],
    placesController.editPlace
)

// remove place
router.delete('/:pid', placesController.deletePlace)

module.exports = router
