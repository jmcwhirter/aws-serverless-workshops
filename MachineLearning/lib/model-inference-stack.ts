import { Construct, Duration, Stack, StackProps, Tag } from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as path from 'path';

export interface ModelInferenceStackProps extends StackProps {
  readonly lambdaPath: string;
}

class ModelInferenceStack extends Stack {
  readonly modelInferenceFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ModelInferenceStackProps) {
    super(scope, id, props);

    this.modelInferenceFunction = new lambda.Function(this, 'ModelInferenceFunction', {
      runtime: lambda.Runtime.PYTHON_2_7,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, props.lambdaPath)),
      deadLetterQueueEnabled: true,
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 128,
      timeout: Duration.seconds(3)
    });

    const bucketName = this.node.tryGetContext('bucketName');
    if (bucketName !== undefined) {
      this.modelInferenceFunction.addEnvironment('OUTPUT_BUCKET', bucketName);
      const importedBucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', bucketName);
      importedBucket.grantRead(this.modelInferenceFunction);
    }

    const modelPath = this.node.tryGetContext('modelPath');
    if (modelPath !== undefined) {
      this.modelInferenceFunction.addEnvironment('MODEL_PATH', modelPath);
    }

    Tag.add(this, 'Module', '3_ModelInference');
  }

  addLambdaRestApi() {
    new apigateway.LambdaRestApi(this, 'ModelInferenceApi', {
      handler: this.modelInferenceFunction,
    });
  }

  addRestApi() {
    new apigateway.RestApi(this, 'ModelInferenceApi');
  }
}

export class ConnectedModelInferenceStack extends ModelInferenceStack {
  constructor(scope: Construct, id: string, props: ModelInferenceStackProps) {
    super(scope, id, props);
    super.addLambdaRestApi();
  }
}

export class DisconnectedModelInferenceStack extends ModelInferenceStack {
  constructor(scope: Construct, id: string, props: ModelInferenceStackProps) {
    super(scope, id, props);
    // super.addRestApi();
  }
}
