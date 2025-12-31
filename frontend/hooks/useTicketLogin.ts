import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "./useAuth";

export const useTicketLogin = () => {
  const searchParams = useSearchParams();
  const { handleLoginSuccess } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ticket = searchParams.get("ticket");

    if (!ticket) {
      setIsLoading(false);
      return;
    }

    const exchangeTicket = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket }),
        });

        if (!res.ok) throw new Error("Invalid ticket");

        const data = await res.json();
        if (data.accessToken) {
          handleLoginSuccess(data);
        } else {
          throw new Error("Token not received");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Login failed");
      } finally {
        setIsLoading(false);
      }
    };

    exchangeTicket();
  }, [searchParams, handleLoginSuccess]);

  return { isLoading, error };
};
