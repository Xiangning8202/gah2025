from enum import Enum
import requests
from typing import Dict

BASE_URL = "https://6ofr2p56t1.execute-api.us-east-1.amazonaws.com/prod"


class Target(Enum):
    ELEPHANT = "/api/elephant"
    FOX = "/api/fox"
    EAGLE = "/api/eagle"
    ANT = "/api/ant"
    WOLF = "/api/wolf"
    BEAR = "/api/bear"
    CHAMELEON = "/api/chameleon"


def message_target(target: Target, msg: str) -> Dict:
    url = BASE_URL + target.value
    payload = {"message": msg}
    response = requests.post(url, json=payload, timeout=35)
    result = response.json()
    print(f"Status: {response.status_code}")
    print(f"Response: {result.get('response', 'No response field')}")
    return result
