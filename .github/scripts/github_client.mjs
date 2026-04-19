import { Octokit } from "octokit";

class GithubApi {
  constructor(githubApiToken) {
    if (!githubApiToken) throw new Error("Cannot initial githubAPi");

    this.ocktokit = new Octokit({ auth: githubApiToken });
  }

  async listPrs(repository, query) {
    let [owner,
      repo] = repository.split("/");
    if (!owner || !repo) throw new Error("Could not retrive repository");
    const response = await this.ocktokit.paginate(this.ocktokit.rest.pulls.list, {
      owner,
      repo,
      ...query,
    });
    return response;
  }

  async listPrEvents(repository, pr) {
    let [owner,
      repo] = repository.split("/");
    if (!owner || !repo) throw new Error("Could not retrive repository");
    const response = this.ocktokit.paginate(
      this.ocktokit.rest.issues.listEvents,
      { owner: owner, repo: repo, issue_number: pr.number },
    );
    return response;
  }
}

export { GithubApi };
