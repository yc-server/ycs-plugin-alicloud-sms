import { AuthModel, signToken } from '@ycs/core/lib/auth';
import { IContext } from '@ycs/core/lib/context';
import { IModel, Mongoose, paginate } from '@ycs/core/lib/db';
import { Boom, handleError } from '@ycs/core/lib/errors';
import { response } from '@ycs/core/lib/response';
import * as sms from 'ali-sms';
import * as moment from 'moment';
import { IConfig } from './config';

export class Controller {
  public static instance: Controller;

  constructor(private model: IModel, private config: IConfig) {
    Controller.instance = this;
  }

  // Gets a list of Models
  public index = async (ctx: IContext) => {
    try {
      const paginateResult = await paginate(this.model, ctx);
      response(ctx, 200, paginateResult);
    } catch (e) {
      console.error(e);
      handleError(ctx, e);
    }
  };

  public send = async (ctx: IContext) => {
    try {
      if (!ctx.request.fields) throw Boom.badData(this.config.errors.empty);
      if (!ctx.request.fields.category)
        throw Boom.badData(this.config.errors.emptyCategory);
      if (!ctx.request.fields.username)
        throw Boom.badData(this.config.errors.emptyMobile);

      const category = this.config.categories.find(
        x => x.name === ctx.request.fields.category
      );
      if (!category) throw Boom.badData(this.config.errors.unknownCategory);

      const exists = await this.model
        .count({
          mobile: ctx.request.fields.username,
          category: category.name,
          createdAt: {
            $gt: moment()
              .subtract(
                category.resendInterval.quantity,
                category.resendInterval.unit
              )
              .toDate(),
          },
        })
        .exec();
      if (exists) throw Boom.badData(category.resendInterval.error);

      const code = Math.random()
        .toString()
        .substring(2, category.codeLength + 2);
      const body = {
        accessKeyID: category.accessKeyID,
        accessKeySecret: category.accessKeySecret,
        paramString: { code, product: category.product },
        recNum: [ctx.request.fields.username],
        signName: category.signName,
        templateCode: category.templateCode,
      };
      await this.sendSms(body);
      await this.model.create({
        mobile: ctx.request.fields.username,
        code,
        expiresIn: moment()
          .add(category.expiresIn.quantity, category.expiresIn.unit)
          .toDate(),
        category: category.name,
      });
      response(ctx, 204);
    } catch (e) {
      handleError(ctx, e);
    }
  };

  public verify = async (body: {
    category: string;
    mobile: string;
    code: string;
  }): Promise<boolean> => {
    const category = this.config.categories.find(x => x.name === body.category);
    if (!category) throw Boom.badData(this.config.errors.unknownCategory);
    const exists = await this.model
      .count({
        mobile: body.mobile,
        category: category.name,
        createdAt: {
          $gt: moment()
            .subtract(category.expiresIn.quantity, category.expiresIn.unit)
            .toDate(),
        },
      })
      .exec();
    return !!exists;
  };

  public signin = async (ctx: IContext) => {
    try {
      if (!ctx.request.fields) throw Boom.badData(this.config.errors.empty);
      if (!ctx.request.fields.code)
        throw Boom.badData(this.config.errors.emptyCode);
      if (!ctx.request.fields.username)
        throw Boom.badData(this.config.errors.emptyMobile);

      const correct = await this.verify({
        mobile: ctx.request.fields.username,
        code: ctx.request.fields.code,
        category: this.config.signin.categoryName,
      });

      if (!correct) throw Boom.badData(this.config.signin.errors.invalidCode);

      let auth = await AuthModel.findOne({
        'providers.name': this.config.signin.categoryName,
        'providers.openid': ctx.request.fields.username,
      }).exec();
      let status = 200;

      if (!auth) {
        auth = await AuthModel.create({
          providers: {
            name: this.config.signin.categoryName,
            openid: ctx.request.fields.username,
          },
        });
        status = 201;
      }
      const token = signToken(auth, {
        expiresIn: this.config.signin.expiresIn,
      });
      response(ctx, status, { token });
    } catch (e) {
      handleError(ctx, e);
    }
  };

  // reset password
  public reset = async (ctx: IContext) => {
    try {
      if (!ctx.request.fields) throw Boom.badData(this.config.errors.empty);
      if (!ctx.request.fields.code)
        throw Boom.badData(this.config.errors.emptyCode);
      if (!ctx.request.fields.username)
        throw Boom.badData(this.config.errors.emptyUsername);
      if (!ctx.request.fields.password)
        throw Boom.badData(this.config.errors.emptyPassword);

      const correct = await this.verify({
        mobile: ctx.request.fields.username,
        code: ctx.request.fields.code,
        category: this.config.reset.categoryName,
      });

      if (!correct) throw Boom.badData(this.config.reset.errors.invalidCode);

      let auth = await AuthModel.findOne({
        'providers.name': this.config.reset.categoryName,
        'providers.openid': ctx.request.fields.username,
      }).exec();
      if (!auth) throw Boom.badData(this.config.errors.emptyUsername);
      auth['password'] = String(ctx.request.fields.password);
      await auth.save();
      response(ctx, 204);
    } catch (e) {
      handleError(ctx, e);
    }
  };

  // send sms
  private sendSms = (body: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      sms(body, (err, body) => {
        if (err) {
          console.log(err);
          reject(err);
        } else resolve(body);
      });
    });
  };
}
