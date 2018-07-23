import {h} from 'dom-chef';
import select from 'select-dom';
import {get, keyBy} from 'lodash';
import graph from '../libs/graph';
import api from '../libs/api';
import {getOwnerAndRepo} from '../libs/page-detect';
import {milestoneStatsBuilder} from '../libs/milestone-stats-builder';
import {spinner} from '../libs/icons';

export default async () => {

	// Check if the milestone actually contain some items .. OH really 🙄
	if (!select.all('.blankslate').length) {
		// Attach the loading spinner while all the processing is being done
		select('.table-list-header-toggle').append(
			<div class="rgh-milestone-loader">{spinner()} Loading milestones data</div>
		);
		
		const {ownerName, repoName} = getOwnerAndRepo();
		const repoInformation = await api(`repos/${ownerName}/${repoName}`); 
		const state = location.href.includes('state=closed') ? 'CLOSED' : 'OPEN';
    	const query = `{ repository(owner: ${ownerName} , name: ${repoName}) { milestones(states: ${state}, first: 100) { edges { node { id, number, issues(first: 100) { edges { node { id, number, state, assignees(first: 10) { edges { node { id, avatarUrl, url }}} labels(first: 10) { edges { node { id, name }}}}}}}}}}}`;
		const graphQLResponse = await graph(query);
		const githubBoard = keyBy(get(graphQLResponse, 'repository.milestones.edges'), 'node.number');

		for (const milestoneNumber in githubBoard) {
			const milestoneElement = select(`.milestone-${milestoneNumber}`);
			
			if (!select.all('.milestone-stats-container', milestoneElement).length) {
				const _githubBoard = keyBy(get(githubBoard[milestoneNumber], 'node.issues.edges'), 'node.number');
				const {milestoneStats, milestoneLeaderboard, milestoneShameboard} = await milestoneStatsBuilder(repoInformation, _githubBoard);
				
				milestoneElement.append(<div class="milestone-stats-container">{milestoneStats}</div>);
				const milestoneContainer = select('.milestone-stats-container', milestoneElement);
				// Based on the availability of leaderboard or shameboard data ..
				(milestoneLeaderboard || milestoneShameboard) && milestoneContainer.append(<span class="rgh-leaderboard">Leaderboard</span>)
				milestoneLeaderboard && milestoneContainer.append(milestoneLeaderboard);
				milestoneShameboard && milestoneContainer.append(milestoneShameboard);
			}
		};
		select('.table-list-header-toggle').removeChild(select('.rgh-milestone-loader'));
	}
};
