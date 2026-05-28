export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paddy: {
          50: "#f2f8ed",
          100: "#e0efd5",
          500: "#4f8f28",
          600: "#3f741f",
          700: "#335c1d",
          900: "#203b16"
        },
        soil: "#7b5d3b"
      },
      boxShadow: {
        soft: "0 10px 28px rgba(32, 59, 22, 0.08)"
      }
    }
  },
  plugins: []
};
