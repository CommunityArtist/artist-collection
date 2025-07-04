// Define any animation utility functions here
export const getFadeInAnimation = (delay: number = 0) => ({
  opacity: 0,
  y: 20,
  transition: {
    delay,
    duration: 0.5,
    ease: [0.645, 0.045, 0.355, 1.0]
  }
});

export const getStaggeredChildren = (
  staggerTime: number = 0.1,
  delayStart: number = 0
) => ({
  delay: delayStart,
  staggerChildren: staggerTime
});

// These functions would be more useful if we were using Framer Motion
// For now they're placeholders that could be integrated later