import React from "react";

interface ButtonProps {
  children?: React.ReactNode;
  style: "blue" | "grey";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, style, className }) => {
  let classes = className ?? "";
  switch (style) {
    case "blue":
      classes += " bg-blue-500 text-white hover:bg-blue-400";
      break;
    case "grey":
      classes += " bg-gray-200 text-gray-800 hover:bg-gray-100";
      break;
  }

  return (
    <button className={`px-4 py-2 rounded-lg transition ${classes}`}>
      {children}
    </button>
  );
};

export default Button;
