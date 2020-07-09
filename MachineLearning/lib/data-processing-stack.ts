import { Construct, Stack, StackProps, Duration, CfnOutput, Tag } from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import { S3EventSource, SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as path from 'path';

export interface DataProcessingStackProps extends StackProps {
  lambdaPath: string;
}

class DataProcessingStack extends Stack {
  readonly rawDataFunction: lambda.Function;
  readonly transformFunction: lambda.Function;
  readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: DataProcessingStackProps) {
    super(scope, id, props);

    this.rawDataFunction = new lambda.Function(this, 'RawDataFunction', {
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, props.lambdaPath, '1-process-s3-event-fan-out')),
      deadLetterQueueEnabled: true,
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 256,
      timeout: Duration.minutes(15)
    });
    this.rawDataFunction.addEnvironment('OUTPUT_QUEUE', '');

    this.transformFunction = new lambda.Function(this, 'TransformDataFunction', {
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, props.lambdaPath, '2-transform-data-output-to-s3')),
      deadLetterQueueEnabled: true,
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 128,
      timeout: Duration.seconds(3)
    });
    this.transformFunction.addEnvironment('OUTPUT_BUCKET', '');

    const rawFunctionWidget = new cloudwatch.GraphWidget({
      title: 'Lambda: Invocations',
      width: 12,
      height: 12,
      left: [
        this.rawDataFunction.metricInvocations({
          label: 'Raw Data Function',
          period: Duration.minutes(1)
        }), this.transformFunction.metricInvocations({
          label: 'Transform Function',
          period: Duration.minutes(1)
        }) ]
    });

    this.dashboard = new cloudwatch.Dashboard(this, 'DataProcessingDashboard');
    this.dashboard.addWidgets(rawFunctionWidget);

    Tag.add(this, 'Module', '1_DataProcessing');
  }

  addBucketSource() {
    const dataBucket = new s3.Bucket(this, 'DataBucket');

    this.rawDataFunction.addEventSource(new S3EventSource(dataBucket, {
      events: [ s3.EventType.OBJECT_CREATED_PUT ],
      filters: [ { prefix: 'raw/', suffix: 'json' } ]
    }));

    this.transformFunction.addEnvironment('OUTPUT_BUCKET', dataBucket.bucketName);

    new CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName
    })

    this.addBucketPermissions(dataBucket);
  }

  addBucketPermissions(dataBucket: s3.IBucket) {
    dataBucket.grantRead(this.rawDataFunction);
    dataBucket.grantWrite(this.transformFunction);
  }

  addQueue() {
    const rawDataQueue = new sqs.Queue(this, 'RawDataQueue');

    this.transformFunction.addEventSource(new SqsEventSource(rawDataQueue, {
      batchSize: 10
    }));

    this.rawDataFunction.addEnvironment('OUTPUT_QUEUE', rawDataQueue.queueUrl);

    this.addQueuePermissions(rawDataQueue);
    this.addQueueWidget(rawDataQueue);
  }

  addQueuePermissions(rawDataQueue: sqs.IQueue) {
    rawDataQueue.grantSendMessages(this.rawDataFunction);
    rawDataQueue.grantConsumeMessages(this.transformFunction);
  }

  addQueueWidget(queue: sqs.IQueue) {

    const rawQueueWidget = new cloudwatch.GraphWidget({
      title: 'Queue Metrics',
      width: 12,
      height: 12,
      left: [
        queue.metricNumberOfMessagesSent({
          label: 'Number of Messages Sent',
          period: Duration.minutes(1)
        }), queue.metricNumberOfEmptyReceives({
          label: 'Number of Empty Receives',
          period: Duration.minutes(1)
        }) ]
    });

    this.dashboard.addWidgets(rawQueueWidget);
  }
}

export class ConnectedDataProcessingStack extends DataProcessingStack {
  constructor(scope: Construct, id: string, props: DataProcessingStackProps) {
    super(scope, id, props);
    super.addBucketSource();
    super.addQueue();
  }
}

export class DisconnectedDataProcessingStack extends DataProcessingStack {
  constructor(scope: Construct, id: string, props: DataProcessingStackProps) {
    super(scope, id, props);
    const bucketName = this.node.tryGetContext('bucketName');
    if (bucketName !== undefined) {
      const importedBucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', bucketName)
      super.addBucketPermissions(importedBucket);
    }
    const queueArn = this.node.tryGetContext('queueArn');
    if (queueArn !== undefined) {
      const importedQueue = sqs.Queue.fromQueueArn(this, 'DisconnectedQueue', queueArn)
      super.addQueuePermissions(importedQueue);
      super.addQueueWidget(importedQueue);
    }
  }
}
