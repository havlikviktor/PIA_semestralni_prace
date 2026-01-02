import Link from "next/link";

interface DashboardButtonProps {
  title: string;
  href: string;
  imageSrc: string;
}

export default function DashboardButton({
  title,
  href,
  imageSrc,
}: DashboardButtonProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center aspect-square bg-stone-900 rounded-xl border border-gray-800 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 group p-6"
    >
      <div className="w-1/2 h-1/2 mb-4 relative flex items-center justify-center">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <span className="text-gray-300 font-medium text-xl group-hover:text-white transition-colors text-center">
        {title}
      </span>
    </Link>
  );
}
