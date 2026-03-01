interface Props {
  step: number;
  icon: string;
  title: string;
  desc: string;
}

const InstructionCard = ({ step, icon, title, desc }: Props) => (
  <div className="bg-white rounded-lg shadow p-6 text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <div className="text-sm font-bold text-blue-600 mb-2">Step {step}</div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{desc}</p>
  </div>
);

export default InstructionCard;
