# load necessary libraries
import json
import boto3
from pyathena import connect
import pandas as pd
import numpy as np
import os
from datetime import datetime

def lambda_handler(event_str, context):
    if(type(event_str) is str):
        event = json.loads(event_str)
    else:
        event = event_str
    data_bucket = ""
    print(event)
    data_bucket = event["data_bucket"]
    if(data_bucket == ""):
        raise Exception("data_bucket is not defined.")
    print("working with bucket: " + data_bucket)
    data_setup = data_catalog_setup(data_bucket)
    df_count = pd.read_sql("""
        SELECT '%s' as tablename, COUNT(*) records FROM  %s.%s
        UNION ALL
        SELECT '%s' as tablename, COUNT(*) records FROM  %s.%s
        """ % (data_setup["processed_table"], data_setup["athena_database"], data_setup["processed_table"],
               data_setup["weather_table"], data_setup["athena_database"], data_setup["weather_table"]
              ), data_setup["conn"])
    print("Count of telemetry records")
    print(df_count)
    merged_df = build_merged_df(data_setup, data_bucket)
    path = save_df_to_s3(merged_df, data_bucket)
    return json.dumps({"df_location": path, "data_bucket": data_bucket})
    
def save_df_to_s3(df, data_bucket):
    path = "s3://"+data_bucket+"/merged_dfs/"+datetime.now().strftime("%m-%d-%Y-%H:%M:%S")+"_merged_df.csv"
    df.to_csv(path)
    return path

def build_merged_df(data_prep, data_bucket):
    athena_database = data_prep["athena_database"]
    processed_table = data_prep["processed_table"]
    weather_table = data_prep["weather_table"]
    conn = data_prep["conn"]
    
    # create a Python panda dataframe with our processed ride telemetry data
    df_telemetry = pd.read_sql("SELECT * FROM %s.%s" % (athena_database, processed_table), conn)
    
    # we need to describe the datetime format in order for our telemetry data to use
    # a datatime data type.  Let's update our 'statustime' field to a datetime data type.
    df_telemetry['statustime'] = pd.to_datetime(df_telemetry['statustime'], format='%Y-%m-%d %H:%M:%S.%f')
    
    # let's add a date field that doesn't have time so we can easily join to weather data later
    df_telemetry['year_date'] = pd.to_datetime(df_telemetry['statustime'].dt.strftime('%Y-%m-%d'))
    
    # here's the descriptive summary of the telemetry dataframe
    df_telemetry.describe(include='all')
    print("telemetry df peek:")
    print(df_telemetry.head(3))
    
    # first let's get our interested ground stations ids from our telemetry data
    unique_gs = tuple(df_telemetry.groundstation.unique())
    
    # weather data goes back far in time.  let's only grab data for the years we need
    start_year = pd.to_datetime(df_telemetry.statustime.min()).year
    
    # let's create our query statement
    weather_query = """
    SELECT * FROM %s.%s
    WHERE q_flag = ''
    AND id IN %s
    AND year(date_parse(year_date, '%%Y%%m%%d')) >= %s
    """ % (athena_database, weather_table, unique_gs, start_year)
    
    # now we'll pass the query to Athena to get back our interested weather data.
    # Athena will scan over 2 billion records (90+ GB) in just over 30 seconds.
    df_weather = pd.read_sql(weather_query, conn)
    
    # we want to make sure the 'data_value' field is a numeric column
    df_weather['data_value'] = pd.to_numeric(df_weather['data_value'])
    
    # let's also make sure 'year_date' is a proper date field
    df_weather['year_date'] = pd.to_datetime(df_weather['year_date'])
    
    #
    df_weather.describe(include='all')
    
    # we want some interesting weather facts as features, so let's pivot the data
    df_weather_pivot = pd.DataFrame(df_weather, columns = ['id','year_date','element', 'data_value']) \
        .query('element in ("TMIN", "TMAX", "PRCP")') \
        .pivot_table(index=['id','year_date'], columns='element', values='data_value') \
        .reset_index()
    
    # element definitions from https://docs.opendata.aws/noaa-ghcn-pds/readme.html
    ## PRCP = Precipitation (tenths of mm)
    ## TMAX = Maximum temperature (tenths of degrees C)
    ## TMIN = Minimum temperature (tenths of degrees C)
    # Let's merge our telemetry data with weather so we can include weather elements as model features
    merge_df = pd.merge(df_telemetry, df_weather_pivot
                         , left_on=['groundstation','year_date']
                         , right_on=['id', 'year_date']
                         , how='left'
                        )
    
    print("merged df peek:")
    print(merge_df.head(3))
    return merge_df

def data_catalog_setup(data_bucket):
    # create place to store athena query results
    athena_query_results = ("s3://%s/results/" % data_bucket)
    
    # establish athena connection in the same region as our S3 bucket
    data_bucket_region = "us-east-1" # boto3.client('s3').get_bucket_location(Bucket=data_bucket)['LocationConstraint']
    
    conn = connect(s3_staging_dir=athena_query_results,
                   region_name=data_bucket_region)
    
    # create a serverless database
    athena_database = "wildrydesworkshop"
    
    sql_stmt_create_db = ("CREATE DATABASE IF NOT EXISTS %s" % athena_database)
    
    pd.read_sql(sql_stmt_create_db, conn)
    
    # list all databases to confirm our new database exists
    tmpDf = pd.read_sql(("SHOW DATABASES LIKE '%s'" % athena_database), conn)
    print(tmpDf)
    
    # create an external table based on the process ride telemetry data
    processed_table = "ridetelemetry"
    
    # drop the table if we're rerunning this cell
    pd.read_sql("DROP TABLE IF EXISTS %s.%s" % (athena_database, processed_table),conn)
    
    # create an external table based on the schema output from our data procressing module
    sql_stmt_create_tb = """
    CREATE EXTERNAL TABLE IF NOT EXISTS %s.%s (
     distance double
    ,healthpoints bigint
    ,latitude double
    ,longitude double
    ,magicpoints bigint
    ,name string
    ,statustime string
    ,fieldservice bigint
    ,groundstation string
    )
    ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe'
    WITH SERDEPROPERTIES (
    "field.delim" = ","
    ,"skip.header.line.count" = "1"
    )
    LOCATION 's3://%s/processed/'
    """ % (athena_database, processed_table, data_bucket)
    
    pd.read_sql(sql_stmt_create_tb, conn)
    
    # confirm that our new table exists
    tmpDf = pd.read_sql(("SHOW TABLES IN %s" % athena_database), conn)
    print(tmpDf)
    
    # create an external table based on NOAA's weather files
    weather_table = "weather"
    
    # drop the table if we're rerunning this cell
    pd.read_sql("DROP TABLE IF EXISTS %s.%s" % (athena_database, weather_table),conn)
    
    # create an external table based on the data schema @ https://docs.opendata.aws/noaa-ghcn-pds/readme.html
    # 'year_date' isn't expressed as a typical datetime type, so we'll worry about it later.
    sql_stmt_create_tb = """
    CREATE EXTERNAL TABLE IF NOT EXISTS %s.%s (
     id string
    ,year_date string
    ,element string
    ,data_value double
    ,m_flag string
    ,q_flag string
    ,s_flag string
    ,obs_time string
    )
    ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe'
    WITH SERDEPROPERTIES (
    "field.delim" = ","
    )
    LOCATION 's3://noaa-ghcn-pds/csv/'
    """ % (athena_database, weather_table)
    
    # send the create table query statement to our Athena connection
    pd.read_sql(sql_stmt_create_tb, conn)
    
    # confirm that our new table exists
    tmpDf = pd.read_sql(("SHOW TABLES IN %s" % athena_database), conn)
    print(tmpDf)
    
    return {"processed_table": processed_table, "athena_database": athena_database, "weather_table": weather_table, "conn": conn}