import {h} from 'dom-chef';
import select from 'select-dom';
<<<<<<< HEAD
import {get, flattenDeep, reverse, sortBy, reduce, forEach, set, keyBy, countBy, keys, filter, merge} from 'lodash';
import OptionsSync from 'webext-options-sync';
import graph from '../libs/graph';
import {getOwnerAndRepo} from '../libs/page-detect';
import {chart, bug, commit, flame, threebars} from '../libs/icons';

export default async () => {

    const {ownerName, repoName} = getOwnerAndRepo();
    const milestoneNumber = location.href.split('?')[0].split('/').pop();
    const query = `{
		repository(owner: ${ownerName} , name: ${repoName}) {
			milestone(number: ${milestoneNumber}) {
                issues(first: 100) {
                    edges {
                        node {
                          id,
                          number,
                          state,
                          assignees(first: 100) {
                            edges {
                              node {
                                id,
                                avatarUrl,
                                url
                              }
                            }
                          }
                          labels(first: 100) {
                            edges {
                              node {
                                id,
                                name
                              }
                            }
                          }
                        }
                    }
                }
			}
		}
	}`;

    const githubBoard = keyBy(get(await graph(query), 'repository.milestone.issues.edges'), 'node.number');
    const {zenhubToken} = await new OptionsSync().getAll();
    const zenhubFormData = `issue_numbers%5B%5D=${keys(githubBoard).join('&issue_numbers%5B%5D=')}`;
    const zenhub = await fetch('https://api.zenhub.io/v4/repositories/98879603/issues/pipelines-estimates', {
        method: 'POST',
        headers: {
            'x-authentication-token': '68d58e034dc7bc62576008c95cdd1c9142030b46a6398aa2a56177f2c8e392596309b052c615f38e',
            'User-Agent': 'Refined Github',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: zenhubFormData
    });
    const zenhubBoardEstimates = keyBy(await zenhub.json(), 'number');
    const milestoneInformation = merge(githubBoard, zenhubBoardEstimates);
    // After making sure we have all the data merged from github and zenhub, calculate all the metrics !
    const closedIssues = filter(milestoneInformation, issue =>  issue.node.state === 'CLOSED');
    const openIssues = filter(milestoneInformation, issue =>  issue.node.state === 'OPEN');
    const totalBugs = filter(milestoneInformation, issue => {
        return issue.node.labels.edges.filter(label => {
            return label.node.name === '03: Type: Bug';
        }).length
    });
    const closedBugs = totalBugs.filter(issue => {
        return issue.node.state === 'CLOSED';
    });
    const processBreaks = filter(milestoneInformation, issue => {
        return issue.node.labels.edges.filter(label => {
            return label.node.name.startsWith('06: Process:');
        }).length
    });
    const closedProcessBreaks =  processBreaks.filter(issue => {
        return issue.node.state === 'CLOSED';
    });
    const totalIssuesEstimate = reduce(milestoneInformation, (accumulator, currentValue) => {
        return accumulator + (currentValue.estimate || 0 )
    }, 0);
    const closedIssuesEstimate = closedIssues.reduce((accumulator, currentValue) => {
        return accumulator + (currentValue.estimate || 0 )
    }, 0);

    /*
    * @function buildLeaderboard
    * @description creates a leaderboard object by parsing a list of issues
    * @returns Object {leaderboardResult, leaderboardMessage}
    *   leaderboardResult Array of HTML DOM objects
    *   leaderboardMessage String of the sorted leaders
    */
    const buildLeaderboard = issues => {
        const assignees = flattenDeep(issues.map(issue => issue.node.assignees.edges));
        const assigneesAvatarMap = countBy(assignees, 'node.avatarUrl');
        const assigneesUrlMap = countBy(assignees, 'node.url');
        const leaderboard = Object.keys(assigneesAvatarMap).sort(function(a,b){
            return assigneesAvatarMap[b] - assigneesAvatarMap[a]
        });
        let leaderboardResult = [];
        for (const leader of leaderboard) {
            leaderboardResult.push(<a class="avatar"><img class="from-avatar" src={leader} width="20" height="20"/></a>);
        };
        const leaderboardMessage = Object.keys(assigneesUrlMap).sort(function(a,b){
            return assigneesUrlMap[b] - assigneesUrlMap[a]
        }).map(url => url.replace("https://github.com/", '')).join(', ');
        return {board: leaderboardResult, message: leaderboardMessage}
    }

    const leaderboard = buildLeaderboard(closedIssues);
    const shameboard = buildLeaderboard(openIssues);
    
    const issuesTable = select('.repository-content .mb-3 .three-fourths');
    issuesTable.parentNode.insertBefore(
    <div class="rgh-milestone-report-container">
        <div class="rgh-metric-row">
            <div class="rgh-metric">
                <span class="rgh-main-metric">{bug()} {totalBugs.length} Bugs</span>
                <span class="rgh-metric-pill green-pill">{totalBugs.length - closedBugs.length} Open</span>
                <span class="rgh-metric-pill red-pill">{closedBugs.length} Closed</span>
            </div>
            <div class="rgh-metric">
                <span class="rgh-main-metric">{commit()} {processBreaks.length} Process breaks</span>
                <span class="rgh-metric-pill green-pill">{processBreaks.length - closedProcessBreaks.length} Open</span>
                <span class="rgh-metric-pill red-pill">{closedProcessBreaks.length} Closed</span>
            </div>
            <div class="rgh-metric">
                <span class="rgh-main-metric">Velocity {Math.floor( closedIssuesEstimate/totalIssuesEstimate *  100 )}%</span>
                <span class="rgh-metric-pill green-pill">{totalIssuesEstimate} Commited</span>
                <span class="rgh-metric-pill red-pill">{closedIssuesEstimate} Closed</span>
            </div>
        </div>
    </div>, issuesTable);
    

    select('.repository-content .three-fourths').append(
        <span>
            <span class="rgh-inline-metric">
                <span class="rgh-main-metric iconless">Leaderboard 🏆</span>
                <div class="rgh-metric-leaderboard AvatarStack AvatarStack--left">
                    <div class="AvatarStack-body tooltipped tooltipped-sw tooltipped-multiline tooltipped-align-right-1" aria-label={leaderboard.message}>
                        {leaderboard.board}
                    </div>
                </div>
            </span>
            <span class="rgh-inline-metric">
                <span class="rgh-main-metric iconless">🤔</span>
                <div class="rgh-metric-leaderboard AvatarStack AvatarStack--left">
                    <div class="AvatarStack-body tooltipped tooltipped-sw tooltipped-multiline tooltipped-align-right-1" aria-label={shameboard.message}>
                        {shameboard.board}
                    </div>
                </div>
            </span>
        </span>
    );
};
