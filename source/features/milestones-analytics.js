import {h} from 'dom-chef';
import select from 'select-dom';
import {getOwnerAndRepo} from '../libs/page-detect';
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
};
