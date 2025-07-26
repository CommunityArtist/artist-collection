import React, { useState } from 'react';
import { Send, Mail, MessageSquare, User, ChevronDown } from 'lucide-react';
import Button from '../components/Button';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    reason: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const contactReasons = [
    'General Inquiry',
    'Technical Support',
    'Feature Request',
    'Partnership Opportunity',
    'Media Inquiry',
    'Account Issues',
    'Billing Question',
    'Report a Bug',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitSuccess(true);
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitSuccess(false);
      setFormData({
        fullName: '',
        reason: '',
        email: '',
        message: ''
      });
    }, 3000);
  };

  // Sample AI artwork images for the left side collage
  const artworkImages = [
    'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/5011647/pexels-photo-5011647.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/8439093/pexels-photo-8439093.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/7130560/pexels-photo-7130560.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/7130465/pexels-photo-7130465.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
    'https://images.pexels.com/photos/5704849/pexels-photo-5704849.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2'
  ];

  return (
    <div className="min-h-screen bg-deep-bg flex">
      {/* Left Side - Artwork Collage */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1 p-4">
          {artworkImages.map((image, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg group cursor-pointer"
              style={{
                aspectRatio: index % 3 === 1 ? '1/1.2' : '1/1'
              }}
            >
              <img
                src={image}
                alt={`AI Artwork ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-deep-bg/20"></div>
      </div>

      {/* Right Side - Contact Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-soft-lavender mb-4">
              Need to contact us?
            </h1>
          </div>

          {submitSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-success-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-success-green" />
              </div>
              <h2 className="text-2xl font-bold text-success-green mb-2">Message Sent!</h2>
              <p className="text-soft-lavender/70">
                Thank you for contacting us. We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-soft-lavender font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-soft-lavender/50" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Leonardo"
                    required
                    className="w-full bg-card-bg border border-border-color rounded-lg pl-12 pr-4 py-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple focus:ring-1 focus:ring-cosmic-purple transition-all duration-200"
                  />
                </div>
              </div>

              {/* Reason For Contact */}
              <div>
                <label className="block text-soft-lavender font-medium mb-2">
                  Reason For Contact
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-soft-lavender/50" />
                  <select
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    required
                    className="w-full bg-card-bg border border-border-color rounded-lg pl-12 pr-10 py-3 text-soft-lavender focus:outline-none focus:border-cosmic-purple focus:ring-1 focus:ring-cosmic-purple transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a choice</option>
                    {contactReasons.map((reason) => (
                      <option key={reason} value={reason} className="bg-card-bg">
                        {reason}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-soft-lavender/50 pointer-events-none" />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-soft-lavender font-medium mb-2">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-soft-lavender/50" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-card-bg border border-border-color rounded-lg pl-12 pr-4 py-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple focus:ring-1 focus:ring-cosmic-purple transition-all duration-200"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-soft-lavender font-medium mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Your Message"
                  required
                  rows={5}
                  className="w-full bg-card-bg border border-border-color rounded-lg px-4 py-3 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple focus:ring-1 focus:ring-cosmic-purple transition-all duration-200 resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-soft-lavender border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;