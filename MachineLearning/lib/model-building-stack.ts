import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as sagemaker from '@aws-cdk/aws-sagemaker';

export class ModelBuildingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
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

    cdk.Tag.add(this, 'Module', '2_ModelBuilding');
  }
}
