import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import CommunityLibrary from './pages/CommunityLibrary';
import UserLibrary from './pages/UserLibrary';
import PromptBuilder from './pages/PromptBuilder';
import CreatePrompt from './pages/CreatePrompt';
import Auth from './pages/Auth';
import Account from './pages/Account';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Documentation from './pages/Documentation';
import PromptStructure from './pages/PromptStructure';
import BestPractices from './pages/BestPractices';
import LibraryManagement from './pages/LibraryManagement';
import CookiePolicy from './pages/CookiePolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import PromptEngineeringGuide from './pages/PromptEngineeringGuide';
import PremiumPlans from './pages/PremiumPlans';
import PromptExtractor from './pages/PromptExtractor';
import ApiConfig from './pages/ApiConfig';

function App() {
  React.useEffect(() => {
    document.title = "Community Artist - AI Art Generation";
    
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute('href', 'https://images.pexels.com/photos/5011647/pexels-photo-5011647.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&dpr=2');
    }
  }, []);

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<CommunityLibrary />} />
          <Route path="/library/:username" element={<UserLibrary />} />
          <Route path="/prompt-builder" element={<PromptBuilder />} />
          <Route path="/create-prompt" element={<CreatePrompt />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/account" element={<Account />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/documentation/prompt-structure" element={<PromptStructure />} />
          <Route path="/documentation/best-practices" element={<BestPractices />} />
          <Route path="/documentation/library-management" element={<LibraryManagement />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/prompt-engineering-guide" element={<PromptEngineeringGuide />} />
          <Route path="/premium-plans" element={<PremiumPlans />} />
          <Route path="/prompt-extractor" element={<PromptExtractor />} />
          <Route path="/api-config" element={<ApiConfig />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;