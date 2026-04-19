const RULES_HANDLERS = {
  labels_presence: labelsPresenceChecker,
  labels_actor: labelActorChecker,
};

function labelsPresenceChecker(pr, rulesParams) {
  const prLabels = pr?.labels.map((l) => l.name.toLowerCase()) || [];
  const includesOk = rulesParams.includes.every((label) =>
    prLabels.includes(label.toLowerCase()),
  );
  const excludesOk = rulesParams.excludes.every(
    (label) => !prLabels.includes(label.toLowerCase()),
  );
  return includesOk && excludesOk;
}

function labelActorChecker(pr, rulesParams) {
    const labelToCheck = rulesParams.labels_to_check.map((label) => label.toLowerCase())
  return pr.prEvents?.some(event =>
        event.event === "labeled" &&
        labelToCheck.includes(event.label.name.toLowerCase()) &&
        event?.actor.login === rulesParams.actor
    ) || false;
}

function getRule(rule) {
  const ruleFunc = RULES_HANDLERS[rule];
  if (!ruleFunc) throw new Error(`Undefined rule passed in: ${rule.name}`);
  return ruleFunc;
}

export { getRule };
