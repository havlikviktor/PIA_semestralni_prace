import { useRouter } from "../i18n/navigation";
import { useState } from "react";

export const useAuth = () => {
  const router = useRouter();
  const [unauthorized, setUnauthorized] = useState(false);

  const handleLoginSuccess = (data: { accessToken: string; user: any }) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.newUser) {
      router.push("/role-setup");
    } else {
      router.push("/dashboard");
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      setUnauthorized(true);
      throw new Error("Unauthorized");
    }

    return { Authorization: `Bearer ${token}` };
  };

  const handleResponseStatus = async (res: Response) => {
    if (res.status === 401) {
      setUnauthorized(true);
      throw new Error("Unauthorized");
    }

    if (res.status === 204) {
      return;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Fetch error");
    }
  };

  const parseResponse = async (
    res: Response,
    responseType: "json" | "blob" | "text"
  ) => {
    if (responseType === "blob") {
      const blob = await res.blob();
      return { blob, headers: res.headers };
    }

    if (responseType === "text") {
      return await res.text();
    }

    const text = await res.text();
    return text ? JSON.parse(text) : {};
  };

  const authFetch = async (
    url: string,
    options: RequestInit = {},
    responseType: "json" | "blob" | "text" = "json"
  ) => {
    try {
      const headers = getAuthHeaders();

      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...headers,
        },
      });

      await handleResponseStatus(res);

      return await parseResponse(res, responseType);
    } catch (e: any) {
      if (e.message === "Unauthorized") throw e;

      console.error("Auth fetch error:", e);
      throw e;
    }
  };

  return { handleLoginSuccess, authFetch, unauthorized };
};
