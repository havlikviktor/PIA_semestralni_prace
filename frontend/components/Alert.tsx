'use client';

interface AlertProps {
  title: string;
  text: string;
  show: boolean;
  onClose?: () => void;
}

export default function Alert({ title, text, show, onClose }: AlertProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{text}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
