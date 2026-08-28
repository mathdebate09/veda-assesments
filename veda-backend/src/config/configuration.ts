import { getAiConfig } from './ai.config';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: '7d',
  },
  azure: {
    documentIntelligence: {
      endpoint: process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT,
      key: process.env.AZURE_DOC_INTELLIGENCE_KEY,
    },
    storage: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      container: process.env.AZURE_STORAGE_CONTAINER || 'exam-files',
      accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    },
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  },
  ai: getAiConfig(),
});
