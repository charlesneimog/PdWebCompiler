#!/usr/bin/env python3
import os
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--destfolder", default="docs", help="Destination forlder for documentation")
    args = parser.parse_args()
    assert os.path.exists(args.destfolder)
