class CustomError extends Error {
    /**
     * Custom error
     * @param {Number} code
     * @param {string} message
     */
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'CustomError';
    };
};

module.exports = CustomError;