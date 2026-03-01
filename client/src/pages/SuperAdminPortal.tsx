import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';

const SuperAdminPortal = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailCheckTimer = useRef<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Section 1: Personal Information
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    
    // Section 2: Contact Information
    email: '',
    phone: '',
    address: '',
    city: '',
    
    // Section 3: Employment Details
    position: '',
    department: '',
    startDate: '',
    employmentType: 'Full-time',
    
    // Section 4: Emergency Contact
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    
    // Section 5: Account Setup
    generatePassword: false,
    manualPassword: '',
    manualPasswordConfirm: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    validateField(name, type === 'checkbox' ? ((e.target as HTMLInputElement).checked ? 'true' : 'false') : value);
    if (name === 'email') {
      if (emailCheckTimer.current) {
        clearTimeout(emailCheckTimer.current);
      }
      emailCheckTimer.current = window.setTimeout(() => {
        checkEmailDuplicate(value);
      }, 500);
    }
  };

  const checkEmailDuplicate = async (email: string) => {
    try {
      const res = await usersAPI.getAll();
      const exists = res.data.some((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
      setErrors(prev => ({ ...prev, email: exists ? 'Email already exists' : prev.email && prev.email !== 'Email already exists' ? prev.email : '' }));
    } catch {
    }
  };

  const validateField = (name: string, value: string) => {
    let message = '';
    if (name === 'firstName' || name === 'lastName') {
      if (!value || value.trim().length < 2) message = 'Required, min 2 characters';
    }
    if (name === 'dateOfBirth') {
      if (!value) message = 'Birthdate is required';
      else {
        const dob = new Date(value);
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
        if (dob > minAgeDate) message = 'Must be at least 18 years old';
      }
    }
    if (name === 'gender') {
      if (!value) message = 'Gender is required';
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) message = 'Invalid email format';
    }
    if (name === 'phone') {
      const phoneRegex = /^(09|\+639)\d{9}$/;
      const clean = value.replace(/[-\s]/g, '');
      if (!phoneRegex.test(clean)) message = 'Invalid Philippine phone format';
    }
    if (name === 'address') {
      if (!value || value.trim().length < 5) message = 'Address is required';
    }
    if (name === 'city') {
      if (!value) message = 'City is required';
    }
    if (name === 'position' || name === 'department') {
      if (!value) message = 'Required';
    }
    if (name === 'startDate') {
      if (!value) message = 'Start date is required';
    }
    if (name === 'emergencyName' || name === 'emergencyRelationship') {
      if (!value) message = 'Required';
    }
    if (name === 'emergencyPhone') {
      const phoneRegex = /^(09|\+639)\d{9}$/;
      const clean = value.replace(/[-\s]/g, '');
      if (!phoneRegex.test(clean)) message = 'Invalid Philippine phone format';
    }
    if (name === 'manualPassword' || name === 'manualPasswordConfirm') {
      const pw = name === 'manualPassword' ? value : formData.manualPassword;
      const confirm = name === 'manualPasswordConfirm' ? value : formData.manualPasswordConfirm;
      const strong = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-]{8,}$/;
      if (!strong.test(pw)) message = 'Min 8 chars, include letters and numbers';
      else if (confirm && pw !== confirm) message = 'Passwords do not match';
    }
    setErrors(prev => ({ ...prev, [name]: message }));
    return { isValid: message === '', message };
  };

  const validateAllFields = () => {
    const allFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender',
      'email', 'phone', 'address', 'city',
      'position', 'department', 'startDate',
      'emergencyName', 'emergencyRelationship', 'emergencyPhone',
      'manualPassword', 'manualPasswordConfirm'
    ];
    
    let valid = true;
    const errorMessages: string[] = [];
    
    for (const f of allFields) {
      const v = (formData as any)[f] as string;
      const result = validateField(f, v || '');
      if (!result.isValid) {
        valid = false;
        if (result.message) {
          errorMessages.push(`${f}: ${result.message}`);
        }
      }
    }
    
    // Only show alert if there are actual errors
    if (!valid && errorMessages.length > 0) {
      alert('Please fix the following errors:\n\n' + errorMessages.join('\n'));
    }
    
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }
    const password = formData.manualPassword;
    const fullName = `${formData.firstName} ${formData.lastName}`;
    const email = formData.email;

    try {
      await usersAPI.create({
        name: fullName,
        email: email,
        password: password,
        phone: formData.phone,
        employmentData: {
          position: formData.position,
          department: formData.department,
          startDate: formData.startDate,
          emergencyContact: {
            name: formData.emergencyName,
            relationship: formData.emergencyRelationship,
            phone: formData.emergencyPhone
          }
        },
        createdBy: 'Admin'
      });

      setCredentials({ email, password });
      setShowSuccess(true);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data
        ? (error.response.data as { error: string }).error
        : 'Failed to create agent account';
      alert(errorMessage);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Agent Account Created!</h2>
            <p className="text-gray-600">The new agent has been successfully registered.</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <p className="text-sm font-semibold text-gray-800 mb-3">Login Credentials:</p>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-mono font-semibold">{credentials.email}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Password:</span>
                <span className="font-mono font-semibold">{credentials.password}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-6 text-center">
            ⚠️ Please save these credentials and share them securely with the agent.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/agents')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              View Agents
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                setFormData({
                  firstName: '', lastName: '', middleName: '', dateOfBirth: '', gender: '',
                  email: '', phone: '', address: '', city: '',
                  position: '', department: '', startDate: '', employmentType: 'Full-time',
                  emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
                  generatePassword: false,
                  manualPassword: '',
                  manualPasswordConfirm: ''
                });
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-white hover:underline mb-4 flex items-center"
            >
              ← Back to Admin Portal
            </button>
            <h1 className="text-3xl font-bold text-white">HR Portal - Agent Registration</h1>
            <p className="text-blue-100 mt-2">Scroll to complete all sections below</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Section 1: Personal Information */}
            <div className="space-y-4 border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Section 1: Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.firstName && <div className="text-red-600 text-xs mt-1">{errors.firstName}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.lastName && <div className="text-red-600 text-xs mt-1">{errors.lastName}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Middle Name (Optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Birthdate *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.dateOfBirth && <div className="text-red-600 text-xs mt-1">{errors.dateOfBirth}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <div className="text-red-600 text-xs mt-1">{errors.gender}</div>}
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="space-y-4 border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Section 2: Contact Information</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="09123456789"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.phone && <div className="text-red-600 text-xs mt-1">{errors.phone}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street Address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.address && <div className="text-red-600 text-xs mt-1">{errors.address}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.city && <div className="text-red-600 text-xs mt-1">{errors.city}</div>}
              </div>
            </div>

            {/* Section 3: Employment Details */}
            <div className="space-y-4 border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Section 3: Employment Details</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Position *</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Position</option>
                  <option value="Real Estate Agent">Real Estate Agent</option>
                  <option value="Senior Real Estate Agent">Senior Real Estate Agent</option>
                  <option value="Property Consultant">Property Consultant</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Marketing Specialist">Marketing Specialist</option>
                </select>
                {errors.position && <div className="text-red-600 text-xs mt-1">{errors.position}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Property Management">Property Management</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Administration">Administration</option>
                </select>
                {errors.department && <div className="text-red-600 text-xs mt-1">{errors.department}</div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.startDate && <div className="text-red-600 text-xs mt-1">{errors.startDate}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Emergency Contact */}
            <div className="space-y-4 border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Section 4: Emergency Contact</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact Name *</label>
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.emergencyName && <div className="text-red-600 text-xs mt-1">{errors.emergencyName}</div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Relationship *</label>
                  <input
                    type="text"
                    name="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={handleInputChange}
                    placeholder="e.g., Spouse, Parent"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.emergencyRelationship && <div className="text-red-600 text-xs mt-1">{errors.emergencyRelationship}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Phone *</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="09123456789"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.emergencyPhone && <div className="text-red-600 text-xs mt-1">{errors.emergencyPhone}</div>}
                </div>
              </div>
            </div>

            {/* Section 5: Account Setup */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Section 5: Account Setup</h3>
              <div className="bg-gray-50 p-6 rounded-lg space-y-3 text-sm mb-4">
                <p><strong>Name:</strong> {formData.firstName} {formData.lastName || '...'}</p>
                <p><strong>Email:</strong> {formData.email || '...'}</p>
                <p><strong>Phone:</strong> {formData.phone || '...'}</p>
                <p><strong>Position:</strong> {formData.position || '...'}</p>
                <p><strong>Department:</strong> {formData.department || '...'}</p>
                <p><strong>Start Date:</strong> {formData.startDate || '...'}</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                <p className="text-sm font-semibold text-gray-700">Create Login Password</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="manualPassword"
                        value={formData.manualPassword}
                        onChange={handleInputChange}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.manualPassword && <div className="text-red-600 text-xs mt-1">{errors.manualPassword}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="manualPasswordConfirm"
                        value={formData.manualPasswordConfirm}
                        onChange={handleInputChange}
                        placeholder="Confirm Password"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.manualPasswordConfirm && <div className="text-red-600 text-xs mt-1">{errors.manualPasswordConfirm}</div>}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Min 8 characters, include letters and numbers</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
              >
                ✓ Create Agent Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPortal;
