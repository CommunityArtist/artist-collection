import React, { useState } from 'react';
import { Send, Mail, MessageSquare, User, ChevronDown } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    reason: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSubmitSuccess(false);
    setError(null);
    
    try {
      // Get the user's session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('You must be logged in to send a message. Please sign in first.');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message.');
      }

      setSubmitSuccess(true);
      // Reset form after successful submission
      setFormData({
        fullName: '',
        reason: '',
        email: '',
        message: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);

    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sample AI artwork images for the left side collage
  const artworkImages = [
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/92383e96-bca8-4763-a97c-edf5967a2a46/0.7993861365321893.png',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/92383e96-bca8-4763-a97c-edf5967a2a46/0.664050780601223.png',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/92383e96-bca8-4763-a97c-edf5967a2a46/0.3931688149060354.png',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/bd559d06-8286-4e2d-bbcb-b545b6e32ea4/0.6796877870629032.PNG',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/92383e96-bca8-4763-a97c-edf5967a2a46/0.5516472420208619.jpg',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/bd559d06-8286-4e2d-bbcb-b545b6e32ea4/0.18572384615167004.jpg',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/92383e96-bca8-4763-a97c-edf5967a2a46/0.4063322316763298.jpg',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/92383e96-bca8-4763-a97c-edf5967a2a46/0.6962766707187353.jpg',
    'https://trpznltoengquizgfelv.supabase.co/storage/v1/object/public/prompt-media/92383e96-bca8-4763-a97c-edf5967a2a46/0.4881718466348771.jpg'
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
          ) : error ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-error-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-error-red" />
              </div>
              <h2 className="text-2xl font-bold text-error-red mb-2">Submission Failed!</h2>
              <p className="text-soft-lavender/70 mb-4">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={() => setError(null)}
              >
                Try Again
              </Button>
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