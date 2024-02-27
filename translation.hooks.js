const { body, validationResult } = require('express-validator');

// Validate the request body
const validateRequestBody = [
    body('text').notEmpty().withMessage('Text to translate is required.'),
    body('toLocale').optional().isString().withMessage('Invalid "toLocale" value.')
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateRequestBody,
    handleValidationErrors
};
