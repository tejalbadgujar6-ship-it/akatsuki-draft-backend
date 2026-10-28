/**
 * Standardized API Response Structure
 */
export class ApiResponse {
  constructor(statusCode, message = 'Success', data = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }

  static success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return res.status(201).json(new ApiResponse(201, message, data));
  }
}

export default ApiResponse;
