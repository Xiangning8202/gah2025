from dataset import DatasetHelper
from target import Target
from attack import run_dataset, run_dataset_p
from store import Dataset


def main():
    dataset = DatasetHelper()
    harmful_asr = run_dataset_p(
        dataset, Dataset.JAILBREAK, Target.BEAR, expected_refusal=True
    )

    print(harmful_asr)


if __name__ == "__main__":
    main()
