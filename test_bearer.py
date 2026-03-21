import boto3
import os

token = os.environ.get("AWS_BEARER_TOKEN_BEDROCK", "missing_token")

client = boto3.client('bedrock-runtime', region_name='us-east-1')

def inject_bearer(request, **kwargs):
    request.headers['Authorization'] = f"Bearer {token}"

client.meta.events.register('before-send.bedrock-runtime.*', inject_bearer)

try:
    response = client.converse(
        modelId="mistral.mistral-7b-instruct-v0:2",
        messages=[{"role": "user", "content": [{"text": "hello"}]}],
        inferenceConfig={"maxTokens": 1024, "temperature": 0.7}
    )
    print("Success:", response['output']['message']['content'][0]['text'])
except Exception as e:
    print("Error:", e)
