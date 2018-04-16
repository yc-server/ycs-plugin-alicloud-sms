import { IContext } from '@ycs/core/lib/context';

export interface IConfig {
  endpoint: string;
  roles: string[];
  categories: IConfigCategory[];
  errors: {
    empty: string;
    emptyCategory: string;
    emptyMobile: string;
    emptyCode: string;
    emptyUsername: string;
    emptyPassword: string;
    unknownCategory: string;
    usernameNotFound: string;
    captcha?: string;
  };
  signin?: {
    categoryName: string;
    expiresIn: any;
    errors: {
      invalidCode: string;
    };
  };
  reset?: {
    categoryName: string;
    expiresIn: any;
    errors: {
      invalidCode: string;
    };
  };
}

export interface IConfigCategory {
  name: string;
  accessKeyID: string;
  accessKeySecret: string;
  templateCode: string;
  signName: string;
  product?: string;
  codeLength: number;
  expiresIn: {
    quantity: number;
    unit: 'month' | 'day' | 'hour' | 'minute' | 'second';
    error: string;
  };
  resendInterval: {
    quantity: number;
    unit: 'month' | 'day' | 'hour' | 'minute' | 'second';
    error: string;
  };
  captcha?: (ctx: IContext) => Promise<boolean>;
}
