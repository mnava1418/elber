import app from './shared/server/app.js';
import http from 'http';

const PORT = 3000;

const startServer = () => {
  app.set('port', PORT);
  const server = http.createServer(app);

  server.listen(PORT);
  server.on('listening', onListening);
}

const onListening = () => {
  console.info('Elber listening on port: ', PORT);
}

startServer();