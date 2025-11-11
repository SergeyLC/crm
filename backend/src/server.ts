import { loadEnv } from './config/env';
import app from './app';
import prisma from "./prisma/client";

// Загрузка переменных окружения перед всем остальным
loadEnv();

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    
    // Проверка соединения с базой данных
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL via Prisma");
    
    console.log(`🚀 Starting server on port ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
    });

    // Обработка сигналов завершения
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      server.close(async () => {
        console.log('Server closed');
        await prisma.$disconnect();
        console.log('Database disconnected');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      server.close(async () => {
        console.log('Server closed');
        await prisma.$disconnect();
        console.log('Database disconnected');
        process.exit(0);
      });
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();