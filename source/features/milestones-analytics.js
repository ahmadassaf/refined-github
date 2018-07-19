import {h} from 'dom-chef';
import select from 'select-dom';
import {getOwnerAndRepo} from '../libs/page-detect';
import {get} from 'lodash';
import graph from '../libs/graph';

export default async () => {
    const milestoneZenhubBoardLink = select('.zh-milestone-link');
    const boardLink = select('a', milestoneZenhubBoardLink).href;

    milestoneZenhubBoardLink.parentNode.removeChild(milestoneZenhubBoardLink);
    select('.TableObject-item--primary').appendChild(
        <div class="zh-milestone-link">
            <a href={boardLink}>
                <div class="zh-milestone-link-icon"><i class="zh-icon-board"></i></div>
            </a>
        </div>
    );

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
                          state
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

    const milestoneInformation = await graph(query);
    const issues = get(milestoneInformation, 'repository.milestone.issues.edges', []);
    const totalBugs = issues.filter(issue => {
        return issue.node.labels.edges.filter(label => {
            return label.node.name === '2: Type: Bug';
        }).length
    });
    const closedBugs = totalBugs.filter(bug => {
        return bug.node.state === 'CLOSED';
    });
    console.log("milestoneInformation", milestoneInformation);
    console.log("totalBugs", totalBugs);
    console.log("closedBugs", closedBugs);

};
