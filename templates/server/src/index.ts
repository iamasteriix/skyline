// required to start tracing server before we load any modules
import { startTracing } from './telemetry/index.js';
const telemetry = await startTracing();


// —— load application ——————————————————————————————————————————————————————————————————
// we use dynamic imports at the entry point so tracing can monkey-patch the app's lifecycle
// before the module graph resolves and the program starts
const { logger } = await import('./config/index.js');
const { createApp } = await import('./app/index.js');

let onShutdown: () => Promise<void>;


const handleShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down application.`);
  await onShutdown?.();
  process.exit(0);
};


const handleUnhandledRejection = async (reason: unknown) => {
  // `pino` has special handling for the `err` keyword
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  await onShutdown?.();
  process.exit(1);
}


const handleUncaughtException = async (error: unknown) => {
  logger.fatal({ err: error, }, 'Uncaught exception');
  await onShutdown?.();
  process.exit(1);  // [You must exit after an uncaught exception](https://node.readthedocs.io/en/latest/api/process/#event-uncaughtexception)
}


const main = async () => {
  const app = await createApp();

  onShutdown = async () => {
    try {
      await telemetry.shutdown();
      await app.shutdown();
    } catch (error) {
      logger.fatal({ err: error }, 'Error shutting down.');
    } finally {
      process.exit(0);
    }
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUncaughtException);

  logger.info(`Server ready at port ${app.port}.`);
}


main(); // start program
