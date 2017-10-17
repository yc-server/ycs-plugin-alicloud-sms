# Installation

```bash
ycs add plugin alicloud-sms
```

# configurations

```ts
import { IConfig } from 'ycs-plugin-alicloud-sms';

export const development: IConfig = {
  endpoint: '/alicloud-sms',
  roles: ['alicloud-sms'],
  categories: [
    {
      name: 'signin',
      accessKeyID: 'xxx',
      accessKeySecret: 'xxx',
      templateCode: 'xxx',
      signName: 'xxx',
      product: 'xxx',
      codeLength: 6,
      expiresIn: {
        quantity: 15,
        unit: 'minute',
        error: 'Invalid code',
      },
      resendInterval: {
        quantity: 1,
        unit: 'minute',
        error: 'You can only send one sms per minute',
      },
    }
  ],
  errors: {
    empty: 'Empty body',
    emptyCategory: 'Empty category',
    emptyMobile: 'Empty mobile',
    emptyCode: 'Empty code',
    emptyUsername: 'Empty username',
    emptyPassword: 'Empty password',
    unknownCategory: 'Unknown category',
    usernameNotFound: 'Username not found',
  },
  signin: {
    categoryName: 'signin',
    expiresIn: '1h',
    errors: {
      invalidCode: 'invalidCode',
    },
  },
  reset: {
    categoryName: 'reset',
    expiresIn: '1h',
    errors: {
      invalidCode: 'invalidCode',
    },
  },
};

export const production: IConfig = {
  endpoint: '/alicloud-sms',
  roles: ['alicloud-sms'],
  categories: [
    {
      name: 'signin',
      accessKeyID: 'xxx',
      accessKeySecret: 'xxx',
      templateCode: 'xxx',
      signName: 'xxx',
      product: 'xxx',
      codeLength: 6,
      expiresIn: {
        quantity: 15,
        unit: 'minute',
        error: 'Invalid code',
      },
      resendInterval: {
        quantity: 1,
        unit: 'minute',
        error: 'You can only send one sms per minute',
      },
    }
  ],
  errors: {
    empty: 'Empty body',
    emptyCategory: 'Empty category',
    emptyMobile: 'Empty mobile',
    emptyCode: 'Empty code',
    emptyUsername: 'Empty username',
    emptyPassword: 'Empty password',
    unknownCategory: 'Unknown category',
    usernameNotFound: 'Username not found',
  },
  signin: {
    categoryName: 'signin',
    expiresIn: '1h',
    errors: {
      invalidCode: 'invalidCode',
    },
  },
  reset: {
    categoryName: 'reset',
    expiresIn: '1h',
    errors: {
      invalidCode: 'invalidCode',
    },
  },
};

```