import { Ycs } from '@ycs/core';
import { IDocs } from '@ycs/core/lib/docs';
import { Router } from '@ycs/core/lib/routers';
import { IConfig } from './config';
import { Controller } from './controller';
import { createModel } from './model';

export async function setupRouter(app: Ycs): Promise<Router[]> {
  const config: IConfig = app.config.alicloudSms;
  const routers: Router[] = [];
  const model = createModel(config);
  const controller = new Controller(model, config);
  routers.push(
    model.routes(
      config.endpoint,
      {
        path: '/',
        methods: ['get'],
        auth: {
          type: 'hasRoles',
          roles: config.roles,
        },
        controller: controller.index,
        tags: ['__alicloud_sms'],
        summary: 'List documents',
        description: 'List documents',
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [model.docSchema.paginateOptions],
        responses: {
          204: {
            description: 'Successful operation',
          },
          '4xx': model.docSchema.response4xx,
          '5xx': model.docSchema.response5xx,
        },
      },
      {
        path: '/send',
        methods: ['post'],
        controller: controller.send,
        tags: ['__alicloud_sms'],
        summary: 'Send code',
        description: `Send code`,
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                mobile: {
                  type: 'string',
                },
                category: {
                  type: 'string',
                },
              },
              xml: {
                name: 'xml',
              },
            },
          },
        ],
        responses: {
          201: {
            description: 'Successful operation',
            schema: model.docSchema.result,
          },
          '4xx': model.docSchema.response4xx,
          '5xx': model.docSchema.response5xx,
        },
      },
      {
        path: '/signin',
        methods: ['post'],
        controller: controller.signin,
        tags: ['__alicloud_sms'],
        summary: 'Signin with sms',
        description: `Signin with sms`,
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                mobile: {
                  type: 'string',
                },
                code: {
                  type: 'string',
                },
              },
              xml: {
                name: 'xml',
              },
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful operation',
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
              xml: {
                name: 'xml',
              },
            },
          },
          201: {
            description: 'Successful operation',
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
              xml: {
                name: 'xml',
              },
            },
          },
          '4xx': model.docSchema.response4xx,
          '5xx': model.docSchema.response5xx,
        },
      }
    )
  );

  return routers;
}
