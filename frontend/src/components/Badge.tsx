interface IntTextProps {
  n: number;
  icon: string;
}

const Badge: React.FC<IntTextProps> = ({ icon, n }) => {
  return (
    <div className="flex flex-row items-baseline mx-1">
      <p>{icon}</p>
      <p className="font-bold text-sm">{n}</p>
    </div>
  );
};

export default Badge;
