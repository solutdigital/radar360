// Basic wordlist for profanity filtering
const PROFANITY_LIST = ["insulto1", "insulto2", "mala_palabra"]; 

// RegEx Patterns based on SRD
const PHONE_REGEX = /\b\d{7,12}\b/;
const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.[a-z]{2,}/i;
const URL_REGEX = /(https?:\/\/|www\.)[^\s]+/i;

const validateMessageContent = (req, res, next) => {
    const { content, type } = req.body;

    // Filters only apply to TEXT messages
    if (type !== 'TEXT' || !content) {
        return next();
    }

    // Check Phone Numbers (FILT-01)
    if (PHONE_REGEX.test(content)) {
        return res.status(422).json({ error: "PHONE_NUMBER", message: "Envío de números telefónicos no permitido." });
    }

    // Check Emails (FILT-02)
    if (EMAIL_REGEX.test(content)) {
        return res.status(422).json({ error: "EMAIL", message: "Envío de correos electrónicos no permitido." });
    }

    // Check URLs (FILT-03)
    if (URL_REGEX.test(content)) {
        return res.status(422).json({ error: "URL", message: "Envío de enlaces externos no permitido." });
    }

    // Check Profanity (FILT-04)
    // Basic exact match for MVP, can be expanded to Levenshtein distance as per SRD
    const lowerContent = content.toLowerCase();
    const containsProfanity = PROFANITY_LIST.some(word => lowerContent.includes(word));
    
    if (containsProfanity) {
        return res.status(422).json({ error: "PROFANITY", message: "Lenguaje inapropiado detectado." });
    }

    // Pass
    next();
};

module.exports = { validateMessageContent };
