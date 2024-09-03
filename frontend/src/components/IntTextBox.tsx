import { useState } from "react";

interface IntTextProps {
  onChange: (score: number | null) => void;
  required?: boolean;
}

const IntTextBox: React.FC<IntTextProps> = ({ onChange, required }) => {
  const [val, setVal] = useState("");
  const isRequired = required ?? true;

  return (
    <input
      className="w-14 bg-gray-300 p-2 rounded-lg"
      required={isRequired}
      value={val}
      onChange={(e) => {
        if (!isRequired && e.target.value === "") {
          setVal("");
          onChange(null);
        }

        const re = /^[0-9\b]+$/;
        if (re.test(e.target.value)) {
          setVal(e.target.value);
          onChange(parseInt(e.target.value));
        }
      }}
    />
  );
};

export default IntTextBox;
