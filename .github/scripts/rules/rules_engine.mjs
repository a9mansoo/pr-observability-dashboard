import { getRule } from "./rules_handler.mjs";

function checkRules(rules, pr) {
  let rulesResults = [];
  for (let rule of rules) {
    try {
      const {type, ...params} = rule;
      const ruleFunc = getRule(type);
      console.log(`[INFO]: Processing PR#: ${pr.number} with rule type: ${type} and parameters: ${params}`)
      let ruleResult = ruleFunc(pr, params);
      rulesResults.push(ruleResult);
    } catch (err) {
      console.log(`[ERROR]: Could not process pr`);
    }
  }

  if (rulesResults.every((ruleResult) => ruleResult === true)) return true;

  return false;
}

function runRulesEngine(rules, pr) {
  let isValid = checkRules(rules, pr);
  return isValid;
}

export { runRulesEngine };
