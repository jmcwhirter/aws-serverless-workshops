# load necessary libraries
import json
import boto3
import os

s3 = boto3.resource('s3')
model_deploy_path = os.environ['MODEL_DEPLOY_PATH']

def lambda_handler(event_str, context):
    if(type(event_str) is str):
        event = json.loads(event_str)
    else:
        event = event_str

    data_bucket = ""
    model_location = ""
    data_bucket = event["data_bucket"]
    model_location = event["model_location"]

    if(data_bucket == ""):
        raise Exception("data_bucket is not defined.")
    if(model_location == ""):
        raise Exception("model_location is not defined.")

    print("working with bucket: " + data_bucket)
    print("model location: " + model_location)

    trained_model = '{}/{}'.format(model_location, 'output/model.tar.gz')
    
    copy_source = {
        'Bucket': data_bucket,
        'Key': trained_model
     }

    # copy the trained model to the "deploy" location for lambda to pick up
    s3.meta.client.copy(copy_source, data_bucket, model_deploy_path)

    result = 'copied model data file to deployment location: s3://{}/{}'.format(data_bucket, model_deploy_path)
    print(result)
    return json.dumps({"data_bucket": data_bucket, "trained_model": trained_model, "result": result})