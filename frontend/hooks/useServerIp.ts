export const useServerIp = () => {
  const serverIp = process.env.NEXT_PUBLIC_SERVER_IP || "localhost";
  return `http://${serverIp}:3000`;
};
