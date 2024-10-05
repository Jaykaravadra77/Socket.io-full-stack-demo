import io from 'socket.io-client';
const SOCKET_URL = 'http://localhost:3000';

let socket: any;

export const initSocket = (token: string) => {
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    withCredentials: true
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const getSocket = () => socket;