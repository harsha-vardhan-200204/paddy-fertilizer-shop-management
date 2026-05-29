import app from "./server/app.js";

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`SRI ANJANEYA AGRO AGENCIES API running on port ${port}`);
});
