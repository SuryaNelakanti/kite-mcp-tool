import React, { useState } from "react";

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  return (
    <label className="swap swap-rotate">
      <input type="checkbox" checked={darkMode} onChange={()=>setDarkMode(!darkMode)} aria-label="Toggle dark mode" />
      <svg className="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64 17.657A9 9 0 0112 3v0a9 9 0 100 18 9.003 9.003 0 01-6.36-2.343z"/></svg>
      <svg className="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm5.657 3.343a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM21 11a1 1 0 110 2h-1a1 1 0 110-2h1zm-3.343 7.657a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM13 21a1 1 0 11-2 0v-1a1 1 0 112 0v1zM5.636 18.364a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707zM4 11a1 1 0 100 2H3a1 1 0 100-2h1zm1.343-5.657a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z"/></svg>
    </label>
  );
}
