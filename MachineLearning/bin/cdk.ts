#!/usr/bin/env node
import 'source-map-support/register';
import { App, Tag } from '@aws-cdk/core';
import { DataProcessingStack } from '../lib/data-processing-stack';
import { ModelBuildingStack } from '../lib/model-building-stack';

const app = new App();
const dataProcessingStack = new DataProcessingStack(app, 'DataProcessingStack');
const modelBuildingStack = new ModelBuildingStack(app, 'ModelBuildingStack');

Tag.add(dataProcessingStack, 'Workshop', 'Wild Rydes');
Tag.add(modelBuildingStack, 'Workshop', 'Wild Rydes');
