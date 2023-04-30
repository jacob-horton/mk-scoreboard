import { useState } from "react";

interface IntTextProps {
  onChange: (score: number) => void;
}

const IntTextBox: React.FC<IntTextProps> = ({ onChange }) => {
  const [val, setVal] = useState("");

  return (
    <input
      className="w-14 bg-gray-300 ml-4 p-2 rounded-lg"
      required={true}
      value={val}
      onChange={(e) => {
        const re = /^[0-9\b]+$/;
        if (e.target.value === "" || re.test(e.target.value)) {
          setVal(e.target.value);
          onChange(parseInt(e.target.value));
        }
      }}
    />
  );
};

export default IntTextBox;
