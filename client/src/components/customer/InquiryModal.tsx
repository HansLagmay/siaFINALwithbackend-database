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
    contactMethods: { email: true, phone: false, sms: false }
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  const validateInquiry = (data: typeof formData) => {
    const errors: string[] = [];
    const phoneRegex = /^(09|\+639)\d{9}$/;
    const cleanPhone = data.phone.replace(/[-\s]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Invalid Philippine phone number format (e.g., 0917-123-4567 or +639171234567)');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email address');
    }
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
        inq.status !== 'deal-cancelled' &&
        inq.status !== 'no-response'
      );
      if (existingInquiry) {
        return {
          isDuplicate: true,
          message: `You already have an active inquiry for this property (Ticket #${existingInquiry.ticketNumber}).`
        };
      }
      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validationErrors = validateInquiry(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        setLoading(false);
        return;
      }

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

      if (response.data && response.data.ticketNumber) {
        setTicketNumber(response.data.ticketNumber);
      }

      setSuccess(true);
      setTimeout(() => { onClose(); }, 2000);
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
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Inquiry Sent!</h2>
          {ticketNumber && (
            <p className="text-gray-600 mb-2">Your ticket number: <strong className="text-blue-600">{ticketNumber}</strong></p>
          )}
          <p className="text-gray-600">Our agents will contact you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📧 Send Inquiry</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="font-semibold text-blue-900">{property.title}</p>
            <p className="text-blue-700 text-sm">₱{property.price.toLocaleString()} · {property.location}</p>
            <p className="text-sm text-blue-800 mt-2">
              📝 Please fill out this form to inquire about this property. Our agents will contact you within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+63 912 345 6789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Methods *</label>
              <div className="flex gap-6">
                {(['email', 'phone', 'sms'] as const).map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.contactMethods[method]}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactMethods: { ...formData.contactMethods, [method]: e.target.checked }
                      })}
                    />
                    <span>{method === 'email' ? '📧 Email' : method === 'phone' ? '📞 Phone' : '📱 SMS'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message (minimum 20 characters) *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                minLength={20}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="I'm interested in this property... (Please provide at least 20 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.message.length}/5000 characters (minimum 20)</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-blue-300">
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
