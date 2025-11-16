import json
import os
from log import LoggerHelper
from dataset import DatasetHelper, Dataset

log = LoggerHelper("store")


class ResponseStore:
    def __init__(self, path="responses.json"):
        self.path = path
        self.data = {}
        if os.path.exists(path):
            with open(path, "r") as f:
                try:
                    self.data = json.load(f)
                except json.JSONDecodeError:
                    self.data = {}
        log.info(f"Loaded {len(self.data)} stored responses from {path}")

    def save(self, dataset: str, case_id: str, target: str, response: dict):
        if "error" in response:  # only save successful responses
            return
        key = f"{dataset}:{case_id}:{target}"
        self.data[key] = response
        with open(self.path, "w") as f:
            json.dump(self.data, f)
        log.info(f"Saved response for {key}")

    def already_done(self, dataset: str, case_id: str, target: str) -> bool:
        key = f"{dataset}:{case_id}:{target}"
        return key in self.data

    def get(self, dataset: str, case_id: str, target: str):
        key = f"{dataset}:{case_id}:{target}"
        return self.data.get(key)

    def load_all(self, dataset: str, target: str) -> list[dict]:
        prefix = f"{dataset}:"
        results = []
        for key, resp in self.data.items():
            if key.startswith(prefix) and key.endswith(f":{target}"):
                results.append(resp)
        return results

    def get_prompt(self, helper: DatasetHelper, dataset: Dataset, case_id: str) -> str:
        if dataset == Dataset.BENIGN:
            row = helper.benign_df.loc[helper.benign_df["id"] == case_id]
            return row["question"].iloc[0] if not row.empty else ""
        elif dataset == Dataset.HARMFUL:
            row = helper.harmful_df.loc[helper.harmful_df["id"] == case_id]
            return row["question"].iloc[0] if not row.empty else ""
        elif dataset == Dataset.JAILBREAK:
            row = helper.jailbreak_df.loc[helper.jailbreak_df["id"] == case_id]
            return row["prompt"].iloc[0] if not row.empty else ""
        else:
            return
