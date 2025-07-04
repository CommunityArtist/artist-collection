import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  imageUrl: string;
  category: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Evolution of AI Art Generation',
    excerpt: 'Exploring how artificial intelligence is revolutionizing digital art creation and empowering artists worldwide.',
    author: 'Sarah Chen',
    date: 'March 15, 2025',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Technology'
  },
  {
    id: '2',
    title: 'Mastering Prompt Engineering',
    excerpt: 'Learn the art of crafting perfect prompts for AI image generation with our comprehensive guide.',
    author: 'Michael Rodriguez',
    date: 'March 12, 2025',
    imageUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Tutorials'
  },
  {
    id: '3',
    title: 'Community Spotlight: Featured Artists',
    excerpt: 'Discover the amazing work of our community members and get inspired by their creative process.',
    author: 'Emma Thompson',
    date: 'March 10, 2025',
    imageUrl: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Community'
  }
];

const Blog: React.FC = () => {
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-soft-lavender mb-4">Blog</h1>
            <p className="text-soft-lavender/70 text-lg">
              Insights, tutorials, and community stories about AI art generation
            </p>
          </div>

          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article 
                key={post.id}
                className="bg-card-bg rounded-lg overflow-hidden border border-border-color hover:border-cosmic-purple/40 transition-all duration-300"
              >
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:w-2/3">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs px-3 py-1 bg-cosmic-purple/10 text-cosmic-purple rounded-full">
                        {post.category}
                      </span>
                      <div className="flex items-center text-soft-lavender/50 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {post.date}
                      </div>
                      <div className="flex items-center text-soft-lavender/50 text-sm">
                        <User className="w-4 h-4 mr-1" />
                        {post.author}
                      </div>
                    </div>
                    <h2 className="text-xl font-semibold text-soft-lavender mb-3">
                      {post.title}
                    </h2>
                    <p className="text-soft-lavender/70 mb-4">
                      {post.excerpt}
                    </p>
                    <Link 
                      to={`/blog/${post.id}`}
                      className="inline-flex items-center text-electric-cyan hover:text-cosmic-purple transition-colors duration-200"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;