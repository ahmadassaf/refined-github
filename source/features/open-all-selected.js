/* eslint-disable no-alert */
import {h} from 'dom-chef';
import select from 'select-dom';
import * as pageDetect from '../libs/page-detect';

const confirmationRequiredCount = 10;

function getUrlFromItem(element) {
	// Element could be a checkbox or the issue's <li>
	return element.closest('li').querySelector('.js-navigation-open').href;
}

function openIssues() {
	const issues = select.all([
		'#js-issues-toolbar.triage-mode + div [name="issues[]"]:checked', // Get checked checkboxes
		'#js-issues-toolbar:not(.triage-mode) + div .js-issue-row' // Or all items
	]);

	if (
		issues.length >= confirmationRequiredCount &&
		!confirm(`This will open ${issues.length} new tabs. Continue?`)
	) {
		return;
	}

	browser.runtime.sendMessage({
		urls: issues.map(getUrlFromItem),
		action: 'openAllInTabs'
	});
}

export default function () {
	if (!pageDetect.isIssueList() || select.all('.js-issue-row').length < 2) {
		return;
	}
	const openAllButtonText = location.pathname.endsWith('/issues') ? `Open all issues` : `Open all PRs`;

	const filtersBar = select('.table-list-header .table-list-header-toggle:not(.states)');
	if (filtersBar) {
		filtersBar.prepend(
			<button
				type="button"
				onClick={openIssues}
				class="float-left btn-link rgh-open-all-selected"
			>
				{openAllButtonText}
			</button>
		);
	}

	const triageFiltersBar = select('.table-list-triage .table-list-header-toggle');
	if (triageFiltersBar) {
		triageFiltersBar.prepend(
			<button
				type="button"
				onClick={openIssues}
				class="float-left btn-link rgh-open-all-selected"
			>
				Open in new tabs
			</button>
		);
	}
}
