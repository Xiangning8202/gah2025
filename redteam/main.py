from dataset import DatasetHelper
from attack import run_benign
from target import Target


def main():
    dataset = DatasetHelper()
    benign_asr = run_benign(dataset, Target.ELEPHANT)
    print(f"Benign ASR: {benign_asr}")


if __name__ == "__main__":
    main()
