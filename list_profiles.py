import boto3

def list_profiles():
    try:
        client = boto3.client('bedrock')
        response = client.list_inference_profiles()
        for p in response.get('inferenceProfileSummaries', []):
            if 'llama' in p['inferenceProfileId'].lower() or 'maverick' in p['inferenceProfileId'].lower():
                print(p['inferenceProfileId'])
    except Exception as e:
        print("Error:", e)

list_profiles()
