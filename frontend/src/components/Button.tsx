import React from "react";

export function Button({
  disabled,
  children,
  onClick,
}: {
  disabled: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="bg-blue-700 disabled:bg-gray-500 disabled:cursor-default shadow-lg rounded-full px-5 py-2 text-lg text-white hover:cursor-pointer"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
