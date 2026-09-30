import "dotenv/config";
import app from "./app.js";
import connectDatabase from "./configs/database.js";

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();
  app.listen(port, () => console.log(`BoiBari API listening on port ${port}`));
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
}
