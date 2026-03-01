const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="bg-blue-50 rounded-lg p-4 text-center">
    <p className="text-3xl font-bold text-blue-600">{number}</p>
    <p className="text-sm text-gray-600 mt-1">{label}</p>
  </div>
);

export default StatCard;
