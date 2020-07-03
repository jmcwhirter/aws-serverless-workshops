#!/usr/bin/env node
import 'source-map-support/register';
import { App, Tag } from '@aws-cdk/core';
import { DataProcessingStack } from '../lib/data-processing-stack';

const app = new App();
const dataProcessingStack = new DataProcessingStack(app, 'DataProcessingStack');

Tag.add(dataProcessingStack, 'Workshop', 'Wild Rydes');
