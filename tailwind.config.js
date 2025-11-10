/**
 * Tailwind CSS configuration for production build.
 */
module.exports = {
  content: [
    './views/**/*.ejs',
    './public/assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        bjPrimary: '#0ea5e9',
        bjSecondary: '#f59e0b',
      },
    },
  },
  plugins: [],
};