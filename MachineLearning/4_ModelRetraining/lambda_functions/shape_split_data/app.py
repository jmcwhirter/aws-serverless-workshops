# load necessary libraries
import json
import boto3
from pyathena import connect
import pandas as pd
import numpy as np
import os
import sagemaker.amazon.common as smac
import io
from datetime import datetime

def lambda_handler(event_str, context):
    event = json.loads(event_str["Payload"])
    print(event)
    data_bucket = ""
    df_location = ""
    df_location = event["df_location"]
    data_bucket = event["data_bucket"]
    if(data_bucket == ""):
        raise Exception("data_bucket is not defined.")
    if(df_location == ""):
        raise Exception("df_location is not defined.")
        
    merge_df = load_df_from_s3(df_location)
    processed_subdir = "standardized"
    folder = "/home/ec2-user/SageMaker/"
    train_features_file = os.path.join(folder, processed_subdir, "train/csv/features.csv")
    train_labels_file = os.path.join(folder, processed_subdir, "train/csv/labels.csv")
    test_features_file = os.path.join(folder, processed_subdir, "test/csv/features.csv")
    test_labels_file = os.path.join(folder, processed_subdir, "test/csv/labels.csv")
    
    raw = merge_df[['distance','healthpoints','magicpoints','TMIN','TMAX','PRCP','fieldservice']].to_numpy(dtype=np.float32)
    
    # split into train/test with a 90/10 split
    np.random.seed(0)
    np.random.shuffle(raw)
    train_size = int(0.9 * raw.shape[0])
    train_features = raw[:train_size, :-1]
    train_labels = raw[:train_size, -1]
    test_features = raw[train_size:, :-1]
    test_labels = raw[train_size:, -1]
    
    print('train_features shape = ', train_features.shape)
    print('train_labels shape = ', train_labels.shape)
    print('test_features shape = ', test_features.shape)
    print('test_labels shape = ', test_labels.shape)
    print('train_features.shape[1]', train_features.shape[1])
    print('train_features.shape[0]', train_features.shape[0])

    train_prefix = 'train'
    key = 'recordio-pb-data'
    
    buf = io.BytesIO()
    smac.write_numpy_to_dense_tensor(buf, train_features, train_labels)
    buf.seek(0)
    
    boto3.resource('s3').Bucket(data_bucket).Object(os.path.join(train_prefix, key)).upload_fileobj(buf)
    s3_train_data = 's3://{}/{}/{}'.format(data_bucket, train_prefix, key)
    train_loc = 'uploaded training data location: {}'.format(s3_train_data)
    print(train_loc)
    return json.dumps({"df_location": df_location, "data_bucket": data_bucket, "training_location": train_loc})

def load_df_from_s3(loc):
    return pd.read_csv(loc)