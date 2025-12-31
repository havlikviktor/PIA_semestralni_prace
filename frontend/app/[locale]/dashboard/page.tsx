import { useTranslations } from "next-intl";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">{t("welcome")}</h1>
      <p className="text-xl">{t("loggedIn")}</p>
    </div>
  );
}
