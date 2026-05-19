export class ApiError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
