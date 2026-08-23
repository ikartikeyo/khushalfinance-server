import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';

const app = createApp();

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Khushal Finance Backend API is LIVE`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🌿 Database: MongoDB`);
      console.log(`🛡️ CORS Origin: ${config.corsOrigin}`);
      console.log(`📖 API Health: http://localhost:${config.port}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server due to database connection error.');
    console.error('👉 Make sure MongoDB is running and MONGODB_URI in .env is correct.');
    console.error(error.message);
  }
}

startServer();
