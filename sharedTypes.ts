export interface Item {
  itemId: string;
  name: string;
}

export interface ServerItem extends Item {
  accessToken: string;
}

export interface Account {
  accountId: string;
  name: string;
  nickname: string;
}
