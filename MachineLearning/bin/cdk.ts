#!/usr/bin/env node
import 'source-map-support/register';
import { App, Tag } from '@aws-cdk/core';
import { DataProcessingStack } from '../lib/data-processing-stack';
import { ModelBuildingStack } from '../lib/model-building-stack';
import { ModelInferenceStack } from '../lib/model-inference-stack';

const dataProcessingLambdaPath = '../1_DataProcessing/lambda-functions/'
const modelInferenceLambdaPath = '../3_Inference/lambda-functions/'

const app = new App();
const dataProcessingStack = new DataProcessingStack(app, 'DataProcessingStack', {
  lambdaPath: dataProcessingLambdaPath
});
const modelBuildingStack = new ModelBuildingStack(app, 'ModelBuildingStack');
const modelInferenceStack = new ModelInferenceStack(app, 'ModelInferenceStack', {
  lambdaPath: modelInferenceLambdaPath
})

Tag.add(dataProcessingStack, 'Workshop', 'Wild Rydes');
Tag.add(modelBuildingStack, 'Workshop', 'Wild Rydes');
Tag.add(modelInferenceStack, 'Workshop', 'Wild Rydes');
