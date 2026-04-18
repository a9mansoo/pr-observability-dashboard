import os
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


def main():
    args = get_argparser().parse_args()

    with open(args.input, "r") as f:
        data = json.load(f)

    render_template(
        template_name="PR_DASHBOARD",
        context=data,
        output_path=args.output
    )


if __name__ == "__main__":
    main()