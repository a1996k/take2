import argparse
import openai

# Define the keys list
keys = []

def is_api_key_valid(key):
    try:
        openai.api_key = key
        response = openai.completions.create(
            model="gpt-3.5-turbo",
            prompt="This is a test prompt.",
            # messages=[
            #     {"role": "system", "content": "You are a helpful assistant."},
            #     {"role": "user", "content": "This is a test."}
            # ]
        )
        return True
    except Exception as ex:
        return str(ex)

def check_api_keys(keys):
    d_keys = {}
    for k in keys:
        validity = is_api_key_valid(k)
        d_keys[k] = validity
    return d_keys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--keys",  # Name on the CLI - lose the `--` for positional/required parameters.
        nargs="*",  # Expects 0 or more values and creates a list.
        type=str,
        default=[],
    )

    args = parser.parse_args()

    if args.keys:
        keys_to_check = args.keys
    else:
        keys_to_check = keys

    d_keys = check_api_keys(keys_to_check)

    for k, v in d_keys.items():
        print(f"API key '{k}' validity:  {v}")

if __name__ == "__main__":
    main()
