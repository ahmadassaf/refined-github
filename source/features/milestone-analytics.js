import {h} from 'dom-chef';
import select from 'select-dom';
import {get, keyBy} from 'lodash';
import graph from '../libs/graph';
import api from '../libs/api';
import {getOwnerAndRepo} from '../libs/page-detect';
import {milestoneStatsBuilder} from '../libs/milestone-stats-builder';
import {threebars} from '../libs/icons';

export default async () => {

    const {ownerName, repoName} = getOwnerAndRepo();
    const repoInformation = await api(`repos/${ownerName}/${repoName}`); 
    const milestoneNumber = location.href.split('?')[0].split('/').pop();
    const query = `{ repository(owner: ${ownerName} , name: ${repoName}) { milestone(number: ${milestoneNumber}) { issues(first: 100) { edges { node { id, number, state, closedAt, createdAt, assignees(first: 100) { edges { node { id, avatarUrl, url }}} labels(first: 100) { edges { node { id, name }}}}}}}}}`;

    // Remove the Zenhub board link and add the custom icon next to the milestone title
    if (select('.zh-milestone-link a')) {
        const milestoneZenhubBoardLink = select('.zh-milestone-link');
        const boardLink = select('a', milestoneZenhubBoardLink).href;
        select('.TableObject-item--primary h2').append(
            <a aria-label="See this milestone on the board" alt="See this milestone on the board" class="rgh-zenhub-board-link" href={boardLink}>{threebars()}</a>
        );
        milestoneZenhubBoardLink.parentNode.removeChild(milestoneZenhubBoardLink);
    }

	const graphQLResponse = await graph(query);
	const githubBoard = keyBy(get(graphQLResponse, 'repository.milestone.issues.edges'), 'node.number');
	const {milestoneStats, milestoneLeaderboard, milestoneShameboard} = await milestoneStatsBuilder(repoInformation, githubBoard);
    const leaderboardContainer = select('.repository-content .three-fourths');
    const issuesTable = select('.repository-content .mb-3 .three-fourths');
    
    issuesTable.parentNode.insertBefore(milestoneStats, issuesTable);
    // Based on the availability of leaderboard or shameboard data ..
    (milestoneLeaderboard || milestoneShameboard) && leaderboardContainer.append(<span class="rgh-leaderboard">Leaderboard</span>)
    milestoneLeaderboard && leaderboardContainer.append(milestoneLeaderboard);
    milestoneShameboard && leaderboardContainer.append(milestoneShameboard);
};
