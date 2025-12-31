import { useRouter } from "../i18n/navigation";

export const useAuth = () => {
  const router = useRouter();

  const handleLoginSuccess = (data: { accessToken: string; user: any }) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.newUser) {
      router.push("/role-setup");
    } else {
      router.push("/dashboard");
    }
  };

  return { handleLoginSuccess };
};
