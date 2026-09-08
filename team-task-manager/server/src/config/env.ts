import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || '',
  dbName: process.env.MONGO_DB_NAME || 'team_task_manager',
  jwtSecret: process.env.JWT_SECRET || 'ttm_dev_secret_change_me_in_production_9f2b7c',
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
