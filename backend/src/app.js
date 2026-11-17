import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: '100kb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ name: 'Saarthi API', tagline: 'One Portal. Every Scheme. Every Citizen.' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
