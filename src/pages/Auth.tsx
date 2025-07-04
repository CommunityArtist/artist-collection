import React, { useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/account');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-card-bg p-8 rounded-lg border border-border-color">
          <h1 className="text-2xl font-bold text-soft-lavender mb-6 text-center">Sign In</h1>
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7B3FEE',
                    brandAccent: '#00E5FF',
                    brandButtonText: '#E2D7F4',
                    defaultButtonBackground: '#1A1F35',
                    defaultButtonBackgroundHover: '#2A2F45',
                    defaultButtonBorder: 'rgba(123, 63, 238, 0.2)',
                    defaultButtonText: '#E2D7F4',
                    dividerBackground: 'rgba(123, 63, 238, 0.2)',
                    inputBackground: '#111327',
                    inputBorder: 'rgba(123, 63, 238, 0.2)',
                    inputBorderHover: '#7B3FEE',
                    inputBorderFocus: '#00E5FF',
                    inputText: '#E2D7F4',
                    inputLabelText: '#E2D7F4',
                    inputPlaceholder: 'rgba(226, 215, 244, 0.5)',
                    messageText: '#E2D7F4',
                    messageTextDanger: '#F9345E',
                    anchorTextColor: '#00E5FF',
                    anchorTextHoverColor: '#7B3FEE',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  fonts: {
                    bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '6px',
                    buttonBorderRadius: '6px',
                    inputBorderRadius: '6px',
                  },
                },
              },
              className: {
                anchor: 'text-electric-cyan hover:text-cosmic-purple transition-colors duration-200',
                button: 'bg-gradient-to-r from-cosmic-purple to-neon-pink text-soft-lavender hover:opacity-90 transition-all duration-300 font-medium',
                container: 'space-y-4',
                divider: 'border-border-color',
                input: 'bg-deep-bg border-border-color text-soft-lavender placeholder-soft-lavender/50 focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-colors duration-200',
                label: 'text-soft-lavender font-medium',
                loader: 'border-electric-cyan',
                message: 'text-soft-lavender',
              },
            }}
            providers={[]}
            redirectTo={window.location.origin + '/account'}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;