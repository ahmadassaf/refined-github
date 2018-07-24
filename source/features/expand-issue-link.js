import {h} from 'dom-chef';
import select from 'select-dom';
import api from '../libs/api';
import {getOwnerAndRepo} from '../libs/page-detect';

export default async () => {
    const {ownerName, repoName} = getOwnerAndRepo();
    const issuesLinks = select.all('.issue-link');
    for (const issueLink in issuesLinks) {
        const issue = issuesLinks[issueLink];
        const issueNumber = issue.textContent.replace('#', '');
        const issueData = await api(`repos/${ownerName}/${repoName}/issues/${issueNumber}`);
        issue.textContent = issueData.title;
        issue.onmouseover = (event) => event.preventDefault();
    }
};
