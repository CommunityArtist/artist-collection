import React from 'react';
import Hero from '../sections/Hero';
import Stats from '../sections/Stats';
import Features from '../sections/Features';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
    </>
  );
};

export default Home;