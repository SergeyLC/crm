import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { addMockHeader } from "./middlewares/mockHeader";

const isMockEnabled = process.env.USE_MOCK === 'true';
console.log(`✅ Mock mode is ${isMockEnabled ? "ENABLED" : "DISABLED"}`);

const app = express();

// Honor X-Forwarded-Proto from nginx so Secure cookies track real HTTPS
app.set("trust proxy", 1);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(addMockHeader);

// Routes
app.use('/api', routes);

app.use(errorHandler);

export default app;