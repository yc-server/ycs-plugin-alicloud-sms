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
      if (!ctx.request.fields.mobile)
        throw Boom.badData(this.config.errors.emptyMobile);

      const category = this.config.categories.find(
        x => x.name === ctx.request.fields.category
      );
      if (!category) throw Boom.badData(this.config.errors.unknownCategory);

      if (category.captcha) {
        const verified = await category.captcha(ctx);
        if (!verified) throw Boom.badData(this.config.errors.captcha);
      }
      const exists = await this.model
        .count({
          mobile: ctx.request.fields.mobile,
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
        recNum: [ctx.request.fields.mobile],
        signName: category.signName,
        templateCode: category.templateCode,
      };
      const res = await this.sendSms(body);
      await this.model.create({
        mobile: ctx.request.fields.mobile,
        code,
        expiresIn: moment()
          .add(category.expiresIn.quantity, category.expiresIn.unit)
          .toDate(),
        category: category.name,
      });
      response(ctx, 201, res);
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
        code: body.code,
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
      if (!ctx.request.fields.mobile)
        throw Boom.badData(this.config.errors.emptyMobile);

      const correct = await this.verify({
        mobile: ctx.request.fields.mobile,
        code: ctx.request.fields.code,
        category: this.config.signin.categoryName,
      });

      if (!correct) throw Boom.badData(this.config.signin.errors.invalidCode);

      let auth = await AuthModel.findOne({
        'providers.name': this.config.signin.categoryName,
        'providers.openid': ctx.request.fields.mobile,
      }).exec();
      let status = 200;

      if (!auth) {
        const oldAuth = await AuthModel.findOne({
          username: ctx.request.fields.mobile,
        }).exec();

        if (!oldAuth) {
          auth = await AuthModel.create({
            username: ctx.request.fields.mobile,
            providers: {
              name: this.config.signin.categoryName,
              openid: ctx.request.fields.mobile,
            },
          });
          status = 201;
        } else {
          oldAuth['providers'].push({
            name: this.config.signin.categoryName,
            openid: ctx.request.fields.mobile,
          });
          auth = await oldAuth.save();
        }
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
        username: ctx.request.fields.username,
      }).exec();
      if (!auth) throw Boom.badData(this.config.errors.usernameNotFound);
      auth['password'] = String(ctx.request.fields.password);
      await auth.save();
      response(ctx, 204);
    } catch (e) {
      handleError(ctx, e);
    }
  };

  // send sms
  public sendSms = (body: any): Promise<any> => {
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
