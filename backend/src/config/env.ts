import dotenv from 'dotenv';
import path from 'path';

/**
 * Загружает переменные окружения из .env файлов
 * Порядок загрузки (последующие переписывают предыдущие):
 * 1. .env.{NODE_ENV}.local (например, .env.development.local)
 * 2. .env.{NODE_ENV} (например, .env.development)
 * 3. .env.local
 * 4. .env
 */
export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const rootDir = path.resolve(__dirname, '../..');

  // Список файлов для загрузки (в порядке приоритета, от меньшего к большему)
  const envFiles = [
    '.env',
    '.env.local',
    `.env.${nodeEnv}`,
    `.env.${nodeEnv}.local`,
  ];

  console.log(`📋 Loading environment variables for: ${nodeEnv}`);

  // Загружаем файлы в обратном порядке, чтобы более специфичные файлы имели приоритет
  envFiles.reverse().forEach((file) => {
    const filePath = path.join(rootDir, file);
    const result = dotenv.config({ path: filePath });
    
    if (!result.error) {
      console.log(`✅ Loaded: ${file}`);
    }
  });

  // Валидация обязательных переменных
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log(`✅ Environment loaded successfully`);
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   - PORT: ${process.env.PORT}`);
  console.log(`   - USE_MOCK: ${process.env.USE_MOCK}`);
}
