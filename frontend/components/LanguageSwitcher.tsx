"use client";

import { usePathname, useRouter } from "../i18n/navigation";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="absolute top-4 right-4">
      <select
        value={locale}
        onChange={handleChange}
        className="text-gray-200 py-1 px-3 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="cs" className="text-gray-900">Čeština</option>
        <option value="en" className="text-gray-900">English</option>
      </select>
    </div>
  );
}
