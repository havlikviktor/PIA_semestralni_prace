export const getServerIp = () => {
  const serverIp = process.env.NEXT_PUBLIC_SERVER_IP || 'localhost';
  const serverPort = process.env.BACKEND_PORT || '3000';
  return `http://${serverIp}:${serverPort}`;
};
