import boto3
import base64

client = boto3.client('bedrock-runtime', region_name='us-east-1')

# Create a small valid jpeg
import io
from PIL import Image

image = Image.new('RGB', (100, 100), color='red')
byte_io = io.BytesIO()
image.save(byte_io, 'JPEG')
img_bytes = byte_io.getvalue()

messages = [
    {
        "role": "user",
        "content": [
            {"text": "What color is this image?"},
            {
                "image": {
                    "format": "jpeg",
                    "source": {"bytes": img_bytes}
                }
            }
        ]
    }
]

print("Calling converse...")
try:
    response = client.converse(
        modelId="us.meta.llama3-2-11b-instruct-v1:0",
        messages=messages,
        system=[{"text": "You are a helpful assistant."}]
    )
    print("Success:")
    print(response['output']['message']['content'][0]['text'])
except Exception as e:
    print("Error:")
    print(e)
