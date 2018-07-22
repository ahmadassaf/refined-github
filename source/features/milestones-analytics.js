import {h} from 'dom-chef';
import select from 'select-dom';
import {get, each, keyBy} from 'lodash';
import graph from '../libs/graph';
import api from '../libs/api';
import {getOwnerAndRepo} from '../libs/page-detect';
import {milestoneStatsBuilder} from '../libs/milestone-stats-builder';

export default async () => {

		// const {ownerName, repoName} = getOwnerAndRepo();
		// const repoInformation = await api(`repos/${ownerName}/${repoName}`); 
		// const state = location.href.includes('state=closed') ? 'CLOSED' : 'OPEN';
    // const query = `{ repository(owner: ${ownerName} , name: ${repoName}) { milestones(states: ${state}, first: 100) { edges { node { id, number, issues(first: 100) { edges { node { id, number, state, assignees(first: 10) { edges { node { id, avatarUrl, url }}} labels(first: 10) { edges { node { id, name }}}}}}}}}}}`;
		// const graphQLResponse = await graph(query);
		// const githubBoard = keyBy(get(graphQLResponse, 'repository.milestones.edges'), 'node.number');
		
		// for (const milestoneNumber in githubBoard) {
		// 	const milestoneElement = select(`.milestone-${milestoneNumber}`);
		// 	console.log("ms", select.all('.milestone-stats-container', milestoneElement).length);
		// 	if (!select.all('.milestone-stats-container', milestoneElement).length) {
		// 		console.log("milestoneNumber", milestoneNumber);
		// 		const _githubBoard = keyBy(get(githubBoard[milestoneNumber], 'node.issues.edges'), 'node.number');
		// 		const {milestoneStats, milestoneLeaderboard} = await milestoneStatsBuilder(repoInformation, _githubBoard);
				
		// 		milestoneElement.append(<div class="milestone-stats-container">{milestoneStats} {milestoneLeaderboard}</div>);
		// 		milestoneElement.classList.add('extended-milestone');
		// 	}
		// };
};
