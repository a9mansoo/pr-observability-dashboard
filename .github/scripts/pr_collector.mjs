import { Octokit } from "octokit";

const NOTIFICATION_INTENT_CONFIG = {
    READY_FOR_REVIEW: {
        rules: [
            {type: "labels_presence", includes: ["final_vetting_completed"], excludes: ["wip"]},
            {type: "labels_actor", labels_to_check: ["final_vetting_completed"], actor: "a9mansoo"}
        ],
        satisfies_rules: "all"
    },
}

const RULES_HANDLERS = {
    labels_presence: labelsPresenceChecker,
   // labels_actor: labelActorChecker
}

const SATISFIES_HANDLERS = {
    all: null,
    any: null 
}


function labelsPresenceChecker(pr, includes, excludes){

}

const githubApi = new Octokit({auth: process.env.token})


async function getPrContext(owner, repo, pr){
    // Get PR event data
    // Return regular pr data with events
    const events = await githubApi.paginate(githubApi.rest.issues.listEvents, {owner: owner, repo: repo, issue_number: pr.number})
    return {
        ...pr,
        events
    }
}

async function getPrs(repository){
    const [owner, repo] = repository.split("/")
const prData = await githubApi.paginate(
    githubApi.rest.pulls.list,
  {
    owner,
    repo,
    per_page: 100,
    state: "open",
    sort: "updated",
  }
)
for (const pr of prData){
    let prContext = await getPrContext(owner, repo, pr);
    console.log(prContext);

}
}

getPrs("a9mansoo/React-Components-Practice");
