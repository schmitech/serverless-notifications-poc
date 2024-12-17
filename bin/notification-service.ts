#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NotificationServiceStack } from '../lib/notification-service-stack';

const app = new cdk.App();
new NotificationServiceStack(app, 'NotificationServiceStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});