import "dotenv/config";
import app from "./app";
import { startPriceRefreshJob } from "./jobs/refreshPrices";

const PORT = process.env["PORT"] || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startPriceRefreshJob();
});
