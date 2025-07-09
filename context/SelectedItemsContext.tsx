import React, { createContext, useContext, useState } from 'react';

type SelectedItem = {
  id: number;
  itemName: string;
  price: number;
  quantity: number;
};

type SelectedItemsContextType = {
  selectedItems: SelectedItem[];
  setSelectedItems: (items: SelectedItem[]) => void;
  clearSelectedItems: () => void;
};

const SelectedItemsContext = createContext<SelectedItemsContextType | undefined>(undefined);

export const SelectedItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedItems, _setSelectedItems] = useState<SelectedItem[]>([]);

  // Wrap setter to always filter out zero quantity items
  const setSelectedItems = (items: SelectedItem[]) => {
    const filtered = items.filter(item => item.quantity > 0);
    _setSelectedItems(filtered);
  };

  const clearSelectedItems = () => _setSelectedItems([]);

  return (
    <SelectedItemsContext.Provider value={{ selectedItems, setSelectedItems, clearSelectedItems }}>
      {children}
    </SelectedItemsContext.Provider>
  );
};

export const useSelectedItems = () => {
  const context = useContext(SelectedItemsContext);
  if (!context) throw new Error('useSelectedItems must be used within SelectedItemsProvider');
  return context;
};
