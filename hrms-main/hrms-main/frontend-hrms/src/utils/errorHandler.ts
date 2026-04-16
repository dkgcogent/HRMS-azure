// @ts-nocheck
import { AxiosError } from 'axios';

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export class ErrorHandler {
  static handleApiError(error: AxiosError): ErrorResponse {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          return {
            message: data?.message || 'Invalid request. Please check your input.',
            code: 'BAD_REQUEST',
            details: data?.details
          };
        
        case 401:
          return {
            message: 'You are not authorized. Please login again.',
            code: 'UNAUTHORIZED'
          };
        
        case 403:
          return {
            message: 'You do not have permission to perform this action.',
            code: 'FORBIDDEN'
          };
        
        case 404:
          return {
            message: 'The requested resource was not found.',
            code: 'NOT_FOUND'
          };
        
        case 409:
          return {
            message: data?.message || 'A conflict occurred. The resource may already exist.',
            code: 'CONFLICT'
          };
        
        case 422:
          return {
            message: data?.message || 'Validation failed. Please check your input.',
            code: 'VALIDATION_ERROR',
            details: data?.details
          };
        
        case 500:
          return {
            message: 'An internal server error occurred. Please try again later.',
            code: 'INTERNAL_ERROR'
          };
        
        default:
          return {
            message: data?.message || `An error occurred (${status}). Please try again.`,
            code: 'UNKNOWN_ERROR'
          };
      }
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  static getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  static isNetworkError(error: AxiosError): boolean {
    return !error.response && !!error.request;
  }

  static isValidationError(error: AxiosError): boolean {
    return error.response?.status === 422;
  }

  static isAuthError(error: AxiosError): boolean {
    return error.response?.status === 401;
  }

  static logError(error: any, context?: string) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error: {
        message: this.getErrorMessage(error),
        stack: error?.stack,
        response: error?.response?.data,
        status: error?.response?.status
      }
    };
    
    console.error('Application Error:', errorInfo);
    
    // In production, you might want to send this to a logging service
    // logToService(errorInfo);
  }
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Not authorized to perform this action') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Error boundary helper - commented out for now as it requires React import
// export const withErrorBoundary = (Component: React.ComponentType<any>) => {
//   return class extends React.Component {
//     constructor(props: any) {
//       super(props);
//       this.state = { hasError: false, error: null };
//     }

//     static getDerivedStateFromError(error: Error) {
//       return { hasError: true, error };
//     }

//     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
//       ErrorHandler.logError(error, 'React Error Boundary');
//       console.error('Error Info:', errorInfo);
//     }

//     render() {
//       if (this.state.hasError) {
//         return (
//           <div style={{
//             padding: '20px',
//             textAlign: 'center',
//             border: '1px solid #f5c6cb',
//             borderRadius: '4px',
//             backgroundColor: '#f8d7da',
//             color: '#721c24'
//           }}>
//             <h3>Something went wrong</h3>
//             <p>An error occurred while rendering this component.</p>
//             <button
//               onClick={() => this.setState({ hasError: false, error: null })}
//               style={{
//                 padding: '8px 16px',
//                 backgroundColor: '#dc3545',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '4px',
//                 cursor: 'pointer'
//               }}
//             >
//               Try Again
//             </button>
//           </div>
//         );
//       }

//       return <Component {...this.props} />;
//     }
//   };
// };

// Async error handler for promises
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  errorContext?: string
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    ErrorHandler.logError(error, errorContext);
    throw error;
  }
};

// Retry mechanism
export const retryAsync = async <T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};
