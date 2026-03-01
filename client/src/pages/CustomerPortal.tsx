import { useState, useEffect } from 'react';
import PropertyList from '../components/customer/PropertyList';
import PropertyDetailModal from '../components/customer/PropertyDetailModal';
import InquiryModal from '../components/customer/InquiryModal';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import type { Property } from '../types';
import { propertiesAPI } from '../services/api';

const CustomerPortal = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || property.type === filterType;
    // Only show available and reserved properties to customers
    // Hide sold, withdrawn, off-market, under-contract, and draft properties
    const isAvailableToView = ['available', 'reserved'].includes(property.status);
    return matchesSearch && matchesType && isAvailableToView;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Find Your Dream Property
          </h1>
          <p className="text-xl text-gray-600">
            Browse our collection of premium properties
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="House">House</option>
            <option value="Condominium">Condominium</option>
            <option value="Villa">Villa</option>
            <option value="Apartment">Apartment</option>
          </select>
        </div>

        <section id="how-to-inquire" className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">📋 How to Inquire About a Property</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="text-lg font-semibold mb-2">Browse Properties</h3>
                <p className="text-gray-600">Explore our available properties using search and filters</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📸</div>
                <h3 className="text-lg font-semibold mb-2">View Details</h3>
                <p className="text-gray-600">Click on any property to see full information and photos</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">✉️</div>
                <h3 className="text-lg font-semibold mb-2">Submit Inquiry</h3>
                <p className="text-gray-600">Click Inquire and fill out the contact form</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📞</div>
                <h3 className="text-lg font-semibold mb-2">Get Contacted</h3>
                <p className="text-gray-600">Our agents will contact you within 24 hours</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-700 text-lg">
                Need immediate assistance?
                <a href="tel:+6328123456789" className="text-blue-600 font-semibold ml-2">📞 Call (02) 8123-4567</a>
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <section id="properties">
            <PropertyList
              properties={filteredProperties}
              onViewDetails={(property) => setSelectedProperty(property)}
              onInquire={(property) => {
                setSelectedProperty(property);
                setShowInquiryModal(true);
              }}
            />
          </section>
        )}

        {selectedProperty && !showInquiryModal && (
          <PropertyDetailModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onInquire={() => setShowInquiryModal(true)}
          />
        )}

        {showInquiryModal && selectedProperty && (
          <InquiryModal
            property={selectedProperty}
            onClose={() => {
              setShowInquiryModal(false);
              setSelectedProperty(null);
            }}
          />
        )}
      
        <section id="services" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">🛠️ Our Services</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">🏡</div>
                <h3 className="text-lg font-semibold mb-2">Buying Assistance</h3>
                <p className="text-gray-600">End-to-end support from property selection to closing</p>
              </div>
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="text-lg font-semibold mb-2">Selling Support</h3>
                <p className="text-gray-600">Professional marketing to sell your property faster</p>
              </div>
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">💳</div>
                <h3 className="text-lg font-semibold mb-2">Mortgage Guidance</h3>
                <p className="text-gray-600">Financing options and bank liaison assistance</p>
              </div>
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">🔧</div>
                <h3 className="text-lg font-semibold mb-2">Property Management</h3>
                <p className="text-gray-600">Tenant screening and maintenance coordination</p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">💬 What Our Clients Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">A</div>
                  <div>
                    <div className="font-semibold">Ana Santos</div>
                    <div className="text-sm text-gray-500">Manila</div>
                  </div>
                </div>
                <p className="text-gray-700">“TES Property helped us find the perfect home. Smooth process and very professional service.”</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">M</div>
                  <div>
                    <div className="font-semibold">Mark Dela Cruz</div>
                    <div className="text-sm text-gray-500">Taguig</div>
                  </div>
                </div>
                <p className="text-gray-700">“Great guidance with financing options. We closed on our condo in record time.”</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">J</div>
                  <div>
                    <div className="font-semibold">Jessa Ramirez</div>
                    <div className="text-sm text-gray-500">Batangas</div>
                  </div>
                </div>
                <p className="text-gray-700">“Highly recommended! The viewing schedule and negotiations were handled perfectly.”</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">❓ Frequently Asked Questions</h2>
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">Do I need to create an account to inquire?</div>
                <div className="text-gray-700">No. The customer portal is public. You can submit an inquiry without logging in.</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">How long before an agent contacts me?</div>
                <div className="text-gray-700">Within 24 hours via your preferred contact methods (Email/Phone/SMS).</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">How do I schedule a property viewing?</div>
                <div className="text-gray-700">After submitting an inquiry, our agents will contact you via SMS, email, or phone to arrange a convenient viewing time.</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">Do you offer mortgage assistance?</div>
                <div className="text-gray-700">Yes. We provide guidance and help coordinate with banks.</div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">🏢 About TES Property</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Who We Are</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  TES Property has been serving the Philippine real estate market for over 15 years. We specialize in premium residential and commercial properties across Metro Manila and surrounding areas.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Our team of experienced agents is committed to helping you find your dream property with personalized service and expert guidance.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  To provide exceptional real estate services through innovation, integrity, and customer satisfaction.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">15+</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-gray-600">Properties Sold</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">1000+</div>
                    <div className="text-sm text-gray-600">Happy Clients</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">20+</div>
                    <div className="text-sm text-gray-600">Expert Agents</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      
        <section id="contact" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">📍 Contact Us</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📍</div>
                    <div>
                      <div className="font-semibold">Office Address</div>
                      <div className="text-gray-700">123 Ayala Avenue, Makati City, Metro Manila 1226</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📞</div>
                    <div>
                      <div className="font-semibold">Phone</div>
                      <a href="tel:+6328123456789" className="text-blue-600">(02) 8123-4567</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📱</div>
                    <div>
                      <div className="font-semibold">Mobile</div>
                      <a href="tel:+639171234567" className="text-blue-600">+63 917 123 4567</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">✉️</div>
                    <div>
                      <div className="font-semibold">Email</div>
                      <a href="mailto:info@tesproperty.com" className="text-blue-600">info@tesproperty.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">🕒</div>
                    <div>
                      <div className="font-semibold">Business Hours</div>
                      <div className="text-gray-700">Mon-Fri: 9:00 AM - 6:00 PM | Sat: 10:00 AM - 4:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">🗺️ Google Maps Embed Here</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      
        <footer className="bg-gray-800 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-lg font-bold mb-4">TES Property</h4>
                <p className="text-gray-400 text-sm">Your trusted partner in finding the perfect property.</p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#properties" className="text-gray-400 hover:text-white">Properties</a></li>
                  <li><a href="#about" className="text-gray-400 hover:text-white">About Us</a></li>
                  <li><a href="#contact" className="text-gray-400 hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                  <li><a href="/terms" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                  <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                  <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
              © 2026 TES Property System. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CustomerPortal;
