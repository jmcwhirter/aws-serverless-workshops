# :construction: UNDER CONSTRUCTION :construction:

## Create a model retraining pipeline

## What are we building?

We're going to use the Amazon SageMaker Jupyter notebook environment to create a model retraining pipeline.

## Why are we building it?

**Time to complete:** 15-20 minutes.

### Step 1: Resize the EBS volume on your Cloud9 environment
1. Navigate to your Cloud9 environment
1. Make sure you're in the correct directory first
    ```
    cd ~/environment/aws-serverless-workshops/MachineLearning
    ```
1. Run a script to resize the volume to 20 GB
    ```
    sh resize.sh 20
    ```

### Step : Build and publish a Lambda layer
1. Navigate to the custom layer directory
    ```
    cd 4_ModelRetraining/lambda_functions/custom_layer/
    ```
1. Run the build script
    ```
    sh build.sh
    ```
1. Run the publish script
    ```
    sh publish.sh
    ```

### Step : Deploy the SAM template to create your resources
1. Copy the value for `LayerVersionArn`
1. Open `4_ModelRetraining/lambda_functions/template.yaml`
1. Paste the value you copied in two spots indicated by `**EDIT_ME**`
1. Save the file
1. Run the following command to deploy the SAM template
    ```
    sam deploy --stack-name ModelRetraining \
        --region $(aws configure get region) \
        --s3-bucket $bucket \
        --s3-prefix 'retraining_artifacts' \
        --capabilities CAPABILITY_IAM
    ```
1. You will use the outputs from this stack in the next notebook

### Step 1: Download the linear learner notebook provided in this workshop
1. Open [Amazon SageMaker](https://console.aws.amazon.com/sagemaker)
1. Navigate to **Notebook instances**
1. Find the notebook instance named `WildRydesNotebook-***`
1. Click the **Open Jupyter** link under Actions
1. When redirected to the notebook instance, click **New** (upper right), then select **Terminal** from list.
1. A new tab will open. When in the terminal, run the following command:
    ```
    curl https://raw.githubusercontent.com/jmcwhirter/aws-serverless-workshops/ml-cdk/MachineLearning/4_ModelRetraining/notebooks/linear_learner-workflow.ipynb \
      -o SageMaker/linear_learner-workflow.ipynb && exit
    ```
1. Exit the terminal tab/window
1. Verify you see a file named **linear_learner-workflow.ipynb**

### Step 2: Execute the instructions in the notebook
1. Click on the **linear_learner-workflow.ipynb** file.
1. You'll need the S3 bucket name captured in `scratchpad.txt` within your Cloud9 environment.

### Step 3: Verify you have a model


## Next step:
Once you're done testing the API call to your model, you can [clean up the resources](../99_Cleanup) so you're not charged.

# New ML Ops Retraining Module
* `./lambda_functions` contains lambda code referenced in the notebook lambda steps
* `./notebooks` contains the new Jupyter notebook used to build the step function workflow

# TODOs
* See "TODOs" in the notebook (2-3)
* Convert Lambda SAM app to CDK app
* Instructions & e2e testing
* Labify it
