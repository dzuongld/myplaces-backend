const axios = require('axios').default
const HttpError = require('../models/http-error')

const API_KEY = process.env.MAPBOX_API

async function getCoords(address) {
    const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
        )}.json?access_token=${API_KEY}`
    )

    const data = response.data

    if (data.features.length === 0) {
        throw new HttpError('Could not find location for this address', 422)
    }

    const coords = data.features[0].geometry.coordinates
    return coords
}

module.exports = getCoords
