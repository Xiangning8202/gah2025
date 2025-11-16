from concurrent.futures import ThreadPoolExecutor, as_completed
from target import Target, retry_message_target, calculate_asr
from refusal import is_refusal
from dataset import DatasetHelper, get_dataset
from typing import List
from log import LoggerHelper
from store import ResponseStore, Dataset
import re

log = LoggerHelper("attack")
store = ResponseStore()
MAX_WORKERS = 3


def run_attack_set(
    dataset: Dataset,
    target: Target,
    ids: List[str],
    messages: List[str],
) -> None:
    log.info(
        f"Running sequential attack set on {target.name} ({dataset.value}) with {len(messages)} messages"
    )

    for case_id, msg in zip(ids, messages):
        if store.already_done(dataset.value, case_id, target.name):
            log.info(f"Skipping {dataset.value}:{case_id} (already done)")
            continue

        resp = retry_message_target(target, msg)
        if "error" not in resp:
            store.save(dataset.value, case_id, target.name, resp)


def run_attack_set_p(
    dataset: Dataset,
    target: Target,
    ids: List[str],
    messages: List[str],
    max_workers: int = MAX_WORKERS,
) -> None:
    log.info(
        f"Running parallel attack set on {target.name} ({dataset.value}) with {len(messages)} messages"
    )

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for case_id, msg in zip(ids, messages):
            if store.already_done(dataset.value, case_id, target.name):
                log.info(f"Skipping {dataset.value}:{case_id} (already done)")
                continue
            futures[executor.submit(retry_message_target, target, msg)] = case_id

        for f in as_completed(futures):
            case_id = futures[f]
            resp = f.result()
            if "error" not in resp:
                store.save(dataset.value, case_id, target.name, resp)


def compute_asr(
    responses: List[dict], expected_refusal: bool, dataset: Dataset, target: Target
) -> float:
    asr = calculate_asr(responses, expected_refusal)
    log.info(f"ASR for {dataset.value} on {target.name}: {asr:.3f}")
    return asr


def compute_asr_store(
    dataset: Dataset,
    target: Target,
    expected_refusal: bool,
) -> float:
    responses = store.load_all(dataset.value, target.name)
    if not responses:
        log.warning(f"No responses found for {dataset.value} on {target.name}")
        return 0.0
    asr = calculate_asr(responses, expected_refusal)
    log.info(f"ASR for {dataset.value} on {target.name}: {asr:.3f}")
    return asr


def sanitize_for_log(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"[\r\n\t]+", " ", text)
    # Collapse multiple spaces
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = "".join(ch for ch in cleaned if ch.isprintable())
    return cleaned.strip()


def compute_asr_detailed(
    helper: DatasetHelper,
    dataset: Dataset,
    target: Target,
    responses: list[dict],
    ids: list[str],
    expected_refusal: bool,
) -> float:
    asr = calculate_asr(responses, expected_refusal)
    log.info(f"ASR for {dataset.value} on {target.name}: {asr:.3f}")

    for case_id, resp in zip(ids, responses):
        if not is_refusal(resp):
            prompt = sanitize_for_log(store.get_prompt(helper, dataset, case_id))
            text = sanitize_for_log(resp.get("response", ""))
            log.info(f"[SUCCESS] {dataset.value}:{case_id}:{target.name}")
            log.info(f"  Prompt: {prompt[:50]}...")
            log.info(f"  Response: {text[:50]}...")

    return asr


def run_dataset(
    helper: DatasetHelper,
    dataset: Dataset,
    target: Target,
    expected_refusal: bool,
) -> float:
    ids, msgs = get_dataset(helper, dataset)
    run_attack_set(dataset, target, ids, msgs)
    responses = store.load_all(dataset.value, target.name)
    return compute_asr_detailed(
        helper, dataset, target, responses, ids, expected_refusal
    )


def run_dataset_p(
    helper: DatasetHelper,
    dataset: Dataset,
    target: Target,
    expected_refusal: bool,
    max_workers: int = MAX_WORKERS,
) -> float:
    ids, msgs = get_dataset(helper, dataset)
    run_attack_set_p(dataset, target, ids, msgs, max_workers)
    responses = store.load_all(dataset.value, target.name)
    return compute_asr_detailed(
        helper, dataset, target, responses, ids, expected_refusal
    )
