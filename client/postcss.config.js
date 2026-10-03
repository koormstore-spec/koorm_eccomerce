export default {
  plugins: {
    // Inline index.css's @imports first so Tailwind sees admin.css and
    // storefront.css (which use @layer) in the same file as @tailwind.
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
