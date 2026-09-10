import { Router } from 'express';
import { diagnosticsRouter } from './diagnostics/index.js';
import { exampleRouter } from './example/index.js';


export const createRouter = (): Router => {
  const router = Router();

  router.use('/', exampleRouter());
  router.use('/diagnostics', diagnosticsRouter());

  return router;
}
