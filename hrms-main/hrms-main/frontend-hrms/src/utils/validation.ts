// @ts-nocheck
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export class Validator {
  static validateField(value: any, rules: ValidationRule): string | null {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        return `Minimum length is ${rules.minLength} characters`;
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Maximum length is ${rules.maxLength} characters`;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Invalid format';
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }

  static validateForm(data: any, rules: ValidationRules): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.keys(rules).forEach(field => {
      const error = this.validateField(data[field], rules[field]);
      if (error) {
        errors[field] = error;
      }
    });

    return errors;
  }

  static hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}

// Common validation rules
export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },

  mobile: {
    pattern: /^[0-9]{10}$/,
    custom: (value: string) => {
      if (value && !/^[0-9]{10}$/.test(value)) {
        return 'Please enter a valid 10-digit mobile number';
      }
      return null;
    }
  },

  pincode: {
    pattern: /^[0-9]{6}$/,
    custom: (value: string) => {
      if (value && !/^[0-9]{6}$/.test(value)) {
        return 'Please enter a valid 6-digit pincode';
      }
      return null;
    }
  },

  ifscCode: {
    pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    custom: (value: string) => {
      if (value && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
        return 'Please enter a valid IFSC code (e.g., SBIN0001234)';
      }
      return null;
    }
  },

  accountNumber: {
    pattern: /^[0-9]{9,18}$/,
    custom: (value: string) => {
      if (value && !/^[0-9]{9,18}$/.test(value)) {
        return 'Account number should be 9-18 digits';
      }
      return null;
    }
  },

  name: {
    pattern: /^[a-zA-Z\s]+$/,
    custom: (value: string) => {
      if (value && !/^[a-zA-Z\s]+$/.test(value)) {
        return 'Name should contain only letters and spaces';
      }
      return null;
    }
  },

  alphanumeric: {
    pattern: /^[a-zA-Z0-9\s]+$/,
    custom: (value: string) => {
      if (value && !/^[a-zA-Z0-9\s]+$/.test(value)) {
        return 'Only letters, numbers and spaces are allowed';
      }
      return null;
    }
  },

  positiveNumber: {
    custom: (value: any) => {
      const num = Number(value);
      if (value && (isNaN(num) || num <= 0)) {
        return 'Please enter a positive number';
      }
      return null;
    }
  },

  dateNotFuture: {
    custom: (value: string) => {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        if (selectedDate > today) {
          return 'Date cannot be in the future';
        }
      }
      return null;
    }
  },

  dateNotPast: {
    custom: (value: string) => {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        if (selectedDate < today) {
          return 'Date cannot be in the past';
        }
      }
      return null;
    }
  },

  minimumAge: (minAge: number) => ({
    custom: (value: string) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < minAge) {
          return `Minimum age should be ${minAge} years`;
        }
      }
      return null;
    }
  }),

  maximumAge: (maxAge: number) => ({
    custom: (value: string) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age > maxAge) {
          return `Maximum age should be ${maxAge} years`;
        }
      }
      return null;
    }
  })
};

// Employee form validation rules
export const employeeValidationRules: ValidationRules = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    ...ValidationRules.name
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    ...ValidationRules.name
  },
  email: {
    required: true,
    ...ValidationRules.email
  },
  mobile: {
    required: true,
    ...ValidationRules.mobile
  },
  dateOfBirth: {
    required: true,
    ...ValidationRules.dateNotFuture,
    ...ValidationRules.minimumAge(18)
  },
  gender: {
    required: true
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 50,
    ...ValidationRules.name
  },
  state: {
    required: true,
    minLength: 2,
    maxLength: 50,
    ...ValidationRules.name
  },
  pincode: {
    required: true,
    ...ValidationRules.pincode
  },
  joiningDate: {
    required: true
  },
  manpowerTypeId: {
    required: true
  },
  departmentId: {
    required: true
  },
  designationId: {
    required: true
  },
  workLocationId: {
    required: true
  },
  shiftId: {
    required: true
  },
  accountNumber: {
    ...ValidationRules.accountNumber
  }
};

// Master data validation rules
export const masterDataValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    ...ValidationRules.alphanumeric
  },
  description: {
    maxLength: 500
  },
  ifscCode: {
    required: true,
    ...ValidationRules.ifscCode
  },
  branchName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200
  }
};
