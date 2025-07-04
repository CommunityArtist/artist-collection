import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
  category: string;
}

const blogPosts: Record<string, BlogPost> = {
  '1': {
    id: '1',
    title: 'The Evolution of AI Art Generation',
    content: `
      Artificial intelligence has revolutionized the way we create and think about digital art. From simple style transfers to complex generative models, the evolution of AI art tools has opened up new possibilities for artists and creators worldwide.

      The journey began with basic algorithmic art in the 1960s, but today's AI models can generate stunning, original artwork from text descriptions alone. This transformation has democratized art creation, allowing anyone with an idea to bring their vision to life.

      Key Developments in AI Art:

      1. Neural Style Transfer
      The ability to apply the style of one image to another marked an early breakthrough in AI art. Artists could now blend different artistic styles with their own work, creating unique hybrid pieces.

      2. Generative Adversarial Networks (GANs)
      GANs introduced a new level of sophistication, enabling the creation of entirely new images that look remarkably realistic. This technology powers many of today's popular AI art tools.

      3. Text-to-Image Models
      The latest advancement in AI art is the ability to generate images directly from text descriptions. This has made art creation more intuitive and accessible than ever before.

      Impact on the Creative Community:

      - Democratization of Art Creation
      AI tools have lowered the technical barriers to creating digital art, allowing more people to express their creativity.

      - New Artistic Possibilities
      Artists can now explore concepts and styles that would be difficult or impossible to achieve through traditional means.

      - Collaborative Potential
      AI can serve as a creative partner, suggesting variations and alternatives that artists might not have considered.

      The Future of AI Art:

      As technology continues to advance, we can expect even more sophisticated AI art tools. The focus is shifting towards greater control and customization, allowing artists to fine-tune the AI's output to match their vision perfectly.

      The role of human creativity remains central - AI is a powerful tool, but it's the artist's vision and direction that brings meaning and purpose to the work. The future of digital art lies in this synergy between human creativity and artificial intelligence.
    `,
    author: 'Sarah Chen',
    date: 'March 15, 2025',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Technology'
  },
  '2': {
    id: '2',
    title: 'Mastering Prompt Engineering',
    content: `
      Prompt engineering is both an art and a science. It's the key to getting the best results from AI image generation models. In this comprehensive guide, we'll explore the principles and techniques that will help you craft more effective prompts.

      Understanding Prompt Structure:

      1. Basic Components
      - Subject: The main focus of your image
      - Style: The artistic direction
      - Composition: How elements are arranged
      - Lighting: The mood and atmosphere
      - Technical Details: Camera settings, medium, etc.

      2. Advanced Techniques
      - Using weighted terms
      - Combining multiple styles
      - Negative prompting
      - Sequential instructions

      Best Practices:

      1. Be Specific
      Instead of "a beautiful landscape", try "a misty mountain valley at sunrise, with golden light filtering through pine trees, captured with a wide-angle lens"

      2. Use Strong Descriptors
      Incorporate vivid adjectives and specific technical terms to guide the AI more precisely

      3. Consider Context
      Think about the overall scene and how different elements interact with each other

      4. Iterate and Refine
      Don't be afraid to experiment and adjust your prompts based on the results

      Common Pitfalls to Avoid:

      - Overcomplicating prompts
      - Using vague or contradictory terms
      - Ignoring composition and lighting
      - Forgetting about technical aspects

      The Impact of Good Prompt Engineering:

      - More consistent results
      - Better artistic control
      - Improved efficiency
      - Enhanced creative possibilities

      Remember, prompt engineering is an iterative process. Keep experimenting and refining your approach to develop your own style and achieve the results you envision.
    `,
    author: 'Michael Rodriguez',
    date: 'March 12, 2025',
    imageUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Tutorials'
  },
  '3': {
    id: '3',
    title: 'Community Spotlight: Featured Artists',
    content: `
      Our community is filled with talented artists pushing the boundaries of AI-generated art. In this spotlight, we showcase some of the most innovative creators and their unique approaches to working with AI tools.

      Featured Artists:

      1. Maya Patel
      Maya combines traditional photography with AI-generated elements to create surreal landscapes that challenge our perception of reality. Her work often explores themes of nature and technology coexisting in harmony.

      Notable Works:
      - "Digital Dreams" series
      - "Nature's Code" collection
      - "Hybrid Horizons" exhibition

      2. James Wilson
      James specializes in character design, using AI to generate base concepts that he then refines through traditional digital painting techniques. His workflow demonstrates how AI can enhance rather than replace traditional artistic skills.

      Signature Style:
      - Cyberpunk aesthetics
      - Emotional portraiture
      - Innovative character designs

      3. Elena Kowalski
      Elena's architectural visualizations blend AI-generated structures with real-world references, creating impossible yet believable spaces that push the boundaries of architectural design.

      Recent Projects:
      - "Vertical Cities" series
      - "Floating Foundations" collection
      - "Neo-Gothic Revival" study

      Community Impact:

      These artists have not only created stunning work but also contributed to the community through:
      - Tutorial creation
      - Mentorship programs
      - Workshop facilitation
      - Resource sharing

      Learning from the Community:

      1. Experimentation is Key
      Don't be afraid to try new approaches and combinations of tools

      2. Iteration Matters
      Great results often come from refining and building upon initial ideas

      3. Share Knowledge
      Contributing to the community helps everyone grow and improve

      The featured artists demonstrate that AI is not just a tool but a collaborative partner in the creative process. Their work inspires us to think differently about how we can use AI in our own artistic journey.
    `,
    author: 'Emma Thompson',
    date: 'March 10, 2025',
    imageUrl: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Community'
  }
};

const BlogPost: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = id ? blogPosts[id] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-deep-bg pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-soft-lavender mb-4">
              Blog post not found
            </h1>
            <Button
              variant="primary"
              onClick={() => navigate('/blog')}
            >
              Return to Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </button>

          <article className="bg-card-bg rounded-lg overflow-hidden border border-border-color">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-64 object-cover"
            />
            
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm px-3 py-1 bg-cosmic-purple/10 text-cosmic-purple rounded-full">
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

              <h1 className="text-3xl font-bold text-soft-lavender mb-6">
                {post.title}
              </h1>

              <div className="prose prose-invert max-w-none">
                {post.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-soft-lavender/70 mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;