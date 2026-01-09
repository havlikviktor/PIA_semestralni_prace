export const getServerUrl = () => {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'localhost';
  const serverPort = process.env.BACKEND_PORT || '3000';
  return `http://${serverUrl}:${serverPort}`;
};
