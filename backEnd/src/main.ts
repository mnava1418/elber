import env from './config/env.js';
import createApp from './app.js';
import http from 'http';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const startServer = () => {
  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.info('Elber listening on port: ', env.PORT);
  });

  // Stop accepting new connections and let in-flight requests finish
  // before exiting (e.g. when a container is stopped or redeployed).
  const shutdown = (signal: NodeJS.Signals) => {
    console.info(`${signal} received, shutting down...`);

    server.close((error) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      process.exit(0);
    });
    server.closeIdleConnections();

    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer();
