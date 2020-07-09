# Set up your development environment

**Time to complete:** 5-10 minutes.

## What are we building?

We are going to use [AWS Cloud9](https://aws.amazon.com/cloud9/) as our cloud-based integrated development environment. It will get you bootstrapped with the right tools and access on Day 1.

_If you already have a Cloud9 environment, feel free to use that._

### Step 1: Create a Cloud9 environment

<details>
<summary><strong>Expand if you want detailed directions</strong></summary><p>

Create your Cloud9 instance by following these steps:

1. Navigate to AWS Cloud9 [in the console](https://console.aws.amazon.com/cloud9)
1. Click **Create environment**
1. Provide a name: **WildRydes**
1. Click **Next step**
1. Leave all defaults
1. Click **Next step**
1. Click **Create environment**

</p></details>

### Step 2: Wait for your environment to be ready

Your AWS Cloud9 environment is being created and your screen will look like this:

![new_tab](assets/cloud9_wait.png)

After a minute or so, your environment will be ready and you can continue.

### Step 3: Validate your environment has credentials

1. Find the "Welcome" tab and click the plus icon next to it
1. Select **New Terminal**
1. Run a command to get the caller identity: `aws sts get-caller-identity`
    * *This command will let you know who you are (account number, user ID, ARN)*

*Hint: New editors and terminals can be created by clicking the green "+" icon in a circle*

![new_tab](assets/new_tab.png)

### Step 4: Clone this repository

Let's get our code and start working. Inside the terminal:

1. Run the following command to get our code:
    ```
    git clone https://github.com/aws-samples/aws-serverless-workshops/
    ```
1. Navigate to our workshop:
    ```
    cd aws-serverless-workshops/MachineLearning/
    ```

At this point we have built our cloud based development environment, verified it is configured with the right credentials, and copied down some source code from a code repository.

Wild Rydes is in the middle of a digital transformation. This means they have mandated that cloud resources be provisioned using infrastructure as code. Over the summer, two interns wrote the necessary code but they didn't talk. One intern used [AWS CloudFormation](https://aws.amazon.com/cloudformation/) because this is what he used last year as an intern at Octan. The other intern read about [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk/) on [r/DevOps](https://www.reddit.com/r/devops/) and decided to go that route. She read that AWS CDK is a software development framework for defining cloud infrastructure in code and provisioning it through AWS CloudFormation. As a programmer, she knew any problem could be solved with another layer of abstraction.

*Check out this [workshop](https://cdkworkshop.com/) specifically on AWS CDK, if you're interested in learning more.*

It's time to decide which intern you want to follow. When deploying your infrastructure as code, you'll have the choice between AWS CloudFormation or AWS CDK. While you shouldn't run into any issues, please don't mix.

### AWS CloudFormation

No additional setup required. Giddy up!

### AWS Cloud Development Kit (AWS CDK)

If you're going to use AWS CDK, there are a few additional set up steps.

<details>
<summary><strong>Expand for instructions</strong></summary><p>

1. AWS CDK uses Node.js as a runtime. AWS Cloud9 comes with a version of CDK pre-installed. Run the following command to update to the latest version, globally:
    ```
    npm install -g aws-cdk@latest --force
    ```
1. Since the intern realized AWS is using TypeScript for their development, she decided to follow suit. Run the following command to install TypeScript, globally:
    ```
    npm install typescript
    ```
1. Run the following command to install CDK dependencies:
    ```
    npm install path jest @types/jest @aws-cdk/assert @aws-cdk/core @aws-cdk/aws-s3 @aws-cdk/assert @aws-cdk/aws-lambda-event-sources @aws-cdk/aws-sqs @aws-cdk/aws-cloudwatch @aws-cdk/aws-apigateway @aws-cdk/aws-sagemaker @aws-cdk/aws-iam
    npm update
    ```

</p></details>

## Next step:

We're ready to proceed with building the [data processing pipeline](../1_DataProcessing).
