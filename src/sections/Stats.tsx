import React from 'react';
import StatCounter from '../components/StatCounter';

const Stats: React.FC = () => {
  const stats = [
    { value: '10,000+', label: 'Prompts' },
    { value: '5,000+', label: 'Users' },
    { value: '1,200+', label: 'Collections' },
    { value: '98%', label: 'Satisfaction' }
  ];
  
  return (
    <section className="py-16 border-y border-border-color">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCounter 
              key={index} 
              value={stat.value} 
              label={stat.label} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;