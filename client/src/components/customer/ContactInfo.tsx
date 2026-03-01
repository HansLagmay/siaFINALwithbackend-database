interface Props {
  icon: string;
  label: string;
  value: string;
  link?: string;
}

const ContactInfo = ({ icon, label, value, link }: Props) => (
  <div className="flex items-start gap-3">
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      {link ? (
        <a href={link} className="font-semibold text-blue-600">
          {value}
        </a>
      ) : (
        <p className="font-semibold">{value}</p>
      )}
    </div>
  </div>
);

export default ContactInfo;
