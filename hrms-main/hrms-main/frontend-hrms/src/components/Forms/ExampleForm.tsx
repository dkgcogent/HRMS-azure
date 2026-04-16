// @ts-nocheck
/**
 * Example HRMS Form Component
 * 
 * This demonstrates how to use the reusable form components
 * with proper placeholders, validation, and accessibility.
 */

import React, { useState } from 'react';
import { FormContainer, FormSection, FormField } from './index';
import { useNavigate } from 'react-router-dom';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  department: string;
  designation: string;
  joiningDate: string;
  description: string;
  salary: string;
}

const ExampleHRMSForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    department: '',
    designation: '',
    joiningDate: '',
    description: '',
    salary: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.designation) {
      newErrors.designation = 'Designation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Form submitted:', formData);
      // Handle success (e.g., show success message, navigate)
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const departmentOptions = [
    { value: 'it', label: 'Information Technology' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
  ];

  const designationOptions = [
    { value: 'developer', label: 'Software Developer' },
    { value: 'manager', label: 'Manager' },
    { value: 'analyst', label: 'Business Analyst' },
    { value: 'designer', label: 'UI/UX Designer' },
    { value: 'executive', label: 'Executive' },
  ];

  return (
    <FormContainer
      title="Employee Registration"
      subtitle="Fill in all required fields with accurate information. All fields marked with * are mandatory."
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel="Register Employee"
      cancelLabel="Cancel"
      loading={loading}
    >
      {/* Personal Information Section */}
      <FormSection
        title="Personal Information"
        subtitle="Enter the employee's personal details"
        columns={2}
      >
        <FormField
          name="firstName"
          label="First Name"
          placeholder="Enter employee's first name"
          value={formData.firstName}
          onChange={handleChange}
          error={!!errors.firstName}
          helperText={errors.firstName}
          required
          autoComplete="given-name"
        />

        <FormField
          name="lastName"
          label="Last Name"
          placeholder="Enter employee's last name"
          value={formData.lastName}
          onChange={handleChange}
          error={!!errors.lastName}
          helperText={errors.lastName}
          required
          autoComplete="family-name"
        />

        <FormField
          name="email"
          label="Email Address"
          placeholder="Enter email address (e.g., john.doe@company.com)"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          required
          autoComplete="email"
        />

        <FormField
          name="phone"
          label="Phone Number"
          placeholder="Enter 10-digit phone number"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          error={!!errors.phone}
          helperText={errors.phone}
          required
          autoComplete="tel"
        />

        <FormField
          name="dateOfBirth"
          label="Date of Birth"
          placeholder="Select date of birth"
          type="date"
          value={formData.dateOfBirth}
          onChange={handleChange}
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth}
          required
        />
      </FormSection>

      {/* Address Information Section */}
      <FormSection
        title="Address Information"
        subtitle="Enter the employee's residential address"
        columns={2}
      >
        <FormField
          name="address"
          label="Street Address"
          placeholder="Enter street address and house number"
          value={formData.address}
          onChange={handleChange}
          multiline
          rows={2}
        />

        <FormField
          name="city"
          label="City"
          placeholder="Enter city name"
          value={formData.city}
          onChange={handleChange}
        />

        <FormField
          name="state"
          label="State"
          placeholder="Enter state name"
          value={formData.state}
          onChange={handleChange}
        />

        <FormField
          name="pincode"
          label="Pincode"
          placeholder="Enter 6-digit pincode"
          type="text"
          value={formData.pincode}
          onChange={handleChange}
          inputProps={{ maxLength: 6, pattern: '[0-9]{6}' }}
        />
      </FormSection>

      {/* Employment Information Section */}
      <FormSection
        title="Employment Information"
        subtitle="Enter the employee's job details"
        columns={2}
      >
        <FormField
          name="department"
          label="Department"
          placeholder="Select department"
          value={formData.department}
          onChange={handleChange}
          error={!!errors.department}
          helperText={errors.department}
          required
          select
          options={departmentOptions}
        />

        <FormField
          name="designation"
          label="Designation"
          placeholder="Select job designation"
          value={formData.designation}
          onChange={handleChange}
          error={!!errors.designation}
          helperText={errors.designation}
          required
          select
          options={designationOptions}
        />

        <FormField
          name="joiningDate"
          label="Joining Date"
          placeholder="Select joining date"
          type="date"
          value={formData.joiningDate}
          onChange={handleChange}
        />

        <FormField
          name="salary"
          label="Salary"
          placeholder="Enter monthly salary amount"
          type="number"
          value={formData.salary}
          onChange={handleChange}
          inputProps={{ min: 0, step: 1000 }}
        />
      </FormSection>

      {/* Additional Information Section */}
      <FormSection
        title="Additional Information"
        subtitle="Any additional notes or comments"
        columns={1}
      >
        <FormField
          name="description"
          label="Description"
          placeholder="Write any additional information or notes about the employee here"
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={4}
          maxRows={8}
        />
      </FormSection>
    </FormContainer>
  );
};

export default ExampleHRMSForm;











