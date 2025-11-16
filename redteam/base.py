from enum import Enum
import requests

BASE_URL = "https://6ofr2p56t1.execute-api.us-east-1.amazonaws.com/prod"


class Target(Enum):
    ELEPHANT = "/api/elephant"
    FOX = "/api/fox"
    EAGLE = "/api/eagle"
    ANT = "/api/ant"
    WOLF = "/api/wolf"
    BEAR = "/api/bear"
    CHAMELEON = "/api/chameleon"


def message_target(target: Target) -> str:
    return requests.get(BASE_URL + target.value)
