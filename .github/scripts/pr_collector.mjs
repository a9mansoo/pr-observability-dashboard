import { GithubApi } from "./github_client.mjs";
import { runRulesEngine } from "./rules/rules_engine.mjs";
import Ajv from "ajv";
import * as core from '@actions/core';
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_LOCATION = path.join(__dirname, "schemas", "rules.schema.json");

async function collectPrs(githubApi, repository, rules) {
  const prs = await githubApi.listPrs(repository, {
    state: "open",
    per_page: 100,
  });
  let validPrs = []

  for (let pr of prs) {
    let events = await githubApi.listPrEvents(repository, pr);
    let isValid = runRulesEngine(rules, {...pr, prEvents: events});
    if (isValid) validPrs.push(pr);
  }
  return validPrs;
}

function getConfigRules(config, ruleName) {
  const rules = config[ruleName];
  if (!rules)
    throw new Error(
      `[ERROR]: Could not find rule name: ${ruleName} in the configuration`,
    );
  return rules.rules;
}

function validateConfigSchema(configFile) {
  const config = JSON.parse(fs.readFileSync(configFile));
  const schema = JSON.parse(fs.readFileSync(SCHEMA_LOCATION));
  const ajv = new Ajv({ allErrors: true });
  const validator = ajv.compile(schema);
  const isValid = validator(config);

  if (!isValid)
    throw new Error(`[ERROR]: Configuration does not meet schema definition`);
  return config;
}

function writeOutput(outLocation, collectedPrs, repository) {
  const outPrs = collectedPrs.map((pr) => {
    return {
      number: pr.number,
      title: pr.title,
      author: pr.user.login,
      state: pr.state,
      isDraft: pr.draft,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      url: pr.html_url,
    };
  });

  const output = {
    generatedAt: new Date(),
    repository: repository,
    pullRequests: outPrs
  }

  fs.writeFileSync(outLocation, JSON.stringify(output));
}

async function main() {
  const params = {
    ruleName: process.env.RULE_NAME,
    configFile: process.env.CONFIG_FILE,
    apiToken: process.env.GH_TOKEN,
    repository: process.env.REPOSITORY,
    outLocation: path.join(
      process.env.GITHUB_WORKSPACE || process.cwd(),
      `prs_collected-${process.env.RUN_ID || 'local'}.json`,
    ),
  };

  try {
    const githubApi = new GithubApi(params.apiToken);
    const config = validateConfigSchema(params.configFile);
    const rules = getConfigRules(config, params.ruleName);
    const collectedPrs = await collectPrs(githubApi, params.repository, rules);
    writeOutput(params.outLocation, collectedPrs, params.repository);
    core.setOutput("PR_LIST", params.outLocation);
  } catch (err) {
    core.setFailed(`[ERROR]: Failed to process PRs: ${err.message}`);
  }
}

await main();
