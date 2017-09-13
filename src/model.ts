import { IModel, Model, Schema } from '@ycs/core/lib/db';
import { IConfig } from './config';

export function createModel(config: IConfig): IModel {
  const schema = new Schema(
    {
      mobile: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
      expiresIn: {
        type: Date,
        required: true,
      },
      category: {
        type: String,
        required: true,
        enum: config.categories.map(x => x.name),
      },
    },
    {
      timestamps: {},
    }
  );
  return Model({
    name: '__alicloud_sms',
    auth: true,
    schema,
  });
}
