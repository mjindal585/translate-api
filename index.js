const express = require('express');
const {translate} = require('@vitalets/google-translate-api');
const { body, validationResult } = require('express-validator');
const morgan = require('morgan');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize an in-memory cache
const translationCache = new NodeCache({ stdTTL: 0 });
app.use(express.json());

// Validation middleware
const validateRequestBody = [
    body('text').notEmpty().withMessage('Text to translate is required.'),
    body('toLocale').optional().isString().withMessage('Invalid "toLocale" value. Expected string')
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
app.use(morgan('dev'));
const documentation = {
    route: '/translate',
    method: 'POST',
    description: 'Translate text from one language to another using the Google Translate API.',
    parameters: [
        { name: 'text', description: 'Text to be translated (required).' },
        { name: 'toLocale', description: 'Target language code (optional, default: "fr(french)").' }
    ],
    example: {
        request: {
            text: 'Hello, how are you?',
            toLocale: 'es'
        },
        response: {
            translation: '¡Hola, cómo estás?'
        }
    }
};
// Documentation endpoint
app.get('/', (req, res) => {
    res.json(documentation);
});
app.get('/translate', (req, res) => {
    res.json(documentation);
});
// Translation API endpoint
app.post('/translate', validateRequestBody, handleValidationErrors, async (req, res) => {
    try {
        const { text, toLocale = 'fr' } = req.body;

        // Check if the translation is already cached
        const cacheKey = `${text}-${toLocale}`;
        const cachedTranslation = translationCache.get(cacheKey);
        if (cachedTranslation) {
            console.log('Translation found in cache');
            return res.json({ translation: cachedTranslation });
        }

        const translatedText = await translate(text, { to: toLocale });

        // Cache the translated text
        translationCache.set(cacheKey, translatedText.text);

        res.json({ translation: translatedText.text });
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'TooManyRequestsError') {
            res.status(429).json({ error: error.name, message: error.message || ' ' });
        } else {
            let errorMessage = 'Internal server error.';
            if (error.code === 'BAD_REQUEST') {
                errorMessage = 'Bad Request';
            }
            res.status(500).json({ error: errorMessage, message: error.message || ' ' });
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error.', message: err.message || '' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
