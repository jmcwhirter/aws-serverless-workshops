import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as path from 'path';

export interface ModelInferenceStackProps extends cdk.StackProps {
  readonly lambdaPath: string;
}

export class ModelInferenceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ModelInferenceStackProps) {
    super(scope, id, props);

    const modelInferenceFunction = new lambda.Function(this, 'ModelInferenceFunction', {
      runtime: lambda.Runtime.PYTHON_2_7,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, props.lambdaPath)),
      deadLetterQueueEnabled: true,
      tracing: lambda.Tracing.ACTIVE,
      memorySize: 128,
      timeout: cdk.Duration.seconds(3),
      environment: {
        OUTPUT_BUCKET: '',
        MODEL_PATH: ''
      }
    });

    new apigateway.LambdaRestApi(this, 'ModelInferenceApi', {
      handler: modelInferenceFunction,
    });

    cdk.Tag.add(this, 'Module', '3_ModelInference');
  }
}
