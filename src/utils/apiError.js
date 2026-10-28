/**
 * Custom Operational API Error
 */
export class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden resource') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict detected') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

export default ApiError;
