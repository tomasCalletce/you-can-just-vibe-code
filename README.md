# Three.js + Socket.IO Demo

A real-time 3D application using Vite, Three.js, Express, and Socket.IO.

## Features

- Real-time 3D rendering with Three.js
- WebSocket communication with Socket.IO
- Express server for serving the application
- TypeScript support

## Getting Started

### Development

To start the development server:

```bash
npm run dev
```

This will start the Vite development server with hot module reloading.

### Production

To build and start the production server:

```bash
npm run prod
```

This will:

1. Build the TypeScript files
2. Build the Vite application
3. Start the Express server that serves the built application and handles Socket.IO connections

You can also run these steps separately:

```bash
# Build the application
npm run build

# Start the server
npm run start
```

## Project Structure

- `src/` - Client-side code
  - `main.ts` - Entry point for the Three.js application and Socket.IO client
  - `style.css` - Application styles
- `server.js` - Express server with Socket.IO
- `dist/` - Build output (created when you run `npm run build`)

## Socket.IO Communication

The application sets up a basic Socket.IO connection for real-time communication:

- Client connects to the server
- Messages can be sent using `socket.emit('message', data)`
- Messages are broadcasted to all connected clients

## License

MIT
