import {h} from 'dom-chef';
import select from 'select-dom';
import { stop, trashcan } from '../libs/icons';

export default function () {
    /* We need to start checking foe issues meta information issues
     * - An issue should not contain multiple types
     * - An issue should belong at least to one product area
     * - Bugs should not have estimates while any other type should have
     * - A bug should have ONE priority asigned and any other type should not have a priority attached
     * - Epics should not have product areas assigned to them
    */
    const ERRORS_MAP = {
        MULTIPLE_TYPES : {
            error: 'should not belong to more than one type',
            filter: (label) => {
                return label.startsWith('03: Type:')    
            },
            condition: (filteredLabels) => {
                return filteredLabels.length > 1
            }
        },
        ONE_PRODUCT_AREA: {
            error: 'should belong to at least one product area',
            filter: (label) => {
                return label.startsWith('02: Product Area:');
            },
            condition: (filteredLabels, labels) => {
                return (labels.includes('03: Type: Bug', '03: Type: Story')) && !!filteredLabels.length
            }
        },
        NO_BUGS_ESTIMATE: {
            error: 'defined as bugs and have estimates! Bugs should NOT have estimates',
            filter: (label) => {
                return label === '03: Type: Bug'
            },
            condition: (filteredLabels, labels, issue) => {
                return select('.zh-estimate-badge', issue)
            }
        },
        MISSING_ESTIMATES: {
            error: 'missing a proper estimate ⏱',
            filter: (label) => {
                return label !== '03: Type: Bug' && label.startsWith('03: Type:')
            },
            condition: (filteredLabels, labels, issue) => {
                return !select('.zh-estimate-badge', issue)
            }
        },
        MULTIPLE_PRIOITIES: {
            error: 'has multiple priorities. Bugs should have ONLY one priority',
            filter: (label) => {
                return label === '03: Type: Bug'
            },
            condition: (filteredLabels, labels, issue) => {
                return labels.filter(label => {
                    return label.startsWith('1: Priority:')
                }).length > 1
            }
        },
        BUGS_MISSING_PRIORITIES: {
            error: 'defined as bugs and miss a priority 🚩',
            filter: (label) => {
                return label === '03: Type: Bug'
            },
            condition: (filteredLabels, labels, issue) => {
                return !labels.filter(label => {
                    return label.startsWith('1: Priority:')
                }).length
            }
        },
        WRONG_ASSIGNMENT_OF_PRIORITY: {
            error: 'are not defined as bugs and have a priority 🚩 ONLY bugs have priority!',
            filter: (label) => {
                return label !== '03: Type: Bug' && label.startsWith('03: Type:')
            },
            condition: (filteredLabels, labels, issue) => {
                return labels.filter(label => {
                    return label.startsWith('1: Priority:')
                }).length
            } 
        },
        EPICS_METADATA: {
            error: 'are defined as epics and have a product area attached. Epics should be containers only and should NOT have additional info',
            filter: (label) => {
                return label === 'Epic'
            },
            condition: (filteredLabels, labels, issue) => {
                return labels.filter(label => {
                    return label.startsWith('02: Product Area:')
                }).length
            }
        }
    }

    const errorsReport = {};

    for (const issue of select.all('.js-issue-row')) {
        const labels = select.all('.labels a', issue).map(label => {
            return label.textContent;
        });
        for (const errorID in ERRORS_MAP) {
            const _error = ERRORS_MAP[errorID];
            const filteredLabels = labels.filter(_error.filter);
            if (filteredLabels.length && _error.condition(filteredLabels, labels, issue)) {
                issue.classList.add(errorID);
                errorsReport[errorID] = ++errorsReport[errorID] || 1;
            }
        }
    }

    const clearFilters = () => {
        select.all('.rgh-selected-filter').forEach(e => e.classList.remove('rgh-selected-filter'));
        select.all('.rgh-issues-meta-clearFilter').forEach(e => e.classList.remove('rgh-visible'));
        select.all(`.js-issue-row.rgh-hidden`).forEach(e => e.classList.remove('rgh-hidden'));
    };

    const filterIssues = event => {
        event.stopPropagation();
        const targetElement = event.target || event.srcElement;
        const className = targetElement.getAttribute('data-error-id');
        const filterElement = select(`ul.rgh-issues-meta-report li span[data-error-id="${className}"]`);
        
        clearFilters();
        filterElement.parentNode.classList.add('rgh-selected-filter');
        select.all(`.js-issue-row:not(.${className})`).forEach(e => e.classList.add('rgh-hidden'));
        select('.rgh-issues-meta-clearFilter', filterElement.parentNode).classList.add('rgh-visible');
    }

    let errors = [];
    for (const error in errorsReport) {
        errors.push(
            <li>
                <span data-error-id={error} onClick={filterIssues}>{errorsReport[error]} issues </span>
                {ERRORS_MAP[error].error}
                <span class="rgh-issues-meta-clearFilter" onClick={clearFilters}>{trashcan()} clear</span>
            </li>
        );
    }

    if (!!errors.length) {
        const issuesTable = select('.table-list-header');
        issuesTable.parentNode.insertBefore(
        <div class="rgh-issues-meta-report-container">
            <h3 class="rgh-beamery-meta-report-title">{stop()} Issues meta report</h3>
            <ul class="rgh-issues-meta-report">{errors}</ul>
        </div>, issuesTable);
    }
}



