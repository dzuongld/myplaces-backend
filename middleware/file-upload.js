const multer = require('multer')
const { nanoid } = require('nanoid')

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const fileUpload = multer({
    limits: 500000, // bytes
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, 'uploads/images')
        },
        filename: (req, file, callback) => {
            const ext = MIME_TYPE_MAP[file.mimetype]
            callback(null, nanoid() + '.' + ext)
        },
    }),
    fileFilter: (req, file, callback) => {
        const valid = !!MIME_TYPE_MAP[file.mimetype]
        const error = valid ? null : new Error('Invalid MIME type')
        callback(error, valid)
    },
})

module.exports = fileUpload
