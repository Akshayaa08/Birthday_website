import path from 'path';
import { fileURLToPath } from 'url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: path.join(projectDirectory, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
