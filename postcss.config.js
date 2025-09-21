// postcss.config.js
import tailwindcss from "tailwindcss";
import tailwindcssNesting from "tailwindcss/nesting/index.js";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwindcssNesting, tailwindcss, autoprefixer],
};
