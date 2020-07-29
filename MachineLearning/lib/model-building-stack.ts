import { Construct, Stack, StackProps, Tag } from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as sagemaker from '@aws-cdk/aws-sagemaker';

export class ModelBuildingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const notebookRole = new iam.Role(this, 'WildRydesNotebookRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      ]
    });

    new sagemaker.CfnNotebookInstance(this, 'WildRydesNotebook', {
      instanceType: 'ml.t3.xlarge',
      roleArn: notebookRole.roleArn
    });

    Tag.add(this, 'Module', '2_ModelBuilding');
  }
}
