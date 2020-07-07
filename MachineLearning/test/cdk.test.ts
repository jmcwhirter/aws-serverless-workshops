import { expect as expectCDK, matchTemplate, MatchStyle, countResources, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as dps from '../lib/data-processing-stack';
import * as mbs from '../lib/model-building-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new cdk.Stack();
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

test('Data processing stack - resource count', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new dps.DataProcessingStack(app, 'DataProcessingStack');
    // THEN
    expectCDK(stack).to(countResources('AWS::S3::Bucket', 1));
    expectCDK(stack).to(countResources('AWS::Lambda::Function', 3));
    expectCDK(stack).to(countResources('AWS::Lambda::Permission', 1));
    expectCDK(stack).to(countResources('AWS::Lambda::EventSourceMapping', 1));
    expectCDK(stack).to(countResources('AWS::IAM::Role', 3));
    expectCDK(stack).to(countResources('AWS::SQS::Queue', 3));
    expectCDK(stack).to(countResources('AWS::CloudWatch::Dashboard', 1));
});

test('Data processing stack - verify integrations', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new dps.DataProcessingStack(app, 'DataProcessingStack');
    // THEN
    // expectCDK(stack).to(haveResource('AWS::'))
});

test('Model building stack - resource count', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new mbs.ModelBuildingStack(app, 'ModelBuildingStack');
    // THEN
    expectCDK(stack).to(countResources('AWS::SageMaker::NotebookInstance', 1));
    expectCDK(stack).to(countResources('AWS::IAM::Role', 1));
});
