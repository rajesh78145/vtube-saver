import { createContext, useContext, useState } from "react";

const ActiveDownloadsContext = createContext();

export const ActiveDownloadsProvider = ({ children }) => {
  const [activeDownloads, setActiveDownloads] = useState([]);

  const addDownload = (download) =>
    setActiveDownloads((prev) => [...prev, download]);
  const updateDownload = (id, updates) =>
    setActiveDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  const removeDownload = (id) =>
    setActiveDownloads((prev) => prev.filter((d) => d.id !== id));

  return (
    <ActiveDownloadsContext.Provider
      value={{ activeDownloads, addDownload, updateDownload, removeDownload }}
    >
      {children}
    </ActiveDownloadsContext.Provider>
  );
};

export const useActiveDownloads = () => useContext(ActiveDownloadsContext);
