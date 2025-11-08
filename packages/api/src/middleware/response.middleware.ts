import { Request, Response, NextFunction } from 'express';

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override the json method
  res.json = function(data: any) {
    // Check if response is already wrapped
    if (data && data.hasOwnProperty('success')) {
      // Already in standard format, send as is
      return originalJson.call(this, data);
    }
    
    // Check if this is an error status code
    if (res.statusCode >= 400) {
      const errorResponse: StandardResponse = {
        success: false,
        error: data.error || data.message || 'An error occurred',
        message: data.message || data.error || 'An error occurred'
      };
      
      // Include validation details if they exist
      if (data.details) {
        (errorResponse as any).details = data.details;
      }
      
      return originalJson.call(this, errorResponse);
    }
    
    // Wrap successful responses
    const successResponse: StandardResponse = {
      success: true,
      data: data
    };
    
    return originalJson.call(this, successResponse);
  };
  
  next();
};

export const errorResponseWrapper = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Standard error response format
  const errorResponse: StandardResponse = {
    success: false,
    error: err.message || 'Internal server error',
    message: err.message || 'Internal server error'
  };
  
  // Set status code if not already set
  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json(errorResponse);
};