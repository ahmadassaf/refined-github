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
		let totalMilestoneInformation = {};
		const {ownerName, repoName} = getOwnerAndRepo();
		const repoInformation = await api(`repos/${ownerName}/${repoName}`); 
		const state = location.href.includes('state=closed') ? 'CLOSED' : 'OPEN';
    	const query = `{ repository(owner: ${ownerName} , name: ${repoName}) { milestones(states: ${state}, first: 100) { edges { node { id, number, issues(first: 100) { edges { node { id, number, state, closedAt, createdAt, assignees(first: 10) { edges { node { id, avatarUrl, url }}} labels(first: 10) { edges { node { id, name }}}}}}}}}}}`;
		const graphQLResponse = await graph(query);
		const githubBoard = keyBy(get(graphQLResponse, 'repository.milestones.edges'), 'node.number');

		for (const milestoneNumber in githubBoard) {
			const milestoneElement = select(`.milestone-${milestoneNumber}`);

			const showAnalytics = event => {
				event.stopPropagation();
				const targetElement = event.target || event.srcElement;
				const _milestoneNumber = targetElement.getAttribute('data-milestone-number');
				const milestoneElement = select(`.milestone-${_milestoneNumber}`);
				
				milestoneElement.classList.contains('analytics-enabled') ? milestoneElement.classList.remove('analytics-enabled') : milestoneElement.classList.add('analytics-enabled');
			}
			select('.f5.mt-2', milestoneElement).append(
				<a class="d-inline-block mr-2 rgh-analytics-toggle" data-milestone-number={milestoneNumber} onClick={showAnalytics} >Analytics</a>
			);
			
			if (!select.all('.milestone-stats-container', milestoneElement).length) {
				const _githubBoard = keyBy(get(githubBoard[milestoneNumber], 'node.issues.edges'), 'node.number');
				const {milestoneStats, milestoneLeaderboard, milestoneShameboard, milestoneInformation} = await milestoneStatsBuilder(repoInformation, _githubBoard);
				totalMilestoneInformation = Object.assign({}, totalMilestoneInformation, milestoneInformation);
				
				milestoneElement.append(<div class="milestone-stats-container">{milestoneStats}</div>);
				
				const milestoneContainer = select('.milestone-stats-container', milestoneElement);
				// Based on the availability of leaderboard or shameboard data ..
				if (milestoneLeaderboard || milestoneShameboard) {
					const milestoneLeaderboardDOM = milestoneLeaderboard ? milestoneLeaderboard : <i></i>;
					const milestoneShameboardDOM = milestoneShameboard ? milestoneShameboard : <i></i>;
					milestoneContainer.append(
						<div class="rgh-leaderboard-container">
							<span class="rgh-leaderboard">Leaderboard</span>
							{milestoneLeaderboardDOM}
							{milestoneShameboardDOM}
						</div>
					)
				} 
			}
		};

		select('.table-list-header-toggle').removeChild(select('.rgh-milestone-loader'));
		
		const totalMilestoneStats = await milestoneStatsBuilder(repoInformation, {}, totalMilestoneInformation);
		const leaderboardContainer = select('.repository-content .table-list-header');
		
		leaderboardContainer.parentNode.insertBefore(totalMilestoneStats.milestoneStats, leaderboardContainer);
		// Based on the availability of leaderboard or shameboard data ..
		if (totalMilestoneStats.milestoneLeaderboard || totalMilestoneStats.milestoneShameboard) {
			leaderboardContainer.parentNode.insertBefore(
				(
					<div class="rgh-leaderboard-container">
						<span class="rgh-leaderboard">Leaderboard</span>
						{totalMilestoneStats.milestoneLeaderboard}
						{totalMilestoneStats.milestoneShameboard}
					</div>
				)
				, leaderboardContainer);
		}
	}
};
