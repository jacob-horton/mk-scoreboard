interface BadgeProps {
  n: number;
  icon: string;
}

const Badge: React.FC<BadgeProps> = ({ icon, n }) => {
  return (
    <div className="flex flex-row items-baseline mx-1">
      <p>{icon}</p>
      <p className="font-bold text-xs md:text-sm">{n}</p>
    </div>
  );
};

export default Badge;
