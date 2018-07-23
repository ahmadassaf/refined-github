import {h} from 'dom-chef';
import select from 'select-dom';
import * as pageDetect from '../libs/page-detect';

const repoUrl = pageDetect.getRepoURL();

export default function () {
	const filtersPanel = select('.subnav-search-context .js-navigation-item:last-child');
	if (filtersPanel) {
		filtersPanel.before(
				<a
					href={`/${repoUrl}/issues?q=is%3Aissue+sort%3Aupdated-desc+-label%3A"2%3A+Type%3A+Bug"+-label%3A"2%3A+Type%3A+Customer+SetUp"+-label%3A"2%3A+Type%3A+Discovery"+-label%3A"2%3A+Type%3A+Documentation"+-label%3A"2%3A+Type%3A+Enhancement"+-label%3A"2%3A+Type%3A+Housekeeping"+-label%3A"2%3A+Type%3A+Knowledge+Transfer"+-label%3A"2%3A+Type%3A+Prototype"+-label%3A"2%3A+Type%3A+Question"+-label%3A"2%3A+Type%3A+Research"+-label%3A"2%3A+Type%3A+Story"+-label%3A"2%3A+Type%3A+Tech+Debt"+-label%3A"2%3A+Type%3A+Test+Coverage"+-label%3AEpic+-label%3A"4%3A+Status%3A+Invalid"+is%3Aopen`}
					class="select-menu-item js-navigation-item rgh-relative">
					<div class="select-menu-item-text">
						All issues without a type
					</div>
				</a>
			);
		select('.subnav-search-context .js-navigation-item:last-child')
			.before(
				<a
					href={`/${repoUrl}/issues?q=is%3Aissue+sort%3Aupdated-desc+label%3A"2%3A+Type%3A+Bug"+-label%3A"1%3A+Priority%3A+P0"+-label%3A"1%3A+Priority%3A+P1"+-label%3A"1%3A+Priority%3A+P2"+-label%3A"1%3A+Priority%3A+P3"+-label%3A"1%3A+Priority%3A+P4"+-label%3A"1%3A+Priority%3A+P5"+-label%3A"1%3A+Priority%3A+Q0"+-label%3A"1%3A+Priority%3A+Q1"+-label%3A"1%3A+Priority%3A+Q2"+is%3Aclosed+-label%3A"4%3A+Status%3A+Invalid"`}
					class="select-menu-item js-navigation-item rgh-relative">
					<div class="select-menu-item-text">
						All bugs without a priority
					</div>
				</a>
			);
	}
}



