import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import { S3EventSource, SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as path from 'path';

export interface DataProcessingStackProps extends cdk.StackProps {
  readonly lambdaPath: string;
}

export class DataProcessingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: DataProcessingStackProps) {
    super(scope, id, props);

    const dataBucket = new s3.Bucket(this, 'DataBucket');

    const rawDataQueue = new sqs.Queue(this, 'RawDataQueue');

    const rawDataFunction = new lambda.Function(this, 'RawDataFunction', {
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, props.lambdaPath, '1-process-s3-event-fan-out')),
      deadLetterQueueEnabled: true,
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 256,
      timeout: cdk.Duration.minutes(15),
      environment: {
        OUTPUT_QUEUE: rawDataQueue.queueUrl
      }
    });
    rawDataFunction.addEventSource(new S3EventSource(dataBucket, {
      events: [ s3.EventType.OBJECT_CREATED_PUT ],
      filters: [ { prefix: 'raw/', suffix: 'json' } ]
    }));
    dataBucket.grantRead(rawDataFunction);
    rawDataQueue.grantSendMessages(rawDataFunction);

    const transformFunction = new lambda.Function(this, 'TransformDataFunction', {
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, props.lambdaPath, '2-transform-data-output-to-s3')),
      deadLetterQueueEnabled: true,
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 128,
      timeout: cdk.Duration.seconds(3),
      environment: {
        OUTPUT_BUCKET: dataBucket.bucketName
      }
    });
    transformFunction.addEventSource(new SqsEventSource(rawDataQueue, {
      batchSize: 10
    }));
    dataBucket.grantWrite(transformFunction);
    rawDataQueue.grantConsumeMessages(transformFunction);

    const rawFunctionWidget = new cloudwatch.GraphWidget({
      title: 'Lambda: Invocations',
      width: 12,
      height: 12,
      left: [
        rawDataFunction.metricInvocations({
          label: 'Raw Data Function',
          period: cdk.Duration.minutes(1)
        }), transformFunction.metricInvocations({
          label: 'Transform Function',
          period: cdk.Duration.minutes(1)
        }) ]
    });

    const rawQueueWidget = new cloudwatch.GraphWidget({
      title: 'Queue Metrics',
      width: 12,
      height: 12,
      left: [
        rawDataQueue.metricNumberOfMessagesSent({
          label: 'Number of Messages Sent',
          period: cdk.Duration.minutes(1)
        }), rawDataQueue.metricNumberOfEmptyReceives({
          label: 'Number of Empty Receives',
          period: cdk.Duration.minutes(1)
        }) ]
    });

    const dashboard = new cloudwatch.Dashboard(this, 'DataProcessingDashboard');
    dashboard.addWidgets(rawFunctionWidget, rawQueueWidget);

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName
    })

    cdk.Tag.add(this, 'Module', '1_DataProcessing');
  }
}
