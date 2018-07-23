import {h} from 'dom-chef';
import select from 'select-dom';
import {getOwnerAndRepo} from '../libs/page-detect';
import {dateToMDY} from '../libs/utils';
import graph from '../libs/graph';
import {calendar, clock} from '../libs/icons';

export default async () => {

	// Check if the milestone actually contain some items .. OH really 🙄
	if (!select.all('.blankslate').length) {
		const {ownerName, repoName} = getOwnerAndRepo();
		const milestonesObjects = select.all('div.milestone');
		const query = `{
			repository(owner: ${ownerName} , name: ${repoName}) {
				milestones(
					states: CLOSED,
					first: ${milestonesObjects.length}
				) {
					edges {
						node {
							id,
							title,
							number,
							dueOn,
							createdAt
						}
					}
				}
			}
		}`;
	
		const graphQLResponse = await graph(query);
		const milestones = {};
		for (const milestone of graphQLResponse.repository.milestones.edges) {
			milestones[milestone.node.number] = milestone.node;
		}
		for (const milestone of select.all('.milestone')) {
			const milestoneLink = select.all('.milestone-title-link a', milestone);
			const milestoneNumber = milestoneLink[0].href.split('/').pop();
			const milestoneClosedDate = select('.milestone-meta-item', milestone);
			const _milestone = milestones[milestoneNumber];
			
			if (_milestone) {
				// Remove the lastUpdated on metadata item
				select.all('.milestone-meta-item', milestone)[1].remove();
				// Add the CreatedOn metadata item
				select.all('.milestone-meta', milestone)[0].append(
					<span class="milestone-meta-item">
						<span class="mr-1">{clock()}</span> Created on {dateToMDY(new Date(_milestone.createdAt))}
					</span>
				);
				// Add the dueOn metadata item
				if (_milestone.dueOn) {
					select.all('.milestone-meta', milestone)[0].append(
						<span class="milestone-meta-item">
							<span class="mr-1">{calendar()}</span> Was due on {dateToMDY(new Date(_milestone.dueOn))}
						</span>
					);
				}
				milestoneClosedDate.classList.add('text-red');
			}
			milestone.classList.add(`milestone-${milestoneNumber}`, 'extended-milestone');
		}
	}
};
