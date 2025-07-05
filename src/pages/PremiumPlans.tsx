import React, { useState } from 'react';
import { Check, Star, Zap, Crown, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
}

const PremiumPlans: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: Plan[] = [
    {
      name: 'Free',
      price: billingCycle === 'monthly' ? '$0' : '$0',
      period: 'forever',
      description: 'Perfect for getting started with AI art creation',
      icon: <Sparkles className="w-6 h-6" />,
      features: [
        { text: 'Access to community library', included: true },
        { text: 'Create up to 10 prompts', included: true },
        { text: 'Basic prompt builder', included: true },
        { text: 'Standard image generation', included: true },
        { text: 'Community support', included: true },
        { text: 'Advanced prompt templates', included: false },
        { text: 'Priority generation queue', included: false },
        { text: 'HD image downloads', included: false },
        { text: 'Private collections', included: false },
        { text: 'API access', included: false },
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline'
    },
    {
      name: 'Pro',
      price: billingCycle === 'monthly' ? '$19' : '$190',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For serious creators and professionals',
      icon: <Zap className="w-6 h-6" />,
      popular: true,
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Unlimited prompts', included: true },
        { text: 'Advanced prompt templates', included: true },
        { text: 'Priority generation queue', included: true },
        { text: 'HD image downloads', included: true },
        { text: 'Private collections', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Email support', included: true },
        { text: 'API access', included: false },
        { text: 'White-label solutions', included: false },
      ],
      buttonText: 'Start Pro Trial',
      buttonVariant: 'primary'
    },
    {
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? '$99' : '$990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For teams and organizations at scale',
      icon: <Crown className="w-6 h-6" />,
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited team members', included: true },
        { text: 'API access', included: true },
        { text: 'White-label solutions', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'Advanced security', included: true },
        { text: 'Custom training', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'On-premise deployment', included: true },
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary'
    }
  ];

  const handlePlanSelect = (planName: string) => {
    if (planName === 'Free') {
      navigate('/auth');
    } else if (planName === 'Enterprise') {
      // In a real app, this would open a contact form or redirect to sales
      alert('Contact our sales team at sales@communityartists.com');
    } else {
      // In a real app, this would integrate with Stripe or another payment processor
      alert('Payment integration would be implemented here');
    }
  };

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-soft-lavender mb-6">
            Choose Your <span className="text-gradient-cyan">Creative Journey</span>
          </h1>
          <p className="text-soft-lavender/70 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Unlock the full potential of AI art creation with our flexible plans designed for creators at every level
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-soft-lavender' : 'text-soft-lavender/50'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                billingCycle === 'yearly' ? 'bg-cosmic-purple' : 'bg-border-color'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                  billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-soft-lavender' : 'text-soft-lavender/50'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="text-xs bg-success-green/20 text-success-green px-2 py-1 rounded-full">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-card-bg rounded-2xl p-8 border transition-all duration-300 hover:transform hover:-translate-y-2 ${
                plan.popular
                  ? 'border-cosmic-purple shadow-glow scale-105'
                  : 'border-border-color hover:border-cosmic-purple/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-cosmic-purple to-neon-pink text-soft-lavender px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  plan.popular ? 'bg-cosmic-purple/20 text-cosmic-purple' : 'bg-electric-cyan/20 text-electric-cyan'
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-soft-lavender mb-2">{plan.name}</h3>
                <p className="text-soft-lavender/70 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-soft-lavender">{plan.price}</span>
                  <span className="text-soft-lavender/70">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                      feature.included 
                        ? 'bg-success-green/20 text-success-green' 
                        : 'bg-soft-lavender/10 text-soft-lavender/30'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={`text-sm ${
                      feature.included ? 'text-soft-lavender' : 'text-soft-lavender/50'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan.buttonVariant}
                size="lg"
                className="w-full"
                onClick={() => handlePlanSelect(plan.name)}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-soft-lavender text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h3 className="text-lg font-semibold text-soft-lavender mb-3">
                Can I change plans anytime?
              </h3>
              <p className="text-soft-lavender/70">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
              </p>
            </div>
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h3 className="text-lg font-semibold text-soft-lavender mb-3">
                Is there a free trial?
              </h3>
              <p className="text-soft-lavender/70">
                Yes! Pro plans come with a 14-day free trial. No credit card required to start your trial.
              </p>
            </div>
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h3 className="text-lg font-semibold text-soft-lavender mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-soft-lavender/70">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h3 className="text-lg font-semibold text-soft-lavender mb-3">
                Can I cancel anytime?
              </h3>
              <p className="text-soft-lavender/70">
                Absolutely. You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-cosmic-purple/10 to-electric-cyan/10 rounded-2xl p-12 border border-cosmic-purple/20">
            <h2 className="text-3xl font-bold text-soft-lavender mb-4">
              Ready to Transform Your Creative Process?
            </h2>
            <p className="text-soft-lavender/70 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already using Community Artists to bring their visions to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/auth')}>
                Start Free Today
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/library')}>
                Explore Library
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPlans;