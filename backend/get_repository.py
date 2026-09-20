import json
import os
from decimal import Decimal
from urllib.parse import unquote

import boto3
from botocore.exceptions import ClientError


s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

S3_BUCKET = os.environ["S3_BUCKET"]
DDB_TABLE = os.environ["DDB_TABLE"]


def _json_default(value):
    if isinstance(value, Decimal):
        # DynamoDB returns numbers as Decimal; counts/scores are always
        # whole numbers here, so int() is safe and gives clean JSON.
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.environ.get(
                "ALLOWED_ORIGIN", "*"
            ),
            "Access-Control-Allow-Headers": "content-type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body, ensure_ascii=False, default=_json_default),
    }


def get_metadata(repository_id):
    table = dynamodb.Table(DDB_TABLE)
    result = table.get_item(
        Key={"repositoryId": repository_id}
    )
    return result.get("Item")


def get_json_from_s3(key):
    result = s3.get_object(
        Bucket=S3_BUCKET,
        Key=key,
    )
    return json.loads(
        result["Body"].read().decode("utf-8")
    )


def get_file_from_s3(key):
    result = s3.get_object(
        Bucket=S3_BUCKET,
        Key=key,
    )
    return result["Body"].read().decode(
        "utf-8",
        errors="replace",
    )


def safe_file_path(path):
    if not path:
        return False

    decoded = unquote(path)

    if decoded.startswith("/"):
        return False

    parts = decoded.split("/")

    if ".." in parts:
        return False

    return True


def lambda_handler(event, context):
    method = (
        event.get("requestContext", {})
        .get("http", {})
        .get("method")
    )

    if method == "OPTIONS":
        return response(200, {"ok": True})

    try:
        path_params = event.get("pathParameters") or {}
        repository_id = path_params.get("repositoryId")

        if not repository_id:
            return response(400, {"message": "repositoryId is required."})

        metadata = get_metadata(repository_id)

        if not metadata:
            return response(404, {"message": "Repository analysis not found."})

        query_params = event.get("queryStringParameters") or {}
        requested_file = query_params.get("path")

        if requested_file:
            requested_file = unquote(requested_file)

            if not safe_file_path(requested_file):
                return response(400, {"message": "Invalid file path."})

            index = get_json_from_s3(metadata["s3IndexKey"])
            matching = None

            for file_record in index.get("files", []):
                if file_record.get("path") == requested_file:
                    matching = file_record
                    break

            if not matching:
                return response(
                    404,
                    {"message": "File was not found in this repository."},
                )

            content = get_file_from_s3(matching["s3Key"])

            return response(
                200,
                {
                    "repositoryId": repository_id,
                    "path": requested_file,
                    "language": matching.get("language", "text"),
                    "content": content,
                },
            )

        index = get_json_from_s3(metadata["s3IndexKey"])

        return response(
            200,
            {
                "repositoryId": repository_id,
                "name": metadata.get("name"),
                "url": metadata.get("repositoryUrl"),
                "defaultBranch": metadata.get("defaultBranch"),
                "status": metadata.get("status"),
                "fileCount": metadata.get("fileCount", 0),
                "filesAnalyzed": metadata.get("filesAnalyzed", 0),
                "files": index.get("files", []),
                "graph": index.get(
                    "graph",
                    {"nodes": [], "edges": []},
                ),
                "description": index.get("description"),
                "generatedAt": index.get("generatedAt"),
            },
        )

    except ClientError as exc:
        print("AWS error:", repr(exc))
        return response(500, {"message": "AWS service error."})

    except Exception as exc:
        print("Get repository error:", repr(exc))
        return response(500, {"message": "Could not load repository."})