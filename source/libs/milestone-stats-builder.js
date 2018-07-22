import {h} from 'dom-chef';
import {get, each, flattenDeep, reduce, keyBy, countBy, keys, filter, merge} from 'lodash';
import OptionsSync from 'webext-options-sync';
import {getRandomColor} from './utils';
import {bug, commit, flame} from './icons';

export const milestoneStatsBuilder = async(repo, githubBoard) => {
    const zenhubFormData = `issue_numbers%5B%5D=${keys(githubBoard).join('&issue_numbers%5B%5D=')}`;
    const zenhub = await fetch(`https://api.zenhub.io/v4/repositories/${repo.id}/issues/pipelines-estimates`, {
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
    const labelsMap = countBy(flattenDeep(closedIssues.map(issue => get(issue, 'node.labels.edges', []))), 'node.name');
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
    * @function getLabelsChart
    * @description Gets the total number of labels for a certain label pattern
    */
    const getLabelsChart = (labelsMap, labelFilter) => {
        let stackedBar = [], tooltip = '', colorIndex = -1;
        const total = filter(labelsMap, (count, label) => label.startsWith(labelFilter)).reduce((a, b) => a + b, 0);
        const COLORS_MAP = ['#2cbe4e', '#0366d6', '#800080', '#d93f0b', '#cb2431'];
        
        each(labelsMap, (value, label) => {
            if (label.startsWith(labelFilter)) {
                const style = {
                    width: `${Math.floor(value / total * 100)}%`,
                    background: COLORS_MAP[++colorIndex] || getRandomColor()
                };
                tooltip += `${value} ${label.replace(labelFilter, '').trim()} / `;
                stackedBar.push(<span class="progress d-inline-block" style={style}>&nbsp;</span>);
            }
        });

        return { stackedBar, tooltip };
    }
    
    const totalNumberOfBugs = getLabelsChart(labelsMap, '01: Priority:'); 
    const totalNumberOfTypes = getLabelsChart(labelsMap, '03: Type:');
    const totalNumberOfProductAreas = getLabelsChart(labelsMap, '02: Product Area:');

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
    const milestoneStats =     
    <div class="rgh-milestone-report-container">
        <div class="rgh-metric-column">
            <div class="rgh-metric">
                <span class="rgh-metric__main">{bug()} {totalBugs.length} Bugs</span>
                <span class="rgh-metric__pill rgh-metric__pill-green">{totalBugs.length - closedBugs.length} Open</span>
                <span class="rgh-metric__pill rgh-metric__pill-red">{closedBugs.length} Closed</span>
            </div>
            <div class="rgh-metric">
                <span class="rgh-metric__main">{commit()} {processBreaks.length} Process breaks</span>
                <span class="rgh-metric__pill rgh-metric__pill-green">{processBreaks.length - closedProcessBreaks.length} Open</span>
                <span class="rgh-metric__pill rgh-metric__pill-red">{closedProcessBreaks.length} Closed</span>
            </div>
            <div class="rgh-metric">
                <span class="rgh-metric__main">{flame()} Velocity {Math.floor( closedIssuesEstimate/totalIssuesEstimate *  100 )}%</span>
                <span class="rgh-metric__pill rgh-metric__pill-green">{totalIssuesEstimate} Commited</span>
                <span class="rgh-metric__pill rgh-metric__pill-red">{closedIssuesEstimate} Closed</span>
            </div>
        </div>
        <div class="rgh-metric-column">
            <span class="rgh-metric__chart">
                Closed Bugs
                <div class="tooltipped tooltipped-s" aria-label={totalNumberOfBugs.tooltip.trim().replace(/.$/, '')}>
                    <span class="progress-bar progress-bar-small">
                        {totalNumberOfBugs.stackedBar}
                    </span>
                </div>
            </span>
            <span class="rgh-metric__chart">
                Closed Issues by type
                <div class="tooltipped tooltipped-s" aria-label={totalNumberOfTypes.tooltip.trim().replace(/.$/, '')}>
                    <span class="progress-bar progress-bar-small">
                        {totalNumberOfTypes.stackedBar}
                    </span>
                </div>
            </span>
            <span class="rgh-metric__chart">
                Closed issues by product area
                <div class="tooltipped tooltipped-s" aria-label={totalNumberOfProductAreas.tooltip.trim().replace(/.$/, '')}>
                    <span class="progress-bar progress-bar-small">
                        {totalNumberOfProductAreas.stackedBar}
                    </span>
                </div>
            </span>
        </div>
    </div>;

    const milestoneLeaderboard =         
    <span>
        <span class="rgh-metric__inline">
            <span class="rgh-metric__main-iconless">Leaderboard 🏆</span>
            <div class="rgh-metric__leaderboard AvatarStack AvatarStack--left">
                <div class="AvatarStack-body tooltipped tooltipped-sw tooltipped-multiline tooltipped-align-right-1" aria-label={leaderboard.message}>
                    {leaderboard.board}
                </div>
            </div>
        </span>
        <span class="rgh-metric__inline">
            <span class="rgh-metric__main-iconless">🤔</span>
            <div class="rgh-metric__leaderboard AvatarStack AvatarStack--left">
                <div class="AvatarStack-body tooltipped tooltipped-sw tooltipped-multiline tooltipped-align-right-1" aria-label={shameboard.message}>
                    {shameboard.board}
                </div>
            </div>
        </span>
    </span>;
    
    return {milestoneStats, milestoneLeaderboard};
}