from target import Target, message_target, calculate_asr
from dataset import DatasetHelper
from typing import List
from log import LoggerHelper

log = LoggerHelper("attack")


def run_attack_set(
    target: Target, messages: List[str], expected_refusal: bool
) -> float:
    log.info(f"Running attack set on {target.name} with {len(messages)} messages")
    responses = [message_target(target, m) for m in messages]
    asr = calculate_asr(responses, expected_refusal)
    log.info(f"ASR for {target.name}: {asr:.3f}")
    return asr


def run_benign(helper: DatasetHelper, target: Target) -> float:
    return run_attack_set(target, helper.benign_questions(), expected_refusal=False)


def run_harmful(helper: DatasetHelper, target: Target) -> float:
    return run_attack_set(target, helper.harmful_questions(), expected_refusal=True)


def run_jailbreak(helper: DatasetHelper, target: Target) -> float:
    return run_attack_set(target, helper.jailbreak_prompts(), expected_refusal=True)
