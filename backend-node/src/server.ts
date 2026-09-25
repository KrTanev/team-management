import { createApp } from "./app.js";
import { PORT } from "./config.js";

createApp().listen(PORT, () => {
  console.log(`Team Management API listening on http://localhost:${PORT}`);
});
