import { createContext } from "react";
import { Item, Account } from "../../../sharedTypes";

export interface ItemWithAccounts extends Item {
  accounts: Account[];
}

export const DataContext = createContext([] as ItemWithAccounts[]);
