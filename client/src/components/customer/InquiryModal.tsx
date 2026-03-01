import { useState } from 'react';
import type { Property } from '../../types';
import { inquiriesAPI } from '../../services/api';

interface InquiryModalProps {
  property: Property;
  onClose: () => void;
}

const InquiryModal = ({ property, onClose }: InquiryModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    contactMethods: {
      email: true,
      phone: false,
      sms: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  const validateInquiry = (data: typeof formData) => {
    const errors: string[] = [];
    
    // Phone format validation: 0917-XXX-XXXX or 09171234567 or +639171234567
    const phoneRegex = /^(09|\+639)\d{9}$/;
    const cleanPhone = data.phone.replace(/[-\s]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Invalid Philippine phone number format (e.g., 0917-123-4567 or +639171234567)');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email address');
    }
    
    // Message minimum length
    if (!data.message || data.message.trim().length < 20) {
      errors.push('Message must be at least 20 characters');
    }
    
    return errors;
  };

  const checkDuplicateInquiry = async (email: string, propertyId: string) => {
    try {
      const response = await inquiriesAPI.getAll();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const existingInquiry = response.data.find((inq: any) => 
        inq.email.toLowerCase() === email.toLowerCase() && 
        inq.propertyId === propertyId &&
        new Date(inq.createdAt).getTime() > sevenDaysAgo &&
        inq.status !== 'closed' && 
        inq.status !== 'cancelled'
      );
      
      if (existingInquiry) {
        return {
          isDuplicate: true,
          message: `You already have an active inquiry for this property (Ticket #${existingInquiry.ticketNumber}).`,
          existingTicket: existingInquiry
        };
      }
      
      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false }; // Allow submission if check fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      const validationErrors = validateInquiry(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        setLoading(false);
        return;
      }

      // Check for duplicate inquiry
      const duplicateCheck = await checkDuplicateInquiry(formData.email, property.id);
      if (duplicateCheck.isDuplicate && duplicateCheck.message) {
        setError(duplicateCheck.message);
        setLoading(false);
        return;
      }

      const preferred = [
        formData.contactMethods.email ? 'Email' : null,
        formData.contactMethods.phone ? 'Phone' : null,
        formData.contactMethods.sms ? 'SMS' : null,
      ].filter(Boolean).join(', ');
      const messageWithPreferences = preferred
        ? `${formData.message}\n\nPreferred contact methods: ${preferred}`
        : formData.message;

      // Submit inquiry with complete data structure
      const response = await inquiriesAPI.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: messageWithPreferences,
        propertyId: property.id,
        propertyTitle: property.title,
        propertyPrice: property.price,
        propertyLocation: property.location
      });
      
      // Extract ticket number from response
      if (response.data && response.data.ticketNumber) {
        setTicketNumber(response.data.ticketNumber);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Inquiry Sent!</h3>
          {ticketNumber && (
            <p className="text-lg font-semibold text-blue-600 mb-2">
              Ticket #{ticketNumber}
            </p>
          )}
          <p className="text-gray-600">We'll get back to you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Send Inquiry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Property:</p>
            <p className="font-semibold text-gray-800">{property.title}</p>
            <p className="text-sm text-gray-600">{property.location}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📝 Please fill out this form to inquire about this property. Our agents will contact you within 24 hours via your preferred method.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+63 912 345 6789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Methods *
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.contactMethods.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactMethods: { ...formData.contactMethods, email: e.target.checked }
                    })}
                  />
                  <span>📧 Email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.contactMethods.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactMethods: { ...formData.contactMethods, phone: e.target.checked }
                    })}
                  />
                  <span>📞 Phone</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.contactMethods.sms}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactMethods: { ...formData.contactMethods, sms: e.target.checked }
                    })}
                  />
                  <span>📱 SMS</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (minimum 20 characters) *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                minLength={20}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="I'm interested in this property... (Please provide at least 20 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length}/5000 characters (minimum 20)
              </p>
            </div>

            <div className="bg-gray-50 border p-3 text-xs text-gray-600">
              🔒 Your information is secure and will not be shared with third parties.
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-blue-300"
              >
                {loading ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;
