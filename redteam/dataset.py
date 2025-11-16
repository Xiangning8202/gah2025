import pandas as pd
from typing import List, Optional, Tuple
import os
from log import LoggerHelper
from enum import Enum

log = LoggerHelper("dataset")


class Dataset(Enum):
    BENIGN = "benign"
    HARMFUL = "harmful"
    JAILBREAK = "jailbreak"


class DatasetHelper:
    def __init__(
        self,
        holistic_repo_path: Optional[str] = None,
    ):
        # default repo path
        if holistic_repo_path is None:
            holistic_repo_path = os.path.expanduser(
                "~/Dev/Random/great-agent-hack-25/hackathon-2025"
            )  # on ooj's machine

        datasets_path = os.path.join(
            holistic_repo_path,
            "track_c_dear_grandma",
            "examples",
            "red_teaming_datasets",
        )

        benign_path = os.path.join(datasets_path, "benign_test_cases.csv")
        harmful_path = os.path.join(datasets_path, "harmful_test_cases.csv")
        jailbreak_path = os.path.join(datasets_path, "jailbreak_prompts.csv")

        log.info(f"Loading datasets from {datasets_path}")
        self.benign_df = pd.read_csv(benign_path)
        self.harmful_df = pd.read_csv(harmful_path)
        self.jailbreak_df = pd.read_csv(jailbreak_path)
        log.info(
            f"Loaded {len(self.benign_df)} benign, {len(self.harmful_df)} harmful, {len(self.jailbreak_df)} jailbreak cases"
        )

    def benign_questions(self) -> List[str]:
        return self.benign_df["question"].tolist()

    def harmful_questions(self) -> List[str]:
        return self.harmful_df["question"].tolist()

    def jailbreak_prompts(self) -> List[str]:
        return self.jailbreak_df["prompt"].tolist()


def get_dataset(helper: DatasetHelper, dataset: Dataset) -> Tuple[List[str], List[str]]:
    if dataset == Dataset.BENIGN:
        return helper.benign_df["id"].tolist(), helper.benign_questions()
    elif dataset == Dataset.HARMFUL:
        return helper.harmful_df["id"].tolist(), helper.harmful_questions()
    elif dataset == Dataset.JAILBREAK:
        return helper.jailbreak_df["id"].tolist(), helper.jailbreak_prompts()
    else:
        raise ValueError(f"Unknown dataset {dataset}")
