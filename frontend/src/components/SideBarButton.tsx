import React from "react";
import { NavLink } from "react-router-dom";

interface SideBarButtonProps {
  name: string;
  page: string;
  onClick?: () => void;
}

const SideBarButton: React.FC<SideBarButtonProps> = ({
  name,
  page,
  onClick,
}) => {
  return (
    <NavLink
      to={page}
      onClick={onClick}
      className={({ isActive }) => {
        const colour = isActive
          ? "bg-blue-200 text-blue-500 hover:bg-blue-100"
          : "hover:bg-gray-200 text-gray-800";
        return `flex w-full items-center py-2 px-4 rounded-lg transition ${colour}`;
      }}
    >
      {name}
    </NavLink>
  );
};

export default SideBarButton;
