import React from "react";

interface SideBarButtonProps {
  selected: boolean;
  onButtonPress: () => void;
  children?: React.ReactNode;
}

const SideBarButton: React.FC<SideBarButtonProps> = ({
  selected,
  children,
  onButtonPress,
}) => {
  const colour = selected
    ? "bg-blue-200 text-blue-500 hover:bg-blue-100"
    : "hover:bg-gray-200 text-gray-800";

  return (
    <button
      onClick={onButtonPress}
      className={`flex w-full items-center py-2 px-4 rounded-lg transition ${colour}`}
    >
      {children}
    </button>
  );
};

interface SideBarProps {
  groups: String[];
  selected: number;
  onButtonPress: (index: number) => void;
}

const SideBar: React.FC<SideBarProps> = ({
  groups,
  selected,
  onButtonPress,
}) => {
  return (
    <div className="bg-gray-100 w-64 h-screen border-r">
      <div className="flex m-4 items-center justify-between">
        <h1 className="text-4xl font-light pr-4">Groups</h1>
        <button className="w-8 h-8 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition">
          +
        </button>
      </div>
      <div className="px-3 py-4">
        <ul className="space-y-2 font-medium">
          {groups.map((group, index) => (
            <li>
              <SideBarButton
                selected={index == selected}
                onButtonPress={() => onButtonPress(index)}
              >
                {group}
              </SideBarButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SideBar;
