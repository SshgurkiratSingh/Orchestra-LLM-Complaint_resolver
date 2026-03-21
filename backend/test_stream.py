import asyncio
from langchain_aws import ChatBedrock

async def test():
    # just check if ChatBedrock streams locally if we have dummy
    print("Testing")

if __name__ == "__main__":
    asyncio.run(test())
