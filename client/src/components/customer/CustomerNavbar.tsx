const CustomerNavbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">TES Property</h1>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-to-inquire" className="text-gray-700 hover:text-blue-600 transition">
              How to Inquire
            </a>
            <a href="#properties" className="text-gray-700 hover:text-blue-600 transition">
              Properties
            </a>
            <a href="#services" className="text-gray-700 hover:text-blue-600 transition">
              Services
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition">
              Testimonials
            </a>
            <a href="#faq" className="text-gray-700 hover:text-blue-600 transition">
              FAQ
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition">
              About
            </a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CustomerNavbar;
