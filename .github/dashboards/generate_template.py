import os
import glob
import sys
from datetime import datetime, timezone
import json
import argparse
from jinja2 import Environment, FileSystemLoader


TEMPLATES_REGISTRY = {
    "PR_DASHBOARD": "prs/pr_dashboard.html"
}

def age_days(created_at):
    created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)

    diff = now - created
    return diff.days


def get_template_from_registry(template_name):
    template_file = TEMPLATES_REGISTRY.get(template_name)
    if not template_file:
        raise ValueError(f"Unknown template: {template_name}")
    return template_file


def render_template(template_name, context, output_path):
    template_file = get_template_from_registry(template_name)

    env = Environment(
        loader=FileSystemLoader(os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")),
        autoescape=True
    )
    env.filters["age_days"] = age_days

    template = env.get_template(template_file)

    rendered_html = template.render(data=context)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(rendered_html)


def get_argparser():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input JSON file")
    parser.add_argument("--output", required=True, help="Output HTML file")
    return parser

def resolve_input_path(input_path):
    if os.path.isfile(input_path):
        return input_path

    files = glob.glob(os.path.join(input_path, "*.json"))

    if not files:
        raise FileNotFoundError(f"No JSON file found in {input_path}")

    if len(files) > 1:
        raise Exception(f"Multiple JSON files found: {files}")

    return files[0]

def load_input_file(input_file_location):
    path = resolve_input_path(input_file_location)
    with open(path, "r") as f:
        data = json.load(f)
    return data

def main():
    try:
        args = get_argparser().parse_args()

        data = load_input_file(args.input)

        render_template(
            template_name="PR_DASHBOARD",
            context=data,
            output_path=args.output
        )
        print(f"Created output file: ${args.output}")
    except Exception as e:
        print(str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()