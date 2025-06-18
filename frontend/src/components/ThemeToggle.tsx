import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Icons } from './ui/Icons';

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Icons.sun className="w-5 h-5 text-yellow-300" />
      ) : (
        <Icons.moon className="w-5 h-5 text-blue-500" />
      )}
    </button>
  );
};

export default ThemeToggle;
