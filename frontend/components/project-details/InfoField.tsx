interface InfoFieldProps {
  label: string;
  value: string | React.ReactNode;
}

export default function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <label className="font-semibold text-gray-600">{label}</label>
      <div className="mt-1">{value}</div>
    </div>
  );
}
